import type { DayRecord, Plan, WorkoutMeta } from '../application/repository';
export type { WorkoutMeta };

// Vários treinos no mesmo dia. DayRecord.workouts[sessionId] guarda um registro por treino; DayRecord.workout (legado)
// segue sendo lido e é mantido igual ao último treino tocado. Funções puras: nunca mutam a entrada e nunca apagam outro treino.
// Séries por exercício (DayRecord.log[exId]) pertencem ao DIA, não ao treino: dois treinos com o mesmo exercício
// compartilham as séries; use overlappingExercises para avisar o usuário antes de iniciar o segundo.

const num = (n: unknown) => (typeof n === 'number' && Number.isFinite(n) ? n : 0);
const touched = (w: WorkoutMeta) => Math.max(num(w.finishedAt), num(w.startedAt));
const valid = (w: unknown): w is WorkoutMeta => !!w && typeof w === 'object' && typeof (w as WorkoutMeta).sessionId === 'string' && (w as WorkoutMeta).sessionId !== '';

/** Todos os treinos do dia (workouts + legado), sem duplicar por sessionId, do mais antigo ao mais recente. */
export function listWorkouts(day: DayRecord | null | undefined): WorkoutMeta[] {
 if (!day) return [];
 const map = new Map<string, WorkoutMeta>();
 const rec = day.workouts;
 if (rec && typeof rec === 'object') for (const [id, w] of Object.entries(rec)) if (valid(w)) map.set(id, { ...w, sessionId: w.sessionId });
 const legacy = day.workout;
 if (valid(legacy)) {
  const cur = map.get(legacy.sessionId);
  // Legado mais novo vence (ex.: tela antiga gravou só `workout`); empate prefere workouts.
  if (!cur || touched(legacy) > touched(cur)) map.set(legacy.sessionId, legacy);
 }
 return [...map.values()].sort((a, b) => touched(a) - touched(b) || a.startedAt - b.startedAt);
}

export function getWorkout(day: DayRecord | null | undefined, sessionId: string): WorkoutMeta | null {
 return listWorkouts(day).find(w => w.sessionId === sessionId) ?? null;
}

/** Grava/atualiza o treino `meta.sessionId` sem tocar nos demais; o campo legado passa a apontar para ele. */
export function upsertWorkout(day: DayRecord | null | undefined, meta: WorkoutMeta): DayRecord {
 const base: DayRecord = day ? { ...day } : {};
 const workouts: Record<string, WorkoutMeta> = {};
 // Promove o legado para workouts antes de substituí-lo, para não perder o treino anterior.
 for (const w of listWorkouts(day)) workouts[w.sessionId] = w;
 workouts[meta.sessionId] = { ...meta };
 return { ...base, workouts, workout: { ...meta } };
}

export const isDone = (day: DayRecord | null | undefined, sessionId: string): boolean => getWorkout(day, sessionId)?.status === 'done';
export const doneCount = (day: DayRecord | null | undefined): number => listWorkouts(day).filter(w => w.status === 'done').length;
export const hasAnyDone = (day: DayRecord | null | undefined): boolean => doneCount(day) > 0;
export const totalSets = (day: DayRecord | null | undefined): number => listWorkouts(day).reduce((n, w) => n + num(w.sets), 0);
export const totalVolume = (day: DayRecord | null | undefined): number => Math.round(listWorkouts(day).reduce((n, w) => n + num(w.volume), 0) * 100) / 100;
/** Treino mais recente do dia (equivale ao campo legado `workout`). */
export const latestWorkout = (day: DayRecord | null | undefined): WorkoutMeta | null => { const l = listWorkouts(day); return l[l.length - 1] ?? null; };

/** Exercícios do treino `sessionId` que já têm séries registradas hoje (feitas ou preenchidas), vindas de outro treino ou do mesmo. */
export function overlappingExercises(day: DayRecord | null | undefined, plan: Plan | null | undefined, sessionId: string): string[] {
 const ids = plan?.sess?.[sessionId]?.ex ?? [];
 const log = day?.log ?? {};
 return ids.filter(id => {
  const rows = log[id];
  return Array.isArray(rows) && rows.some(r => r?.done === true || (r?.kg !== undefined && r.kg !== '') || (r?.reps !== undefined && r.reps !== ''));
 });
}
