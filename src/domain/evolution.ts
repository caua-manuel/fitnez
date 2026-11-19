import type { DayRecord, Payload, Plan } from '../application/repository';
import { addDays, mondayOf } from './calendar';
import type { DayIso } from './calendar';
import { parseNumber } from './workout';
import { doneCount } from './workoutRecord';

// Regras puras da aba Evolução. Nada aqui inventa número: sem registro, o resultado é null ou lista vazia.
export interface Range { from: DayIso; to: DayIso }
export type Weeks = 4 | 8 | 12;

const DAY = 86400000;
const utc = (day: DayIso) => { const [y, m, d] = day.split('-').map(Number); return Date.UTC(y, m - 1, d); };
const daysBetween = (a: DayIso, b: DayIso) => Math.round((utc(b) - utc(a)) / DAY);
const isEmpty = (r: Range) => r.from > r.to;
const inRange = (day: string, r: Range) => /^\d{4}-\d{2}-\d{2}$/.test(day) && day >= r.from && day <= r.to;
/** Semana (0 = primeira) de um dia, contada a partir de `from` (uma segunda-feira). */
const weekOf = (day: DayIso, from: DayIso) => Math.floor(daysBetween(from, day) / 7);
const round = (n: number, digits: number) => { const f = 10 ** digits; return Math.round(n * f) / f; };

/** Período exibido: termina hoje (ou no fim do plano) e começa na segunda de N-1 semanas antes, sem passar do início do plano. Antes do plano, from > to. */
export function periodRange(today: DayIso, weeks: Weeks, start: DayIso): Range {
 const first = mondayOf(start);
 const last = addDays(first, 83);
 const end = today > last ? last : today;
 const from = addDays(mondayOf(end), -(weeks - 1) * 7);
 return { from: from < first ? first : from, to: end };
}
/** Primeira semana (índice do plano, 0 a 11) do período; útil para rotular S1..S12. */
export function firstPlanWeek(range: Range, start: DayIso): number { return Math.max(0, weekOf(range.from, mondayOf(start))); }

/** Aceita "78,2" ou "78.2". Zero, negativo, vazio e texto viram null. */
export function parseMeasure(v: unknown): number | null {
 const n = parseNumber(v);
 return n !== null && n > 0 ? n : null;
}

export interface StrengthPoint { week: number; avgLoadKg: number | null }
/** Carga média por semana (índice relativo ao início do período) das séries feitas de exercícios medidos em kg. */
export function strengthSeries(days: Record<string, DayRecord>, plan: Plan, range: Range): StrengthPoint[] {
 if (isEmpty(range)) return [];
 const count = weekOf(range.to, range.from) + 1;
 const sums = Array.from({ length: count }, () => ({ total: 0, n: 0 }));
 for (const [day, rec] of Object.entries(days)) {
  if (!inRange(day, range) || !rec?.log) continue;
  const w = weekOf(day, range.from);
  for (const [exId, rows] of Object.entries(rec.log)) {
   if (plan.ex[exId]?.m !== 'kg' || !Array.isArray(rows)) continue;
   for (const r of rows) {
    if (r?.done !== true) continue;
    const kg = parseMeasure(r.kg);
    if (kg === null) continue;
    sums[w].total += kg; sums[w].n += 1;
   }
  }
 }
 return sums.map((s, week) => ({ week, avgLoadKg: s.n ? round(s.total / s.n, 2) : null }));
}
/** Variação percentual da primeira para a última semana com dado; null com menos de 2 pontos. */
export function strengthChange(series: StrengthPoint[]): number | null {
 const pts = series.filter(p => p.avgLoadKg !== null && Number.isFinite(p.avgLoadKg)) as Array<{ week: number; avgLoadKg: number }>;
 if (pts.length < 2) return null;
 const a = pts[0].avgLoadKg, b = pts[pts.length - 1].avgLoadKg;
 return a > 0 ? ((b - a) / a) * 100 : null;
}

// Chaves legadas de history.measurements[data]: p peso (kg), c cintura, b braço, t coxa, q quadril (cm); valores em texto, com vírgula.
export type MeasureKey = 'p' | 'c' | 'b' | 't' | 'q';
export interface MeasurePoint { day: DayIso; value: number }
export function measureSeries(measurements: Record<string, Payload>, range: Range, key: MeasureKey): MeasurePoint[] {
 if (isEmpty(range)) return [];
 const out: MeasurePoint[] = [];
 for (const day of Object.keys(measurements).sort()) {
  if (!inRange(day, range)) continue;
  const value = parseMeasure(measurements[day]?.[key]);
  if (value !== null) out.push({ day, value });
 }
 return out;
}
export interface OutsideMeasure { day: DayIso; when: 'antes' | 'depois'; values: Partial<Record<MeasureKey, number>> }
/**
 * Medidas válidas salvas em datas fora das 12 semanas do plano (antes da segunda do início ou depois do fim), em ordem de data.
 * Nenhuma medida salva fica invisível: o gráfico cobre o plano e esta lista cobre o resto.
 */
