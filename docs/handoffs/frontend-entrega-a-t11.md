# Frontend, Entrega A, Tarefa 11: execução, descanso e conclusão

- `src/domain/restTimer.ts`: `restRemaining` e `adjustRest` (testes em `tests/unit/restTimer.test.ts`, vistos falhar antes).
- `src/features/treino/Executar.tsx`: um exercício por vez (setas), séries com `inputMode="decimal"`, concluir série herda campos vazios da série anterior do mesmo exercício (1 toque), descanso por `endsAt` (guardado em `localStorage`, chave `treino12:descanso`; retoma após recarregar), −15 s, +15 s, Pular, vibração e `notifyRestEnd`. Exercício sem `rest` mostra campo "Descanso (s)". Grava a cada série/adicionar série via `commit` (`workout.status` 'partial'); Concluir treino grava 'done', `finishedAt`, `sets`, `volume`, `acts.gym`. Falha de gravação mantém o digitado e avisa.
- `src/features/treino/Concluido.tsx`: duração, exercícios, séries e volume reais; "Voltar ao início" e "Ver resultado" (sem "Salvar treino": salvar já é automático).
- Ligação em `Treino.tsx`; estilos em `treino.css`. Removido de `entrega-a-treino.spec.ts` o trecho que esperava o marcador da execução.
- Sem pausa do cronômetro (não pedida no plano). Sugestão só é exibida, nunca preenche.
- E2E: `tests/e2e/entrega-a-executar.spec.ts` (6 cenários, relógio `page.clock`).
