# QA: falha intermitente do tema Escuro no CI

## Sintoma (evidência do CI)
- `tests/e2e/fase1.spec.ts`, teste `rotas, layout <largura>px e tema Escuro`: após clicar em "Escuro", `html[data-theme]` fica `"light"` até o timeout de 10 s (24 leituras, sempre `light`).
- Runs: 43449386227 (commit c28254c) falhou 360 px e 1280 px; 43986355742 (da2b3dd) falhou só 360 px; 43443521367 e 43367264196 passaram.
- Nenhum run publicou artefato (o workflow não envia `playwright-report` nem `test-results`), então o screenshot e o trace da falha não existem para consulta. Só há o log.
- No log, os testes do CI duram cerca de 1,3 s quando passam: o runner não está lento. O teste de 1280 px e o de 360 px do mesmo run se comportam de forma diferente.
- O teste Claro nunca falha, mas ele não consegue falhar: com tema automático e sistema claro, `data-theme` já é `light`. Qualquer clique perdido só aparece ao escolher Escuro. Logo, o defeito é "o clique em um tema não vira estado", não "Escuro especificamente".
- Entre o último run verde e o primeiro vermelho o único diff de app foi cor de CSS/ilustrações (commit c28254c). Nada de lógica, então a mudança é coincidência de tempo, não causa.

## Hipóteses testadas (todas por experimento)
| Hipótese | Experimento | Resultado |
| --- | --- | --- |
| Corrida entre gravar o tema e uma releitura (`refresh`, `focus`, outra aba) em `src/app/commitQueue.ts` e `src/data/` | Simulação com o repositório real (fake-indexeddb) e o committer: 300 iterações aleatórias com 0 a 3 releituras antes, durante e depois do clique | 0 perdas. O banco e a tela terminam sempre em `dark`. Virou teste de regressão (abaixo) |
| Evento `focus` da janela dispara releitura no instante do clique | Disparo de `focus` de 40 ms antes a 40 ms depois do clique, 3 vezes cada | 33 de 33 `dark` |
| `focus`/`blur` real da página no primeiro clique (Linux) | Log de eventos com e sem `Emulation.setFocusEmulationEnabled` | Nenhum evento de foco; `hasFocus()` sempre verdadeiro |
| Clique concorrente com a ativação do service worker (`controllerchange`, `PRECACHE_READY`) | Clique sintético de 0 a 80 ms após `controllerchange`, 3 vezes cada | 24 de 24 `dark` (o SW assume o controle em cerca de 210 ms) |
| `matchMedia` disputando `data-theme` com `settings.theme` (`App.tsx` 46-51) | Leitura do código: o efeito depende de `[theme]`, limpa o listener e só o `auto` consulta a mídia. Nenhum outro código grava `dataset.theme` | Descartada. Teste "automático acompanha sistema" passa nos dois modos |
| Folha de primeira abertura intercepta o clique | A oferta só abre se a rota inicial for Início; o teste abre `#perfil` | Descartada por leitura e por log de eventos |
| Clique cai em outro botão por deslocamento de layout | `requestAnimationFrame` registrando o retângulo do botão, `:disabled` e `aria-pressed`, com e sem carga de CPU | Retângulo estável do primeiro quadro até o clique; alvo sempre `Escuro`; `aria-pressed` vira `true` 10 a 15 ms depois |
| Fieldset desativado (`busy`) durante o clique | Mesmo log | `disabled=false` o tempo todo; nenhuma ação automática chama `run` |
| Reload da página perdendo a gravação | Leitura: só `usePwa` (ao aplicar atualização) e `ApagarDados` recarregam; nenhum dos dois ocorre | Descartada por leitura. O diagnóstico novo registra `boot` e `pagehide` e provará se ocorrer |
| Ambiente: base `/fitnez/`, `TZ=UTC`, `CI=true`, porta alterada, `colorScheme: 'light'`, CPU 6x, 20x, carga de 6 a 24 processos, latência de rede de 50 e 300 ms | Spec de tema com `--repeat-each=15` em cada variante, mais a suíte completa em cópia com base `/fitnez/` | Tudo verde (156 de 156 na cópia com `/fitnez/`). Falhas sob carga foram só de ferramenta: `ENOENT` de trace e `ERR_NO_BUFFER_SPACE` do Windows ao esgotar sockets, nenhuma no tema |

