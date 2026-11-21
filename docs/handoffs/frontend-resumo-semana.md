# Handoff frontend: resumo da semana e cartão compartilhável (ADR 011, 2.5)

Data: 20/11/2026. Sem commit. Estado continua `v: 3`; nada novo é gravado.

## Arquivos

- Novos em `src/features/resumo/` (carregados só por `import()`):
  - `ResumoSemana.tsx`: folha (`Sheet`) "Resumo da semana" com seletor Semana passada / Esta semana, texto real do resumo, opção de peso e cintura, prévia do cartão e botão Compartilhar/Baixar imagem.
  - `content.ts`: `cardContent(summary, { today, body })` monta os textos a partir de `weekSummaryOf`; a mesma estrutura alimenta a tela e o desenho (o texto da tela é a prévia acessível do cartão).
  - `draw.ts`: `drawCard(ctx, content, palette)` (canvas 1080 × 1350, devolve os textos desenhados), `fontsReady()` (Figtree local nos pesos 400 a 800, depois `document.fonts.ready`), `renderCardPng(canvas, …)` (`toBlob('image/png')`), `paletteFromDocument()` (tokens do tema ativo).
  - `resumo.css`.
- Alterados em `src/features/evolucao/`: `Evolucao.tsx` (linha "Resumo da semana" acima do período, abre a folha via `lazy` + `Suspense`) e `evolucao.css` (`.ev-resumo`).
- Testes: `tests/unit/resumo-cartao.test.ts` (canvas simulado, 7 casos) e `tests/e2e/resumo-semana.spec.ts` (1 caso).

## Comportamento

- Semana do plano pelo domínio: atual e anterior quando ambas existem; depois da semana 12, só a última; antes do início, uma frase com a segunda-feira de início.
- Mostra treinos do plano feitos de previstos (com parciais), séries, total levantado, recordes da semana, linha da dieta e a nota de rodapé uma vez. Com `diet: null` (metas escondidas ou desligadas) a dieta some da tela e do cartão.
- Peso e cintura: caixa "Incluir variação de peso e cintura", desmarcada por padrão, estado local da folha (some ao fechar; conferido no e2e). Só a variação (`delta`) aparece, nunca o valor absoluto.
- Cartão: fundo e cores do tema ativo (claro ou escuro), marca discreta (símbolo e "Fitnez" em cinza), azul só no número de treinos feitos, linhas finas, sem pílulas nem brilho. Sem nome, idade ou fotos. Recordes: quantos couberem acima do rodapé, depois "e mais N recordes". Nome do arquivo: `fitnez-semana-N.png`.
- Envio: com `navigator.canShare({ files })` usa `navigator.share` com o arquivo (cancelar não mostra erro; outra falha cai no download); senão `URL.createObjectURL` + `<a download>`, revogado após 30 s. O PNG é gerado ao abrir/trocar opção, para o toque em Compartilhar não perder a ativação do usuário no Safari.
- A prévia é o próprio `<canvas>` na tela (`role="img"`): a CSP (`img-src 'self'`) bloqueia `<img src="blob:">`.
- Foco inicial no seletor de semana, Escape fecha e devolve o foco à linha da Evolução; o único efeito de movimento (fade de 150 ms da prévia) fica dentro de `prefers-reduced-motion: no-preference`.

## Verificação

- `npm run typecheck`: sem erros no momento.
- `npx vitest run tests/unit/resumo-cartao.test.ts tests/unit/weekSummary.test.ts`: 23 de 23.
- e2e (`E2E_PORT=4320`): `resumo-semana.spec.ts` 1 de 1 (Web Share removido, download de PNG 1080 × 1350 conferido pelo cabeçalho IHDR); `entrega-a-evolucao.spec.ts` 16 de 16.
- Navegador 390 × 844, claro e escuro, com o backup sintético da demonstração importado pelo Perfil: PNGs gerados das semanas 5 e 4 (com e sem peso e cintura) e abertos para conferência; sem erros no console.
- Peso: chunk `ResumoSemana` 6,0 KB JS e 0,8 KB CSS gzip (limite 20 e 4). O `weekSummary` foi para o chunk sob demanda. Carga inicial 203,5 de 205 KB JS: margem curta para o cartão do Início.

## Pendências

- Cartão discreto no Início na primeira abertura da semana seguinte (não feito: Início, `App.tsx` e `router.ts` estavam com outro agente). Falta: no Início, se `weekSummaryOf(state, { today, week: semanaAtual - 1 })` não for nulo e a semana ainda não tiver sido vista, mostrar a linha "Resumo da semana N" que abre o mesmo `ResumoSemana` por `import()` (aceitar `initial: 'anterior'` como prop); gravar "visto" exige campo novo (por exemplo `meta.prompts.weekSummarySeen?: number`, com validação) pelo `backend-dados`. Importar `weekSummary.ts` no Início leva a regra (~1,5 KB) para a carga inicial, que hoje tem 1,5 KB de folga.
- `seguranca-privacidade`: revisar o conteúdo do cartão (ADR 011, 2.5).
- Variação zero de peso ou cintura aparece como "sem mudança" (tela e cartão); as demais com sinal tipográfico e vírgula (−0,3 kg, +0,2 cm).
