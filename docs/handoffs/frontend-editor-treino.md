# Frontend: editor de treinos e exercícios

- Rotas novas (router.ts, com testes): `#treino/_/novo`, `#treino/<id>/exercicio/<exId>` e `#treino/<id>/exercicio/_` (novo). O `_` nunca é id gerado.
- Telas em `src/features/treino/`: `NovoTreino` (dados do treino + primeiro exercício, com descanso), `EditarTreino` (dados, lista com subir/descer, remover, adicionar do catálogo ou novo, duplicar, excluir), `EditarExercicio` (nome, grupo, tipo de registro, séries e repetições por bloco, descanso com passo de 15 s, observação), `Sheet`/`ConfirmDialog`, `UndoToast` (8 s, `role=status`), `Menu` (⋮), `editor.css`.
- Regras puras novas: `src/domain/exerciseDraft.ts` (validação, vírgula, travessão em faixas), `planEdit.ts` (`createSessionWithExercise`, `updateSession`, `restoreSeedPlan`, `sessionsUsing`), `muscleGroupOf` respeita `g: ''` (sem grupo). Testes em `tests/unit/planEdit.test.ts` e `router.test.ts`.
- Desfazer: regrava o plano anterior via `commit`. Remover/excluir nunca toca `history` nem `plan.ex`. "Restaurar treinos originais" fica no fim da Biblioteca (usa `data/plan.json`, mantém exercícios criados).
- Diferenças da referência: sem campo "Carga" (o modelo não tem carga planejada; ela é registrada na execução); botão "Novo" (nome acessível "Novo treino") no lugar do "Salvar" da tela-4; blocos B1/B2/B3 em vez de um só par séries/repetições; contorno dos campos em `--input` (AA), mais escuro que o da referência.
- Pedido: arrastar para reordenar não foi feito (só botões).
- e2e: `tests/e2e/entrega-a-editor.spec.ts`; o teste de rota de edição em `entrega-a-treino.spec.ts` foi atualizado.
