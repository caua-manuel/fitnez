import { describe, expect, it } from 'vitest';
import type { Exercise } from '../../src/application/repository';
import type { SetEntry } from '../../src/domain/workout';
import { repRange, suggestNext } from '../../src/domain/progression';

const ex: Exercise = { n: 'Supino', s: [3, 3, 3], r: ['5–8', '5–8', '5–8'], m: '' };
const sess = (kg: string, ...reps: string[]): SetEntry[] => reps.map(r => ({ kg, reps: r, done: true }));
const run = (history: SetEntry[][], lower = false, week = 0) => suggestNext({ ex, week, history, lower });

describe('repRange', () => {
 it('interpreta faixa e valor único', () => {
  expect(repRange('5–8')).toEqual({ min: 5, max: 8 });
  expect(repRange('5-8')).toEqual({ min: 5, max: 8 });
  expect(repRange('8')).toEqual({ min: 8, max: 8 });
  expect(repRange('')).toBeNull();
  expect(repRange('abc')).toBeNull();
 });
});

describe('suggestNext', () => {
 it('sem histórico', () => {
  expect(run([])).toEqual({ kg: null, reps: '5–8', reason: 'sem-historico', stagnant: false });
  expect(run([[]]).reason).toBe('sem-historico');
 });
 it('sobe +2,5 kg no superior e +5 kg no inferior no topo da faixa', () => {
  const h = [sess('20', '8', '8', '8')];
  expect(run(h)).toMatchObject({ kg: 22.5, reason: 'subir', reps: '5–8' });
  expect(run(h, true)).toMatchObject({ kg: 25, reason: 'subir' });
 });
 it('mantém quando alguma série não chegou ao topo ou faltou série', () => {
  expect(run([sess('20', '8', '8', '7')])).toMatchObject({ kg: 20, reason: 'manter' });
  expect(run([sess('20', '8', '8')])).toMatchObject({ kg: 20, reason: 'manter' });
 });
 it('reduz quando o volume caiu em 2 sessões seguidas', () => {
  const h = [sess('20', '8', '8', '8'), sess('20', '7', '7', '7'), sess('20', '6', '6', '6')];
  expect(run(h)).toMatchObject({ reason: 'reduzir', kg: 20 });
 });
 it('estagnação após 3 sessões sem aumento', () => {
  const h = [sess('20', '6', '6', '6'), sess('20', '6', '6', '6'), sess('20', '6', '6', '6')];
  expect(run(h)).toMatchObject({ reason: 'manter', stagnant: true });
  const prog = [sess('20', '6', '6', '6'), sess('20', '7', '6', '6'), sess('20', '7', '7', '6')];
  expect(run(prog).stagnant).toBe(false);
  expect(run(h.slice(1)).stagnant).toBe(false);
 });
 it('aceita vírgula decimal', () => {
  expect(run([sess('22,5', '8', '8', '8')])).toMatchObject({ kg: 25, reason: 'subir' });
  expect(run([sess('22,5', '6', '6', '6')])).toMatchObject({ kg: 22.5, reason: 'manter' });
 });
 it('entradas inválidas não geram NaN', () => {
  const bad = [[{ kg: 'abc', reps: 'x', done: true }], [{ kg: '', reps: '', done: true }]] as SetEntry[][];
  const r = run(bad);
  expect(r.kg === null || Number.isFinite(r.kg)).toBe(true);
  expect(run(bad).reason).toBe('sem-historico');
  const noReps = suggestNext({ ex: { ...ex, r: ['x'] }, week: 0, history: [sess('20', '8', '8', '8')], lower: false });
  expect(noReps.kg).toBe(20);
  expect(noReps.reason).toBe('manter');
  expect(Number.isNaN(noReps.kg as number)).toBe(false);
 });
});
