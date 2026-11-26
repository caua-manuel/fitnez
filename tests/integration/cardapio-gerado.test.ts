import { afterEach, describe, expect, it } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import { createRepository } from '../../src/data/index';
import { applyOnboarding, previewOnboarding } from '../../src/application/onboarding';
import { applyGeneratedDiet, canUndoGeneratedDiet, swapDietFood, undoGeneratedDiet } from '../../src/application/generatedDiet';
import type { Repository } from '../../src/application/repository';
import type { OnboardingAnswers } from '../../src/domain/onboarding';
import { applyPlanShare } from '../../src/application/planShare';
import { buildPlanShare, checkPlanShare } from '../../src/domain/planShare';

// ADR 013. Dados sintéticos; relógio injetado.
const NOW = new Date(2026, 10, 23, 12).getTime();
const TODAY = '2026-11-23';
const repos: Repository[] = [];
function setup() { const r = createRepository({ indexedDB: new IDBFactory(), storage: { getItem: () => null }, storageManager: {}, basePath: '/teste/', now: () => NOW }); repos.push(r); return r; }
afterEach(() => { repos.splice(0).forEach(r => r.close()); });
const backup = (state: unknown) => JSON.stringify({ v: 3, app: 'treino12', exportedAt: 1, state });
const answers = (over: Partial<OnboardingAnswers> = {}): OnboardingAnswers => ({ safety: ['nenhum'], goal: 'massa', experience: 'iniciante', daysPerWeek: 3, duration: 'medio', place: 'academia', activities: [], body: { sex: 'm', age: 30, heightCm: 180, weightKg: 80, lifestyle: 'moderado' }, food: { style: 'tudo', restrictions: [], mealsPerDay: 4, dedication: 'cardapio', dislikes: [], whey: false }, ...over });

async function withPlan(r: Repository, a: OnboardingAnswers) {
 const { state } = await r.initialize();
 const p = previewOnboarding(a); if (!p.ok) throw new Error('prévia');
 return applyOnboarding(r, { preview: p.preview, start: TODAY, today: TODAY, expectedRevision: state.revision, now: NOW });
}

describe('cardápio gerado: aplicar, trocar e desfazer', () => {
 it('aplica numa gravação, troca um alimento e desfaz para o cardápio do dono', async () => {
  const r = setup();
  const before = await withPlan(r, answers());
  const ownerDiet = structuredClone(before.catalog.diet);
  const res = await applyGeneratedDiet(r, { answers: answers(), expectedRevision: before.revision, now: NOW });
  if (!res.ok) throw new Error(res.reason);
  expect(res.withinTolerance).toBe(true);
  expect(res.state.revision).toBe(before.revision + 1);
  const diet = res.state.catalog.diet as Record<string, any[]>;
  expect(diet.cafe!.map(o => o.key)).toEqual(['t1', 'd1']);
  expect(diet.pos).toEqual([]);
  expect(res.state.settings.onboarding?.answers.food?.mealsPerDay).toBe(4);
  expect(canUndoGeneratedDiet(res.state)).toBe(true);
  expect(res.state.history).toEqual(before.history);

  const pid = diet.almoco![0].foods[0].id;
  const swapped = await swapDietFood(r, { meal: 'almoco', optionKey: 't1', foodId: pid, expectedRevision: res.state.revision, today: TODAY });
  expect(swapped).not.toBeNull();
  const lunch = (swapped!.catalog.diet as Record<string, any[]>).almoco![0];
  expect(lunch.foods.map((x: any) => x.id)).not.toContain(pid);
  expect((await r.read()).catalog.diet).toEqual(swapped!.catalog.diet);

  const undone = await undoGeneratedDiet(r, { expectedRevision: swapped!.revision });
  expect(undone.catalog.diet).toEqual(ownerDiet);
  expect(undone.settings.onboarding?.answers.food).toEqual(before.settings.onboarding?.answers.food); // o assistente já guardou food
  expect(canUndoGeneratedDiet(undone)).toBe(false);

  // O backup com o cardápio gerado e as respostas food passa pela validação de importação.
  const p = await r.prepareImport(backup(swapped));
  expect(p.token).toBeTruthy();
 });

 it('caso bloqueado não grava nada', async () => {
  const r = setup();
  const before = await withPlan(r, answers({ food: { style: 'tudo', restrictions: [], mealsPerDay: 4, dedication: 'proteina', dislikes: [], whey: false } }));
  const res = await applyGeneratedDiet(r, { answers: answers({ body: { sex: 'm', age: 17, heightCm: 180, weightKg: 80, lifestyle: 'moderado' } }), expectedRevision: before.revision, now: NOW });
  expect(res).toEqual({ ok: false, reason: 'menor18' });
  expect((await r.read()).revision).toBe(before.revision);
 });

 it('backup v3 antigo (sem foods nem food) continua importando; foods fora do limite é recusado', async () => {
  const r = setup();
  const { state } = await r.initialize();
  await expect(r.prepareImport(backup(state))).resolves.toBeDefined();
  const bad = structuredClone(state) as any;
  bad.catalog.diet.cafe[0].foods = [{ id: 'frango_peito', qty: 5000 }];
  await expect(r.prepareImport(backup(bad))).rejects.toMatchObject({ code: 'validation' });
  bad.catalog.diet.cafe[0].foods = [{ id: 'Frango!', qty: 100 }];
  await expect(r.prepareImport(backup(bad))).rejects.toMatchObject({ code: 'validation' });
  bad.catalog.diet.cafe[0].foods = Array.from({ length: 9 }, (_, i) => ({ id: `x${i}`, qty: 10 }));
  await expect(r.prepareImport(backup(bad))).rejects.toMatchObject({ code: 'validation' });
 });

 it('exporta e importa a edição do cardápio e continua compartilhando o plano', async () => {
  const source = setup();
  const before = await withPlan(source, answers());
  const generated = await applyGeneratedDiet(source, { answers: answers(), expectedRevision: before.revision, now: NOW });
  if (!generated.ok) throw new Error(generated.reason);
  const state = generated.state;
  const option = state.catalog.diet.almoco[0];
  option.items[0] = 'Item escolhido à mão';
  option.edited = true;
  const saved = await source.save({ state, expectedRevision: state.revision });
  const exported = await source.export();
  const dest = setup();
  const { state: empty } = await dest.initialize();
  const preview = await dest.prepareImport(exported.text);
  const imported = await dest.confirmImport({ token: preview.token, expectedRevision: empty.revision });
  expect(imported.catalog.diet).toEqual(saved.catalog.diet);
  expect((await dest.read()).catalog.diet.almoco[0].edited).toBe(true);

  const shared = buildPlanShare(saved, { name: 'Plano com cardápio editado', includeNotes: false });
  if (!shared.ok) throw new Error(shared.error);
  expect(shared.file).not.toHaveProperty('diet');
  const checked = checkPlanShare(JSON.parse(JSON.stringify(shared.file)));
  if (!checked.ok) throw new Error(checked.error);
  const applied = await applyPlanShare(dest, { file: checked.value, start: TODAY, today: TODAY, expectedRevision: imported.revision });
  expect(applied.catalog.diet).toEqual(saved.catalog.diet);
 });

 it.each(['true', 1, null])('recusa marca de edição não booleana (%j)', async edited => {
  const r = setup();
  const { state } = await r.initialize();
  state.catalog.diet.cafe[0].edited = edited;
  await expect(r.prepareImport(backup(state))).rejects.toMatchObject({ code: 'validation' });
 });
});

