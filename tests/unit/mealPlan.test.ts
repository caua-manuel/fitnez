import { describe, expect, it } from 'vitest';
import foodsJson from '../../src/data/foods/foods.json';
import tplJson from '../../src/data/foods/templates.json';
import { POWDER_IDS, checkFoodData, checkTolerance, generateMeals, mealEligibility, swapFood, totalsOf } from '../../src/domain/mealPlan';
import type { Food, GeneratedOption, MealTemplates } from '../../src/domain/mealPlan';
import { FOOD_DISLIKES_MAX, buildDietTargetsFromAnswers, checkFoodAnswers, checkStoredOnboarding, validateOnboardingAnswers } from '../../src/domain/onboarding';
import type { FoodAnswers, OnboardingAnswers } from '../../src/domain/onboarding';
import type { DietTargets } from '../../src/domain/dietTargets';

// ADR 013. Exemplos sintéticos do handoff do conteúdo (docs/handoffs/conteudo-adr-013-tabela.md).
const FOODS = foodsJson.foods as Food[];
const TPL = tplJson as unknown as MealTemplates;
const byId = new Map(FOODS.map(f => [f.id, f]));
const food = (over: Partial<FoodAnswers> = {}): FoodAnswers => ({ style: 'tudo', restrictions: [], mealsPerDay: 4, dedication: 'cardapio', dislikes: [], whey: false, ...over });
const answers = (body: OnboardingAnswers['body'], goal: OnboardingAnswers['goal'], f: FoodAnswers, safety: OnboardingAnswers['safety'] = ['nenhum']): OnboardingAnswers =>
 ({ safety, goal, experience: 'iniciante', daysPerWeek: 3, duration: 'medio', place: 'academia', activities: [], body, food: f });
const targetsOf = (a: OnboardingAnswers): DietTargets => { const t = buildDietTargetsFromAnswers(a); if (t.kind !== 'targets') throw new Error('sem metas'); return t.targets; };
const EX = {
 a: answers({ sex: 'm', age: 30, heightCm: 180, weightKg: 80, lifestyle: 'moderado' }, 'massa', food()),
 b: answers({ sex: 'f', age: 25, heightCm: 165, weightKg: 62, lifestyle: 'moderado' }, 'perder', food({ style: 'vegetariano', mealsPerDay: 3, whey: true })),
 c: answers({ sex: 'm', age: 40, heightCm: 175, weightKg: 85, lifestyle: 'pouco' }, 'recomp', food({ restrictions: ['sem_lactose'], mealsPerDay: 5, whey: true })),
 d: answers({ sex: 'f', age: 35, heightCm: 160, weightKg: 58, lifestyle: 'moderado' }, 'saude', food({ style: 'vegano', whey: true })),
 e: answers({ sex: 'm', age: 28, heightCm: 175, weightKg: 75, lifestyle: 'moderado' }, 'recomp', food({ dedication: 'proteina' })),
};
const gen = (a: OnboardingAnswers) => generateMeals(a, targetsOf(a), FOODS, TPL);
const optionsOf = (meals: Record<string, GeneratedOption[]>, key: string) => Object.entries(meals).flatMap(([m, list]) => list.filter(o => o.key === key).map(o => ({ meal: m, o })));
const usedIds = (meals: Record<string, GeneratedOption[]>) => Object.values(meals).flatMap(l => l.flatMap(o => o.foods.map(x => x.id)));
const dayTotals = (meals: Record<string, GeneratedOption[]>, key: string) => totalsOf(optionsOf(meals, key).flatMap(({ o }) => o.foods.map(x => ({ food: byId.get(x.id)!, qty: x.qty }))));

describe('tabela e moldes', () => {
 it('são válidos: ids únicos, porções e escalas positivas, frações que somam 1', () => {
  expect(FOODS.length).toBe(88);
  expect(checkFoodData(FOODS, TPL)).toEqual([]);
  expect(new Set(FOODS.map(f => f.id)).size).toBe(FOODS.length);
  for (const f of FOODS) { expect(f.portion).toBeGreaterThan(0); expect(f.scale.min).toBeGreaterThan(0); expect(f.scale.step).toBeGreaterThan(0); }
 });
});

