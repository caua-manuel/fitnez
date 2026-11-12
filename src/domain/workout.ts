import type { DayRecord, Exercise } from '../application/repository';
import type { DayIso } from './calendar';

export interface SetEntry { kg: string; reps: string; done: boolean }

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
 const col = Math.min(2, Math.max(0, deload ? Math.max(0, block - 2) : block - 1));
 const n = ex.s[col] ?? ex.s[0] ?? 0;
 return { sets: deload ? Math.max(1, Math.ceil(n / 2)) : n, reps: ex.r[col] ?? ex.r[0] ?? '' };
}

export function sessionVolume(entries: SetEntry[][]): number {
 let total = 0;
 for (const sets of entries) for (const s of sets) {
  if (!s.done) continue;
  const kg = parseNumber(s.kg), reps = parseNumber(s.reps);
  if (kg !== null && reps !== null) total += kg * reps;
 }
 return Math.round(total * 100) / 100;
}

export function countDoneSets(entries: SetEntry[][]): number { return entries.reduce((n, sets) => n + sets.filter(s => s.done).length, 0); }

export function lastPerformance(days: Record<string, DayRecord>, exId: string, before: DayIso): { day: DayIso; sets: SetEntry[] } | null {
 const candidates = Object.keys(days).filter(d => d < before).sort().reverse();
 for (const day of candidates) {
  const rows = days[day]?.log?.[exId];
  if (Array.isArray(rows) && rows.some(r => r.done === true)) {
   return { day, sets: rows.map(r => ({ kg: String(r.kg ?? ''), reps: String(r.reps ?? ''), done: r.done === true })) };
  }
 }
 return null;
}
