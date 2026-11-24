import type { DietOption, MealKey } from './diet';
import type { DietTargets } from './dietTargets';
import { bmiOf, safetyFlagsOf } from './onboarding';
import type { FoodAnswers, FoodRestriction, OnboardingAnswers } from './onboarding';

// Cardápio gerado pelo assistente (ADR 013). Regra pura: sem React, sem datas, sem aleatoriedade.
// A mesma entrada sempre dá a mesma saída, e a ordem da tabela não muda o resultado (tudo é ordenado aqui).
// Unidade: `portion`, `scale` e `qty` estão em gramas (ou ml para líquidos, cujo nome termina com "(ml)").
// Carregue este módulo e a tabela só sob demanda (`import()`), nunca na carga inicial.

export type FoodRole = 'P' | 'PC' | 'C' | 'F' | 'Gd' | 'Le';
export type FoodTag = 'V' | 'Vg' | 'L' | 'G' | 'O' | 'Pe' | 'Am' | 'S';
export type FoodMeal = 'c' | 'a' | 'l' | 'pre' | 'pos';
export interface Food {
 id: string; name: string; portion: number; kcal: number; p: number; c: number; g: number;
 role: FoodRole; tags: FoodTag[]; meals: FoodMeal[]; cost: 1 | 2; check: boolean;
 scale: { min: number; max: number; step: number };
}
export interface MealRule { roles: FoodRole[]; optional: FoodRole[]; minLeG?: number; maxFatG?: number }
export interface MealTemplates {
 version: number;
 /** Etiquetas de refeição da tabela aceitas em cada `MealKey`. */
 mealTags: Record<MealKey, FoodMeal[]>;
 tolerance: { kcal: { min: number; max: number }; protein: { min: number; max: number } };
 /** Papéis obrigatórios de cada refeição. `optional` só entra quando falta proteína. */
 mealRules: Record<MealKey, MealRule>;
 /** Vegetariano e vegano: papel obrigatório extra por refeição (leguminosa no almoço e no jantar). */
 plantBased: { requireRoleIn: Partial<Record<MealKey, FoodRole>> };
 plans: Record<'3' | '4' | '5', Record<PlanDay, { meal: MealKey; frac: number }[]>>;
}
export type PlanDay = 'treino' | 'descanso';
export const PLAN_DAYS: readonly PlanDay[] = ['treino', 'descanso'];
/** Tipo de dia das metas usado por cada dia do cardápio. */
export const PLAN_DAY_TARGET: Readonly<Record<PlanDay, 'academia' | 'descanso'>> = { treino: 'academia', descanso: 'descanso' };
export const PLAN_DAY_KEY: Readonly<Record<PlanDay, string>> = { treino: 't1', descanso: 'd1' };
export const PLAN_DAY_NAME: Readonly<Record<PlanDay, string>> = { treino: 'Dia de treino', descanso: 'Dia de descanso' };
export const MEAL_KEYS: readonly MealKey[] = ['cafe', 'almoco', 'lanche', 'pos', 'jantar'];
export const CHECK_SUFFIX = ' (a verificar)';
export const FOODS_PER_OPTION_MAX = 8;

/** Opção com a lista de alimentos para permitir a troca (campo opcional, ADR 013). */
export type GeneratedOption = DietOption & { foods: { id: string; qty: number }[] };
export type EligibilityReason = 'menor18' | 'imc-baixo' | 'gestacao' | 'amamentacao' | 'transtorno' | 'condicao' | 'sem-dados' | 'so-proteina';
export type Eligibility = { ok: true } | { ok: false; reason: EligibilityReason };
export interface Totals { kcal: number; p: number; c: number; g: number }
export interface DayTotals { kcal: number; p: number }
export interface DayGoal { kcal: number; protein: number }

const round1 = (x: number) => Math.round(x * 10) / 10;
const byId = (a: Food, b: Food) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);

