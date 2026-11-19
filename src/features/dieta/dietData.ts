import type { Payload, StateV3 } from '../../application/repository';
import { activityFor, anyDayTypeOf } from '../../domain/dayActivity';
import type { AnyDayType } from '../../domain/dayActivity';
import { addDays, mondayOf } from '../../domain/calendar';
import type { DayIso } from '../../domain/calendar';
import type { DietDay, DietOption, MealKey } from '../../domain/diet';

/** Cola entre a interface e as regras de domínio: só leitura e formatação, sem regra nova. */
export const MEALS: readonly MealKey[] = ['cafe', 'almoco', 'lanche', 'pos', 'jantar'];
export const MEAL_NAME: Record<MealKey, string> = { cafe: 'Café da manhã', almoco: 'Almoço', lanche: 'Pré-treino ou lanche', pos: 'Pós-treino', jantar: 'Jantar' };
export const MEAL_LOWER: Record<MealKey, string> = { cafe: 'café da manhã', almoco: 'almoço', lanche: 'pré-treino ou lanche', pos: 'pós-treino', jantar: 'jantar' };
export const DAY_TYPE_LABEL: Record<AnyDayType, string> = { perna: 'Dia de perna', academia: 'Dia de academia', jiujitsu: 'Dia de jiu-jitsu', volei: 'Dia de vôlei', esporte: 'Dia de esporte', descanso: 'Dia de descanso' };

export const nf = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });
export const nf1 = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
export const fmt = (n: number) => nf.format(Math.round(n));

export function readDay(raw: Payload | undefined): DietDay {
 const d = (raw ?? {}) as Partial<DietDay>;
 return { pick: { ...d.pick }, eaten: { ...d.eaten }, skip: { ...d.skip }, water: typeof d.water === 'number' && d.water > 0 ? Math.floor(d.water) : 0, crea: d.crea === true, ...(d.consumed ? { consumed: { ...d.consumed } } : {}) };
}

export function catalogOf(state: StateV3): Record<MealKey, DietOption[]> {
 const diet = state.catalog.diet as Partial<Record<MealKey, DietOption[]>>;
 return { cafe: diet.cafe ?? [], almoco: diet.almoco ?? [], lanche: diet.lanche ?? [], pos: diet.pos ?? [], jantar: diet.jantar ?? [] };
}

export function dayTypeFor(state: StateV3, day: DayIso): AnyDayType {
 const [y, m, d] = day.split('-').map(Number);
 const weekday = (new Date(y, m - 1, d).getDay() + 6) % 7;
 const rec = state.history.days[day];
 const plan = state.catalog.plan;
 const act = activityFor({ sched: state.settings.sched, weekday, override: rec?.over, alt: plan.alt });
 const sessionId = act.kind === 'gym' ? act.sessionId : act.kind === 'volei' ? act.altSessionId : undefined;
 return anyDayTypeOf(act, sessionId ? plan.sess[sessionId]?.name : undefined);
}

const SHORT_WEEK = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
const SHORT_MONTH = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
export function dayLabel(day: DayIso, today: DayIso): string {
 const [y, m, d] = day.split('-').map(Number);
 const date = `${d} de ${SHORT_MONTH[m - 1]}`;
 if (day === today) return `Hoje, ${date}`;
 if (day === addDays(today, -1)) return `Ontem, ${date}`;
 if (day === addDays(today, 1)) return `Amanhã, ${date}`;
 return `${SHORT_WEEK[new Date(y, m - 1, d).getDay()]}, ${date}${y !== Number(today.slice(0, 4)) ? ` de ${y}` : ''}`;
}

/** Número 1-based da opção no catálogo atual; sem a opção, cai na letra guardada. */
export function optionNumber(options: DietOption[], key: string | undefined): string | null {
 if (!key) return null;
 const i = options.findIndex(o => o.key === key);
 return i >= 0 ? String(i + 1) : key;
}

/** Aceita vírgula ou ponto decimal; vazio ou inválido vira null. */
export function parseDecimal(text: string): number | null {
 const t = text.trim().replace(/\s/g, '').replace(',', '.');
 if (!t || !/^\d+(\.\d+)?$/.test(t)) return null;
 const n = Number(t);
 return Number.isFinite(n) ? n : null;
}
export function showDecimal(n: number): string { return String(n).replace('.', ','); }

export function nextKey(options: DietOption[]): string {
 const used = new Set(options.map(o => o.key));
 for (let i = 0; i < 26; i++) { const k = String.fromCharCode(65 + i); if (!used.has(k)) return k; }
 return `N${Date.now()}`;
}

/** Médias semanais (segunda a domingo) de peso (p) e cintura (c), do mais antigo ao mais novo. */
export function weeklyAverages(measurements: Record<string, Payload>): { weights: number[]; waists: number[]; any: boolean } {
 const buckets: Record<string, { p: number[]; c: number[] }> = {};
 let any = false;
 for (const [date, m] of Object.entries(measurements)) {
  const p = parseDecimal(String(m?.p ?? '')); const c = parseDecimal(String(m?.c ?? ''));
  if (p === null && c === null) continue;
  any = true;
  const wk = mondayOf(date); const b = buckets[wk] ?? (buckets[wk] = { p: [], c: [] });
  if (p !== null) b.p.push(p); if (c !== null) b.c.push(c);
 }
 const avg = (a: number[]) => a.reduce((s, v) => s + v, 0) / a.length;
 const weeks = Object.keys(buckets).sort();
 return {
  any,
  weights: weeks.filter(w => buckets[w].p.length).map(w => avg(buckets[w].p)),
  waists: weeks.filter(w => buckets[w].c.length).map(w => avg(buckets[w].c)),
 };
}
