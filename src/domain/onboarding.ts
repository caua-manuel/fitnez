import type { Exercise, Payload, Plan, Session } from '../application/repository';
import { RIR_BEGINNER, addDays, mondayOf } from './calendar';
import type { DayIso } from './calendar';
import { SPORT_LABEL_DEFAULT, SPORT_LABEL_MAX, activityFor, anyDayTypeOf } from './dayActivity';
import type { AnyDayType } from './dayActivity';
import { ALL_DAY_TYPES, LIMITS as DIET_LIMITS, carbsFromRest, validateDietTargets } from './dietTargets';
import type { DietTargets } from './dietTargets';
import type { MuscleGroup } from './muscleGroups';
import { validateProfile } from './profile';
import { PAIN_AVOID } from './painRules';
import { DEFAULT_EQUIPMENT, EQUIPMENT, ENGINE_EXERCISE_IDS, LOAD_LIMITED, PAIN_REGIONS, PRIORITIES, SESSION_TEMPLATES, VOLUME, buildEngine, restFor, setsPattern } from './planEngine';
import type { Equipment, PainRegion, PlanNote, Priority, SessionKey } from './planEngine';
export type { Equipment, PainRegion, PlanNote, Priority } from './planEngine';

// Assistente de início (ADR 008). Regras puras e determinísticas, sem interface e sem acesso a dados.
// Contrato: docs/handoffs/conteudo-assistente-inicio.md. Todos os números marcados "a verificar" na especificação.
// Privacidade (decisão do dono): sexo e marcações do passo 0 só existem nas respostas em memória; nada aqui
// devolve esses campos para gravação (ver `storedAnswersOf`).

// ---------- respostas ----------
/** `amamentacao`: opção separada da gravidez (ADR 012, P2, adotada pelo orquestrador; aguarda o dono). A tela do passo 0 ainda junta as duas. */
export type SafetyFlag = 'menor18' | 'gestacao' | 'amamentacao' | 'condicao' | 'transtorno';
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
 /** Bloco do cardápio (ADR 013, conteúdo v2). Opcional: respostas da versão 1 continuam válidas. */
 food?: FoodAnswers;
 /** ADR 015. Só em memória (nada disto entra em StoredAnswers): grupo a priorizar, dores por região, equipamento em casa e se treinou nos últimos 3 meses. */
 priority?: Priority;
 pains?: PainRegion[];
 equipment?: Equipment[];
 trainedRecently?: boolean;
}

// ---------- alimentação (ADR 013) ----------
export type FoodStyle = 'tudo' | 'vegetariano' | 'vegano';
export type FoodRestriction = 'sem_lactose' | 'sem_gluten' | 'ovo' | 'peixe' | 'amendoim' | 'soja';
export type Dedication = 'proteina' | 'cardapio';
export type MealsPerDay = 3 | 4 | 5;
/** `dislikes`: ids da tabela de alimentos (até 40; os grupos da tela somam 34). `whey`: a pessoa marcou que usa whey ou proteína em pó. */
export interface FoodAnswers { style: FoodStyle; restrictions: FoodRestriction[]; mealsPerDay: MealsPerDay; dedication: Dedication; dislikes: string[]; whey: boolean }
export const FOOD_STYLES: readonly FoodStyle[] = ['tudo', 'vegetariano', 'vegano'];
export const FOOD_RESTRICTIONS: readonly FoodRestriction[] = ['sem_lactose', 'sem_gluten', 'ovo', 'peixe', 'amendoim', 'soja'];
export const DEDICATIONS: readonly Dedication[] = ['proteina', 'cardapio'];
export const MEALS_PER_DAY: readonly MealsPerDay[] = [3, 4, 5];
export const FOOD_DISLIKES_MAX = 40;
export const FOOD_ID_RE = /^[a-z0-9_-]{1,40}$/;
const FOOD_KEYS = new Set(['style', 'restrictions', 'mealsPerDay', 'dedication', 'dislikes', 'whey']);