// ---------- elegibilidade ----------
/** Cardápio só a partir de 18 anos, com dados de corpo, IMC ≥ 18,5, sem nenhuma marcação de segurança e com "cardápio" escolhido. */
export function mealEligibility(answers: OnboardingAnswers): Eligibility {
 const flags = safetyFlagsOf(answers);
 for (const f of ['menor18', 'gestacao', 'amamentacao', 'transtorno', 'condicao'] as const) if (flags.includes(f)) return { ok: false, reason: f };
 const b = answers.body;
 if (!answers.food || typeof b?.age !== 'number' || typeof b.heightCm !== 'number' || typeof b.weightKg !== 'number') return { ok: false, reason: 'sem-dados' };
 if (b.age < 18) return { ok: false, reason: 'menor18' };
 if (bmiOf(b.weightKg, b.heightCm) < 18.5) return { ok: false, reason: 'imc-baixo' };
 if (answers.food.dedication !== 'cardapio') return { ok: false, reason: 'so-proteina' };
 return { ok: true };
}

// ---------- filtros ----------
const RESTRICTION_TAG: Readonly<Record<FoodRestriction, FoodTag>> = { sem_lactose: 'L', sem_gluten: 'G', ovo: 'O', peixe: 'Pe', amendoim: 'Am', soja: 'S' };
/** Ids de whey e proteína em pó: só entram para quem marcou que usa. */
export const POWDER_IDS: readonly string[] = ['whey_concentrado', 'whey_zero_lactose', 'proteina_vegana_po'];

/** O alimento é permitido para estas respostas? (tipo de alimentação, restrições, "não como" e whey) */
export function foodAllowed(food: Food, f: FoodAnswers): boolean {
 if (f.style === 'vegano' && !food.tags.includes('V')) return false;
 if (f.style === 'vegetariano' && !food.tags.includes('V') && !food.tags.includes('Vg')) return false;
 for (const r of f.restrictions) if (food.tags.includes(RESTRICTION_TAG[r])) return false;
 if (f.dislikes.includes(food.id)) return false;
 if (!f.whey && POWDER_IDS.includes(food.id)) return false;
 return true;
}

// ---------- contas ----------
const per = (food: Food, qty: number) => qty / food.portion;
export function totalsOf(items: readonly { food: Food; qty: number }[]): Totals {
 const t = { kcal: 0, p: 0, c: 0, g: 0 };
 for (const { food, qty } of items) { const k = per(food, qty); t.kcal += food.kcal * k; t.p += food.p * k; t.c += food.c * k; t.g += food.g * k; }
 return t;
}
export function checkTolerance(totals: DayTotals, target: DayGoal, tol: MealTemplates['tolerance'] = DEFAULT_TOLERANCE): { kcal: boolean; protein: boolean } {
 const rk = target.kcal > 0 ? totals.kcal / target.kcal - 1 : -1;
 const rp = target.protein > 0 ? totals.p / target.protein - 1 : -1;
 const eps = 1e-9;
 return { kcal: rk >= tol.kcal.min - eps && rk <= tol.kcal.max + eps, protein: rp >= tol.protein.min - eps && rp <= tol.protein.max + eps };
}
export const DEFAULT_TOLERANCE: MealTemplates['tolerance'] = { kcal: { min: -0.05, max: 0.05 }, protein: { min: -0.05, max: 0.15 } };

const unitOf = (food: Food) => (/\(ml\)/.test(food.name) ? 'ml' : 'g');
/** Texto de um item: "Peito de frango grelhado: 150 g (a verificar)". */
export function itemText(food: Food, qty: number): string {
 return `${food.name}: ${qty} ${unitOf(food)}${food.check ? CHECK_SUFFIX : ''}`;
}
function optionOf(key: string, name: string, items: { food: Food; qty: number }[]): GeneratedOption {
 const t = totalsOf(items);
 return { key, name, kcal: Math.round(t.kcal), p: round1(t.p), c: round1(t.c), g: round1(t.g), items: items.map(x => itemText(x.food, x.qty)), foods: items.map(x => ({ id: x.food.id, qty: x.qty })) };
}

