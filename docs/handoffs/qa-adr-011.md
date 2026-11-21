# QA: ADR 011 (Fase 1 e itens 2.1 a 2.4) e seletores da Fase 3

Data: 21/11/2026. Agente: `qa-testes`. Sem commit. Só dados sintéticos. Não editei `src/`.

## Resultado final

A árvore `src/` estava estável. Rodei `npm run build` (verde) e depois as duas suítes.

- **`npx vitest run`:** 51 de 51 arquivos e 778 de 778 testes passaram.
- **`npm run typecheck`:** sem erros (inclui `tests/`).
- **`npx playwright test`:** 199 de 201 passaram e 2 falharam (7,5 min).
  1. `adr011-academia.spec.ts` "ao abrir, a primeira série e 'Concluir treino' se alcançam sem rolar". É **defeito de tela**: o teste fica vermelho de propósito até o `frontend` corrigir (ver "Defeito").
  2. `ondas-hevy.spec.ts` "trocar exercício só hoje". **Falhou uma vez:** a prévia da importação não apareceu em 45 s. Repeti esse teste 5 de 5 vezes e o arquivo inteiro 6 de 6 vezes, e passou todas. A evidência se perdeu porque a repetição sobrescreveu `test-results/`. É risco aberto (ver "Riscos").

**Fase não aprovada:** o defeito de 2.2 está aberto.

## 1. Lembrete por 7 dias de uso (testes ajustados)

Os dois testes simulam dias de uso reais: relógio fixo e uma gravação por dia (troca de tema). Não mexem em `meta` por fora. O apoio fica em `tests/e2e/support/adr011.ts`, `simulateUsageDays`.

- **`base-ui` "sino mostra ponto":** sem ponto logo depois de importar, sem ponto no 6º dia de uso e com ponto no 7º. O aviso real e o link continuam conferidos.
- **`fase1` "importação v1/v2":** tudo o que já verificava, mais:
  - sem lembrete no dia da importação;
  - lembrete no 7º dia de uso;
  - "Já guardei o backup" esconde o lembrete e zera `meta.usage.daysSinceBackup`.

O texto "Seu backup semanal está pendente." agora só existe na folha Avisos. No Perfil, o teste usa o cartão "Guarde uma cópia dos seus dados".

## 2. Teste instável do tema (gravação lenta)

**Execuções:** 44 no total, todas verdes.
- 10 seguidas com `--repeat-each`;
- 24 em 6 workers ao mesmo tempo;
- o `fase1` inteiro 4 vezes, em 4 workers;
- mais 2 rodadas da suíte completa.

**Hipótese descartada:** o auxiliar `state()` do teste pegaria o banco da demo, que o app apaga a cada abertura sem esperar. Medi: `indexedDB.databases()` nunca lista um banco apagado que não existe.

**O teste espera o suficiente:** `expect.poll` lê o IndexedDB por outra conexão. Só enxerga `dark` depois que a transação foi confirmada, e só então recarrega.

**Causa provável: ambiente.** Nesta sessão, as falhas isoladas vieram de duas execuções do Playwright em paralelo, que dividiam `test-results/` (ENOENT nos traces), a porta 4173 e um `dist/` reconstruído no meio da rodada. Não mudei o teste nem vejo defeito do app. Se voltar a falhar sozinho, o anexo `tema-diagnostico.json` mostra a causa.

## 3. E2E novos do ADR 011 (18 testes em 4 arquivos)

### `adr011-demo.spec.ts` (4 testes)
- Entrar, navegar pelas 5 abas com a faixa e sem rolagem lateral.
- Na demo não aparecem backup, compartilhar nem o lembrete.
- "Continuar vendo" mantém a demo.
- Sair volta ao Início real vazio, sem a marca, sem o banco da demo e com o banco real **idêntico** (JSON comparado antes, durante e depois).
- Offline depois do precache: recarrega e navega com a faixa.
- Marca adulterada volta ao modo real.
- Com dados do usuário, o botão da demo some.

### `adr011-lembrete.spec.ts` (2 testes)
- 6 dias de uso e depois 36 dias de calendário: sem lembrete. No 7º dia de uso, a linha "Backup pendente" aparece no Início.
- "Agora não" esconde só hoje (mesmo recarregando) e o lembrete volta no dia seguinte.
- "Fazer backup agora" baixa o arquivo e pergunta "Guardou o arquivo?", com foco.
- "Ainda não" não confirma. "Sim, guardei" zera a contagem.
- Sem dados do usuário, 8 dias de uso não disparam nada.