/** Valida o bloco `food` (só valores de listas fechadas). Devolve a mensagem do primeiro erro ou `null`. */
export function checkFoodAnswers(v: unknown): string | null {
 if (!plain(v)) return 'Alimentação: respostas inválidas.';
 for (const k of Object.keys(v)) if (!FOOD_KEYS.has(k)) return `Alimentação: campo não permitido (${k.slice(0, 40)}).`;
 if (!oneOf(FOOD_STYLES, v.style)) return 'Alimentação: escolha como você come.';
 if (!Array.isArray(v.restrictions) || v.restrictions.length > FOOD_RESTRICTIONS.length || v.restrictions.some(r => !oneOf(FOOD_RESTRICTIONS, r)) || new Set(v.restrictions).size !== v.restrictions.length) return 'Alimentação: restrições inválidas.';
 if (!oneOf(MEALS_PER_DAY, v.mealsPerDay)) return 'Alimentação: escolha de 3 a 5 refeições.';
 if (!oneOf(DEDICATIONS, v.dedication)) return 'Alimentação: escolha quanto você quer seguir.';
 if (!Array.isArray(v.dislikes) || v.dislikes.length > FOOD_DISLIKES_MAX || v.dislikes.some(d => typeof d !== 'string' || !FOOD_ID_RE.test(d)) || new Set(v.dislikes).size !== v.dislikes.length) return `Alimentação: marque no máximo ${FOOD_DISLIKES_MAX} alimentos que você não come.`;
 if (typeof v.whey !== 'boolean') return 'Alimentação: responda se usa whey.';
 return null;
}
const copyFood = (f: FoodAnswers): FoodAnswers => ({ style: f.style, restrictions: [...f.restrictions], mealsPerDay: f.mealsPerDay, dedication: f.dedication, dislikes: [...f.dislikes], whey: f.whey });

