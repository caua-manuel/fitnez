import type { Exercise, Payload, Plan, Session } from '../application/repository';
import { RIR_BEGINNER, addDays, mondayOf } from './calendar';
import type { DayIso } from './calendar';
import { SPORT_LABEL_DEFAULT, SPORT_LABEL_MAX, activityFor, anyDayTypeOf } from './dayActivity';
import type { AnyDayType } from './dayActivity';
import { ALL_DAY_TYPES, LIMITS as DIET_LIMITS, carbsFromRest, validateDietTargets } from './dietTargets';
import type { DietTargets } from './dietTargets';
import { validateProfile } from './profile';

// Assistente de início (ADR 008). Regras puras e determinísticas, sem interface e sem acesso a dados.
// Contrato: docs/handoffs/conteudo-assistente-inicio.md. Todos os números marcados "a verificar" na especificação.
// Privacidade (decisão do dono): sexo e marcações do passo 0 só existem nas respostas em memória; nada aqui
// devolve esses campos para gravação (ver `storedAnswersOf`).

// ---------- respostas ----------
export type SafetyFlag = 'menor18' | 'gestacao' | 'condicao' | 'transtorno';
export type SafetyAnswer = SafetyFlag | 'nenhum';
export type Goal = 'perder' | 'massa' | 'recomp' | 'saude';
export type Experience = 'nunca' | 'iniciante' | 'intermediario';
export type Duration = 'curto' | 'medio' | 'longo';
export type Place = 'academia' | 'casa_equip' | 'casa_livre';
export type FixedKind = 'luta' | 'esporte' | 'corrida';
export type Sex = 'm' | 'f' | 'nao_informar';
export type Lifestyle = 'pouco' | 'moderado' | 'muito';
export type DaysPerWeek = 2 | 3 | 4 | 5 | 6;

/** Atividade fixa. `days`: 0 = segunda ... 6 = domingo. `label` só vale para `esporte` (ex.: "Futebol"). */
export interface FixedActivity { kind: FixedKind; days: number[]; label?: string }
export interface BodyAnswers { sex?: Sex; age?: number; heightCm?: number; weightKg?: number; lifestyle?: Lifestyle }
export interface OnboardingAnswers {
 safety: SafetyAnswer[];
 goal: Goal;
 experience: Experience;
 daysPerWeek: DaysPerWeek;
 duration: Duration;
 place: Place;
 activities: FixedActivity[];
 body?: BodyAnswers;
}

export const SAFETY_FLAGS: readonly SafetyFlag[] = ['menor18', 'gestacao', 'condicao', 'transtorno'];
export const GOALS: readonly Goal[] = ['perder', 'massa', 'recomp', 'saude'];
export const EXPERIENCES: readonly Experience[] = ['nunca', 'iniciante', 'intermediario'];
export const DAYS_OPTIONS: readonly DaysPerWeek[] = [2, 3, 4, 5, 6];
export const DURATIONS: readonly Duration[] = ['curto', 'medio', 'longo'];
export const PLACES: readonly Place[] = ['academia', 'casa_equip', 'casa_livre'];
export const FIXED_KINDS: readonly FixedKind[] = ['luta', 'esporte', 'corrida'];
export const SEXES: readonly Sex[] = ['m', 'f', 'nao_informar'];
export const LIFESTYLES: readonly Lifestyle[] = ['pouco', 'moderado', 'muito'];
export const ONBOARDING_CONTENT_VERSION = 1 as const;

/** Padrões da especificação (seção 1). `safety` começa vazio: "Nenhuma dessas" precisa ser tocado. */
export function defaultAnswers(): OnboardingAnswers {
 return { safety: [], goal: 'saude', experience: 'nunca', daysPerWeek: 3, duration: 'medio', place: 'academia', activities: [] };
}

export type AnswersResult = { ok: true; value: OnboardingAnswers } | { ok: false; errors: Record<string, string> };
const plain = (v: unknown): v is Record<string, unknown> => v !== null && typeof v === 'object' && !Array.isArray(v);
const oneOf = <T extends string | number>(list: readonly T[], v: unknown): v is T => (list as readonly unknown[]).includes(v);
const emptyValue = (v: unknown) => v === undefined || v === null || (typeof v === 'string' && v.trim() === '');

