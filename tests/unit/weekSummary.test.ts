import { describe, expect, it } from 'vitest';
import type { StateV3 } from '../../src/application/repository';
import { foundation } from '../../src/data/migration';
import { demoState } from '../../src/demo/generate';
import { addDays } from '../../src/domain/calendar';
import { DIET_FOOTNOTE, dietDayStatus, dietLine, weekSummary, weekSummaryOf } from '../../src/domain/weekSummary';

// ADR 011, 2.5 e docs/handoffs/conteudo-adr-011.md, parte B ("dia na meta").
const TODAY = '2026-11-20'; // sexta da semana 5 da demo
const empty = () => foundation(Date.UTC(2026, 10, 1, 12));
const demo = () => demoState(TODAY, empty());

describe('dietDayStatus (B.1)', () => {
 const target = { kcal: 2000, protein: 200 };
 it('sem refeição marcada não conta nem como na meta nem como fora', () => {
  expect(dietDayStatus({ kcal: 0, p: 0, eatenCount: 0 }, target)).toBe('sem-registro');
 });
 it('kcal dentro de ±10% (inclusive) e proteína ≥ 85% (inclusive)', () => {
  expect(dietDayStatus({ kcal: 1800, p: 170, eatenCount: 1 }, target)).toBe('na-meta');
  expect(dietDayStatus({ kcal: 2200, p: 170, eatenCount: 5 }, target)).toBe('na-meta');
  expect(dietDayStatus({ kcal: 1799, p: 200, eatenCount: 5 }, target)).toBe('fora');
  expect(dietDayStatus({ kcal: 2201, p: 200, eatenCount: 5 }, target)).toBe('fora'); // acima de 110% também é fora
  expect(dietDayStatus({ kcal: 2000, p: 169.9, eatenCount: 5 }, target)).toBe('fora');
 });
});

describe('dietLine (B.2)', () => {
 it('textos do conteúdo', () => {
  expect(dietLine(0, 0, 4)).toBe('Dieta: nenhum dia registrado nesta semana.');
  expect(dietLine(4, 5, 2)).toBe('Dieta: na meta em 4 de 5 dias registrados. 2 dias sem registro.');
  expect(dietLine(6, 6, 1)).toBe('Dieta: na meta em 6 de 6 dias registrados. 1 dia sem registro.');
  expect(dietLine(3, 3, 0)).toBe('Dieta: na meta em 3 de 3 dias registrados.');
  expect(DIET_FOOTNOTE).toBe('Na meta: calorias perto da meta do dia (10% para mais ou para menos) e proteína quase completa.');
 });
});