export const SAFETY_FLAGS: readonly SafetyFlag[] = ['menor18', 'gestacao', 'amamentacao', 'condicao', 'transtorno'];
export const GOALS: readonly Goal[] = ['perder', 'massa', 'recomp', 'saude'];
export const EXPERIENCES: readonly Experience[] = ['nunca', 'iniciante', 'intermediario'];
export const DAYS_OPTIONS: readonly DaysPerWeek[] = [2, 3, 4, 5, 6];
export const DURATIONS: readonly Duration[] = ['curto', 'medio', 'longo'];
export const PLACES: readonly Place[] = ['academia', 'casa_equip', 'casa_livre'];
export const FIXED_KINDS: readonly FixedKind[] = ['luta', 'esporte', 'corrida'];
export const SEXES: readonly Sex[] = ['m', 'f', 'nao_informar'];
export const LIFESTYLES: readonly Lifestyle[] = ['pouco', 'moderado', 'muito'];
/** 2: bloco `food` (ADR 013). Respostas da versão 1 (sem `food`) continuam válidas. */
export const ONBOARDING_CONTENT_VERSION = 2 as const;

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
 let priority: Priority | undefined, pains: PainRegion[] | undefined, equipment: Equipment[] | undefined, trainedRecently: boolean | undefined;
 if (!emptyValue(input.priority)) { if (oneOf(PRIORITIES, input.priority)) priority = input.priority; else errors.priority = 'Escolha o que priorizar.'; }
 if (input.pains !== undefined && input.pains !== null) {
  if (!Array.isArray(input.pains) || input.pains.length > PAIN_REGIONS.length || input.pains.some(p => !oneOf(PAIN_REGIONS, p))) errors.pains = 'Regiões inválidas.';
  else pains = PAIN_REGIONS.filter(r => (input.pains as unknown[]).includes(r));
 }
 if (input.equipment !== undefined && input.equipment !== null) {
  if (!Array.isArray(input.equipment) || input.equipment.length > EQUIPMENT.length || input.equipment.some(p => !oneOf(EQUIPMENT, p))) errors.equipment = 'Equipamento inválido.';
  else equipment = EQUIPMENT.filter(r => (input.equipment as unknown[]).includes(r));
 }
 if (input.trainedRecently !== undefined && input.trainedRecently !== null) { if (typeof input.trainedRecently === 'boolean') trainedRecently = input.trainedRecently; else errors.trainedRecently = 'Responda sim ou não.'; }
 let food: FoodAnswers | undefined;
 if (input.food !== undefined && input.food !== null) {
  const why = checkFoodAnswers(input.food);
  if (why) errors.food = why; else food = copyFood(input.food as FoodAnswers);
 }
 if (Object.keys(errors).length) return { ok: false, errors };
 const value: OnboardingAnswers = { safety, goal: input.goal as Goal, experience: input.experience as Experience, daysPerWeek: input.daysPerWeek as DaysPerWeek, duration: input.duration as Duration, place: input.place as Place, activities };
 if (body && Object.keys(body).length) value.body = body;
 if (food) value.food = food;
 if (priority) value.priority = priority;
 if (pains) value.pains = pains;
 if (equipment) value.equipment = equipment;
 if (trainedRecently !== undefined) value.trainedRecently = trainedRecently;
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
/** RIR do plano para condição de saúde, amamentação e 60 anos ou mais (ADR 012; a verificar). */
export const RIR_CONSERVADOR: readonly string[] = ['4', '3', '3', '4', '3', '3', '3', '4', '3', '3', '3', '4'];
/** Idade a partir da qual o plano fica mais leve e com exercícios estáveis (ADR 012; a verificar). */
export const OLDER_AGE = 60;
/** Abaixo desta idade informada, o assistente não gera plano (ADR 012, P1, adotada pelo orquestrador; aguarda o dono). */
export const MIN_PLAN_AGE = 14;
/** Teto de dias e sem duração longa com transtorno alimentar (ADR 012, P3, adotada pelo orquestrador; aguarda o dono). */
export const TRANSTORNO_MAX_DAYS = 4;
export const isOlder = (a: OnboardingAnswers): boolean => typeof a.body?.age === 'number' && a.body.age >= OLDER_AGE;
/** Plano leve com liberação médica: condição de saúde ou amamentação. */
export const isConservative = (a: OnboardingAnswers): boolean => { const f = safetyFlagsOf(a); return f.includes('condicao') || f.includes('amamentacao'); };
export type PlanBlockedReason = 'gestacao' | 'menor14';
/** Motivo para não gerar plano nem metas (a tela mostra texto próprio, sem "Começar o plano"); `null` = pode gerar. */
export function planBlockedReason(a: OnboardingAnswers): PlanBlockedReason | null {
 if (safetyFlagsOf(a).includes('gestacao')) return 'gestacao';
 if (typeof a.body?.age === 'number' && a.body.age < MIN_PLAN_AGE) return 'menor14';
 return null;
}
/** Experiência usada nas regras: menor de 18, condição de saúde, amamentação e 60+ (salvo intermediário) recebem o treino de quem nunca treinou. */
export const effectiveExperience = (a: OnboardingAnswers): Experience => {
 if (isMinor(a) || isConservative(a) || (isOlder(a) && a.experience !== 'intermediario')) return 'nunca';
 // ADR 015: quem marcou intermediário e ficou mais de 3 meses sem treinar começa com o volume e os exercícios de iniciante.
 return a.experience === 'intermediario' && a.trainedRecently === false ? 'iniciante' : a.experience;
};
/** Prioridade usada: menor de 18 e transtorno alimentar ficam em "equilibrado" (ADR 015). */
export const effectivePriority = (a: OnboardingAnswers): Priority => (isMinor(a) || safetyFlagsOf(a).includes('transtorno') ? 'equilibrado' : a.priority ?? 'equilibrado');
export const bmiOf = (weightKg: number, heightCm: number): number => weightKg / ((heightCm / 100) ** 2);

export type OnboardingWarning = SafetyFlag | 'idade60' | 'sem-dados' | 'imc-baixo' | 'imc-alto-massa' | 'duracao-reduzida' | 'semana-cheia' | 'tres-dias';
/** Ordem de exibição dos avisos (ADR 012): segurança, idade60, sem-dados, imc-*, duracao-reduzida, semana-cheia. */
export const WARNING_ORDER: readonly OnboardingWarning[] = [...SAFETY_FLAGS, 'idade60', 'sem-dados', 'imc-baixo', 'imc-alto-massa', 'duracao-reduzida', 'semana-cheia', 'tres-dias'];
/**
 * Por que a divisão tem menos treinos do que o pedido. Desde 25/11/2026 (ADR 014) não há teto por experiência:
 * `teto` só aparece com transtorno alimentar (`TRANSTORNO_MAX_DAYS`); `atividades` = no máximo 6 dias ativos.
 */
export type DaysReason = 'teto' | 'atividades';