describe('refazer o plano sem cardápio (ADR 013)', () => {
 const semCardapio = (dedication: 'proteina' | 'cardapio', over: Partial<OnboardingAnswers> = {}) => answers({ food: { style: 'tudo', restrictions: [], mealsPerDay: 4, dedication, dislikes: [], whey: false }, ...over });
 for (const [nome, a] of [
  ['só bater a proteína', semCardapio('proteina')],
  ['bloqueado (menor de 18)', semCardapio('cardapio', { body: { sex: 'm', age: 17, heightCm: 180, weightKg: 80, lifestyle: 'moderado' } })],
  ['sem respostas de alimentação', answers({ food: undefined })],
 ] as const) {
  it(`${nome}: remove o cardápio gerado, volta às refeições de antes e o desfazer devolve o cardápio`, async () => {
   const r = setup();
   const before = await withPlan(r, answers());
   const ownerDiet = structuredClone(before.catalog.diet);
   const gen = await applyGeneratedDiet(r, { answers: answers(), expectedRevision: before.revision, now: NOW });
   if (!gen.ok) throw new Error(gen.reason);
   const p = previewOnboarding(a); if (!p.ok) throw new Error('prévia');
   const redo = await applyOnboarding(r, { preview: p.preview, start: TODAY, today: TODAY, expectedRevision: gen.state.revision, now: NOW + 1 });
   expect(redo.revision).toBe(gen.state.revision + 1); // uma gravação
   expect(redo.catalog.diet).toEqual(ownerDiet);
   expect((await r.read()).catalog.diet).toEqual(ownerDiet);
   expect(canUndoGeneratedDiet(redo)).toBe(false);
   const { undoOnboarding } = await import('../../src/application/onboarding');
   const back = await undoOnboarding(r, { expectedRevision: redo.revision, now: NOW + 2 });
   expect(back.catalog.diet).toEqual(gen.state.catalog.diet);
   expect(canUndoGeneratedDiet(back)).toBe(true);
  });
 }
 it('sem registro de desfazer do cardápio, volta ao cardápio de fábrica', async () => {
  const r = setup();
  const before = await withPlan(r, answers());
  const gen = await applyGeneratedDiet(r, { answers: answers(), expectedRevision: before.revision, now: NOW });
  if (!gen.ok) throw new Error(gen.reason);
  const s = structuredClone(gen.state); delete s.settings.onboarding!.dietUndoKey;
  const saved = await r.save({ state: s, expectedRevision: gen.state.revision });
  const p = previewOnboarding(semCardapio('proteina')); if (!p.ok) throw new Error('prévia');
  const redo = await applyOnboarding(r, { preview: p.preview, start: TODAY, today: TODAY, expectedRevision: saved.revision, now: NOW + 1 });
  const seed = (await import('../../data/diet.json')).default;
  expect(redo.catalog.diet).toEqual(seed);
 });
});
