import { describe, expect, it } from 'vitest';
import { applyAdjustments, dayTarget, dayTargetForProfile, dayTotals, editDietOption, markEaten, progress, unmarkEaten, weeklyReview } from '../../src/domain/diet';
import type { DietDay, DietOption, MealKey } from '../../src/domain/diet';

const opt = (key: string, kcal: number, p = 30, c = 40, g = 10): DietOption => ({ key, name: `Opção ${key}`, kcal, p, c, g, items: ['x'] });
const catalog = (): Record<MealKey, DietOption[]> => ({
 cafe: [opt('A', 500)], almoco: [opt('A', 800)], lanche: [opt('A', 300)], pos: [opt('A', 250)], jantar: [opt('A', 600)]
});
const empty = (): DietDay => ({ pick: {}, eaten: {}, skip: {}, water: 0, crea: false });

describe('editar opção do cardápio', () => {
 const original = { ...opt('A', 500), items: ['a', 'b'], foods: [{ id: 'a', qty: 1 }], rec: 'receita' };
 it.each([{}, { edited: true }] as const)('mantém a opção quando os campos são iguais (%j)', flag => {
  const option = { ...original, ...flag };
  expect(editDietOption(option, { ...original, items: [...original.items] })).toBe(option);
 });
 it.each([{ name: 'Outro nome' }, { items: ['b', 'a'] }, { kcal: 501 }, { p: 31 }, { c: 41 }, { g: 11 }])('marca alteração de %j e mantém os dados internos', changes => {
  const option = editDietOption(original, { ...original, ...changes });
  expect(option).toEqual({ ...original, ...changes, edited: true });
 });
});

describe('meta do dia', () => {
 it.each([['perna', 2600, 340], ['academia', 2450, 305], ['jiujitsu', 2500, 315], ['volei', 2500, 315], ['descanso', 2100, 215]] as const)('%s', (t, kcal, carbs) => {
  const d = dayTarget(t);
  expect(d.kcal).toBe(kcal); expect(d.carbs).toBe(carbs);
  expect(d.protein).toBe(185); expect(d.fat).toBe(55); expect(d.waterL).toBe(3);
  expect(d.focus.length).toBeGreaterThan(0);
 });
 it('ajustes por tipo e proteína/gordura configuráveis', () => {
  expect(dayTarget('perna').adjustments.join(' ')).toMatch(/arroz/);
  expect(dayTarget('academia').adjustments).toEqual([]);
  expect(dayTarget('descanso').adjustments.join(' ')).toMatch(/lanche/);
  const d = dayTarget('volei', { protein: 200, fat: 60 });
  expect(d.protein).toBe(200); expect(d.fat).toBe(60);
 });
});

describe('marcar comi', () => {
 it('copia valores e não muta o original', () => {
  const day = empty();
  const o = opt('A', 500);
  const r = markEaten(day, 'cafe', o);
  expect(day.eaten.cafe).toBeUndefined();
  expect(r.eaten.cafe).toBe(true);
  expect(r.consumed?.cafe).toEqual({ key: 'A', name: 'Opção A', kcal: 500, p: 30, c: 40, g: 10 });
  o.kcal = 999;
  expect(r.consumed?.cafe?.kcal).toBe(500);
 });
 it('desmarcar remove eaten e consumed', () => {
  const r = unmarkEaten(markEaten(empty(), 'cafe', opt('A', 500)), 'cafe');
  expect(r.eaten.cafe).toBeFalsy(); expect(r.consumed?.cafe).toBeUndefined();
 });
});

describe('totais do dia', () => {
 it('dia sem nada marcado', () => {
  expect(dayTotals(empty(), catalog())).toEqual({ kcal: 0, p: 0, c: 0, g: 0, eatenCount: 0, mealCount: 5 });
 });
 it('escolhida mas não comida não conta; comida sem consumed usa catálogo', () => {
  const day: DietDay = { ...empty(), pick: { cafe: 'A', almoco: 'A' }, eaten: { almoco: true } };
  const t = dayTotals(day, catalog());
  expect(t.kcal).toBe(800); expect(t.eatenCount).toBe(1);
 });
 it('consumed preservado quando a opção é editada depois', () => {
  const day = markEaten({ ...empty(), pick: { cafe: 'A' } }, 'cafe', opt('A', 500));
  const edited = catalog(); edited.cafe = [opt('A', 900)];
  expect(dayTotals(day, edited).kcal).toBe(500);
 });
 it('kcal inválida não gera NaN', () => {
  const bad = { ...opt('A', 0), kcal: 'abc' as unknown as number };
  const day = markEaten(empty(), 'cafe', bad);
  const t = dayTotals(day, catalog());
  expect(t.kcal).toBe(0); expect(Number.isNaN(t.p)).toBe(false); expect(t.p).toBe(30);
  const cat = catalog(); cat.almoco = [bad];
  const t2 = dayTotals({ ...empty(), pick: { almoco: 'A' }, eaten: { almoco: true } }, cat);
  expect(t2.kcal).toBe(0);
 });
 it('pulada não conta', () => {
  const day: DietDay = { ...empty(), pick: { cafe: 'A' }, eaten: { cafe: true }, skip: { cafe: true } };
  expect(dayTotals(day, catalog()).kcal).toBe(0);
 });
});

