# Handoff backend-dados: ADR 011, Fase 2 (2.1 descanso, 2.5 resumo, 2.6 estagnação) e números da demo (1.1)

Data: 20/11/2026. Estado continua `v: 3`; nenhum campo novo gravado; nenhuma dependência nova. Sem commit.
Base: [ADR 011](../decisoes/011-pronto-para-amigos-e-ferramentas-da-academia.md) 1.1, 2.1, 2.5 e 2.6; [conteúdo](conteudo-adr-011.md) partes A, B e C.

## Arquivos

- Alterados: `src/domain/restTimer.ts` (`restoreRest`), `src/demo/generate.ts` (números da parte A; marca PROVISÓRIO removida; sem PRNG: tudo determinado pela tabela).
- Novos: `src/domain/weekSummary.ts`, `src/domain/stagnation.ts`.
- Testes: `tests/unit/restTimer.test.ts` (ampliado), `tests/unit/stagnation.test.ts` (12 casos da tabela C.6 + regras gerais), `tests/unit/weekSummary.test.ts`, `tests/unit/demo-generate.test.ts` (ampliado). `tests/integration/demo.test.ts` sem mudança, passa.

## API para a tela

### 2.1 Descanso (`src/domain/restTimer.ts`)
```ts
interface SavedRest { exId: string; endsAt: number; total: number }
type RestoreRest =
 | { kind: 'ativo'; rest: SavedRest; remainingSec: number }
 | { kind: 'terminado'; rest: SavedRest; endedAgoSec: number }   // venceu há até 10 min (inclusive o instante do fim)
 | { kind: 'nada' };
restoreRest(raw: unknown, ctx: { id: string; day: string; now: number }): RestoreRest
REST_ENDED_GRACE_MS = 600000; REST_MAX_AHEAD_MS = 3600000   // fim a mais de 1 h no futuro = lixo -> 'nada'
```
`raw` pode ser o texto do `localStorage` (ou `null`) ou o objeto já lido; JSON inválido, outro treino, outro dia ou campos errados dão `nada`.

Uso em `Executar.tsx` (frontend; não editei, o TODO está na linha do `readRest`):
```ts
const raw = (() => { try { return localStorage.getItem(REST_KEY); } catch { return null; } })();
const r = restoreRest(raw, { id, day, now: Date.now() });
if (r.kind === 'ativo') { setRest(r.rest); setEnded(false); }
else if (r.kind === 'terminado') { endedFor.current = r.rest.endsAt; setRest(r.rest); setEnded(true); } // mostra "Descanso terminou", sem vibrar de novo
else writeRest(id, day, null);  // limpa a chave vencida ou inválida
```
Chamar na montagem e também no `visibilitychange` (volta à aba), junto com o `setNow(Date.now())` que já existe. Marcar `endedFor.current` antes de `setEnded(true)` evita que o efeito do fim vibre/notifique de novo.

### 2.5 Resumo da semana (`src/domain/weekSummary.ts`)
```ts
weekSummaryOf(state: StateV3, opts: { today: DayIso; week?: number; body?: boolean }): WeekSummary | null
weekSummary(input: WeekSummaryInput): WeekSummary | null
 // WeekSummaryInput = { days; plan; sched; start; today; targets /* settings: dietTargets + profile */;
 //   onboarding?: { hideDietNumbers?; dietTargetsDisabled? } | null; diet /* catalog.diet */; week?; measurements?; body? }
interface WeekSummary {
 week: number; from: DayIso; to: DayIso; deload: boolean;
 workouts: { done: number; partial: number; planned: number };   // done = planWorkoutsDone (treino livre fora); planned = dias de academia da rotina
 sets: number; volume: number;                                     // sem aquecimento, todos os registros da semana até hoje
 records: { exId; name; day; type: RecordType; kg; reps; e1rm: number | null }[];   // melhor recorde por exercício (recordsOfDay)
 diet: { considered; registered; onTarget; unregistered; text: string } | null;    // null com hideDietNumbers ou dietTargetsDisabled
 body: { weight: BodyChange | null; waist: BodyChange | null } | null;              // só com body: true
}
interface BodyChange { before: number; after: number; delta: number }   // última medida da semana contra a última antes dela
dietDayStatus(totals: { kcal; p; eatenCount }, target: { kcal; protein }): 'sem-registro' | 'na-meta' | 'fora'
dietLine(onTarget: number, registered: number, unregistered: number): string
DIET_FOOTNOTE   // rodapé "Na meta: ..." (uma vez por cartão, só quando `diet` existe)
DIET_ON_TARGET = { kcalTolerance: 0.1, proteinMin: 0.85 }
```
- `null`: antes da segunda-feira do início, semana fora de 0 a 11, ou semana que ainda não começou.
- Semana padrão = a de `today`. Para o cartão do Início na primeira abertura da semana seguinte: `weekSummaryOf(state, { today, week: semanaAtual - 1 })`.
- Dieta: só datas antes de hoje; meta do dia = `dayTargetFor(tipo, data, settings)` com o tipo da rotina (com `over` e `plan.alt`, como a Dieta). `diet.text` já é a linha B.2.
- `body`: passe `body: true` só quando a pessoa marcar na hora; nunca salve a escolha. Sem a opção, nenhum número de peso ou cintura aparece no resultado.