describe('weekSummary com a demonstração', () => {
 const s = demo();
 const sum = (week?: number, extra: { body?: boolean; today?: string } = {}) => weekSummaryOf(s, { today: extra.today ?? TODAY, week, body: extra.body });

 it('dieta das semanas 1 a 4 como a conferência do conteúdo (A.6)', () => {
  expect([0, 1, 2, 3].map(w => { const d = sum(w)!.diet!; return [d.onTarget, d.registered, d.unregistered]; })).toEqual([[6, 6, 1], [4, 5, 2], [6, 6, 1], [4, 5, 2]]);
  expect(sum(1)!.diet!.text).toBe('Dieta: na meta em 4 de 5 dias registrados. 2 dias sem registro.');
 });
 it('treinos feitos e previstos, com a falta e o parcial', () => {
  expect(sum(0)!.workouts).toEqual({ done: 3, partial: 0, planned: 3 });
  expect(sum(1)!.workouts).toEqual({ done: 2, partial: 0, planned: 3 }); // falta na sexta
  expect(sum(2)!.workouts).toEqual({ done: 2, partial: 1, planned: 3 }); // parcial na terça
 });
 it('semana leve: marcada e com menos séries que a anterior', () => {
  const w3 = sum(3)!, w2 = sum(2)!;
  expect(w3.deload).toBe(true);
  expect(w2.deload).toBe(false);
  expect(w3.sets).toBeLessThan(sum(0)!.sets);
  expect(w3.volume).toBeLessThan(sum(0)!.volume);
 });
 it('séries e volume sem aquecimento', () => {
  const base = sum(0)!;
  const withWarm = structuredClone(s) as StateV3;
  const day = addDays(s.settings.start, 2);
  withWarm.history.days[day]!.log!.supino!.unshift({ kg: '20', reps: '10', done: true, kind: 'warm' });
  const after = weekSummaryOf(withWarm, { today: TODAY, week: 0 })!;
  expect(after.sets).toBe(base.sets);
  expect(after.volume).toBe(base.volume);
 });
 it('recordes: semana 1 sem recordes (primeira vez); semanas seguintes com o melhor de cada exercício', () => {
  expect(sum(0)!.records).toEqual([]);
  const r = sum(1)!.records;
  expect(r.length).toBeGreaterThan(0);
  expect(new Set(r.map(x => x.exId)).size).toBe(r.length);
  const sup = r.find(x => x.exId === 'supino')!;
  expect(sup).toMatchObject({ name: s.catalog.plan.ex.supino!.n, kg: 28, reps: 7, day: addDays(s.settings.start, 9) });
 });
 it('semana atual: hoje não conta na dieta; semana futura ou antes do início: nada', () => {
  const cur = sum()!;
  expect(cur.week).toBe(4);
  expect(cur.diet!.considered).toBe(4);
  expect(sum(5)).toBeNull();
  expect(weekSummaryOf(s, { today: addDays(s.settings.start, -1) })).toBeNull();
 });
 it('peso e cintura só com a opção', () => {
  expect(sum(4)!.body).toBeNull();
  expect(sum(4, { body: true })!.body).toEqual({ weight: { before: 76.6, after: 76.3, delta: -0.3 }, waist: { before: 85.5, after: 85.2, delta: -0.3 } });
  expect(sum(0, { body: true })!.body).toEqual({ weight: null, waist: null }); // sem medida antes da semana 1
 });
 it('sem peso no resultado sem a opção (nenhum campo com o peso)', () => {
  const text = JSON.stringify(sum(4));
  expect(text).not.toContain('76.3');
  expect(text).not.toContain('76,3');
 });
 it.each(['hideDietNumbers', 'dietTargetsDisabled'] as const)('dieta omitida com %s', flag => {
  const hidden = structuredClone(s) as StateV3;
  hidden.settings.onboarding = { v: 1, appliedOn: TODAY, answers: {}, dietTargetsDisabled: flag === 'dietTargetsDisabled', hideDietNumbers: flag === 'hideDietNumbers' } as unknown as StateV3['settings']['onboarding'];
  expect(weekSummaryOf(hidden, { today: TODAY, week: 1 })!.diet).toBeNull();
 });
});

describe('weekSummary: semana vazia e metas próprias', () => {
 it('semana sem nenhum registro', () => {
  const s = empty();
  s.settings.start = '2026-11-16';
  const r = weekSummaryOf(s, { today: '2026-11-23', week: 0 })!;
  expect(r).toMatchObject({ week: 0, from: '2026-11-16', to: '2026-11-22', deload: false, workouts: { done: 0, partial: 0, planned: 3 }, sets: 0, volume: 0, records: [], body: null });
  expect(r.diet).toEqual({ considered: 7, registered: 0, onTarget: 0, unregistered: 7, text: 'Dieta: nenhum dia registrado nesta semana.' });
 });
 it('usa a meta do dia em vigor (dietTargets por data) e o tipo do dia da rotina', () => {
  const s = demo();
  const base = weekSummaryOf(s, { today: TODAY, week: 0 })!.diet!;
  // Meta própria com 3.000 kcal em todos os tipos de dia desde antes do início: nenhum dia fica na meta.
  const days = Object.fromEntries(['perna', 'academia', 'jiujitsu', 'volei', 'descanso'].map(t => [t, { kcal: 3000, carbs: 400 }]));
  s.settings.dietTargets = { schema: 1, versions: [{ from: '2026-01-01', targets: { days, proteinG: null, fatG: 55, waterL: 3 } }] } as StateV3['settings']['dietTargets'];
  const custom = weekSummaryOf(s, { today: TODAY, week: 0 })!.diet!;
  expect(base.onTarget).toBe(6);
  expect(custom).toMatchObject({ registered: 6, onTarget: 0 });
 });
 it('a função base aceita a entrada separada do estado', () => {
  const s = demo();
  const a = weekSummaryOf(s, { today: TODAY, week: 2 });
  const b = weekSummary({ days: s.history.days, plan: s.catalog.plan, sched: s.settings.sched, start: s.settings.start, today: TODAY, targets: s.settings, onboarding: null, diet: s.catalog.diet, week: 2 });
  expect(b).toEqual(a);
 });
});
