import type { Exercise } from '../application/repository';
import { isWarm, parseNumber, setsForWeek, type SetEntry } from './workout';

export interface Suggestion { kg: number | null; reps: string; reason: 'sem-historico' | 'subir' | 'manter' | 'reduzir'; stagnant: boolean }

export function repRange(reps: string): { min: number; max: number } | null {
 const m = /^\s*(\d+)\s*(?:[–—-]\s*(\d+))?\s*$/.exec(String(reps ?? ''));
 if (!m) return null;
 const min = Number(m[1]), max = m[2] === undefined ? min : Number(m[2]);
 return max >= min ? { min, max } : null;
}

interface Valid { kg: number; reps: number }

function validSets(sets: SetEntry[]): Valid[] {
 const out: Valid[] = [];
 for (const s of Array.isArray(sets) ? sets : []) {
  if (!s || s.done !== true || isWarm(s)) continue;
  const kg = parseNumber(s.kg), reps = parseNumber(s.reps);
  if (kg !== null && reps !== null) out.push({ kg, reps });
 }
 return out;
}

const round = (n: number) => Math.round(n * 100) / 100;

// Sugestão apenas: não grava nem preenche carga. Dupla progressão (ESPECIFICACAO §3).
export function suggestNext(input: { ex: Exercise; week: number; history: SetEntry[][]; lower: boolean }): Suggestion {
 const { ex, week, lower } = input;
 const plan = setsForWeek(ex, week);
 const range = repRange(plan.reps);
 const sessions = (Array.isArray(input.history) ? input.history : []).map(validSets).filter(s => s.length > 0);
 if (sessions.length === 0) return { kg: null, reps: plan.reps, reason: 'sem-historico', stagnant: false };

 const last = sessions[sessions.length - 1]!;
 const kg = Math.max(...last.map(s => s.kg));
 const vol = sessions.map(s => s.reduce((t, x) => t + x.kg * x.reps, 0));
 const n = vol.length;

 // Estagnação: nas últimas 3 sessões, nenhuma superou a primeira em carga máxima nem em repetições totais.
 let stagnant = false;
 if (n >= 3) {
  const w = sessions.slice(-3).map(s => ({ kg: Math.max(...s.map(x => x.kg)), reps: s.reduce((t, x) => t + x.reps, 0) }));
  stagnant = w.slice(1).every(s => s.kg <= w[0]!.kg && s.reps <= w[0]!.reps);
 }

 if (n >= 3 && vol[n - 1]! < vol[n - 2]! && vol[n - 2]! < vol[n - 3]!) {
  return { kg: round(kg), reps: plan.reps, reason: 'reduzir', stagnant };
 }

 const hitTop = range !== null && last.length >= plan.sets && last.every(s => s.reps >= range.max);
 if (hitTop) return { kg: round(kg + (lower ? 5 : 2.5)), reps: plan.reps, reason: 'subir', stagnant: false };
 return { kg: round(kg), reps: plan.reps, reason: 'manter', stagnant };
}
