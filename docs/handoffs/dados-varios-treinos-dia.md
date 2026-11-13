# Dados: vários treinos no mesmo dia

Bug (qa-jornada-2 N1): `DayRecord.workout` era único por dia; iniciar o treino B apagava a conclusão de A.

## Modelo (estado v3, sem migração destrutiva)
- `DayRecord.workouts?: Record<sessionId, WorkoutMeta>` (novo, opcional): um registro por treino.
- `DayRecord.workout` (legado) continua existindo e é mantido igual ao último treino tocado (compatibilidade). Dados antigos, só com `workout`, seguem legíveis: os helpers unem os dois sem duplicar por `sessionId` (legado mais novo vence; empate prefere `workouts`).
- `WorkoutMeta` agora é exportado de `src/application/repository.ts`.
- Séries (`DayRecord.log[exId]`) são do DIA, não do treino. Dois treinos com o mesmo exercício compartilham as séries; as existentes continuam e a tela deve avisar (ver `overlappingExercises`). Nada é sobrescrito em silêncio pelo domínio.

## API (`src/domain/workoutRecord.ts`, funções puras, não mutam a entrada)
- `listWorkouts(day): WorkoutMeta[]` (antigo -> recente)
- `getWorkout(day, sessionId): WorkoutMeta | null`
- `upsertWorkout(day, meta): DayRecord` (promove o legado para `workouts`, grava `workouts[id]` e `workout = meta`)
- `isDone(day, sessionId)`, `doneCount(day)`, `hasAnyDone(day)`, `totalSets(day)`, `totalVolume(day)`, `latestWorkout(day)`
- `overlappingExercises(day, plan, sessionId): string[]` (exIds do treino que já têm séries hoje)

Consumidores de domínio já atualizados: `evolution.consistency` (cada treino concluído conta; previsto = max(1, concluídos) por dia de academia), `jiujitsu.weekMax` (percorre todos os treinos do dia; com plano, só exercícios do próprio treino). `workout.lastPerformance` e `userData` não dependem de `workout` (usam `log` / contagem de dias): sem mudança.

## Como migrar os usos em src/features (a cargo dos agentes de tela)
- `treino/util.ts:49` `dayBelongsTo`: `if (day.workout) return day.workout.sessionId === id` -> `if (listWorkouts(day).length) return getWorkout(day, id) !== null` (ou trocar para o treino que não foi tocado).
- `treino/util.ts:55-56` status: `isDone(day, id)` / `getWorkout(day, id)?.status === 'partial'` por treino (mantendo `acts.gym === true` como done legado).
- `treino/util.ts:64`: trocar `!days[d].workout || statusOf(...)==='done'` por `!getWorkout(days[d], id) || isDone(days[d], id)`.
- `treino/Executar.tsx:110`: `startedAt` = `getWorkout(rec, id)?.startedAt ?? Date.now()`.
- `treino/Executar.tsx:173-174`: `prev = getWorkout(rec, id)`; ao salvar usar `upsertWorkout(rec, meta)` em vez de `{...rec, workout}`. Ao abrir um treino, chamar `overlappingExercises(rec, plan, id)` e mostrar "já há séries de X hoje".
- `treino/Detalhe.tsx:94` e `:143`: usar `getWorkout(rec, id)` (por treino) ou `totalSets/totalVolume` (resumo do dia).
- `treino/Concluido.tsx:20`: `w = getWorkout(rec, sessionId)` do treino concluído, não `rec.workout`.
- `inicio/Inicio.tsx:69` e `:86`: `latestWorkout(record)` / `getWorkout(record, sessionId)`; `same` = `getWorkout(...) !== null`.
- `perfil/metricas.ts:6`: `Object.values(days).reduce((n, d) => n + doneCount(d), 0)`.
- Uso de `acts.gym` (util.ts:55): continua válido como sinalizador legado; não é substituído.
- Regra para qualquer escrita: nunca atribuir `workout` diretamente; sempre `upsertWorkout`.

## Testes
`tests/unit/workoutRecord.test.ts` (legado, dois treinos, upsert, concluir A/iniciar B/concluir B, overlapping, constância). Suíte completa e typecheck passam.
