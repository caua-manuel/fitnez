import type { DayRecord, Plan, StateV3 } from '../../application/repository';
import { addDays, mondayOf, phaseOf, rirSequence } from '../../domain/calendar';
import type { DayIso } from '../../domain/calendar';
import { isLower, muscleGroupOf } from '../../domain/muscleGroups';
import type { MuscleGroup } from '../../domain/muscleGroups';
import { getWorkout, isDone, listWorkouts } from '../../domain/workoutRecord';
import { FREE_SESSION_ID } from '../../domain/weekStreak';
import { exercisesWithSwaps } from '../../domain/swap';

export function todayIso(): DayIso {
 const d = new Date();
 return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Semana usada para séries e repetições: a atual; antes do início, a primeira; depois do fim, a última.
export function planWeek(state: StateV3, today: DayIso): number {
 const phase = phaseOf(state.settings.start, today, rirSequence(state.catalog.plan));
 return phase.kind === 'week' ? phase.week : phase.kind === 'done' ? 11 : 0;
}

export function weekDays(state: StateV3, week: number): DayIso[] {
 const first = mondayOf(state.settings.start);
 return Array.from({ length: 7 }, (_, i) => addDays(first, week * 7 + i));
}

export const WEEKDAYS = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'] as const;

export const GROUP_LABEL: Record<MuscleGroup, string> = {
 peito: 'Peito', costas: 'Costas', 'ombro-lateral': 'Ombro lateral', 'ombro-posterior': 'Ombro posterior', press: 'Ombros',
 biceps: 'Bíceps', triceps: 'Tríceps', quadriceps: 'Quadríceps', 'posterior-gluteos': 'Posterior e glúteos', panturrilha: 'Panturrilha', core: 'Core',
};

export type SessionKind = 'superior' | 'inferior' | 'outro';
export function sessionKind(plan: Plan, id: string): SessionKind {
 let upper = 0, lower = 0;
 for (const exId of plan.sess[id]?.ex ?? []) {
  const ex = plan.ex[exId]; if (!ex) continue;
  const g = muscleGroupOf(exId, ex);
  if (g === null || g === 'core') continue;
  if (isLower(g)) lower++; else upper++;
 }
 return lower > upper ? 'inferior' : upper > 0 ? 'superior' : 'outro';
}

export function sessionIds(plan: Plan): string[] {
 const ids = plan.order.filter(id => plan.sess[id]);
 return [...ids, ...Object.keys(plan.sess).filter(id => !ids.includes(id))];
}

export function dayBelongsTo(plan: Plan, day: DayRecord | undefined, id: string): boolean {
 if (!day) return false;
 if (listWorkouts(day).length > 0) return getWorkout(day, id) !== null;
 return (plan.sess[id]?.ex ?? []).some(e => (day.log?.[e] ?? []).some(r => r.done === true));
}

export type DayStatus = 'done' | 'partial' | 'pending';
/** Situação de UM treino no dia. `acts.gym` (legado) só vale quando o dia não tem registro por treino. */
export function statusOf(day: DayRecord | undefined, id: string): DayStatus {
 if (isDone(day, id)) return 'done';
 if (getWorkout(day, id)?.status === 'partial') return 'partial';
 if (listWorkouts(day).length === 0 && day?.acts?.gym === true) return 'done';
 return 'pending';
}
export const STATUS_LABEL: Record<DayStatus, string> = { done: 'Concluído', partial: 'Em andamento', pending: 'Pendente' };

export function lastDoneDay(state: StateV3, id: string): DayIso | null {
 const days = state.history.days;
 const hit = Object.keys(days)
  .filter(d => dayBelongsTo(state.catalog.plan, days[d], id) && (!getWorkout(days[d], id) || isDone(days[d], id)))
  .sort().reverse();
 return hit[0] ?? null;
}

const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
export function formatDay(day: DayIso): string {
 const [y, m, d] = day.split('-').map(Number);
 return `${String(d).padStart(2, '0')} ${MONTHS[m! - 1]} ${y}`;
}

export function formatKg(n: number): string { return String(n).replace('.', ','); }

// Número solto vira estimativa ("≈ 55 min"); faixa ("70 a 80") e texto com unidade ficam como estão.
export function minutesLabel(min: string | undefined): string | null {
 const t = (min ?? '').trim();
 if (!t) return null;
 if (/min/i.test(t)) return t;
 return /^\d+$/.test(t) ? `≈ ${t} min` : `${t} min`;
}

/** Até dois grupos musculares que mais aparecem no treino, para a ilustração de destaque. */
export function sessionGroups(plan: Plan, id: string): MuscleGroup[] {
 const count = new Map<MuscleGroup, number>();
 for (const exId of plan.sess[id]?.ex ?? []) {
  const ex = plan.ex[exId]; if (!ex) continue;
  const g = muscleGroupOf(exId, ex);
  if (g) count.set(g, (count.get(g) ?? 0) + 1);
 }
 return [...count.entries()].sort((a, b) => b[1] - a[1]).slice(0, 2).map(([g]) => g);
}

/** Letra do treino na ordem do plano (A, B, C…), ou null se não estiver na lista. */
export function sessionLetter(plan: Plan, id: string): string | null {
 const i = sessionIds(plan).indexOf(id);
 return i >= 0 && i < 26 ? String.fromCharCode(65 + i) : null;
}

const MONTHS_LONG = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
export function shortDay(day: DayIso): string {
 const [, m, d] = day.split('-').map(Number);
 return `${d} ${MONTHS_LONG[m! - 1]}`;
}

/** Texto da meta de repetições: só acrescenta "repetições" quando a faixa é numérica pura (não "10 por lado" nem "30-40 s"). */
export function repsText(ex: { m?: string }, reps: string): string {
 const t = String(reps).trim();
 if (/[A-Za-zÀ-ÿ]/.test(t)) return t;
 const counted = ex.m === 'kg' || ex.m === 'kgs' || ex.m === 'rep' || ex.m === 'bw';
 return counted ? `${t} ${t === '1' ? 'repetição' : 'repetições'}` : t;
}

/** Índice do primeiro exercício com alguma série pendente; 0 se tudo estiver feito ou nada começado. */
export function firstIncomplete(rows: Record<string, { done: boolean }[]>, exIds: string[]): number {
 const i = exIds.findIndex(e => { const r = rows[e] ?? []; return r.length === 0 || r.some(s => !s.done); });
 return i < 0 ? 0 : i;
}

const cursorKey = (day: string, id: string) => `treino12:cursor:${day}:${id}`;
/** Exercício em que a pessoa estava (estado leve, por aba); null quando não há valor válido. */
export function readCursor(day: string, id: string, count: number): number | null {
 try {
  const raw = sessionStorage.getItem(cursorKey(day, id));
  const n = Number(raw);
  return raw !== null && Number.isInteger(n) && n >= 0 && n < count ? n : null;
 } catch { return null; }
}
export function writeCursor(day: string, id: string, idx: number | null) {
 try { if (idx === null) sessionStorage.removeItem(cursorKey(day, id)); else sessionStorage.setItem(cursorKey(day, id), String(idx)); } catch { /* o cursor é só conveniência */ }
}

export const plural =(n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export function normalize(s: string): string { return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim(); }

/** Exercícios do treino livre no dia: os escolhidos (lista da URL, "a,b") e os já registrados no dia que não são de outro treino. */
export function freeExercises(state: StateV3, day: DayIso, picked?: string): string[] {
 const plan = state.catalog.plan, rec = state.history.days[day];
 const own = new Set(listWorkouts(rec).filter(w => w.sessionId !== FREE_SESSION_ID).flatMap(w => exercisesWithSwaps(plan.sess[w.sessionId]?.ex ?? [], rec)));
 const logged = Object.keys(rec?.log ?? {}).filter(e => !own.has(e) && (rec?.log?.[e] ?? []).some(r => r.done === true));
 const chosen = (picked ?? '').split(',').filter(Boolean);
 return [...new Set([...chosen, ...logged])].filter(e => plan.ex[e]);
}