### 2.6 Estagnação (`src/domain/stagnation.ts`)
```ts
stagnation(input: { ex: Pick<Exercise, 'm' | 's' | 'r'>; sessions: readonly ExerciseSession[]; start: DayIso; today: DayIso; week: number; beginner: boolean }): Stagnation | null
interface Stagnation { motivo: 'queda' | 'sem-progresso'; acao: 'deload' | 'repeticoes' | 'trocar'; sessoes: number; texto: string; novaFaixa?: string; kgSugerido?: number }
planWeekIndex(start: DayIso, today: DayIso): number
STAGNATION_NOTE    // "Melhorar aqui é ..." (uma vez na página do exercício)
STAGNATION_BUTTON  // { repeticoes: 'Ajustar repetições', trocar: 'Trocar só hoje' }
STAGNATION         // limiares (a verificar)
```
Chamada: `stagnation({ ex, sessions: exerciseHistory(state.history.days, exId, ex), start: state.settings.start, today, week: planWeekIndex(start, today), beginner: Array.isArray(state.catalog.plan.rir) })`. A assinatura segue o conteúdo (C.1), não a do ADR (`rirOfWeek`, `experience`): `beginner` = o plano tem `plan.rir`. `texto` é o texto final da parte C.5; `deload` não tem botão (só orientação). "Ajustar repetições" troca `r` do exercício no bloco atual e nos seguintes por `novaFaixa` via `planEdit.ts` (com desfazer); `kgSugerido` é só texto.

## Demo (parte A)

`DEMO_PARAMS` agora tem só os números do conteúdo: perfil "Exemplo" (30 anos, 178 cm, 76,3 kg, sem `dietTargets`), cargas da tabela A.4, falta na sexta da semana 2 (UB), parcial na terça da semana 3 (LW, `salto_l`, `agach`, `stiff`, `bulg`, 40 min), 18h30 de Brasília e 75 min, `feel` 3/4/2, jiu-jitsu e vôlei em todas as semanas, medidas 77,0→76,3 kg e 86,0→85,2 cm, dieta A/B/C/A/B (22 de 28 dias nas semanas 1 a 4). O resumo da semana sobre a demo dá exatamente a conferência do conteúdo: 6 de 6, 4 de 5, 6 de 6, 4 de 5.

Decisões de leitura do conteúdo:
- Subida de carga só em `m: 'kg'` com faixa que `repRange` entende; peso do corpo (`barra`) não ganha carga extra. Sem subida, as repetições param no topo (não recomeçam).
- Subida conquistada na semana 3 só aparece na semana 5: a semana leve usa a carga da última sessão feita (o teste antigo exige carga igual à anterior na semana leve).
- Tempo e `kgs`: ponto médio da faixa (`farmer` 35 s, `copen_l` 25 s, `pescoco` 20 s).
- Medida da segunda da semana 5 entra mesmo se hoje for essa segunda (A.5 diz "≤ today").

## Regra C.2.6 (decidida depois pelo conteúdo)

A.4 previa nenhum aviso na demo, mas o Pallof (15 kg × 10 fixo, "10 por lado") dava `trocar`. O conteúdo aprovou a regra C.2.6: `stagnation` devolve `null` quando `repRange(setsForWeek(ex, week).reps) === null`. Implementada; caso 13 na tabela; `demo-generate.test.ts` agora garante nenhum aviso de estagnação na demo (6 datas de hoje).

## Verificação

- `npm run typecheck`: só erros em `src/features/assistente/Assistente.tsx` e `tests/unit/assistente-perfis.test.ts` (`'g' is possibly 'null'`), do outro agente (onboarding). Meus arquivos sem erros.
- `npx vitest run`: 712 de 717. As 5 falhas não são destes arquivos: 2 em `assistente-perfis` (outro agente) e 3 por causa de `data/plan.json` em edição (57 exercícios em vez de 55: `entrega-a-dados`, `repository`, `ondasHevy` "ponte").

## Guia de exercícios fora da carga inicial (21/11/2026)

- `src/data/validation.ts` importava `checkStoredExerciseNotes` de `src/domain/exerciseNotes.ts`, que carrega `data/exercise-guide.json` no topo. Isso prendia o guia na carga inicial.
- Novo `src/domain/exerciseNotesCheck.ts` (puro, sem o JSON): `EXERCISE_NOTE_MAX`, `EXERCISE_NOTES_MAX_COUNT`, `EXERCISE_ID_MAX` e `checkStoredExerciseNotes`. A validação passou a importar daqui.
- `exerciseNotes.ts` reexporta os mesmos nomes, então a API não mudou e nenhuma tela precisou mudar. O guia (`guideFor`, `GUIDE_SAFETY`, `EXERCISE_GUIDE`) continua lá.
- Único importador estático de `exerciseNotes.ts`: `src/features/treino/ExercicioPagina.tsx`, que já é carregada sob demanda (`lazy.tsx`). O guia agora vai no chunk dela (`ExercicioPagina-*.js`, 5,9 KB gzip). Nenhuma outra tela importa o guia de forma estática.
- Carga inicial JS (gzip): **190,9 KB → 187,0 KB** (`index-*.js` 154,5 → 150,4 KB). Total: 240,4 → 240,7 KB, por causa de pequenas mudanças paralelas de outros agentes.
- Vitest: 778 de 778 testes aprovados. `tsc` passou na minha rodada.
- O `npm run build` seguinte parou no typecheck por causa de `tests/e2e/entrega-b-dieta.spec.ts` (linhas 283 e 292), que outro agente estava editando. Rodei `vite build` e `scripts/verify-build.ts` à parte, e os dois passaram dentro do orçamento.