describe('exemplos do conteúdo', () => {
 const target = (a: OnboardingAnswers, day: 'academia' | 'descanso') => { const t = targetsOf(a); return { kcal: t.days[day].kcal, protein: t.proteinG! }; };
 it('as metas batem com a conta do handoff', () => {
  expect(targetsOf(EX.a).days.academia).toEqual({ kcal: 2750, carbs: 396 });
  expect(targetsOf(EX.b).days.academia).toEqual({ kcal: 1600, carbs: 163 });
  expect(targetsOf(EX.c).days.descanso).toEqual({ kcal: 1900, carbs: 148 });
  expect(targetsOf(EX.d).proteinG).toBe(95);
 });
 for (const k of ['a', 'b', 'c', 'd'] as const) it(`(${k}) fica dentro das tolerâncias nos dois tipos de dia`, () => {
  const a = EX[k];
  expect(mealEligibility(a)).toEqual({ ok: true });
  const r = gen(a);
  expect(r.withinTolerance).toBe(true);
  for (const [key, day] of [['t1', 'academia'], ['d1', 'descanso']] as const) {
   const t = dayTotals(r.meals, key);
   const goal = target(a, day);
   expect(checkTolerance(t, goal)).toEqual({ kcal: true, protein: true });
   expect(t.kcal / goal.kcal).toBeGreaterThanOrEqual(0.95); expect(t.kcal / goal.kcal).toBeLessThanOrEqual(1.05);
   expect(t.p / goal.protein).toBeGreaterThanOrEqual(0.95); expect(t.p / goal.protein).toBeLessThanOrEqual(1.15);
   expect(optionsOf(r.meals, key)).toHaveLength(a.food!.mealsPerDay);
  }
  for (const list of Object.values(r.meals)) for (const o of list) {
   expect(o.items.every(i => i.endsWith('(a verificar)'))).toBe(true);
   expect(o.foods.length).toBeLessThanOrEqual(8);
  }
 });
 it('(c) sem lactose: nenhum L nem whey concentrado', () => {
  const ids = usedIds(gen(EX.c).meals);
  expect(ids.some(id => byId.get(id)!.tags.includes('L'))).toBe(false);
  expect(ids).not.toContain('whey_concentrado');
 });
 it('(d) vegano: só V, e almoço e jantar com leguminosa', () => {
  const r = gen(EX.d);
  expect(usedIds(r.meals).every(id => byId.get(id)!.tags.includes('V'))).toBe(true);
  for (const m of ['almoco', 'jantar'] as const) for (const o of r.meals[m]) expect(o.foods.some(x => byId.get(x.id)!.role === 'PC')).toBe(true);
 });
 it('(e) só proteína: bloqueado com motivo so-proteina', () => {
  expect(mealEligibility(EX.e)).toEqual({ ok: false, reason: 'so-proteina' });
 });
});

describe('determinismo', () => {
 it('mesma entrada, mesma saída; ordem da tabela não importa', () => {
  const t = targetsOf(EX.a);
  const one = generateMeals(EX.a, t, FOODS, TPL);
  expect(generateMeals(EX.a, t, FOODS, TPL)).toEqual(one);
  expect(generateMeals(EX.a, t, [...FOODS].reverse(), TPL)).toEqual(one);
  const shuffled = [...FOODS].sort((x, y) => (x.kcal * 7 + x.p) % 13 - (y.kcal * 7 + y.p) % 13);
  expect(generateMeals(EX.a, t, shuffled, TPL)).toEqual(one);
 });
});

describe('restrições', () => {
 const base = EX.a;
 const idsFor = (f: Partial<FoodAnswers>) => usedIds(generateMeals({ ...base, food: food(f) }, targetsOf(base), FOODS, TPL).meals).map(id => byId.get(id)!);
 it('vegano só usa V', () => expect(idsFor({ style: 'vegano', whey: true }).every(f => f.tags.includes('V'))).toBe(true));
 it('vegetariano só usa V ou Vg', () => expect(idsFor({ style: 'vegetariano', whey: true }).every(f => f.tags.includes('V') || f.tags.includes('Vg'))).toBe(true));
 for (const [r, tag] of [['sem_lactose', 'L'], ['sem_gluten', 'G'], ['ovo', 'O'], ['peixe', 'Pe'], ['amendoim', 'Am'], ['soja', 'S']] as const)
  it(`${r} tira ${tag}`, () => {
   for (const style of ['tudo', 'vegetariano'] as const) expect(idsFor({ style, restrictions: [r], whey: true }).some(f => f.tags.includes(tag))).toBe(false);
  });
 it('sem glúten tira a aveia', () => expect(idsFor({ restrictions: ['sem_gluten'] }).map(f => f.id)).not.toContain('aveia_flocos'));
 it('alimentos rejeitados não aparecem', () => {
  const first = idsFor({});
  const dislikes = [...new Set(first.map(f => f.id))].slice(0, 5);
  const ids = idsFor({ dislikes }).map(f => f.id);
  for (const d of dislikes) expect(ids).not.toContain(d);
 });
 it('whey e proteína em pó só para quem usa', () => {
  expect(idsFor({ style: 'vegano', whey: false }).some(f => POWDER_IDS.includes(f.id))).toBe(false);
  expect(idsFor({ style: 'vegano', whey: true }).some(f => POWDER_IDS.includes(f.id))).toBe(true);
 });
});

describe('casos bloqueados', () => {
 const a = EX.a;
 it.each([
  ['menor de 18 pela idade', { ...a, body: { ...a.body, age: 17 } }, 'menor18'],
  ['menor de 18 marcado', { ...a, safety: ['menor18'] }, 'menor18'],
  ['IMC 18,4', { ...a, body: { ...a.body, heightCm: 180, weightKg: 59.6 } }, 'imc-baixo'],
  ['gestação', { ...a, safety: ['gestacao'] }, 'gestacao'],
  ['amamentação', { ...a, safety: ['amamentacao'] }, 'amamentacao'],
  ['transtorno', { ...a, safety: ['transtorno'] }, 'transtorno'],
  ['condição de saúde', { ...a, safety: ['condicao'] }, 'condicao'],
  ['sem dados de corpo', { ...a, body: undefined }, 'sem-dados'],
  ['sem respostas de alimentação', { ...a, food: undefined }, 'sem-dados'],
 ] as [string, OnboardingAnswers, string][])('%s', (_n, x, reason) => {
  expect(mealEligibility(x)).toEqual({ ok: false, reason });
 });
});

