# Handoff: qa-testes, ADR 013 (assistente com 10 telas e cardápio)

Data: 23/11/2026. Autor: `qa-testes`. Só mexi em `tests/`. Sem commit.

## O que foi testado
- `tests/e2e/assistente-inicio.spec.ts` (3 casos) e `tests/e2e/hoje-livre-atalhos.spec.ts` (2 casos) seguem o fluxo novo: "Passo X de 10"; tempo e local são uma tela só, e o teste confere o título "Tempo e local do treino"; atividades ficam no passo 6. Com corpo preenchido, o teste confere o foco e a ordem das telas A ("Como você come?", passo 8 de 10) e B ("Quanto você quer seguir?"), depois "Passo 10 de 10". Sem corpo, confere "Passo 8 de 8". Mantive todas as verificações antigas (foco, nada pré-marcado, gravação, desfazer, histórico do voltar sem dados de saúde, chunk offline).
- Revisei os testes novos dos outros agentes:
  - `cardapio-assistente.spec.ts`: no caso "menor de 18", o teste comparava `catalog.diet` logo depois do fechamento da janela, sem esperar a gravação. Ele passaria mesmo que o cardápio fosse gravado depois. Agora o teste espera `settings.onboarding.v === 1` antes de comparar.
  - `rascunho-executar.spec.ts`: troquei o `waitForTimeout(700)` por uma espera pelo rascunho no localStorage. Agora o teste também confere que a série 1 continua desmarcada depois do reload, que não há rolagem horizontal e que nada vai para o sessionStorage.
  - `commit-recusa.test.ts`, `rascunho-execucao.test.ts`, `mealPlan.test.ts` e `cardapio-gerado.test.ts`: estão adequados e não mudei nada neles.

## Resultado
- `npm run check`: 56 arquivos, 837 testes passaram; orçamento JS total 254,4 de 300 KB, inicial 189,3 de 205 KB.
- `npm run test:e2e`: 208 passaram e 0 falharam. Os 4 arquivos que dependem do cardápio passaram de novo no fim (18 de 18).

## Riscos e avisos do ambiente
- O Vitest falha em todos os arquivos ("failed to find the current suite" / "reading 'config'") quando é rodado a partir de `c:\Projeto-Treino` com "c" minúsculo, porque carrega o módulo duas vezes. A partir de `C:\` funciona.
- Quando duas execuções do Playwright rodam ao mesmo tempo, uma apaga `test-results` da outra (ENOENT no trace). Use `--output` separado.
- Sem teste: o limite `FOOD_DISLIKES_MAX = 20` na tela A e um cardápio antigo que continua salvo depois de refazer com "só proteína". As duas decisões ainda estão com o backend-dados.