/** Valida e normaliza as respostas (aceita números como texto no passo 7). Nada é gravado aqui. */
export function validateOnboardingAnswers(input: unknown): AnswersResult {
 const errors: Record<string, string> = {};
 if (!plain(input)) return { ok: false, errors: { answers: 'Respostas inválidas.' } };
 const safety: SafetyAnswer[] = [];
 if (!Array.isArray(input.safety) || input.safety.length === 0) errors.safety = 'Marque as situações que valem para você, ou "Nenhuma dessas".';
 else {
  for (const s of input.safety) {
   if (!oneOf([...SAFETY_FLAGS, 'nenhum'] as SafetyAnswer[], s)) { errors.safety = 'Opção de segurança inválida.'; break; }
   if (!safety.includes(s)) safety.push(s);
  }
  if (!errors.safety && safety.includes('nenhum') && safety.length > 1) errors.safety = '"Nenhuma dessas" não pode ser marcada junto com outra opção.';
 }
 if (!oneOf(GOALS, input.goal)) errors.goal = 'Escolha um objetivo.';
 if (!oneOf(EXPERIENCES, input.experience)) errors.experience = 'Escolha sua experiência.';
 if (!oneOf(DAYS_OPTIONS, input.daysPerWeek)) errors.daysPerWeek = 'Escolha de 2 a 6 dias.';
 if (!oneOf(DURATIONS, input.duration)) errors.duration = 'Escolha o tempo por treino.';
 if (!oneOf(PLACES, input.place)) errors.place = 'Escolha onde você vai treinar.';

 const activities: FixedActivity[] = [];
 const taken = new Set<number>();
 const rawActs = input.activities === undefined || input.activities === null ? [] : input.activities;
 if (!Array.isArray(rawActs) || rawActs.length > FIXED_KINDS.length) errors.activities = 'Atividades inválidas.';
 else for (const a of rawActs) {
  if (!plain(a) || !oneOf(FIXED_KINDS, a.kind) || activities.some(x => x.kind === a.kind)) { errors.activities = 'Atividades inválidas.'; break; }
  if (!Array.isArray(a.days) || a.days.length === 0 || a.days.some(d => !Number.isInteger(d) || (d as number) < 0 || (d as number) > 6)) { errors[`activities.${a.kind}`] = 'Escolha em quais dias.'; continue; }
  const days = [...new Set(a.days as number[])].sort((x, y) => x - y);
  if (days.some(d => taken.has(d))) { errors[`activities.${a.kind}`] = 'Cada dia da semana só pode ter uma atividade fixa.'; continue; }
  days.forEach(d => taken.add(d));
  const item: FixedActivity = { kind: a.kind, days };
  if (a.kind === 'esporte' && !emptyValue(a.label)) {
   if (typeof a.label !== 'string') errors['activities.esporte'] = 'Nome do esporte: use texto.';
   else if (a.label.trim().length > SPORT_LABEL_MAX) errors['activities.esporte'] = `Nome do esporte: use no máximo ${SPORT_LABEL_MAX} caracteres.`;
   else item.label = a.label.trim();
  }
  activities.push(item);
 }

 let body: BodyAnswers | undefined;
 if (input.body !== undefined && input.body !== null) {
  if (!plain(input.body)) errors.body = 'Dados físicos inválidos.';
  else {
   const b = input.body;
   body = {};
   if (!emptyValue(b.sex)) { if (oneOf(SEXES, b.sex)) body.sex = b.sex; else errors['body.sex'] = 'Opção de sexo inválida.'; }
   if (!emptyValue(b.lifestyle)) { if (oneOf(LIFESTYLES, b.lifestyle)) body.lifestyle = b.lifestyle; else errors['body.lifestyle'] = 'Escolha como é seu dia.'; }
   const p = validateProfile({ age: b.age as string | number | null | undefined, heightCm: b.heightCm as string | number | null | undefined, weightKg: b.weightKg as string | number | null | undefined });
   if (!p.ok) for (const [k, m] of Object.entries(p.errors)) errors[`body.${k}`] = m;
   else { if (p.value.age !== undefined) body.age = p.value.age; if (p.value.heightCm !== undefined) body.heightCm = p.value.heightCm; if (p.value.weightKg !== undefined) body.weightKg = p.value.weightKg; }
  }
 }
 if (Object.keys(errors).length) return { ok: false, errors };
 const value: OnboardingAnswers = { safety, goal: input.goal as Goal, experience: input.experience as Experience, daysPerWeek: input.daysPerWeek as DaysPerWeek, duration: input.duration as Duration, place: input.place as Place, activities };
 if (body && Object.keys(body).length) value.body = body;
 return { ok: true, value };
}