// ---------- escolha ----------
/** Ordem fixa por papel: custo, depois (só proteína) mais proteína por kcal, depois id. */
function rank(role: FoodRole) {
 return (a: Food, b: Food) => a.cost - b.cost || (role === 'P' ? b.p / b.kcal - a.p / a.kcal : 0) || byId(a, b);
}
function pick(pool: readonly Food[], role: FoodRole, meal: MealKey, tpl: MealTemplates, used: readonly string[]): Food | undefined {
 const tags = tpl.mealTags[meal];
 return pool.filter(x => x.role === role && !used.includes(x.id) && x.meals.some(m => tags.includes(m))).sort(rank(role))[0];
}

interface Slot { meal: MealKey; frac: number; food: Food; qty: number; minQ: number; maxQ: number }

function snap(food: Food, q: number, minQ: number, maxQ: number): number {
 const s = food.scale.step;
 const k = Math.round((q - food.scale.min) / s);
 return Math.min(maxQ, Math.max(minQ, food.scale.min + k * s));
}

/**
 * Ajusta as porções pelos passos de `scale` (descida coordenada determinística).
 * Erro: kcal e proteína do dia (pesados), kcal de cada refeição pela fração do molde, gordura e porções perto da referência (leves).
 */
function fit(slots: Slot[], goal: DayGoal & { fat: number }, rules: MealTemplates['mealRules']) {
 const meals = [...new Set(slots.map(s => s.meal))];
 const cost = () => {
  let kcal = 0, p = 0, g = 0, e = 0;
  const mk: Record<string, number> = {};
  const mg: Record<string, number> = {};
  for (const s of slots) { const k = per(s.food, s.qty); kcal += s.food.kcal * k; p += s.food.p * k; g += s.food.g * k; mk[s.meal] = (mk[s.meal] ?? 0) + s.food.kcal * k; mg[s.meal] = (mg[s.meal] ?? 0) + s.food.g * k; }
  const rk = kcal / goal.kcal - 1;
  e += 400 * rk * rk + (Math.abs(rk) > 0.04 ? 4000 * (Math.abs(rk) - 0.04) ** 2 : 0);
  const rp = p / goal.protein - 1 - 0.05; // mira em +5%, no meio da faixa de −5% a +15%
  e += 300 * rp * rp + (rp < -0.09 ? 4000 * (rp + 0.09) ** 2 : 0) + (rp > 0.09 ? 4000 * (rp - 0.09) ** 2 : 0);
  const rg = g / goal.fat - 1;
  e += 10 * rg * rg;
  for (const m of meals) {
   const want = goal.kcal * slots.find(s => s.meal === m)!.frac;
   const rm = (mk[m] ?? 0) / want - 1;
   e += 8 * rm * rm;
   const maxFat = rules[m]?.maxFatG;
   if (maxFat !== undefined && (mg[m] ?? 0) > maxFat) e += 1000 + 100 * ((mg[m] ?? 0) - maxFat);
  }
  for (const s of slots) { const r = s.qty / s.food.portion - 1; e += 0.02 * r * r; }
  return e;
 };
 let best = cost();
 for (let iter = 0; iter < 400; iter++) {
  let move: { i: number; q: number; e: number } | null = null;
  for (let i = 0; i < slots.length; i++) {
   const s = slots[i]!;
   const orig = s.qty;
   for (const d of [1, -1, 2, -2, 4, -4]) {
    const q = orig + d * s.food.scale.step;
    if (q < s.minQ || q > s.maxQ) continue;
    s.qty = q;
    const e = cost();
    if (e < best - 1e-12 && (!move || e < move.e - 1e-12)) move = { i, q, e };
   }
   s.qty = orig;
  }
  if (!move) break;
  slots[move.i]!.qty = move.q;
  best = move.e;
 }
}

function dayGoal(targets: DietTargets, day: PlanDay, weightKg?: number) {
 const row = targets.days[PLAN_DAY_TARGET[day]];
 const protein = typeof targets.proteinG === 'number' ? targets.proteinG : Math.round((weightKg ?? 70) * 1.6);
 return { kcal: row.kcal, protein, fat: targets.fatG };
}

