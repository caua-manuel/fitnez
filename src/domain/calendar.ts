export type DayIso = string;
export const RIR: readonly string[] = ['3', '2–3', '2', '4', '2', '1–2', '1–2', '4', '2', '1–2', '1–2', '4'];
/** Notas presas à semana do plano (0 = primeira). Natal e Réveillon vêm da data real: ver `weekNoteOf`. */
export const WEEK_NOTES: Readonly<Record<number, string>> = { 11: 'Semana de testes de carga, medidas e fotos.' };
export const CHRISTMAS_NOTE = 'Semana do Natal.';
export const NEW_YEAR_NOTE = 'Semana do Réveillon.';
export type Phase =
 | { kind: 'pre'; daysUntil: number }
 | { kind: 'done' }
 | { kind: 'week'; idx: number; week: number; weekday: number; block: 1 | 2 | 3; deload: boolean; rir: string; note?: string; progress: number };

const DAY = 86400000;
function toUtc(day: DayIso): number { const [y, m, d] = day.split('-').map(Number); return Date.UTC(y, m - 1, d); }
function fromUtc(ms: number): DayIso { return new Date(ms).toISOString().slice(0, 10); }
export function addDays(day: DayIso, n: number): DayIso { return fromUtc(toUtc(day) + n * DAY); }
export function mondayOf(day: DayIso): DayIso { const wd = (new Date(toUtc(day)).getUTCDay() + 6) % 7; return addDays(day, -wd); }
/** RIR do assistente para quem nunca treinou ou é iniciante (ADR 008; nunca abaixo de 2; a verificar). */
export const RIR_BEGINNER: readonly string[] = ['3', '3', '3', '4', '2–3', '2–3', '2', '4', '2', '2', '2', '4'];
/** Sequência de RIR do plano: `plan.rir` (12 textos) quando existe e é válido; senão a sequência padrão. */
export function rirSequence(plan: { rir?: unknown } | null | undefined): readonly string[] {
 const r = plan?.rir;
 return Array.isArray(r) && r.length === 12 && r.every(x => typeof x === 'string' && x.trim() !== '') ? (r as string[]) : RIR;
}
/** Nota da semana: Natal e Réveillon pela data real (semana de segunda a domingo que contém 25/12 ou 31/12) e as notas fixas do plano. */
export function weekNoteOf(weekMonday: DayIso, week: number): string | undefined {
 const notes: string[] = [];
 for (const [md, text] of [['12-25', CHRISTMAS_NOTE], ['12-31', NEW_YEAR_NOTE]] as const) {
  for (let i = 0; i < 7; i++) if (addDays(weekMonday, i).slice(5) === md) { notes.push(text); break; }
 }
 if (WEEK_NOTES[week]) notes.push(WEEK_NOTES[week]);
 return notes.length ? notes.join(' ') : undefined;
}
export function phaseOf(start: DayIso, today: DayIso, rir: readonly string[] = RIR): Phase {
 const idx = Math.round((toUtc(today) - toUtc(mondayOf(start))) / DAY);
 if (idx < 0) return { kind: 'pre', daysUntil: -idx };
 if (idx >= 84) return { kind: 'done' };
 const week = Math.floor(idx / 7);
 const phase: Phase = { kind: 'week', idx, week, weekday: idx % 7, block: (Math.floor(week / 4) + 1) as 1 | 2 | 3, deload: week % 4 === 3, rir: rir[week] ?? RIR[week], progress: (week + 1) / 12 };
 const note = weekNoteOf(addDays(mondayOf(start), week * 7), week);
 if (note) phase.note = note;
 return phase;
}
export function weekLabel(week: number): string { return `Semana ${String(week + 1).padStart(2, '0')} de 12`; }