// ---------- segurança ----------
/** Marcações efetivas: idade informada abaixo de 18 conta como `menor18` mesmo sem marcar. */
export function safetyFlagsOf(a: OnboardingAnswers): SafetyFlag[] {
 const flags = SAFETY_FLAGS.filter(f => a.safety.includes(f));
 if (!flags.includes('menor18') && typeof a.body?.age === 'number' && a.body.age < 18) flags.unshift('menor18');
 return SAFETY_FLAGS.filter(f => flags.includes(f));
}
export const isMinor = (a: OnboardingAnswers): boolean => safetyFlagsOf(a).includes('menor18');
/** Experiência usada nas regras: menor de 18 recebe o treino leve de quem nunca treinou (decisão do dono). */
export const effectiveExperience = (a: OnboardingAnswers): Experience => (isMinor(a) ? 'nunca' : a.experience);
export const bmiOf = (weightKg: number, heightCm: number): number => weightKg / ((heightCm / 100) ** 2);

export type OnboardingWarning = SafetyFlag | 'sem-dados' | 'imc-baixo' | 'imc-alto-massa' | 'semana-cheia';

// ---------- divisão e rotina ----------
type SlotKey = 'joelho' | 'joelho2' | 'quadril' | 'unilateral' | 'posterior' | 'empH' | 'empInc' | 'empV' | 'puxV' | 'puxH' | 'ombroLat' | 'ombroPost' | 'biceps' | 'triceps' | 'panturrilha' | 'core' | 'core2';
export type SessionKey = 'CIA' | 'CIB' | 'SUPA' | 'SUPB' | 'PERA' | 'PERB';
const PRINCIPAL: ReadonlySet<SlotKey> = new Set(['joelho', 'joelho2', 'quadril', 'empH', 'empInc', 'empV', 'puxV', 'puxH']);
const CORE_SLOTS: ReadonlySet<SlotKey> = new Set(['core', 'core2']);

const TEMPLATES: Readonly<Record<SessionKey, { name: string; sub: string; full: boolean; slots: readonly SlotKey[] }>> = {
 CIA: { name: 'Corpo inteiro A', sub: 'Pernas, peito, costas e core', full: true, slots: ['joelho', 'empH', 'puxV', 'quadril', 'ombroLat', 'core', 'biceps', 'panturrilha'] },
 CIB: { name: 'Corpo inteiro B', sub: 'Pernas, ombros, costas e core', full: true, slots: ['quadril', 'empV', 'puxH', 'unilateral', 'ombroPost', 'core', 'triceps', 'panturrilha'] },
 SUPA: { name: 'Superior A', sub: 'Peito, costas, ombros e braços', full: false, slots: ['empH', 'puxV', 'empV', 'puxH', 'ombroLat', 'biceps', 'triceps'] },
 SUPB: { name: 'Superior B', sub: 'Costas, peito, ombros e braços', full: false, slots: ['puxH', 'empInc', 'puxV', 'ombroLat', 'ombroPost', 'triceps', 'biceps'] },
 PERA: { name: 'Pernas A', sub: 'Pernas, glúteos e core', full: false, slots: ['joelho', 'quadril', 'unilateral', 'posterior', 'panturrilha', 'core', 'core2'] },
 PERB: { name: 'Pernas B', sub: 'Pernas, glúteos e core', full: false, slots: ['quadril', 'joelho2', 'unilateral', 'posterior', 'panturrilha', 'core', 'core2'] }
};
// Variantes do ajuste de volume (conteudo-ajuste-volume-assistente.md, ADR 010; a verificar).
const SUPB_INICIO: readonly SlotKey[] = ['puxH', 'empInc', 'ombroLat', 'ombroPost', 'triceps', 'biceps', 'empV'];
const CIB_2DIAS: readonly SlotKey[] = ['quadril', 'empInc', 'puxH', 'unilateral', 'ombroPost', 'core', 'triceps', 'panturrilha'];
export const CIB_2DIAS_SUB = 'Pernas, peito, costas e core';
/** Vagas e subtítulo do treino. `days` = número final de treinos da divisão (depois de teto, atividades fixas e semana cheia). */
function templateFor(key: SessionKey, exp: Experience, days: number): { name: string; sub: string; full: boolean; slots: readonly SlotKey[] } {
 const tpl = TEMPLATES[key];
 if (key === 'SUPB' && (exp === 'nunca' || exp === 'iniciante')) return { ...tpl, slots: SUPB_INICIO };
 if (key === 'CIB' && days === 2) return { ...tpl, sub: CIB_2DIAS_SUB, slots: CIB_2DIAS };
 return tpl;
}
export const isLegSession = (key: SessionKey): boolean => key === 'PERA' || key === 'PERB';