function buildDay(f: FoodAnswers, goal: DayGoal & { fat: number }, pool: readonly Food[], tpl: MealTemplates, day: PlanDay, withExtras: boolean): Slot[] {
 const plan = tpl.plans[String(f.mealsPerDay) as '3' | '4' | '5'][day];
 const plant = f.style !== 'tudo';
 const slots: Slot[] = [];
 for (const { meal, frac } of plan) {
  const rule = tpl.mealRules[meal];
  const roles = [...rule.roles];
  const extra = plant ? tpl.plantBased.requireRoleIn[meal] : undefined;
  if (extra && !roles.includes(extra)) roles.push(extra);
  if (withExtras) for (const r of rule.optional) if (!roles.includes(r)) roles.push(r);
  const used: string[] = [];
  for (const role of roles) {
   const food = pick(pool, role, meal, tpl, used);
   if (!food) continue;
   used.push(food.id);
   let minQ = food.scale.min;
   if (role === 'Le' && rule.minLeG && rule.minLeG > minQ) minQ = Math.min(food.scale.max, food.scale.min + Math.ceil((rule.minLeG - food.scale.min) / food.scale.step) * food.scale.step);
   slots.push({ meal, frac, food, qty: snap(food, food.portion, minQ, food.scale.max), minQ, maxQ: food.scale.max });
  }
 }
 return slots;
}

/**
 * Gera o cardápio dos dois tipos de dia. Cada refeição recebe `t1` (treino) e `d1` (descanso).
 * Refeições fora do molde ficam com lista vazia. `withinTolerance` é falso quando a melhor aproximação
 * não fecha kcal ±5% e proteína −5% a +15% (a tela mostra um aviso, sem esconder).
 * Chame só depois de `mealEligibility(answers).ok`.
 */
export function generateMeals(answers: OnboardingAnswers, targets: DietTargets, foods: readonly Food[], templates: MealTemplates): { meals: Record<MealKey, GeneratedOption[]>; withinTolerance: boolean } {
 const f = answers.food;
 if (!f) throw new Error('Respostas de alimentação ausentes.');
 const pool = foods.filter(x => foodAllowed(x, f)).sort(byId);
 const meals = { cafe: [], almoco: [], lanche: [], pos: [], jantar: [] } as Record<MealKey, GeneratedOption[]>;
 let within = true;
 for (const day of PLAN_DAYS) {
  const goal = dayGoal(targets, day, answers.body?.weightKg);
  let slots = buildDay(f, goal, pool, templates, day, false);
  fit(slots, goal, templates.mealRules);
  let t = totalsOf(slots);
  let ok = checkTolerance(t, goal, templates.tolerance);
  if (!ok.kcal || !ok.protein) {
   // Segunda tentativa com os papéis opcionais do molde; fica a que chegar mais perto.
   const alt = buildDay(f, goal, pool, templates, day, true);
   fit(alt, goal, templates.mealRules);
   const ta = totalsOf(alt);
   const oa = checkTolerance(ta, goal, templates.tolerance);
   const miss = (x: Totals) => Math.abs(x.kcal / goal.kcal - 1) + Math.max(0, 1 - 0.05 - x.p / goal.protein);
   if ((oa.kcal && oa.protein) || miss(ta) < miss(t)) { slots = alt; t = ta; ok = oa; }
  }
  if (!ok.kcal || !ok.protein) within = false;
  for (const { meal } of templates.plans[String(f.mealsPerDay) as '3' | '4' | '5'][day]) {
   const items = slots.filter(s => s.meal === meal).map(s => ({ food: s.food, qty: s.qty }));
   if (items.length) meals[meal].push(optionOf(PLAN_DAY_KEY[day], PLAN_DAY_NAME[day], items));
  }
 }
 return { meals, withinTolerance: within };
}

/**
 * Troca um alimento da opção por outro do mesmo papel, que caiba na mesma refeição (compartilha uma etiqueta
 * de refeição) e respeite as respostas. Refaz a porção para manter as kcal da opção em ±5% e escolhe o candidato
 * com macros mais parecidas. `exclude`: ids já oferecidos (para "trocar de novo" ciclar). `null` = sem troca válida.
 * `targets` fica na assinatura do ADR 013; a troca só olha a refeição, não o dia.
 */