// ---------- divisão e rotina ----------
// Exercícios, séries e tempo: src/domain/planEngine.ts (ADR 015). Aqui ficam a divisão por dias e a rotina.
export type { SessionKey } from './planEngine';
export const isLegSession = (key: SessionKey): boolean => key === 'PERA' || key === 'PERB';
/** Treinos que trabalham pernas (inclui Corpo inteiro): não ficam em dias seguidos quando há dia livre que resolva. */
const hasLegs = (key: SessionKey): boolean => key === 'PERA' || key === 'PERB' || key === 'CIA' || key === 'CIB';
export const CIB_2DIAS_SUB = 'Pernas, peito, costas e abdômen';
/** Nome do Superior B quando a divisão de 5 dias não tem Superior A (ADR 014). */
export const SUPERIOR_UNICO_NAME = 'Superior';
/** Nome e subtítulo do treino. `days` = número final de treinos da divisão. */
function sessionLabel(key: SessionKey, days: number): { name: string; sub: string } {
 const tpl = SESSION_TEMPLATES[key];
 if (key === 'SUPB' && days === 5) return { name: SUPERIOR_UNICO_NAME, sub: tpl.sub };
 if (key === 'CIB' && days === 2) return { name: tpl.name, sub: CIB_2DIAS_SUB };
 if (days === 6 && (key === 'EMP' || key === 'PUX')) return { name: `${tpl.name} A`, sub: tpl.sub };
 return { name: tpl.name, sub: tpl.sub };
}
/** IDs que o assistente pode usar (todos precisam existir no catálogo e no guia). */
export const ASSISTANT_EXERCISE_IDS: readonly string[] = ENGINE_EXERCISE_IDS;

// Sem teto por experiência (decisão do dono, 25/11/2026, ADR 014): a pessoa recebe os dias que pediu.
const PREFERRED: Readonly<Record<number, readonly number[]>> = { 2: [0, 3], 3: [0, 2, 4], 4: [0, 1, 3, 4], 5: [0, 1, 2, 4, 5], 6: [0, 1, 2, 3, 4, 5] };
export const DURATION_TEXT: Readonly<Record<Duration, string>> = { curto: '30 a 45 min', medio: '45 a 60 min', longo: '60 a 90 min' };

/**
 * Divisão por número de treinos (ADR 014). 5 dias: Superior/Pernas + Empurrar/Puxar (cada grupo grande 2 a 3 vezes,
 * só 2 dias de pernas). 6 dias: Empurrar, Puxar, Pernas duas vezes (cada grupo 2 vezes, pernas com 2 dias de intervalo).
 */
function splitFor(days: number, exp: Experience): SessionKey[] {
 if (days <= 2) return ['CIA', 'CIB'];
 if (days === 3) return exp === 'intermediario' ? ['SUPA', 'PERA', 'CIB'] : ['CIA', 'CIB', 'CIA'];
 if (days === 4) return ['SUPA', 'PERA', 'SUPB', 'PERB'];
 if (days === 5) return ['SUPB', 'PERA', 'EMP', 'PUX', 'PERB'];
 return ['EMP', 'PUX', 'PERA', 'EMP2', 'PUX2', 'PERB'];
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
 /** Por que a divisão tem menos treinos do que o pedido (`null`: nada cortou, ou semana cheia). Textos no handoff do conteúdo. */
 daysReason: DaysReason | null;
 /** ADR 015: séries por grupo na semana (bloco 1), minutos estimados por treino (pior bloco) e avisos do que foi trocado ou não deu para treinar. */
 weeklySets: Partial<Record<MuscleGroup, number>>;
 sessionMinutes: Record<string, number>;
 notes: PlanNote[];
}

export class OnboardingError extends Error { constructor(message: string) { super(message); this.name = 'OnboardingError'; } }

