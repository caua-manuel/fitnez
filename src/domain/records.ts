import type { DayRecord, Exercise, Plan } from '../application/repository';
import type { DayIso } from './calendar';
import { workingSets } from './setPlaceholder';
import { getWorkout } from './workoutRecord';
import { parseNumber, type SetEntry } from './workout';

// Recordes pessoais, volume comparado e histórico por exercício (conteudo-aval-ondas-hevy.md, seção 2). Funções puras.

export type RecordType = 'maxKg' | 'maxE1rm' | 'maxRepsAtKg';
export const RECORD_PRIORITY: readonly RecordType[] = ['maxKg', 'maxE1rm', 'maxRepsAtKg'];
/** Ganho mínimo do 1RM estimado para virar recorde (evita anunciar arredondamento). */
export const E1RM_MIN_GAIN = 0.5;
export const E1RM_MAX_REPS = 10;
export const E1RM_FOOTNOTE = 'O 1RM estimado é uma conta aproximada a partir das suas séries. Não é preciso testar a carga máxima.';

/** Epley (a verificar): kg × (1 + reps/30), só com 1 a 10 repetições; fora disso, null. */
export function e1rm(kg: number, reps: number): number | null {
 if (!(kg > 0) || !Number.isInteger(reps) || reps < 1 || reps > E1RM_MAX_REPS) return null;
 return kg * (1 + reps / 30);
}
/** Arredondamento de exibição do 1RM: 0,5 kg. */
export const roundHalf = (x: number): number => Math.round(x * 2) / 2;

interface Lift { kg: number; reps: number }
/** Série elegível para recorde: exercício `m: 'kg'`, série de trabalho concluída, kg > 0 e reps ≥ 1. */
export function eligibleLift(ex: Pick<Exercise, 'm'> | null | undefined, s: Partial<SetEntry> | null | undefined): Lift | null {
 if (!ex || ex.m !== 'kg' || !s || s.done !== true || s.kind === 'warm') return null;
 const kg = parseNumber(s.kg), reps = parseNumber(s.reps);
 if (kg === null || reps === null || kg <= 0 || reps < 1) return null;
 return { kg, reps: Math.floor(reps) };
}

export interface PersonalBests {
 /** Há pelo menos uma série elegível no histórico considerado (sem isso, nada é recorde). */
 hasHistory: boolean;
 maxKg: { kg: number; reps: number; day: DayIso } | null;
 maxE1rm: { value: number; kg: number; reps: number; day: DayIso } | null;
 /** Mais repetições já feitas em cada carga exata (chave = carga em texto, ex.: "60", "62.5"). */
 repsAtKg: Record<string, number>;
}
const keyKg = (kg: number) => String(Math.round(kg * 100) / 100);
const emptyBests = (): PersonalBests => ({ hasHistory: false, maxKg: null, maxE1rm: null, repsAtKg: {} });

function addLift(b: PersonalBests, l: Lift, day: DayIso): void {
 b.hasHistory = true;
 if (!b.maxKg || l.kg > b.maxKg.kg || (l.kg === b.maxKg.kg && l.reps > b.maxKg.reps)) b.maxKg = { kg: l.kg, reps: l.reps, day };
 const v = e1rm(l.kg, l.reps);
 if (v !== null && (!b.maxE1rm || v > b.maxE1rm.value)) b.maxE1rm = { value: v, kg: l.kg, reps: l.reps, day };
 const k = keyKg(l.kg);
 if ((b.repsAtKg[k] ?? 0) < l.reps) b.repsAtKg[k] = l.reps;
}

/** Melhores marcas do exercício em todos os dias anteriores a `beforeDay` (sem limite: todos os dias). */
export function personalRecords(days: Record<string, DayRecord>, exId: string, ex: Pick<Exercise, 'm'> | null | undefined, beforeDay?: DayIso): PersonalBests {
 const b = emptyBests();
 for (const day of Object.keys(days).sort()) {
  if (beforeDay !== undefined && day >= beforeDay) continue;
  for (const s of workingSets(days[day]?.log?.[exId])) { const l = eligibleLift(ex, s); if (l) addLift(b, l, day); }
 }
 return b;
}

export interface SetRecord { type: RecordType; kg: number; reps: number; /** 1RM estimado exato (exiba com roundHalf). */ e1rm: number | null; /** Todos os tipos batidos, pela prioridade. */ types: RecordType[] }

/**
 * Recorde ao registrar uma série. `todayBefore` = linhas do mesmo exercício já registradas hoje antes desta
 * (a 3ª série pode ser recorde mesmo que a 1ª já tenha sido). Primeira vez (sem histórico antes do dia): null.
 */