/** Exercício por vaga e local (tabela 3.2). `null` = vaga pulada. */
function slotExercise(slot: SlotKey, place: Place, exp: Experience): string | null {
 const T: Record<SlotKey, Record<Place, string | null>> = {
  joelho: { academia: exp === 'nunca' ? 'leg' : 'agach', casa_equip: 'goblet', casa_livre: 'agach_livre' },
  joelho2: { academia: 'leg', casa_equip: 'goblet', casa_livre: 'agach_livre' },
  quadril: { academia: 'hip_b', casa_equip: 'ponte_h', casa_livre: 'ponte_uni' },
  unilateral: { academia: exp === 'intermediario' ? 'bulg' : 'afundo', casa_equip: 'bulg', casa_livre: 'afundo_livre' },
  posterior: { academia: exp === 'intermediario' ? 'stiff' : 'mesa', casa_equip: 'stiff', casa_livre: 'stiff_uni' },
  empH: { academia: 'supino', casa_equip: 'supino_chao', casa_livre: 'flexao' },
  empInc: { academia: 'inclinado', casa_equip: 'supino_chao', casa_livre: 'flexao' },
  empV: { academia: 'press_b', casa_equip: 'press_b', casa_livre: 'pike' },
  puxV: { academia: 'puxada', casa_equip: 'puxada_elastico', casa_livre: 'remada_mochila' },
  puxH: { academia: 'remada_b', casa_equip: 'remada_b', casa_livre: 'remada_mochila' },
  ombroLat: { academia: 'lat_a', casa_equip: 'lat_a', casa_livre: 'ytw' },
  ombroPost: { academia: 'face', casa_equip: 'face_elastico', casa_livre: 'ytw' },
  biceps: { academia: 'rosca_a', casa_equip: 'rosca_a', casa_livre: null },
  triceps: { academia: 'tri_a', casa_equip: 'tri_b', casa_livre: 'flexao_fechada' },
  panturrilha: { academia: 'pant_pe', casa_equip: 'pant_degrau', casa_livre: 'pant_degrau' },
  core: { academia: 'pallof', casa_equip: 'deadbug', casa_livre: 'deadbug' },
  core2: { academia: 'prancha', casa_equip: 'prancha', casa_livre: 'prancha' }
 };
 return T[slot][place];
}

/** IDs que o assistente pode usar (todos precisam existir no catálogo). */
const ALL_SLOTS: readonly SlotKey[] = ['joelho', 'joelho2', 'quadril', 'unilateral', 'posterior', 'empH', 'empInc', 'empV', 'puxV', 'puxH', 'ombroLat', 'ombroPost', 'biceps', 'triceps', 'panturrilha', 'core', 'core2'];
export const ASSISTANT_EXERCISE_IDS: readonly string[] = [...new Set(PLACES.flatMap(p => EXPERIENCES.flatMap(e => ALL_SLOTS.map(s => slotExercise(s, p, e)))).filter((x): x is string => x !== null))].sort();

const VOLUME: Readonly<Record<Experience, { ps: number[]; pr: string[]; as: number[]; ar: string[]; prest: number; arest: number }>> = {
 nunca: { ps: [2, 3, 3], pr: ['10–12', '8–12', '8–12'], as: [2, 2, 3], ar: ['12–15', '12–15', '10–15'], prest: 120, arest: 60 },
 iniciante: { ps: [3, 3, 4], pr: ['8–12', '8–10', '6–10'], as: [2, 3, 3], ar: ['12–15', '10–15', '10–12'], prest: 120, arest: 60 },
 intermediario: { ps: [3, 4, 4], pr: ['6–10', '6–8', '5–8'], as: [3, 3, 4], ar: ['10–12', '10–12', '8–12'], prest: 150, arest: 60 }
};
const CORE_REST = 45;
const SLOT_COUNT: Readonly<Record<Duration, number>> = { curto: 4, medio: 6, longo: 8 };
const TETO: Readonly<Record<Experience, number>> = { nunca: 3, iniciante: 4, intermediario: 5 };
const PREFERRED: Readonly<Record<number, readonly number[]>> = { 2: [0, 3], 3: [0, 2, 4], 4: [0, 1, 3, 4], 5: [0, 1, 2, 4, 5] };
export const DURATION_TEXT: Readonly<Record<Duration, string>> = { curto: '30 a 45 min', medio: '45 a 60 min', longo: '60 a 90 min' };