### `adr011-compartilhar.spec.ts` (2 testes)
- **Exportar:** o arquivo sai sem nome do perfil, nota pessoal, histórico, `meta`, `recovery` nem observações. As chaves de topo passam pela lista branca.
- **Revisar e aplicar:** outro contexto do navegador revisa sem gravar e aplica numa gravação só. A rotina e os registros ficam intactos.
- **Desfazer:** pelo aviso e por "Voltar ao plano anterior" no Perfil, o plano volta idêntico.
- **Recusas:** arquivo de 300 KB e arquivo com campo desconhecido, sem mudar nada.

### `adr011-academia.spec.ts` (10 testes)
- **1.4:** o cartão "Deixe o Fitnez na tela inicial" aparece no 1º treino, com `installShownAt` e `persistAskedAt` gravados. Não volta ao recarregar nem no 2º treino.
- **2.1, descanso:** sair, avançar 60 s e voltar mostra 1:30. Depois do fim, mostra "Próxima série" e 0:00. Mais de 10 min depois, não mostra nada. Ao voltar à aba, o relógio atualiza na hora, com o relógio parado.
- **2.1, Wake Lock simulado:** pede ao abrir, pede de novo ao voltar à aba e solta ao concluir. Sem a API, segue sem erro.
- **2.2 (360 × 740):**
  - 48 × 48 px em toda a execução: os 10 exercícios, com o descanso ativo, no histórico, nas anilhas e no menu;
  - `inputmode` de cada campo (carga `decimal`, repetições e segundos `numeric`);
  - alcance sem rolar: o teste do defeito.
- **2.3:** 5 sessões, a mais recente primeiro, sem aquecimento. O digitado, o foco e o descanso continuam depois de fechar.
- **2.4:** "Usar 42,5 kg" preenche a carga sem concluir a série e nada fica gravado como feito. Quando a conta fecha, não aparece "Usar".

## 4. Seletores da Fase 3 (mudanças legítimas de tela, sem afrouxar)

| Arquivo | O que mudou no teste |
| --- | --- |
| `entrega-a-executar` | "Tirar 15 segundos", "Somar 15 segundos" e "Pular descanso" |
| `entrega-b-dieta` :49 | A meta do anel (`aria-valuemax`) precisa aparecer como "N kcal restantes" |
| `entrega-b-dieta` :274 | A linha "N kcal restantes" não quebra em 1280 px |
| `metas-dieta` | A meta é lida no anel "Calorias consumidas" ("de 2.300 kcal") |
| `ondas-hevy` | Depois de "Ver exercício", o relógio anda 1 s (folha sob demanda com relógio parado) |
| `adr011-lembrete` | O Início usa a linha compacta "Backup pendente" |

## Defeito (para o `frontend`)

Em 360 × 740, ao abrir a execução, a caixa "Série 1 concluída" fica em y 720 a 768. Ela fica sob o rodapé fixo, que começa em y 646, e cortada pela borda da tela. Para concluir a primeira série é preciso rolar. Isso fere o ADR 011, 2.2 ("ações principais no rodapé fixo ou na metade de baixo").

O teste que cobre o defeito está em `adr011-academia.spec.ts`, no describe "2.2", e passa quando a caixa fica inteira e tocável sem rolar.

## Riscos

- **Falha isolada em `ondas-hevy` "trocar exercício só hoje":** a prévia da importação não apareceu. Passou em 11 repetições. Uma causa possível é carga: o `vitest` rodou junto no início da rodada final. Fica aberto; se repetir, guardar o `trace.zip`.
- **Relógio pausado pelo Playwright:** com ele, as animações de entrada também param. As medidas de 2.2 rodam com o relógio andando e só depois que duas leituras seguidas dão o mesmo valor.
- **Execuções em paralelo:** duas rodadas do Playwright ao mesmo tempo quebram uma à outra. Use uma por vez ou `--output` e uma porta separada.
- **Fora do e2e:** Web Share real e Wake Lock real (os e2e simulam os dois) e a vibração.
