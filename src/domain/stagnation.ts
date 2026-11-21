import type { Exercise } from '../application/repository';
import type { DayIso } from './calendar';
import { repRange } from './progression';
import { e1rm, type ExerciseSession } from './records';
import { setsForWeek } from './workout';

// Aviso de estagnação (ADR 011, 2.6). Regras e textos de docs/handoffs/conteudo-adr-011.md, parte C.
// Função pura: data e semana entram como parâmetro. Limiares são escolhas de produto (a verificar).

export type StagnationAction = 'deload' | 'repeticoes' | 'trocar';
export interface Stagnation {
 motivo: 'queda' | 'sem-progresso';
 acao: StagnationAction;
 /** Treinos considerados no aviso (2 na queda; k em "sem progresso"). */
 sessoes: number;
 texto: string;
 /** Só em `repeticoes`: faixa nova, ex.: "6–8". */
 novaFaixa?: string;
 /** Só em `repeticoes`: carga sugerida em kg (múltiplo de 0,5). */
 kgSugerido?: number;
}

/** Limiares da parte C (a verificar). */
export const STAGNATION = {
 /** Progresso pelo 1RM estimado: q ≥ 1,01 melhor; q ≤ 0,97 pior. */
 better: 1.01, worse: 0.97,
 /** Sem 1RM: diferença de carga a partir da qual conta (kg). */
 kgStep: 0.5,
 /** Pausa: sessões válidas a mais de 21 dias uma da outra recomeçam a contagem. */
 pauseDays: 21,
 /** Janela máxima de sessões válidas. */
 window: 6,
 minForDrop: 3, minForFlat: 4,
} as const;

export const STAGNATION_NOTE = 'Melhorar aqui é levantar mais carga ou fazer mais repetições com a mesma carga.';
export const STAGNATION_BUTTON: Readonly<Record<'repeticoes' | 'trocar', string>> = { repeticoes: 'Ajustar repetições', trocar: 'Trocar só hoje' };

const DAY = 86400000;
const utc = (d: DayIso) => { const [y, m, dd] = d.split('-').map(Number); return Date.UTC(y!, m! - 1, dd!); };
const daysBetween = (a: DayIso, b: DayIso) => Math.round((utc(b) - utc(a)) / DAY);
const isDeload = (week: number) => week % 4 === 3;
const kgText = (n: number) => String(n).replace('.', ',');

interface Valid { day: DayIso; kg: number; reps: number; e1rm: number | null }
type Cmp = 'melhor' | 'igual' | 'pior';

/** Compara a melhor série de S com a de R (parte C.3). */
function cmp(S: Valid, R: Valid): Cmp {
 if (S.e1rm !== null && R.e1rm !== null) {
  const q = S.e1rm / R.e1rm;
  return q >= STAGNATION.better ? 'melhor' : q <= STAGNATION.worse ? 'pior' : 'igual';
 }
 const d = S.kg - R.kg;
 if (d >= STAGNATION.kgStep) return 'melhor';
 if (d <= -STAGNATION.kgStep) return S.reps > R.reps ? 'igual' : 'pior';
 if (S.reps >= R.reps + 1) return 'melhor';
 if (S.reps <= R.reps - 2) return 'pior';
 return 'igual';
}

/** Faixa nova pelo máximo da faixa atual (C.4.3). */
function newRange(max: number): string | null {
 if (max <= 6) return '6–8';
 if (max <= 10) return '8–12';
 if (max <= 12) return '12–15';
 return null;
}

/**
 * Aviso de estagnação de um exercício, ou `null`.
 * - `sessions`: `exerciseHistory(days, exId, ex)` (do mais recente ao mais antigo; a ordem de entrada não importa).
 * - `week`: índice (0 a 11) da semana do plano de `today`.
 * - `beginner`: o plano tem `plan.rir` (iniciante, nunca treinou ou conservador).
 */