function splitFor(days: number, exp: Experience): SessionKey[] {
 if (days <= 2) return ['CIA', 'CIB'];
 if (days === 3) return exp === 'intermediario' ? ['SUPA', 'PERA', 'CIB'] : ['CIA', 'CIB', 'CIA'];
 if (days === 4) return ['SUPA', 'PERA', 'SUPB', 'PERB'];
 return ['SUPA', 'PERA', 'SUPB', 'PERB', 'CIA'];
}

/** Rotina (7 dias) só com as atividades fixas; os demais dias ficam `null`. */
function fixedWeek(a: OnboardingAnswers): (Payload | null)[] {
 const week: (Payload | null)[] = Array(7).fill(null);
 for (const kind of FIXED_KINDS) {
  const act = a.activities.find(x => x.kind === kind);
  if (!act) continue;
  for (const d of act.days) {
   if (week[d]) continue;
   week[d] = kind === 'luta' ? { k: 'bjj', gi: true } : { k: 'esporte', label: kind === 'corrida' ? 'Corrida' : act.label?.trim() || SPORT_LABEL_DEFAULT };
  }
 }
 return week;
}

export interface GeneratedPlan {
 /** Só os exercícios e treinos gerados. Use `mergeGeneratedPlan` para juntar ao plano atual. */
 plan: { ex: Record<string, Exercise>; sess: Record<string, Session>; order: string[]; rir?: string[] };
 /** Rotina de 7 dias (0 = segunda), no formato de `settings.sched`. */
 sched: Payload[];
 /** Quantos treinos de musculação a divisão tem e quantos entraram na rotina. */
 gymDays: number;
 scheduledGymDays: number;
 experience: Experience;
 duration: Duration;
 warnings: OnboardingWarning[];
}

export class OnboardingError extends Error { constructor(message: string) { super(message); this.name = 'OnboardingError'; } }

/** Monta divisão, rotina, exercícios, séries, repetições, descanso e RIR (seções 2 a 4). */
export function buildPlanFromAnswers(answers: OnboardingAnswers, catalog: Readonly<Record<string, Exercise>>): GeneratedPlan {
 const exp = effectiveExperience(answers);
 const warnings: OnboardingWarning[] = [];
 const week = fixedWeek(answers);
 const fixas = week.filter(Boolean).length;
 let days = Math.min(answers.daysPerWeek, TETO[exp]);
 if (days + fixas > 6) days = Math.max(2, 6 - fixas);
 const full = fixas >= 6;
 if (full) { days = 2; warnings.push('semana-cheia'); }
 // Semana cheia: 2 treinos curtos, fora da rotina (decisão do dono: não marcar musculação no mesmo dia da atividade fixa).
 const duration: Duration = full ? 'curto' : answers.duration;
 const split = splitFor(days, exp);

 // Dias da semana (2.3)
 const chosen: number[] = [];
 if (!full) {
  for (const d of [...(PREFERRED[days] ?? []), 0, 1, 2, 3, 4, 5, 6]) { if (chosen.length >= days) break; if (!week[d] && !chosen.includes(d)) chosen.push(d); }
  chosen.sort((x, y) => x - y);
 }
 const assigned = chosen.map((d, i) => ({ day: d, key: split[i] }));
 const busy = (d: number) => week[d] !== null;
 for (let i = 0; i < assigned.length; i++) {
  const a = assigned[i];
  if (!isLegSession(a.key) || !(busy(a.day) || busy((a.day + 1) % 7))) continue;
  const j = assigned.findIndex((b, k) => k > i && !isLegSession(b.key));
  if (j >= 0) { const t = a.key; a.key = assigned[j].key; assigned[j].key = t; }
 }
 const sched: Payload[] = week.map(x => (x ? { ...x } : { k: 'rest' }));
 for (const a of assigned) sched[a.day] = { k: 'gym', s: a.key };

 // Exercícios (3 e 4)
 const vol = VOLUME[exp];
 const ex: Record<string, Exercise> = {};
 const sess: Record<string, Session> = {};
 const order: string[] = [];
 for (const key of split) {
  if (sess[key]) continue;
  const tpl = templateFor(key, exp, split.length);
  const limit = duration === 'longo' ? (tpl.full ? 8 : 7) : SLOT_COUNT[duration];
  const ids: string[] = [];
  for (const slot of tpl.slots) {
   if (ids.length >= limit) break;
   const id = slotExercise(slot, answers.place, exp);
   if (!id || ids.includes(id)) continue;
   const base = catalog[id];
   if (!base) throw new OnboardingError(`Exercício ${id} não está no catálogo.`);
   ids.push(id);
   if (ex[id]) continue;
   const principal = PRINCIPAL.has(slot);
   const e: Exercise = structuredClone(base);
   e.s = [...(principal ? vol.ps : vol.as)];
   if (e.m === 'kg' || e.m === 'bw') e.r = [...(principal ? vol.pr : vol.ar)];
   e.rest = CORE_SLOTS.has(slot) ? CORE_REST : principal ? vol.prest : vol.arest;
   ex[id] = e;
  }
  sess[key] = { name: tpl.name, sub: tpl.sub, min: DURATION_TEXT[duration], ex: ids };
  order.push(key);
 }
 const plan: GeneratedPlan['plan'] = { ex, sess, order };
 if (exp !== 'intermediario') plan.rir = [...RIR_BEGINNER];
 return { plan, sched, gymDays: split.length, scheduledGymDays: assigned.length, experience: exp, duration, warnings };
}

