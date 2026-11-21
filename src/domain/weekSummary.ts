import type { DayRecord, Payload, Plan, StateV3 } from '../application/repository';
import { addDays, mondayOf, type DayIso } from './calendar';
import { activityFor, anyDayTypeOf } from './dayActivity';
import { dayTotals, type DietDay, type DietOption, type MealKey } from './diet';
import { dayTargetFor } from './dietTargets';
import { recordsOfDay, type RecordType } from './records';
import { FREE_SESSION_ID, planWorkoutsDone, weeklyGoal } from './weekStreak';
import { listWorkouts } from './workoutRecord';
import { countDoneSets, parseNumber, sessionVolume, type SetEntry } from './workout';

// Resumo da semana (ADR 011, 2.5). "Dia na meta" de docs/handoffs/conteudo-adr-011.md, parte B (a verificar).
// Função pura: hoje entra como parâmetro. Nada aqui é salvo; peso e cintura só entram com `body: true`.

/** Limiares do "dia na meta" (parte B.1, a verificar). */
export const DIET_ON_TARGET = { kcalTolerance: 0.1, proteinMin: 0.85 } as const;
export const DIET_FOOTNOTE = 'Na meta: calorias perto da meta do dia (10% para mais ou para menos) e proteína quase completa.';

export interface WeekRecord { exId: string; name: string; day: DayIso; type: RecordType; kg: number; reps: number; e1rm: number | null }
export interface DietWeek {
 /** Dias da semana antes de hoje (hoje nunca conta). */
 considered: number;
 /** Dias com pelo menos 1 refeição marcada. */
 registered: number;
 onTarget: number;
 /** Dias considerados sem nenhuma refeição marcada (aparecem à parte). */
 unregistered: number;
 /** Linha pronta (parte B.2). */
 text: string;
}
export interface BodyChange { before: number; after: number; delta: number }
export interface WeekSummary {
 /** Índice (0 a 11) da semana do plano. */
 week: number;
 from: DayIso; to: DayIso;
 deload: boolean;
 /** Treinos do plano concluídos (treino livre fica fora, como na sequência de semanas), parciais e previstos pela rotina. */
 workouts: { done: number; partial: number; planned: number };
 /** Séries de trabalho concluídas e volume (kg × repetições), sem aquecimento, de todos os registros da semana. */
 sets: number;
 volume: number;
 /** Recordes da semana: o melhor de cada exercício (mesma regra do Concluído). */
 records: WeekRecord[];
 /** `null` quando as metas estão escondidas ou desligadas pelo assistente: a dieta não aparece nem como opção. */
 diet: DietWeek | null;
 /** Só com `body: true`: última medida da semana contra a última antes dela. */
 body: { weight: BodyChange | null; waist: BodyChange | null } | null;
}

export interface WeekSummaryInput {
 days: Record<string, DayRecord>;
 plan: Plan;
 sched: readonly Payload[];
 /** Início do plano (`settings.start`). */
 start: DayIso;
 today: DayIso;
 /** Fonte das metas por data: `settings` (usa `dietTargets` e `profile`). */
 targets: { dietTargets?: unknown; profile?: { weightKg?: number } | null } | null | undefined;
 /** `settings.onboarding`: `hideDietNumbers` ou `dietTargetsDisabled` escondem a dieta. */
 onboarding?: { hideDietNumbers?: boolean; dietTargetsDisabled?: boolean } | null;
 /** Cardápio (`catalog.diet`). */
 diet: Payload | Record<MealKey, DietOption[]>;
 /** Semana do plano a resumir; padrão = a semana de `today`. */
 week?: number;
 /** Medidas (`history.measurements`), lidas só com `body: true`. */
 measurements?: Record<string, Payload>;
 /** Opção marcada na hora, nunca salva. */
 body?: boolean;
}

const DAY = 86400000;
const utc = (d: DayIso) => { const [y, m, dd] = d.split('-').map(Number); return Date.UTC(y!, m! - 1, dd!); };
const MEALS: MealKey[] = ['cafe', 'almoco', 'lanche', 'pos', 'jantar'];
const plain = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);

function catalogOf(diet: WeekSummaryInput['diet']): Record<MealKey, DietOption[]> {
 const d = (plain(diet) ? diet : {}) as Partial<Record<MealKey, DietOption[]>>;
 const out = {} as Record<MealKey, DietOption[]>;
 for (const m of MEALS) out[m] = Array.isArray(d[m]) ? d[m]! : [];
 return out;
}
function dietDayOf(raw: unknown): DietDay {
 const d = (plain(raw) ? raw : {}) as Partial<DietDay>;
 return { pick: { ...d.pick }, eaten: { ...d.eaten }, skip: { ...d.skip }, water: 0, crea: false, ...(d.consumed ? { consumed: { ...d.consumed } } : {}) };
}

/** "Dia na meta" (parte B.1): ≥ 1 refeição marcada, kcal dentro de ±10% e proteína ≥ 85% da meta do dia. */
export function dietDayStatus(totals: { kcal: number; p: number; eatenCount: number }, target: { kcal: number; protein: number }): 'sem-registro' | 'na-meta' | 'fora' {
 if (!(totals.eatenCount >= 1)) return 'sem-registro';
 const kcalOk = target.kcal > 0 && Math.abs(totals.kcal - target.kcal) <= DIET_ON_TARGET.kcalTolerance * target.kcal;
 const proteinOk = totals.p >= DIET_ON_TARGET.proteinMin * target.protein;
 return kcalOk && proteinOk ? 'na-meta' : 'fora';
}