export function measuresOutsidePlan(measurements: Record<string, Payload>, start: DayIso): OutsideMeasure[] {
 const first = mondayOf(start), last = addDays(first, 83);
 const out: OutsideMeasure[] = [];
 for (const day of Object.keys(measurements).sort()) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || (day >= first && day <= last)) continue;
  const values: Partial<Record<MeasureKey, number>> = {};
  for (const k of ['p', 'c', 'q', 't', 'b'] as MeasureKey[]) { const v = parseMeasure(measurements[day]?.[k]); if (v !== null) values[k] = v; }
  if (Object.keys(values).length) out.push({ day, when: day < first ? 'antes' : 'depois', values });
 }
 return out;
}
export interface Delta { abs: number; pct: number }
export function measureDelta(series: MeasurePoint[]): Delta | null {
 if (series.length < 2) return null;
 const a = series[0].value, b = series[series.length - 1].value;
 return { abs: round(b - a, 2), pct: ((b - a) / a) * 100 };
}
export const weightSeries = (m: Record<string, Payload>, range: Range): Array<{ day: DayIso; kg: number }> => measureSeries(m, range, 'p').map(p => ({ day: p.day, kg: p.value }));
export const waistSeries = (m: Record<string, Payload>, range: Range): Array<{ day: DayIso; cm: number }> => measureSeries(m, range, 'c').map(p => ({ day: p.day, cm: p.value }));
export function weightDelta(series: Array<{ day: DayIso; kg: number }>): { kg: number; pct: number } | null {
 const d = measureDelta(series.map(p => ({ day: p.day, value: p.kg })));
 return d && { kg: d.abs, pct: d.pct };
}
export function waistDelta(series: Array<{ day: DayIso; cm: number }>): { cm: number; pct: number } | null {
 const d = measureDelta(series.map(p => ({ day: p.day, value: p.cm })));
 return d && { cm: d.abs, pct: d.pct };
}

/** Número com vírgula decimal, sinal tipográfico (−) e unidade. Ex.: "−3,8 kg", "+2 cm". */
export function formatNumber(n: number, digits = 1): string { return round(n, digits).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: digits }); }
export function formatSigned(n: number, unit: string, digits = 1): string {
 const r = round(n, digits);
 if (r === 0) return `0 ${unit}`;
 return `${r > 0 ? '+' : '−'}${formatNumber(Math.abs(r), digits)} ${unit}`;
}

export interface Consistency { done: number; planned: number; pct: number | null; byWeek: Array<{ week: number; done: number; planned: number }> }
/**
 * FONTE ÚNICA da constância (Perfil e Evolução usam só esta função; não existe outro cálculo).
 * Regra: previsto = atividades agendadas na rotina (academia, aula de jiu-jitsu, jogo de vôlei) de cada dia do período
 * até hoje; feito = academia com workout.status "done" ou aula/jogo marcados em acts. Dias futuros nunca entram, então a
 * semana atual conta só até hoje. O dia de hoje só entra no previsto quando já está feito, para o percentual não cair
 * antes de o dia acabar. Por isso o "previsto" cresce conforme os dias passam (não é um erro). Semana 0 = primeira do
 * período (ou do plano, sem período). A rotina vem de sched; trocar o treino do dia (over) não altera o previsto.
 */
export function consistency(days: Record<string, DayRecord>, sched: Payload[], start: DayIso, today: DayIso, range?: Range): Consistency {
 const first = mondayOf(start);
 const planEnd = addDays(first, 83);
 const r: Range = range ?? { from: first, to: today };
 const from = r.from < first ? first : r.from;
 const to = [r.to, today, planEnd].reduce((a, b) => (a < b ? a : b));
 if (!sched.length || from > to) return { done: 0, planned: 0, pct: null, byWeek: [] };
 const byWeek = Array.from({ length: weekOf(to, from) + 1 }, (_, week) => ({ week, done: 0, planned: 0 }));
 let done = 0, planned = 0;
 for (let day = from; day <= to; day = addDays(day, 1)) {
  const kind = sched[(daysBetween(first, day) % 7 + 7) % 7]?.k;
  if (kind !== 'gym' && kind !== 'bjj' && kind !== 'volei' && kind !== 'esporte') continue;
  const rec = days[day];
  // Academia: cada treino concluído no dia conta como feito; previsto = 1 por dia agendado, ou mais se houver mais concluídos.
  const gymDone = kind === 'gym' ? doneCount(rec) : 0;
  const ok = kind === 'gym' ? gymDone > 0 : rec?.acts?.[kind as 'bjj' | 'volei' | 'esporte'] === true;
  if (day === today && !ok) continue;
  const w = byWeek[weekOf(day, from)];
  const units = kind === 'gym' ? Math.max(1, gymDone) : 1;
  const hit = kind === 'gym' ? gymDone : ok ? 1 : 0;
  w.planned += units; planned += units;
  w.done += hit; done += hit;
 }
 return { done, planned, pct: planned ? Math.round((done / planned) * 100) : null, byWeek };
}

/** Constância do plano inteiro até hoje (mesmo período de 12 semanas da Evolução). É o número exibido no Perfil. */
export function planConsistency(days: Record<string, DayRecord>, sched: Payload[], start: DayIso, today: DayIso): Consistency {
 return consistency(days, sched, start, today, periodRange(today, 12, start));
}

/** Último valor de cada semana do período (índice 0 = primeira semana); semanas sem medida ficam null. */
export function weeklyValues(series: MeasurePoint[], range: Range, weeks: number): Array<number | null> {
 const out: Array<number | null> = Array.from({ length: weeks }, () => null);
 if (isEmpty(range)) return out;
 for (const p of series) { const w = weekOf(p.day, range.from); if (w >= 0 && w < weeks) out[w] = p.value; }
 return out;
}
/** Percentual inteiro; null sem previsto. */
export function pctOf(done: number, planned: number): number | null { return planned > 0 ? Math.round((done / planned) * 100) : null; }

export const hipSeries = (m: Record<string, Payload>, range: Range): Array<{ day: DayIso; cm: number }> => measureSeries(m, range, 'q').map(p => ({ day: p.day, cm: p.value }));
export const hipDelta = waistDelta;