/**
 * Junta o plano gerado ao plano atual: treinos, ordem e RIR passam a ser os gerados; exercícios gerados
 * substituem os de mesma ID (o histórico de carga continua pela ID) e os demais exercícios atuais ficam,
 * para o histórico manter os nomes. `alt` (treino opcional do plano anterior) sai; `cond` é mantido.
 */
export function mergeGeneratedPlan(current: Plan, generated: GeneratedPlan['plan']): Plan {
 const next: Plan = { ...structuredClone(current), ex: { ...structuredClone(current.ex), ...structuredClone(generated.ex) }, sess: structuredClone(generated.sess), order: [...generated.order] };
 delete next.alt;
 if (generated.rir) next.rir = [...generated.rir]; else delete next.rir;
 return next;
}

// ---------- metas de dieta (seção 6) ----------
const SEX_S: Readonly<Record<Sex, number>> = { m: 5, f: -161, nao_informar: -78 };
const LIFESTYLE_F: Readonly<Record<Lifestyle, number>> = { pouco: 1.2, moderado: 1.3, muito: 1.45 };
const EXTRA: Readonly<Record<AnyDayType, number>> = { descanso: 0, academia: 200, perna: 250, jiujitsu: 350, volei: 300, esporte: 300 };
const ADJUST: Readonly<Record<Goal, number>> = { perder: -0.2, recomp: -0.1, massa: 0.1, saude: 0 };
const PROTEIN_PER_KG: Readonly<Record<Goal, number>> = { perder: 2.0, recomp: 2.0, massa: 1.8, saude: 1.6 };
const r50 = (x: number) => Math.round(x / 50) * 50;
const r5 = (x: number) => Math.round(x / 5) * 5;

export type DietTargetsFromAnswers =
 | { kind: 'targets'; targets: DietTargets; effectiveGoal: Goal; warnings: OnboardingWarning[] }
 /** `seguranca`: não calcula e não sugere déficit. `sem-dados`: faltou idade, altura ou peso; fica a meta de exemplo. */
 | { kind: 'none'; reason: 'seguranca' | 'sem-dados'; effectiveGoal: Goal; warnings: OnboardingWarning[] };