/** Monta divisão, rotina, exercícios, séries, repetições, descanso e RIR (seções 2 a 4 e ADR 012). */
export function buildPlanFromAnswers(answers: OnboardingAnswers, catalog: Readonly<Record<string, Exercise>>): GeneratedPlan {
 const blocked = planBlockedReason(answers);
 // Defesa: a tela nunca deve pedir plano nesses casos (ver `OnboardingPreview.blocked`).
 if (blocked) throw new OnboardingError(blocked === 'gestacao' ? 'Plano não gerado: gestação.' : `Plano não gerado: menos de ${MIN_PLAN_AGE} anos.`);
 const exp = effectiveExperience(answers);
 const older = isOlder(answers);
 const conservative = isConservative(answers);
 const transtorno = safetyFlagsOf(answers).includes('transtorno');
 const warnings: OnboardingWarning[] = [];
 if (older) warnings.push('idade60');
 const week = fixedWeek(answers);
 const fixas = week.filter(Boolean).length;
 // Único teto que sobra: transtorno alimentar (ADR 012, P3). Os outros cortes são físicos (atividades fixas e semana cheia).
 let days = transtorno ? Math.min(answers.daysPerWeek, TRANSTORNO_MAX_DAYS) : answers.daysPerWeek;
 let daysReason: DaysReason | null = days < answers.daysPerWeek ? 'teto' : null;
 if (days + fixas > 6) { days = Math.max(2, 6 - fixas); daysReason = 'atividades'; }
 const full = fixas >= 6;
 if (full) { days = 2; daysReason = null; }
 // Semana cheia: 2 treinos curtos, fora da rotina (decisão do dono: não marcar musculação no mesmo dia da atividade fixa).
 let duration: Duration = full ? 'curto' : answers.duration;
 // Quem nunca treinou (inclui menor de 18, condição, amamentação e 60+) e transtorno alimentar: sem treino longo.
 if (duration === 'longo' && (exp === 'nunca' || transtorno)) { duration = 'medio'; if (exp === 'nunca') warnings.push('duracao-reduzida'); }
 if (full) warnings.push('semana-cheia');
 const split = splitFor(days, exp);

 // Dias da semana (2.3)
 const chosen: number[] = [];
 if (!full) {
  for (const d of [...(PREFERRED[days] ?? []), 0, 1, 2, 3, 4, 5, 6]) { if (chosen.length >= days) break; if (!week[d] && !chosen.includes(d)) chosen.push(d); }
  chosen.sort((x, y) => x - y);
 }
 const assigned = chosen.map((d, i) => ({ day: d, key: split[i] }));
 const busy = (d: number) => week[d] !== null;
 const legOk = (d: number) => !busy(d) && !busy((d + 1) % 7);
 // Pernas no dia ou na véspera de atividade fixa: troca com um treino que não é de pernas, primeiro os seguintes,
 // depois os anteriores (do mais próximo ao mais distante), desde que o dia do parceiro sirva para pernas (ADR 012).
 for (let i = 0; i < assigned.length; i++) {
  const a = assigned[i];
  if (!isLegSession(a.key) || legOk(a.day)) continue;
  const ok = (k: number) => !isLegSession(assigned[k].key) && legOk(assigned[k].day);
  let j = -1;
  for (let k = i + 1; k < assigned.length && j < 0; k++) if (ok(k)) j = k;
  for (let k = i - 1; k >= 0 && j < 0; k--) if (ok(k)) j = k;
  if (j >= 0) { const t = a.key; a.key = assigned[j].key; assigned[j].key = t; }
 }
 const slots: (SessionKey | null)[] = Array(7).fill(null);
 for (const a of assigned) slots[a.day] = a.key;
 // Treinos com pernas em dias seguidos: o segundo vai para um dia livre que não fique ao lado de outro treino
 // com pernas nem na véspera de atividade fixa. Sem dia assim, fica como está (ADR 012).
 const legDay = (d: number) => { const k = slots[d]; return k !== null && hasLegs(k); };
 for (let d = 0; d < 7; d++) {
  const e = (d + 1) % 7;
  if (!legDay(d) || !legDay(e)) continue;
  for (let f = 0; f < 7; f++) {
   if (slots[f] !== null || busy(f) || busy((f + 1) % 7)) continue;
   const prev = (f + 6) % 7, next = (f + 1) % 7;
   if ((prev !== e && legDay(prev)) || (next !== e && legDay(next))) continue;
   slots[f] = slots[e]; slots[e] = null;
   break;
  }
 }
 const sched: Payload[] = week.map(x => (x ? { ...x } : { k: 'rest' }));
 slots.forEach((k, d) => { if (k) sched[d] = { k: 'gym', s: k }; });

 // Exercícios, séries e tempo (ADR 015): o motor escolhe, ajusta o volume por grupo e confere o tempo.
 const goal = buildDietTargetsFromAnswers(answers).effectiveGoal;
 const painAvoid = (answers.pains ?? []).map(region => ({ region, ids: PAIN_AVOID[region] }));
 const res = buildEngine({
  split, place: answers.place, exp, volExp: exp, older, conservative, equipment: answers.equipment ?? DEFAULT_EQUIPMENT[answers.place], painAvoid,
  duration, goal, priority: effectivePriority(answers), days: split.length, catalog
 });
 const vol = VOLUME[exp];
 const ex: Record<string, Exercise> = {};
 const sess: Record<string, Session> = {};
 const order: string[] = [];
 for (const key of split) {
  if (sess[key]) continue;
  const label = sessionLabel(key, split.length);
  const ids = res.sessions[key] ?? [];
  for (const id of ids) {
   if (ex[id]) continue;
   const base = catalog[id];
   if (!base) throw new OnboardingError(`Exercício ${id} não está no catálogo.`);
   const role = res.roles[id];
   const e: Exercise = structuredClone(base);
   e.s = setsPattern(exp, role, res.sets[id], res.growth);
   // Sem carga (rep, s) ou com carga limitada: repetições do catálogo (a progressão é por repetição).
   const keepCatalogReps = !(e.m === 'kg' || e.m === 'bw') || LOAD_LIMITED.has(id);
   if (!keepCatalogReps) {
    e.r = [...(role === 'principal' ? vol.pr : vol.ar)];
    // "10 por perna" vira "12–15": a unidade passa para a observação, para não fazer metade.
    const unit = /\spor (lado|perna)\s*$/.exec(String(base.r[0] ?? ''))?.[1];
    if (unit && !/^Repetições por /.test(e.t ?? '')) e.t = `Repetições por ${unit}.${e.t ? ` ${e.t}` : ''}`;
   }
   e.rest = restFor(id, base, role, exp, duration);
   ex[id] = e;
  }
  sess[key] = { name: label.name, sub: label.sub, min: DURATION_TEXT[duration], ex: [...ids] };
  order.push(key);
 }
 const plan: GeneratedPlan['plan'] = { ex, sess, order };
 // Intermediário com 2 dias: o volume fica no mínimo; a revisão sugere um terceiro dia, sem bloquear.
 if (exp === 'intermediario' && split.length === 2) warnings.push('tres-dias');
 if (conservative || older) plan.rir = [...RIR_CONSERVADOR];
 else if (exp !== 'intermediario') plan.rir = [...RIR_BEGINNER];
 return { plan, sched, gymDays: split.length, scheduledGymDays: assigned.length, experience: exp, duration, warnings, daysReason, weeklySets: res.weekly, sessionMinutes: res.minutes, notes: res.notes };
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
 /**
  * Plano não gerado (gestação ou menos de 14 anos, ADR 012): a tela mostra texto próprio e não oferece
  * "Começar o plano". Com \`blocked\`, \`generated\` é \`null\`, \`usedDayTypes\` é \`[]\` e o resumo vem zerado.
  */
 blocked: PlanBlockedReason | null;
 /** Condição de saúde ou amamentação: "Começar o plano" só depois de marcar a liberação médica (não gravada). */
 requiresClearance: boolean;
 generated: GeneratedPlan | null;
 diet: DietTargetsFromAnswers;
 flags: OnboardingFlags;
 /** Avisos na ordem de exibição (\`WARNING_ORDER\`: segurança primeiro). Textos na seção 10 da especificação e no ADR 012. */
 warnings: OnboardingWarning[];
 /** Tipos de dia que a rotina gerada usa (para a faixa "de {min} a {max} kcal"). */
 usedDayTypes: AnyDayType[];
 /** \`daysRequested\` e \`daysReason\` alimentam a linha "Você pediu {pedido} dias..." (só com \`daysReason !== null\`). */
 summary: { gymDays: number; scheduledGymDays: number; sessionNames: string[]; weeks: 12; kcalMin: number | null; kcalMax: number | null; proteinG: number | null; daysRequested: DaysPerWeek; daysReason: DaysReason | null };
}