export function recordForSet(input: { ex: Pick<Exercise, 'm'>; bests: PersonalBests; todayBefore?: readonly SetEntry[]; set: SetEntry; day?: DayIso }): SetRecord | null {
 const { ex } = input;
 if (!input.bests.hasHistory) return null;
 const l = eligibleLift(ex, input.set);
 if (!l) return null;
 const b: PersonalBests = { ...input.bests, repsAtKg: { ...input.bests.repsAtKg } };
 for (const s of input.todayBefore ?? []) { const x = eligibleLift(ex, s); if (x) addLift(b, x, input.day ?? ''); }
 const types: RecordType[] = [];
 if (b.maxKg && l.kg > b.maxKg.kg) types.push('maxKg');
 const v = e1rm(l.kg, l.reps);
 if (v !== null && (!b.maxE1rm || v >= b.maxE1rm.value + E1RM_MIN_GAIN)) types.push('maxE1rm');
 const prev = b.repsAtKg[keyKg(l.kg)];
 if (prev !== undefined && l.reps > prev) types.push('maxRepsAtKg');
 if (!types.length) return null;
 return { type: types[0]!, kg: l.kg, reps: l.reps, e1rm: v, types };
}

export interface DayRecordHit extends SetRecord { exId: string }
/** Recordes do dia `day` (para o Concluído): o melhor tipo por exercício, na ordem de `exIds` (ou do registro). */
export function recordsOfDay(days: Record<string, DayRecord>, plan: Pick<Plan, 'ex'>, day: DayIso, exIds?: readonly string[]): DayRecordHit[] {
 const log = days[day]?.log ?? {};
 const out: DayRecordHit[] = [];
 for (const exId of exIds ?? Object.keys(log)) {
  const ex = plan.ex[exId];
  if (!ex) continue;
  const bests = personalRecords(days, exId, ex, day);
  const rows = workingSets(log[exId]);
  let best: SetRecord | null = null;
  rows.forEach((set, i) => {
   const r = recordForSet({ ex, bests, todayBefore: rows.slice(0, i), set, day });
   if (r && (!best || RECORD_PRIORITY.indexOf(r.type) < RECORD_PRIORITY.indexOf(best.type) || (r.type === best.type && (r.e1rm ?? r.kg) > (best.e1rm ?? best.kg)))) best = r;
  });
  if (best) out.push({ ...(best as SetRecord), exId });
 }
 return out;
}

export interface VolumeComparison { volume: number; previous: number | null; /** Variação em % arredondada; null sem treino anterior ou com volume anterior 0. */ pct: number | null }
export function volumeComparison(volume: number, previous: number | null | undefined): VolumeComparison {
 const prev = typeof previous === 'number' && Number.isFinite(previous) ? previous : null;
 return { volume, previous: prev, pct: prev !== null && prev > 0 ? Math.round(((volume - prev) / prev) * 100) : null };
}
/** Volume da última vez em que o mesmo treino (`sessionId`) foi concluído antes de `before`, ou null. */
export function previousSessionVolume(days: Record<string, DayRecord>, sessionId: string, before: DayIso): number | null {
 for (const day of Object.keys(days).filter(d => d < before).sort().reverse()) {
  const w = getWorkout(days[day], sessionId);
  if (w?.status === 'done' && typeof w.volume === 'number' && Number.isFinite(w.volume)) return w.volume;
 }
 return null;
}

export interface HistorySet { kg: number | null; reps: number | null }
export interface ExerciseSession {
 day: DayIso;
 /** Séries de trabalho concluídas, na ordem (aquecimento fica fora). */
 sets: HistorySet[];
 /** Melhor série: maior 1RM estimado; sem 1RM (reps > 10 ou sem carga), maior carga e depois mais repetições. */
 best: HistorySet | null;
 /** Maior 1RM estimado da sessão (exato; exiba com roundHalf), só para `m: 'kg'`. */
 e1rm: number | null;
 maxKg: number | null;
}
/** Histórico do exercício para a página do exercício, do dia mais recente ao mais antigo. */
export function exerciseHistory(days: Record<string, DayRecord>, exId: string, ex?: Pick<Exercise, 'm'> | null): ExerciseSession[] {
 const out: ExerciseSession[] = [];
 for (const day of Object.keys(days).sort().reverse()) {
  const done = workingSets(days[day]?.log?.[exId]).filter(s => s.done);
  if (!done.length) continue;
  const sets = done.map(s => ({ kg: parseNumber(s.kg), reps: parseNumber(s.reps) }));
  let e: number | null = null, best: HistorySet | null = null, bestE: number | null = null;
  for (const s of sets) {
   const v = ex?.m === 'kg' || ex == null ? (s.kg !== null && s.reps !== null ? e1rm(s.kg, s.reps) : null) : null;
   if (v !== null && (e === null || v > e)) e = v;
   const better = !best
    || (v !== null && (bestE === null || v > bestE))
    || (v === null && bestE === null && ((s.kg ?? 0) > (best.kg ?? 0) || ((s.kg ?? 0) === (best.kg ?? 0) && (s.reps ?? 0) > (best.reps ?? 0))));
   if (better) { best = s; bestE = v; }
  }
  const kgs = sets.map(s => s.kg).filter((n): n is number => n !== null);
  out.push({ day, sets, best, e1rm: ex && ex.m !== 'kg' ? null : e, maxKg: kgs.length ? Math.max(...kgs) : null });
 }
 return out;
}