describe('swapFood', () => {
 const r = gen(EX.a);
 const lunch = r.meals.almoco[0]!;
 const kcalOf = (o: GeneratedOption) => totalsOf(o.foods.map(x => ({ food: byId.get(x.id)!, qty: x.qty }))).kcal;
 const proteinId = lunch.foods.find(x => byId.get(x.id)!.role === 'P')!.id;
 it('troca por mesmo papel, mantém kcal ±5% e macros parecidas', () => {
  const s = swapFood(lunch, proteinId, EX.a, null, FOODS)!;
  expect(s).not.toBeNull();
  const novo = s.foods.find(x => !lunch.foods.some(y => y.id === x.id))!;
  expect(byId.get(novo.id)!.role).toBe('P');
  expect(Math.abs(kcalOf(s) / kcalOf(lunch) - 1)).toBeLessThanOrEqual(0.05);
  expect(Math.abs(s.p - lunch.p)).toBeLessThan(15);
  expect(s.key).toBe(lunch.key);
  expect(s.items.length).toBe(lunch.items.length);
  expect(swapFood(lunch, proteinId, EX.a, null, FOODS)).toEqual(s);
 });
 it('respeita restrições, rejeitados e exclusões', () => {
  const exclude: string[] = ['alcatra'];
  for (let i = 0; i < 6; i++) {
   const s = swapFood(lunch, proteinId, { food: food({ restrictions: ['peixe'], dislikes: ['lombo_porco'] }) }, null, FOODS, exclude);
   if (!s) break;
   const ids = s.foods.map(x => x.id);
   expect(ids.some(id => byId.get(id)!.tags.includes('Pe'))).toBe(false);
   expect(ids).not.toContain('lombo_porco');
   for (const e of exclude) expect(ids).not.toContain(e);
   exclude.push(ids.find(id => !lunch.foods.some(y => y.id === id))!);
  }
 });
 it('devolve null sem candidato', () => {
  expect(lunch.foods.some(x => x.id === 'azeite_oliva')).toBe(true);
  expect(swapFood(lunch, 'azeite_oliva', EX.a, null, FOODS)).toBeNull(); // único Gd do almoço
  expect(swapFood(lunch, 'nao_existe', EX.a, null, FOODS)).toBeNull();
  expect(swapFood({ ...lunch, foods: undefined }, 'azeite_oliva', EX.a, null, FOODS)).toBeNull();
 });
});

describe('respostas food', () => {
 it('respostas antigas (sem food) continuam válidas', () => {
  const { food: _f, ...old } = EX.a;
  expect(validateOnboardingAnswers(old).ok).toBe(true);
 });
 it('não como: aceita 40 (limite) e recusa 41', () => {
  const ids = (n: number) => Array.from({ length: n }, (_, i) => `x${i}`);
  expect(FOOD_DISLIKES_MAX).toBe(40);
  expect(checkFoodAnswers({ ...food(), dislikes: ids(34) })).toBeNull(); // todos os grupos da tela
  expect(checkFoodAnswers({ ...food(), dislikes: ids(40) })).toBeNull();
  expect(checkFoodAnswers({ ...food(), dislikes: ids(41) })).not.toBeNull();
  expect(validateOnboardingAnswers({ ...EX.a, food: { ...food(), dislikes: ids(40) } }).ok).toBe(true);
  expect(validateOnboardingAnswers({ ...EX.a, food: { ...food(), dislikes: ids(41) } }).ok).toBe(false);
 });
 it('rejeita valores fora das listas', () => {
  expect(checkFoodAnswers(food())).toBeNull();
  for (const bad of [{ style: 'carnivoro' }, { restrictions: ['nozes'] }, { mealsPerDay: 6 }, { dislikes: ['Frango!'] }, { whey: 'sim' }, { alergia: 'x' }])
   expect(checkFoodAnswers({ ...food(), ...bad })).not.toBeNull();
 });
 it('settings.onboarding aceita food válido e dietUndoKey', () => {
  const s = { v: 1, appliedOn: '2026-11-23', dietTargetsDisabled: false, hideDietNumbers: false, dietUndoKey: 'diet-undo:1', answers: { goal: 'massa', experience: 'iniciante', daysPerWeek: 3, duration: 'medio', place: 'academia', activities: [], food: food() } };
  expect(checkStoredOnboarding(s, 200, 40)).toBeNull();
  expect(checkStoredOnboarding({ ...s, answers: { ...s.answers, food: { ...food(), style: 'x' } } }, 200, 40)).not.toBeNull();
 });
});