const sortWarnings = (list: OnboardingWarning[]): OnboardingWarning[] => WARNING_ORDER.filter(w => list.includes(w));

export function buildOnboardingPreview(answers: OnboardingAnswers, catalog: Readonly<Record<string, Exercise>>): OnboardingPreview {
 const blocked = planBlockedReason(answers);
 const generated = blocked ? null : buildPlanFromAnswers(answers, catalog);
 const diet = buildDietTargetsFromAnswers(answers);
 const flags: OnboardingFlags = { dietTargetsDisabled: diet.kind === 'none' && diet.reason === 'seguranca', hideDietNumbers: safetyFlagsOf(answers).includes('transtorno') };
 const used: AnyDayType[] = [];
 if (generated) for (let d = 0; d < 7; d++) {
  const act = activityFor({ sched: generated.sched, weekday: d });
  const t = anyDayTypeOf(act, act.kind === 'gym' ? generated.plan.sess[act.sessionId]?.name : undefined);
  if (!used.includes(t)) used.push(t);
 }
 const usedDayTypes = ALL_DAY_TYPES.filter(t => used.includes(t));
 let kcalMin: number | null = null, kcalMax: number | null = null;
 if (diet.kind === 'targets' && usedDayTypes.length) {
  const values = usedDayTypes.map(t => (diet.targets.days as Record<AnyDayType, { kcal: number }>)[t].kcal);
  kcalMin = Math.min(...values); kcalMax = Math.max(...values);
 }
 const warnings = sortWarnings([...diet.warnings, ...(generated?.warnings ?? [])]);
 return {
  answers: structuredClone(answers), blocked, requiresClearance: !blocked && isConservative(answers), generated, diet, flags, warnings, usedDayTypes,
  summary: {
   gymDays: generated?.gymDays ?? 0, scheduledGymDays: generated?.scheduledGymDays ?? 0, sessionNames: generated ? generated.plan.order.map(k => generated.plan.sess[k].name) : [], weeks: 12,
   kcalMin, kcalMax, proteinG: diet.kind === 'targets' ? diet.targets.proteinG : null, daysRequested: answers.daysPerWeek, daysReason: generated?.daysReason ?? null
  }
 };
}