/** Linha da dieta (parte B.2). */
export function dietLine(onTarget: number, registered: number, unregistered: number): string {
 if (registered === 0) return 'Dieta: nenhum dia registrado nesta semana.';
 const tail = unregistered === 0 ? '' : unregistered === 1 ? ' 1 dia sem registro.' : ` ${unregistered} dias sem registro.`;
 return `Dieta: na meta em ${onTarget} de ${registered} dias registrados.${tail}`;
}

function bodyChange(measurements: Record<string, Payload> | undefined, key: 'p' | 'c', from: DayIso, to: DayIso): BodyChange | null {
 let before: { day: DayIso; v: number } | null = null, after: { day: DayIso; v: number } | null = null;
 for (const [day, m] of Object.entries(measurements ?? {})) {
  const v = parseNumber(plain(m) ? m[key] : undefined);
  if (v === null || v <= 0) continue;
  if (day < from) { if (!before || day > before.day) before = { day, v }; }
  else if (day <= to) { if (!after || day > after.day) after = { day, v }; }
 }
 if (!before || !after) return null;
 return { before: before.v, after: after.v, delta: Math.round((after.v - before.v) * 10) / 10 };
}

/**
 * Resumo de uma semana do plano (segunda a domingo). `null` antes do início, depois da semana 12
 * ou para uma semana que ainda não começou. Dias depois de hoje nunca entram.
 */
export function weekSummary(input: WeekSummaryInput): WeekSummary | null {
 const first = mondayOf(input.start);
 if (input.today < first) return null;
 const current = Math.floor((utc(input.today) - utc(first)) / DAY / 7);
 const week = input.week ?? current;
 if (!Number.isInteger(week) || week < 0 || week > 11 || week > current) return null;
 const from = addDays(first, week * 7), to = addDays(from, 6);
 const { days, plan, today } = input;

 let done = 0, partial = 0, sets = 0, volume = 0;
 const best = new Map<string, WeekRecord>();
 const rank = (t: RecordType) => ['maxKg', 'maxE1rm', 'maxRepsAtKg'].indexOf(t);
 for (let i = 0; i < 7; i++) {
  const day = addDays(from, i);
  if (day > today) break;
  const rec = days[day];
  if (!rec) continue;
  done += planWorkoutsDone(rec);
  partial += listWorkouts(rec).filter(w => w.status === 'partial' && w.sessionId !== FREE_SESSION_ID).length;
  const entries = Object.values(rec.log ?? {}).filter(Array.isArray) as unknown as SetEntry[][];
  sets += countDoneSets(entries);
  volume += sessionVolume(entries);
  for (const hit of recordsOfDay(days, plan, day)) {
   const cur = best.get(hit.exId);
   if (!cur || rank(hit.type) < rank(cur.type) || (hit.type === cur.type && (hit.e1rm ?? hit.kg) > (cur.e1rm ?? cur.kg))) {
    best.set(hit.exId, { exId: hit.exId, name: plan.ex[hit.exId]?.n ?? hit.exId, day, type: hit.type, kg: hit.kg, reps: hit.reps, e1rm: hit.e1rm });
   }
  }
 }

 const hidden = input.onboarding?.hideDietNumbers === true || input.onboarding?.dietTargetsDisabled === true;
 let diet: DietWeek | null = null;
 if (!hidden) {
  const catalog = catalogOf(input.diet);
  let considered = 0, registered = 0, onTarget = 0;
  for (let i = 0; i < 7; i++) {
   const day = addDays(from, i);
   if (day >= today) break;
   considered++;
   const rec = days[day];
   const act = activityFor({ sched: input.sched as Payload[], weekday: i, override: rec?.over, alt: plan.alt });
   const sessionId = act.kind === 'gym' ? act.sessionId : act.kind === 'volei' ? act.altSessionId : undefined;
   const type = anyDayTypeOf(act, sessionId ? plan.sess[sessionId]?.name : undefined);
   const status = dietDayStatus(dayTotals(dietDayOf(rec?.diet), catalog), dayTargetFor(type, day, input.targets));
   if (status === 'sem-registro') continue;
   registered++;
   if (status === 'na-meta') onTarget++;
  }
  const unregistered = considered - registered;
  diet = { considered, registered, onTarget, unregistered, text: dietLine(onTarget, registered, unregistered) };
 }

 const body = input.body === true
  ? { weight: bodyChange(input.measurements, 'p', from, to < today ? to : today), waist: bodyChange(input.measurements, 'c', from, to < today ? to : today) }
  : null;

 return {
  week, from, to, deload: week % 4 === 3,
  workouts: { done, partial, planned: weeklyGoal(input.sched) },
  sets, volume: Math.round(volume * 100) / 100,
  records: [...best.values()],
  diet, body,
 };
}

/** Atalho para a tela: monta a entrada a partir do estado salvo. */
export function weekSummaryOf(state: StateV3, opts: { today: DayIso; week?: number; body?: boolean }): WeekSummary | null {
 return weekSummary({
  days: state.history.days, plan: state.catalog.plan, sched: state.settings.sched, start: state.settings.start,
  today: opts.today, targets: state.settings, onboarding: state.settings.onboarding, diet: state.catalog.diet,
  week: opts.week, measurements: state.history.measurements, body: opts.body,
 });
}