export function stagnation(input: { ex: Pick<Exercise, 'm' | 's' | 'r'>; sessions: readonly ExerciseSession[]; start: DayIso; today: DayIso; week: number; beginner: boolean }): Stagnation | null {
 const { ex, start, today, week, beginner } = input;
 if (!ex || (ex.m !== 'kg' && ex.m !== 'bw')) return null; // C.2.1
 if (today < start || !Number.isInteger(week) || week < 2 || week > 11) return null; // C.2.2
 if (isDeload(week)) return null; // C.2.3
 if (beginner && week < 4) return null; // C.2.4
 const range = repRange(setsForWeek(ex as Exercise, week).reps);
 if (!range) return null; // C.2.6: faixa que o app não lê ("10 por lado", "8–10 por perna") não sobe pela dupla progressão

 // Sessões válidas, da mais antiga para a mais nova.
 let v: Valid[] = [];
 for (const s of [...(input.sessions ?? [])].sort((a, b) => (a.day < b.day ? -1 : a.day > b.day ? 1 : 0))) {
  if (!s || typeof s.day !== 'string' || s.day < start || s.day >= today) continue;
  const w = Math.floor(daysBetween(start, s.day) / 7);
  if (w < 0 || w > 11 || isDeload(w)) continue;
  const kg = s.best?.kg, reps = s.best?.reps;
  if (typeof kg !== 'number' || typeof reps !== 'number' || !Number.isFinite(kg) || !Number.isFinite(reps)) continue;
  v.push({ day: s.day, kg, reps, e1rm: ex.m === 'kg' ? e1rm(kg, reps) : null });
 }
 // Pausa: só contam as sessões depois da última pausa.
 for (let i = v.length - 1; i > 0; i--) {
  if (daysBetween(v[i - 1]!.day, v[i]!.day) > STAGNATION.pauseDays) { v = v.slice(i); break; }
 }
 v = v.slice(-STAGNATION.window);
 const n = v.length;

 // C.4.1 Queda.
 if (n >= STAGNATION.minForDrop && cmp(v[n - 2]!, v[n - 3]!) === 'pior' && cmp(v[n - 1]!, v[n - 3]!) === 'pior') {
  const texto = week % 4 === 2
   ? 'Seu desempenho caiu nos últimos 2 treinos deste exercício. A próxima semana já é leve: siga o plano, durma bem e coma o suficiente.'
   : 'Seu desempenho caiu nos últimos 2 treinos deste exercício. Pode ser cansaço. Nesta semana, faça cerca de 1/3 menos séries dele e capriche no sono e na comida.';
  return { motivo: 'queda', acao: 'deload', sessoes: 2, texto };
 }

 // C.4.2 Sem progresso.
 if (n < STAGNATION.minForFlat) return null;
 let k = 0;
 for (let c = Math.min(5, n - 1); c >= 3; c--) {
  const ref = v[n - c - 1]!;
  if (v.slice(n - c).every(s => cmp(s, ref) !== 'melhor')) { k = c; break; }
 }
 if (!k) return null;
 const faixa = k < 5 && ex.m === 'kg' && range.max <= 12 ? newRange(range.max) : null;
 if (faixa) {
  const kgSugerido = Math.floor(v[n - 1]!.kg * 0.9 * 2 + 1e-9) / 2;
  return {
   motivo: 'sem-progresso', acao: 'repeticoes', sessoes: k, novaFaixa: faixa, kgSugerido,
   texto: `${k} treinos seguidos sem melhorar neste exercício. Uma ideia: mudar para ${faixa} repetições, com cerca de ${kgText(kgSugerido)} kg.`,
  };
 }
 return { motivo: 'sem-progresso', acao: 'trocar', sessoes: k, texto: `${k} treinos seguidos sem melhorar neste exercício. Trocar por um parecido por algumas semanas pode ajudar.` };
}

/** Índice da semana do plano de `today` (pode ser negativo antes do início ou ≥ 12 depois do fim). */
export function planWeekIndex(start: DayIso, today: DayIso): number { return Math.floor(daysBetween(start, today) / 7); }