# Frontend: aba Dieta (D6)

- Arquivos: `src/features/dieta/` (Dieta, Refeicao, GerenciarOpcoes, parts, dietData, useDietDay, dieta.css); rotas `dieta/<refeição>` e `dieta/<refeição>/gerenciar` (com `?dia=`) em `src/app/router.ts` e `tests/unit/router.test.ts`; `App.tsx` monta a aba, esconde o cabeçalho na tela da refeição e usa o nome da refeição no h1.
- Regras vêm de `src/domain/diet.ts` (dayTarget, markEaten, unmarkEaten, dayTotals, progress, applyAdjustments, weeklyReview). Meta pelo tipo do dia (`dayTypeOf(activityFor(...))`). `consumed` guarda cópia ao marcar; trocar a opção de uma refeição já marcada regrava a cópia.
- Editar/duplicar/excluir/adicionar opção altera `state.catalog.diet` por `commit` e incrementa `catalog.revision` (ninguém mais incrementava; o repositório não exige). Não mexe em dias registrados. Desfazer por 8 s regrava a lista anterior.
- Revisão semanal: médias por semana de `history.measurements` (p, c; vírgula aceita). Dispensar grava `settings.dietReviewDismissed` (segunda-feira da semana).
- Diferenças deliberadas das referências: sem fotos (ilustrações); sem horário nas refeições (não há dado); kcal da linha vai abaixo do nome abaixo de 27rem (cabe em 360 px); sem botão "Adicionar refeição" (são 5 fixas): o botão azul registra a próxima refeição pendente; os cartões de indicador empilham ícone e texto abaixo de 26rem.
- Testes: `tests/e2e/entrega-b-dieta.spec.ts` (9). Capturas: `capturas/dieta-r1` a `r5`, `r5-escuro`, `r5-marcado`.
