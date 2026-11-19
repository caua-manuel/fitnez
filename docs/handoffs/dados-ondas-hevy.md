# Dados: regras das ondas inspiradas no Hevy (e ajuste de volume do assistente)

Data: 19/11/2026. Responsável: `backend-dados`. Contratos: `conteudo-aval-ondas-hevy.md`, `conteudo-instrucoes-exercicios.md`, ADR 009; `conteudo-ajuste-volume-assistente.md`, ADR 010.
Tudo é função pura em `src/domain`; nada grava. Sem dependência nova. `npm run typecheck` e `npm test` verdes (36 arquivos, 531 testes).

## Formato de dados (novo, opcional, retrocompatível)

| Campo | Onde | Regra de validação (backup e estado) |
| --- | --- | --- |
| `kind: 'warm'` | linha de `history.days[d].log[exId][i]` | ausente ou exatamente `'warm'` |
| `swaps: { [idOriginal]: idNovo }` | `history.days[d]` (troca só no dia) | textos até 200, até 200 entradas |
| `exerciseNotes: { [exId]: texto }` | `settings` | até 140 caracteres por nota, até 1000 notas |
| `plates: { bar, available }` | `settings` | `bar` em 20, 15, 10, 0 (sem barra); `available` subconjunto de 25, 20, 15, 10, 5, 2,5, 1,25 |

Sem versão nova do estado: os campos são opcionais, backups v1, v2 e v3 antigos continuam importando (teste de integração). `data/exercise-guide.json` (novo, catálogo, não vai para o backup) foi gerado do documento de instruções: `{ versao: 1, seguranca: [2 frases], itens: { id: { passos, erro } } }`, 55 IDs.

Mudanças mínimas em arquivos existentes: `SetEntry.kind?: 'warm'` e `isWarm` em `workout.ts`; `sessionVolume`, `countDoneSets`, `lastPerformance` e `suggestNext` (via `validSets`) ignoram aquecimento.

## API para a interface

`src/domain/setPlaceholder.ts`
- `workingSets(rows): SetEntry[]` (sem aquecimento)
- `lastWorkingSession(days, exId, before): { day, sets } | null` (séries de trabalho concluídas)
- `previousSetAt(days, exId, day, index): SetEntry | null` ("Antes"; `index` entre as séries de trabalho)
- `workingHistory(days, exId, before): SetEntry[][]` (passe a `suggestNext`)
- `placeholderFor({ ex, week, suggestion, previous, today, index }): { kg: string|null, reps: string|null, podeConfirmar, falta: 'kg'|'reps'|null, dica: { kg: 'kg', reps: faixa } }`
  - `previous` = `lastWorkingSession(...)?.sets ?? []`; `today` = linhas de hoje (pode ter aquecimento); "carga mudada hoje" é calculada sozinha (recalcula o placeholder da série anterior).
- `confirmSet(typed, placeholder, ex, kind?): { ok: true, set } | { ok: false, falta, mensagem }` (mensagem `Digite a carga` ou `Digite as repetições`; `bw` grava kg `''`).

`src/domain/records.ts`
- `e1rm(kg, reps): number|null` (Epley, 1 a 10 reps), `roundHalf(x)`, `E1RM_FOOTNOTE`, `RECORD_PRIORITY`.
- `personalRecords(days, exId, ex, beforeDay?): { hasHistory, maxKg, maxE1rm, repsAtKg }` (também serve de "Melhores marcas").
- `recordForSet({ ex, bests, todayBefore?, set, day? }): { type, kg, reps, e1rm, types } | null`.
- `recordsOfDay(days, plan, day, exIds?): Array<SetRecord & { exId }>` (melhor tipo por exercício, para o Concluído; a UI corta em 3 + `e mais N`).
- `previousSessionVolume(days, sessionId, before): number|null`, `volumeComparison(volume, previous): { volume, previous, pct }`.
- `exerciseHistory(days, exId, ex?): Array<{ day, sets: {kg,reps}[], best, e1rm, maxKg }>` (mais recente primeiro).

`src/domain/plates.ts`: `platesPerSide(total, bar = 20, available = DEFAULT_PLATES)` → `{ ok: true, perSide, achieved, exact, bar } | { ok: false, error: 'abaixo-da-barra'|'carga-invalida' }`; `BARBELL_EXERCISES`, `BAR_OPTIONS`, `DEFAULT_PLATE_SETTINGS`, `checkStoredPlates`.

`src/domain/weeklySets.ts`: `weeklySetsByGroup(days, plan, monday)`, `plannedSetsByGroup(plan, sched, week)` (séries previstas por grupo), `groupRange(group, experience?)`, `groupStatus({ group, sets, experience?, inProgress, deload, planned? })` → `'abaixo'|'dentro'|'acima'|null` (piso = min(mínimo da faixa, planned)); faixa intermediária dos grandes 8 a 16 (conteudo-divergencias-ondas.md). Textos `GROUP_STATUS_TEXT`, `GROUP_HELP`, `DELOAD_LINE`.

`src/domain/swap.ts`: `SWAP_GROUPS`, `BEGINNER_SWAP_EXCLUDED`, `NO_SWAP_TEXT`, `swapOptions(exId, place?, experience?, presentIds?)`, `swapPrescription(original, novo, week)` → `{ sets, reps, rest }`, `setDaySwap(day, from, to|null)`, `exercisesWithSwaps(sessionEx, day)`. Séries do trocado vão em `log[idNovo]`.

`src/domain/warmup.ts`: `warmupSets({ exId, ex, baseKg, earlier? })` (alias `warmupSuggestion`) → `{ kg, reps }[]`; `WARMUP_TEXT`, `GENERAL_WARMUP_TEXT`. `baseKg` = `Number(placeholderFor(...index 0).kg)` ou null.

`src/domain/weekStreak.ts`: `weekStreak({ days, sched, start, today })` → `{ count, show }`; `planWorkoutsDone`, `weeklyGoal`, `weekMet`, `FREE_SESSION_ID = 'livre'`.

`src/domain/exerciseNotes.ts`: `EXERCISE_NOTE_MAX = 140`, `setExerciseNote(notes, exId, text)`, `checkStoredExerciseNotes`, `guideFor(exId)` → `{ passos: string[], erro } | null`, `GUIDE_SAFETY`, `EXERCISE_GUIDE`.

## Ajuste de volume do assistente (ADR 010)

`onboarding.ts`: `templateFor(key, exp, days)` com Superior B sem puxada vertical para nunca/iniciante e Corpo inteiro B com empurrar inclinado com 2 dias (subtítulo `Pernas, peito, costas e core`, exportado como `CIB_2DIAS_SUB`). Os 15 perfis conferem com todos os valores da seção 4 do documento, inclusive a faixa nova (intermediário 8 a 16) e o mínimo com 2 dias. Nenhum número divergiu.

## Divergências (resolvidas em conteudo-divergencias-ondas.md)

1. Aquecimento `goblet 24`: vale 12,5 × 8 (regra).
2. Faixa intermediária dos grupos grandes: 8 a 16; 15 e 16 = dentro, 17 = acima.
3. Plano de exemplo: o piso de `groupStatus` usa o previsto (`planned`); quadríceps 7 e panturrilha 3 nos blocos 1 e 3 ficam dentro. O teste de consistência confere só o máximo.

## Testes

`tests/unit/ondasHevy.test.ts` (todas as tabelas do contrato), `tests/unit/onboarding.test.ts` (volume dos 15 perfis), `tests/integration/ondas-hevy-dados.test.ts` (importação, recusa e ida e volta dos campos novos; backups antigos).