export function buildDietTargetsFromAnswers(answers: OnboardingAnswers): DietTargetsFromAnswers {
 const flags = safetyFlagsOf(answers);
 if (flags.length) return { kind: 'none', reason: 'seguranca', effectiveGoal: answers.goal === 'perder' ? 'saude' : answers.goal, warnings: [...flags] };
 const b = answers.body;
 if (typeof b?.age !== 'number' || typeof b.heightCm !== 'number' || typeof b.weightKg !== 'number') return { kind: 'none', reason: 'sem-dados', effectiveGoal: answers.goal, warnings: ['sem-dados'] };
 const { age, heightCm: h, weightKg: w } = b;
 const warnings: OnboardingWarning[] = [];
 const bmi = bmiOf(w, h);
 let goal = answers.goal;
 if (goal === 'perder' && bmi < 18.5) { goal = 'saude'; warnings.push('imc-baixo'); }
 if (goal === 'massa' && bmi >= 30) { goal = 'saude'; warnings.push('imc-alto-massa'); }
 const tmb = 10 * w + 6.25 * h - 5 * age + SEX_S[b.sex ?? 'nao_informar'];
 const base = tmb * LIFESTYLE_F[b.lifestyle ?? 'pouco'];
 const refW = bmi > 30 ? 25 * (h / 100) ** 2 : w;
 const proteinG = r5(refW * PROTEIN_PER_KG[goal]);
 const fatG = Math.max(40, r5(0.8 * refW));
 const days = {} as DietTargets['days'];
 for (const t of ALL_DAY_TYPES) {
  let kcal = r50((base + EXTRA[t]) * (1 + ADJUST[goal]));
  kcal = Math.min(4500, Math.max(kcal, r50(tmb), 1400));
  const carbs = Math.min(DIET_LIMITS.carbs.max, carbsFromRest(kcal, proteinG, fatG));
  (days as Record<AnyDayType, { kcal: number; carbs: number }>)[t] = { kcal, carbs };
 }
 const waterL = Math.min(4, Math.max(2, Math.round(0.035 * w * 2) / 2));
 const checked = validateDietTargets({ days, proteinG, fatG, waterL }, { weightKg: w });
 if (!checked.ok) throw new OnboardingError('Metas calculadas fora dos limites.');
 return { kind: 'targets', targets: checked.value, effectiveGoal: goal, warnings };
}

// ---------- prévia ----------
export interface OnboardingFlags {
 /** Não calcular metas (segurança). A Dieta mostra a meta de exemplo. */
 dietTargetsDisabled: boolean;
 /** Esconder números de metas na Dieta (transtorno alimentar). */
 hideDietNumbers: boolean;
}
export interface OnboardingPreview {
 answers: OnboardingAnswers;
 generated: GeneratedPlan;
 diet: DietTargetsFromAnswers;
 flags: OnboardingFlags;
 /** Avisos na ordem de exibição (segurança primeiro). Textos na seção 10 da especificação. */
 warnings: OnboardingWarning[];
 /** Tipos de dia que a rotina gerada usa (para a faixa "de {min} a {max} kcal"). */
 usedDayTypes: AnyDayType[];
 summary: { gymDays: number; scheduledGymDays: number; sessionNames: string[]; weeks: 12; kcalMin: number | null; kcalMax: number | null; proteinG: number | null };
}

export function buildOnboardingPreview(answers: OnboardingAnswers, catalog: Readonly<Record<string, Exercise>>): OnboardingPreview {
 const generated = buildPlanFromAnswers(answers, catalog);
 const diet = buildDietTargetsFromAnswers(answers);
 const flags: OnboardingFlags = { dietTargetsDisabled: diet.kind === 'none' && diet.reason === 'seguranca', hideDietNumbers: safetyFlagsOf(answers).includes('transtorno') };
 const used: AnyDayType[] = [];
 for (let d = 0; d < 7; d++) {
  const act = activityFor({ sched: generated.sched, weekday: d });
  const t = anyDayTypeOf(act, act.kind === 'gym' ? generated.plan.sess[act.sessionId]?.name : undefined);
  if (!used.includes(t)) used.push(t);
 }
 const usedDayTypes = ALL_DAY_TYPES.filter(t => used.includes(t));
 let kcalMin: number | null = null, kcalMax: number | null = null;
 if (diet.kind === 'targets') {
  const values = usedDayTypes.map(t => (diet.targets.days as Record<AnyDayType, { kcal: number }>)[t].kcal);
  kcalMin = Math.min(...values); kcalMax = Math.max(...values);
 }
 const warnings = [...diet.warnings, ...generated.warnings];
 return {
  answers: structuredClone(answers), generated, diet, flags, warnings, usedDayTypes,
  summary: { gymDays: generated.gymDays, scheduledGymDays: generated.scheduledGymDays, sessionNames: generated.plan.order.map(k => generated.plan.sess[k].name), weeks: 12, kcalMin, kcalMax, proteinG: diet.kind === 'targets' ? diet.targets.proteinG : null }
 };
}

/** "Começar quando?": padrão é a próxima segunda-feira (hoje, se hoje for segunda). */
export function defaultOnboardingStart(today: DayIso): DayIso {
 const m = mondayOf(today);
 return m === today ? today : addDays(m, 7);
}