describe('progresso', () => {
 it('razões e restante', () => {
  const p = progress({ kcal: 1225, p: 92.5, c: 152.5, g: 55 }, dayTarget('academia'));
  expect(p.kcal).toBeCloseTo(0.5); expect(p.protein).toBeCloseTo(0.5); expect(p.carbs).toBeCloseTo(0.5); expect(p.fat).toBe(1);
  expect(p.remaining).toBe(1225);
 });
 it('passa de 1 e restante mínimo 0; sem NaN', () => {
  const p = progress({ kcal: 3000, p: 0, c: 0, g: 0 }, dayTarget('descanso'));
  expect(p.kcal).toBeGreaterThan(1); expect(p.remaining).toBe(0);
  const z = progress({ kcal: NaN, p: 1, c: 1, g: 1 }, { ...dayTarget('descanso'), fat: 0 });
  expect(z.kcal).toBe(0); expect(z.fat).toBe(0);
 });
});

describe('ajustes por tipo de dia', () => {
 it('perna: arroz no almoço e banana no lanche, sem alterar números', () => {
  const o = opt('A', 800);
  const a = applyAdjustments(o, 'perna', 'almoco');
  expect(a.note).toMatch(/50 g de arroz/); expect(a.option.kcal).toBe(800);
  expect(applyAdjustments(opt('A', 300), 'perna', 'lanche').note).toMatch(/banana/);
  expect(applyAdjustments(o, 'perna', 'jantar').note).toBeUndefined();
 });
 it('descanso: sugere pular lanche', () => {
  expect(applyAdjustments(opt('A', 300), 'descanso', 'lanche').note).toMatch(/pular/i);
  expect(applyAdjustments(opt('A', 800), 'descanso', 'almoco').note).toBeUndefined();
 });
 it('academia sem nota', () => {
  expect(applyAdjustments(opt('A', 800), 'academia', 'almoco').note).toBeUndefined();
 });
});

describe('revisão semanal', () => {
 const base = { waists: [80, 80], strengthDown: false, hungerHigh: false };
 it('dados insuficientes', () => {
  expect(weeklyReview({ ...base, weights: [80] }).suggestion).toBe('dados-insuficientes');
  expect(weeklyReview({ ...base, weights: [] }).kcalDelta).toBe(0);
  expect(weeklyReview({ ...base, weights: [80, 80], waists: [80] }).suggestion).toBe('dados-insuficientes');
 });
 it('cortar 130 kcal quando estagnado e sugere revisar pré-treino', () => {
  const r = weeklyReview({ ...base, weights: [80, 80.1] });
  expect(r.suggestion).toBe('cortar'); expect(r.kcalDelta).toBe(-130);
  expect(r.text).toMatch(/pré-treino/); expect(r.text).toMatch(/sugest/i);
 });
 it('aumentar por perda rápida, força ou fome', () => {
  const a = weeklyReview({ ...base, weights: [80, 79.2], waists: [80, 79] });
  expect(a.suggestion).toBe('aumentar'); expect(a.kcalDelta).toBeGreaterThanOrEqual(130); expect(a.kcalDelta).toBeLessThanOrEqual(170);
  expect(weeklyReview({ ...base, weights: [80, 80], strengthDown: true }).suggestion).toBe('aumentar');
  expect(weeklyReview({ ...base, weights: [80, 80], hungerHigh: true }).suggestion).toBe('aumentar');
 });
 it('manter com perda de 0,2 a 0,4 e cintura diminuindo', () => {
  const r = weeklyReview({ ...base, weights: [80, 79.7], waists: [80, 79.5] });
  expect(r.suggestion).toBe('manter'); expect(r.kcalDelta).toBe(0);
 });
 it('entradas inválidas não geram NaN', () => {
  const r = weeklyReview({ ...base, weights: [NaN, 80] });
  expect(r.suggestion).toBe('dados-insuficientes');
 });
});

describe('meta de proteína pelo perfil', () => {
 it('sem peso mantém 185 g e 55 g de gordura', () => {
  expect(dayTarget('academia', { protein: 185, fat: 55 }).protein).toBe(185);
  expect(dayTargetForProfile('academia', undefined).protein).toBe(185);
  expect(dayTargetForProfile('academia', {}).fat).toBe(55);
 });
 it('com peso usa 2,4 g/kg e não altera kcal nem carboidrato', () => {
  const t = dayTargetForProfile('perna', { weightKg: 80 });
  expect(t.protein).toBe(192);
  expect(t.kcal).toBe(2600);
  expect(t.carbs).toBe(340);
 });
});