## Causa raiz
**Não comprovada.** Não consegui reproduzir a falha em Windows com nenhuma das simulações do runner, e a camada de dados e a de estado foram provadas livres de corrida. O que as evidências sustentam:
- O estado do app não perde o tema (simulação e leitura do código).
- A falha, quando ocorre, é "o clique não vira estado" e nunca é visível em Claro.
- O CI não guarda trace nem screenshot, por isso a primeira falha real não deixa prova.

Não alterei o código de produção porque nenhum defeito foi demonstrado, e mudar `src/` sem causa seria tratar sintoma.

## O que foi alterado
- `tests/e2e/fase1.spec.ts`: o teste de tema agora instala `probe(page)` antes de abrir a página e troca o primeiro `expect` por `expectTheme(...)`. A verificação é exatamente a mesma e o timeout não mudou. Quando falha, coleta e imprime (linha `TEMA-DIAGNOSTICO` no log do CI, que é o único lugar que o dono lê) um JSON com: cliques recebidos (alvo e instante), trocas de `data-theme`, `boot`/`pagehide`/`focus` (sobrevive a reload via `sessionStorage`), `aria-pressed` dos três botões, `fieldset` desativado, alertas na tela, tema gravado no IndexedDB e se o SW controla a página. Com isso a próxima falha no CI diz qual hipótese é a verdadeira: clique não chegou, chegou em outro botão, página recarregou, ou o estado reverteu depois de gravado.
- `tests/integration/commit.test.ts`: novo teste "releituras concorrentes (foco, outra aba) em qualquer instante nunca desfazem a troca de tema" (60 iterações com semente fixa, repositório real). Protege contra regressão da hipótese mais plausível de corrida.

## Mudança recomendada fora do meu escopo (workflow)
Em `.github/workflows/pages.yml`, depois do passo "Testar fluxos e modo offline no navegador", acrescentar:
```yaml
      - name: Guardar relatório do Playwright em falha
        if: failure()
        uses: actions/upload-artifact@<sha fixado da versão atual>
        with:
          name: playwright-falha
          path: |
            test-results/
            playwright-report/
          retention-days: 7
```
Sem isso, qualquer falha futura de e2e volta a não deixar screenshot nem trace. Fixe a action por SHA, como as demais do arquivo. Não apliquei porque o arquivo está fora do escopo que recebi.

## Resultados reais dos comandos
- `npm run typecheck`: limpo.
- `npm test`: 32 arquivos, 389 testes verdes (inclui o novo).
- `npm run build`: verde; JS 172,8 KB de 190 KB, CSS 22,0 KB de 24 KB; artefato verificado.
- `npm run test:e2e` (com `CI=true E2E_PORT=4291`): 161 de 161 verdes.
- Spec de tema, 4 variantes (360/1280 px, Claro/Escuro) com `--repeat-each=15`: 60 de 60 verdes, sem carga. Com 6 processos de CPU em paralelo: 59 de 60 numa rodada (uma falha `net::ERR_NO_BUFFER_SPACE` do sistema operacional no `page.goto`, sem relação com o app) e 60 de 60 na repetição.

## Risco que sobrou
- O CI pode falhar de novo no tema. Não tenho evidência de que o defeito desapareceu, só de que não aparece em 500+ execuções locais com simulações do runner.
- Se falhar, a linha `TEMA-DIAGNOSTICO` no log decide a causa na primeira ocorrência. Com o artefato do workflow acima, também haverá trace e screenshot.
- Não foi possível rodar em Linux real: o Docker Desktop estava parado e não o iniciei para não alterar o ambiente do dono. Se o dono quiser, rodar a imagem oficial do Playwright na mesma versão do `package-lock.json` é o próximo passo para reproduzir.