// ---------- o que pode ser gravado (privacidade) ----------
/** Respostas que podem ser guardadas para refazer o assistente: sem passo 0 e sem dados físicos (sexo nunca é gravado). */
export interface StoredAnswers { goal: Goal; experience: Experience; daysPerWeek: DaysPerWeek; duration: Duration; place: Place; activities: FixedActivity[] }
export interface OnboardingSetting {
 v: 1;
 /** Dia em que o plano do assistente foi aplicado. */
 appliedOn: DayIso;
 answers: StoredAnswers;
 dietTargetsDisabled: boolean;
 hideDietNumbers: boolean;
 /** Chave em `recovery` com o estado anterior para "Voltar ao plano anterior" (1 nível). */
 undoKey?: string;
}
export function storedAnswersOf(a: OnboardingAnswers): StoredAnswers {
 return { goal: a.goal, experience: a.experience, daysPerWeek: a.daysPerWeek, duration: a.duration, place: a.place, activities: a.activities.map(x => (x.label !== undefined ? { kind: x.kind, days: [...x.days], label: x.label } : { kind: x.kind, days: [...x.days] })) };
}
/** Respostas guardadas + padrões, para preencher o assistente ao refazer (passo 0 e passo 7 voltam vazios). */
export function answersFromStored(s: unknown): OnboardingAnswers {
 const base = defaultAnswers();
 const a = plain(s) && plain(s.answers) ? s.answers : null;
 if (!a) return base;
 const r = validateOnboardingAnswers({ ...base, ...a, safety: ['nenhum'] });
 return r.ok ? { ...r.value, safety: [] } : base;
}

const STORED_KEYS = new Set(['v', 'appliedOn', 'answers', 'dietTargetsDisabled', 'hideDietNumbers', 'undoKey']);
const ANSWER_KEYS = new Set(['goal', 'experience', 'daysPerWeek', 'duration', 'place', 'activities']);
const ACT_KEYS = new Set(['kind', 'days', 'label']);

/**
 * Confere `settings.onboarding` salvo ou importado. Estrito de propósito: qualquer campo fora da lista
 * (por exemplo sexo ou marcações de saúde) é rejeitado. Devolve a mensagem do primeiro erro ou `null`.
 */
export function checkStoredOnboarding(v: unknown, maxKey: number, maxLabel: number): string | null {
 if (!plain(v)) return 'Assistente: esperado objeto.';
 for (const k of Object.keys(v)) if (!STORED_KEYS.has(k)) return `Assistente: campo não permitido (${k.slice(0, 40)}).`;
 if (v.v !== 1) return 'Assistente: versão desconhecida.';
 if (typeof v.appliedOn !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v.appliedOn) || new Date(`${v.appliedOn}T12:00:00Z`).toISOString().slice(0, 10) !== v.appliedOn) return 'Assistente: data inválida.';
 if (typeof v.dietTargetsDisabled !== 'boolean' || typeof v.hideDietNumbers !== 'boolean') return 'Assistente: marcações inválidas.';
 if (v.undoKey !== undefined && (typeof v.undoKey !== 'string' || v.undoKey.length > maxKey)) return 'Assistente: chave de desfazer inválida.';
 const a = v.answers;
 if (!plain(a)) return 'Assistente: respostas inválidas.';
 for (const k of Object.keys(a)) if (!ANSWER_KEYS.has(k)) return `Assistente: campo não permitido nas respostas (${k.slice(0, 40)}).`;
 if (!Array.isArray(a.activities)) return 'Assistente: atividades inválidas.';
 for (const x of a.activities) {
  if (!plain(x)) return 'Assistente: atividades inválidas.';
  for (const k of Object.keys(x)) if (!ACT_KEYS.has(k)) return `Assistente: campo não permitido nas atividades (${k.slice(0, 40)}).`;
  if (x.label !== undefined && (typeof x.label !== 'string' || x.label.length > maxLabel)) return `Assistente: nome do esporte com mais de ${maxLabel} caracteres.`;
 }
 // Rótulo já conferido acima com a folga de importação; aqui confere o resto pelas mesmas regras do assistente.
 const r = validateOnboardingAnswers({ ...a, safety: ['nenhum'], activities: (a.activities as Record<string, unknown>[]).map(x => ({ ...x, label: undefined })) });
 if (!r.ok) return `Assistente: ${Object.values(r.errors)[0]}`;
 return null;
}
