export type DayIso = string;
export const RIR: readonly string[] = ['3', '2–3', '2', '4', '2', '1–2', '1–2', '4', '2', '1–2', '1–2', '4'];
export const WEEK_NOTES: Readonly<Record<number, string>> = { 5: 'Semana do Natal: ajuste a rotina se precisar.', 6: 'Semana do Réveillon: ajuste a rotina se precisar.', 11: 'Semana de testes.' };
export type Phase =
 | { kind: 'pre'; daysUntil: number }
 | { kind: 'done' }
 | { kind: 'week'; idx: number; week: number; weekday: number; block: 1 | 2 | 3; deload: boolean; rir: string; note?: string; progress: number };

const DAY = 86400000;
function toUtc(day: DayIso): number { const [y, m, d] = day.split('-').map(Number); return Date.UTC(y, m - 1, d); }
function fromUtc(ms: number): DayIso { return new Date(ms).toISOString().slice(0, 10); }
export function addDays(day: DayIso, n: number): DayIso { return fromUtc(toUtc(day) + n * DAY); }
export function mondayOf(day: DayIso): DayIso { const wd = (new Date(toUtc(day)).getUTCDay() + 6) % 7; return addDays(day, -wd); }
export function phaseOf(start: DayIso, today: DayIso): Phase {
 const idx = Math.round((toUtc(today) - toUtc(mondayOf(start))) / DAY);
 if (idx < 0) return { kind: 'pre', daysUntil: -idx };
 if (idx >= 84) return { kind: 'done' };
 const week = Math.floor(idx / 7);
 const phase: Phase = { kind: 'week', idx, week, weekday: idx % 7, block: (Math.floor(week / 4) + 1) as 1 | 2 | 3, deload: week % 4 === 3, rir: RIR[week], progress: (week + 1) / 12 };
 if (WEEK_NOTES[week]) phase.note = WEEK_NOTES[week];
 return phase;
}
export function weekLabel(week: number): string { return `Semana ${String(week + 1).padStart(2, '0')} de 12`; }