/** "Começar quando?": padrão é a próxima segunda-feira (hoje, se hoje for segunda). */
export function defaultOnboardingStart(today: DayIso): DayIso {
 const m = mondayOf(today);
 return m === today ? today : addDays(m, 7);
}

// ---------- o que pode ser gravado (privacidade) ----------
/** Respostas que podem ser guardadas para refazer o assistente: sem passo 0 e sem dados físicos (sexo nunca é gravado). */
/** `food` (ADR 013): fica só no aparelho e no backup; não entra no compartilhamento de plano nem no CSV. */
export interface StoredAnswers { goal: Goal; experience: Experience; daysPerWeek: DaysPerWeek; duration: Duration; place: Place; activities: FixedActivity[]; food?: FoodAnswers }
export interface OnboardingSetting {
 v: 1;
 /** Dia em que o plano do assistente foi aplicado. */
 appliedOn: DayIso;
 answers: StoredAnswers;
 dietTargetsDisabled: boolean;
 hideDietNumbers: boolean;
 /** Chave em `recovery` com o estado anterior para "Voltar ao plano anterior" (1 nível). */
 undoKey?: string;
 /** Chave em `recovery` com o cardápio anterior para desfazer o cardápio gerado (ADR 013, 1 nível). */
 dietUndoKey?: string;
}
export function storedAnswersOf(a: OnboardingAnswers): StoredAnswers {
 const out: StoredAnswers = { goal: a.goal, experience: a.experience, daysPerWeek: a.daysPerWeek, duration: a.duration, place: a.place, activities: a.activities.map(x => (x.label !== undefined ? { kind: x.kind, days: [...x.days], label: x.label } : { kind: x.kind, days: [...x.days] })) };
 if (a.food) out.food = copyFood(a.food);
 return out;
}
/** Respostas guardadas + padrões, para preencher o assistente ao refazer (passo 0 e passo 7 voltam vazios). */
export function answersFromStored(s: unknown): OnboardingAnswers {
 const base = defaultAnswers();
 const a = plain(s) && plain(s.answers) ? s.answers : null;
 if (!a) return base;
 const r = validateOnboardingAnswers({ ...base, ...a, safety: ['nenhum'] });
 return r.ok ? { ...r.value, safety: [] } : base;
}

const STORED_KEYS = new Set(['v', 'appliedOn', 'answers', 'dietTargetsDisabled', 'hideDietNumbers', 'undoKey', 'dietUndoKey']);
const ANSWER_KEYS = new Set(['goal', 'experience', 'daysPerWeek', 'duration', 'place', 'activities', 'food']);
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
 if (v.dietUndoKey !== undefined && (typeof v.dietUndoKey !== 'string' || v.dietUndoKey.length > maxKey)) return 'Assistente: chave de desfazer do cardápio inválida.';
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
