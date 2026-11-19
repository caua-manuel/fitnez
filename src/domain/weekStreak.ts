import type { DayRecord, Payload } from '../application/repository';
import { addDays, mondayOf, type DayIso } from './calendar';
import { listWorkouts } from './workoutRecord';

// Sequência de semanas (conteudo-aval-ondas-hevy.md, seção 6). Treino livre (sessionId 'livre') e aulas não contam.

export const FREE_SESSION_ID = 'livre';
const DAY = 86400000;
const utc = (d: DayIso) => { const [y, m, dd] = d.split('-').map(Number); return Date.UTC(y!, m! - 1, dd!); };

/** Treinos do plano concluídos no dia (legado `done: true` sem registro de treino vale 1). */
export function planWorkoutsDone(day: DayRecord | null | undefined): number {
 const n = listWorkouts(day).filter(w => w.status === 'done' && w.sessionId !== FREE_SESSION_ID).length;
 return n === 0 && day?.done === true ? 1 : n;
}

export const weeklyGoal = (sched: readonly Payload[]): number => sched.filter(d => d?.k === 'gym').length;
export function weekMet(done: number, goal: number, week: number): boolean {
 const deload = week < 12 && week % 4 === 3;
 return done >= (deload ? 1 : Math.max(1, goal - 1));
}

/** count = semanas seguidas; show = count ≥ 2 (`${count} semanas seguidas`). Ao quebrar, count volta a contar do zero, sem mensagem. */
export function weekStreak(input: { days: Record<string, DayRecord>; sched: readonly Payload[]; start: DayIso; today: DayIso }): { count: number; show: boolean } {
 const first = mondayOf(input.start);
 if (input.today < first) return { count: 0, show: false };
 const current = Math.floor((utc(input.today) - utc(first)) / DAY / 7);
 const goal = weeklyGoal(input.sched);
 let count = 0, lastForgiven = -Infinity;
 for (let w = 0; w <= current; w++) {
  let done = 0;
  for (let i = 0; i < 7; i++) { const d = addDays(first, w * 7 + i); if (d <= input.today) done += planWorkoutsDone(input.days[d]); }
  if (weekMet(done, goal, w)) { count++; continue; }
  if (w === current) break; // em andamento: não soma nem quebra
  if (count > 0 && w - lastForgiven > 3) { lastForgiven = w; continue; } // perdão: não soma
  count = 0;
 }
 return { count, show: count >= 2 };
}