export function swapFood(option: DietOption & { foods?: { id: string; qty: number }[] }, foodId: string, answers: Pick<OnboardingAnswers, 'food'>, _targets: DietTargets | null, foods: readonly Food[], exclude: readonly string[] = []): GeneratedOption | null {
 const f = answers.food;
 if (!f || !option.foods?.length) return null;
 const index = new Map(foods.map(x => [x.id, x]));
 const items: { food: Food; qty: number }[] = [];
 for (const x of option.foods) { const food = index.get(x.id); if (!food) return null; items.push({ food, qty: x.qty }); }
 const at = items.findIndex(x => x.food.id === foodId);
 if (at < 0) return null;
 const old = items[at]!;
 const before = totalsOf(items);
 const rest = totalsOf(items.filter((_, i) => i !== at));
 const oldPart = totalsOf([old]);
 const inOption = new Set(items.map(x => x.food.id));
 let best: { food: Food; qty: number; d: number } | null = null;
 for (const cand of [...foods].sort(byId)) {
  if (cand.role !== old.food.role || inOption.has(cand.id) || exclude.includes(cand.id) || !foodAllowed(cand, f)) continue;
  if (!cand.meals.some(m => old.food.meals.includes(m))) continue;
  const raw = (oldPart.kcal / cand.kcal) * cand.portion;
  const qty = snap(cand, raw, cand.scale.min, cand.scale.max);
  const part = totalsOf([{ food: cand, qty }]);
  const kcal = rest.kcal + part.kcal;
  if (before.kcal > 0 && Math.abs(kcal / before.kcal - 1) > 0.05 + 1e-9) continue;
  const norm = Math.max(1, oldPart.kcal);
  const d = (4 * Math.abs(part.p - oldPart.p) + 4 * Math.abs(part.c - oldPart.c) + 9 * Math.abs(part.g - oldPart.g)) / norm + Math.abs(kcal / before.kcal - 1) + (cand.cost - 1) * 0.01;
  if (!best || d < best.d - 1e-12) best = { food: cand, qty, d };
 }
 if (!best) return null;
 const next = items.map((x, i) => (i === at ? { food: best!.food, qty: best!.qty } : x));
 const out = optionOf(option.key, option.name, next);
 if (option.rec !== undefined) out.rec = option.rec;
 return out;
}

/** Confere a tabela e os moldes (usado nos testes e ao carregar). Devolve a lista de problemas. */
export function checkFoodData(foods: readonly Food[], tpl: MealTemplates): string[] {
 const errs: string[] = [];
 const ids = new Set<string>();
 for (const x of foods) {
  if (!/^[a-z0-9_-]{1,40}$/.test(x.id)) errs.push(`id inválido: ${x.id}`);
  if (ids.has(x.id)) errs.push(`id repetido: ${x.id}`);
  ids.add(x.id);
  if (!(x.portion > 0) || !(x.kcal > 0) || [x.p, x.c, x.g].some(v => !(v >= 0))) errs.push(`valores inválidos: ${x.id}`);
  const s = x.scale;
  if (!(s.step > 0) || !(s.min > 0) || s.max < s.min || (s.max - s.min) % s.step !== 0) errs.push(`escala inválida: ${x.id}`);
  if (!x.meals.length) errs.push(`sem refeição: ${x.id}`);
 }
 for (const n of ['3', '4', '5'] as const) for (const d of PLAN_DAYS) {
  const list = tpl.plans[n]?.[d];
  if (!list || list.length !== Number(n)) { errs.push(`molde ${n}/${d} incompleto`); continue; }
  const sum = list.reduce((a, b) => a + b.frac, 0);
  if (Math.abs(sum - 1) > 1e-9) errs.push(`molde ${n}/${d} soma ${sum}`);
  if (list.some(x => !(x.frac > 0) || !MEAL_KEYS.includes(x.meal))) errs.push(`molde ${n}/${d} com refeição inválida`);
 }
 return errs;
}
