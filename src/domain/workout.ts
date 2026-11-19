import type { DayRecord, Exercise } from '../application/repository';
import type { DayIso } from './calendar';

/** `kind: 'warm'` = série de aquecimento (ADR 009): fora de volume, recordes, progressão, "Antes" e contagens. */
export interface SetEntry { kg: string; reps: string; done: boolean; kind?: 'warm' }
export const isWarm = (s: { kind?: unknown } | null | undefined): boolean => !!s && s.kind === 'warm';

export function parseNumber(v: unknown): number | null {
 if (typeof v === 'number') return Number.isFinite(v) && v >= 0 ? v : null;
 if (typeof v !== 'string') return null;
 const t = v.trim().replace(',', '.');
 if (!/^\d+(\.\d+)?$/.test(t)) return null;
 const n = Number(t);
 return Number.isFinite(n) ? n : null;
}

export function setsForWeek(ex: Exercise, week: number): { sets: number; reps: string } {
 const block = Math.floor(week / 4) + 1;
 const deload = week % 4 === 3;
 // Séries: coluna do bloco corrente. Repetições: no deload, coluna do bloco anterior (casos do plano: semanas 3, 7 e 11).
 const sCol = Math.min(2, Math.max(0, block - 1));
 const rCol = Math.min(2, Math.max(0, deload ? block - 2 : block - 1));
 const n = ex.s[sCol] ?? ex.s[0] ?? 0;
 return { sets: deload ? Math.max(1, Math.ceil(n / 2)) : n, reps: ex.r[rCol] ?? ex.r[0] ?? '' };
}

export function sessionVolume(entries: SetEntry[][]): number {
 let total = 0;
 for (const sets of entries) for (const s of sets) {
  if (!s.done || isWarm(s)) continue;
  const kg = parseNumber(s.kg), reps = parseNumber(s.reps);
  if (kg !== null && reps !== null) total += kg * reps;
 }
 return Math.round(total * 100) / 100;
}

export function countDoneSets(entries: SetEntry[][]): number { return entries.reduce((n, sets) => n + sets.filter(s => s.done && !isWarm(s)).length, 0); }

export function lastPerformance(days: Record<string, DayRecord>, exId: string, before: DayIso): { day: DayIso; sets: SetEntry[] } | null {
 const candidates = Object.keys(days).filter(d => d < before).sort().reverse();
 for (const day of candidates) {
  const all = days[day]?.log?.[exId];
  const rows = Array.isArray(all) ? all.filter(r => !isWarm(r)) : null;
  if (rows && rows.some(r => r.done === true)) {
   return { day, sets: rows.map(r => ({ kg: String(r.kg ?? ''), reps: String(r.reps ?? ''), done: r.done === true })) };
  }
 }
 return null;
}
