# Dados Entrega A, Tarefa 6 (tipos, grupos e edicao do plano)

- repository.ts: tipos opcionais DayRecord.workout/acts e settings.profile/notifications (so tipos).
- Criados muscleGroups.ts (mapa dos 38 ids das sementes; revisar com conteudo-treino-nutricao: press_a/press_b = "press", farmer/pescoco = core), planEdit.ts (funcoes puras, imutaveis) e testes (planEdit + integracao com fake-indexeddb).
- O que mudou nos dados: apenas campos opcionais no v3; nenhum dado existente alterado; src/data/validation.ts nao precisou de ajuste (campos extras ja preservados em save, backup e importacao).
- Verificar: npm.cmd test -- tests/unit/planEdit.test.ts tests/integration/entrega-a-dados.test.ts
- Ambiente: no Bash do harness o Vitest padrao falha ("reading config"); rodar via PowerShell (npm.cmd test) funciona.
