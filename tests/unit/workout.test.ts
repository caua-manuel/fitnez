import { describe, expect, it } from 'vitest';
import type { DayRecord, Exercise } from '../../src/application/repository';
import { countDoneSets, lastPerformance, parseNumber, sessionVolume, setsForWeek } from '../../src/domain/workout';

const supino: Exercise = { n: 'Supino com halteres', s: [4, 5, 5], r: ['5–8', '4–6', '3–5'], m: 'kg', rest: 150 };
describe('setsForWeek', () => {
 it('semanas normais e deload', () => {
  expect(setsForWeek(supino, 0)).toEqual({ sets: 4, reps: '5–8' });
  expect(setsForWeek(supino, 4)).toEqual({ sets: 5, reps: '4–6' });
  expect(setsForWeek(supino, 3)).toEqual({ sets: 2, reps: '5–8' });
  expect(setsForWeek(supino, 7)).toEqual({ sets: 3, reps: '5–8' });
  expect(setsForWeek(supino, 11)).toEqual({ sets: 3, reps: '4–6' });
  expect(setsForWeek({ ...supino, s: [1, 1, 1] }, 3).sets).toBe(1);
 });
});
describe('parseNumber', () => {
 it('aceita vírgula e recusa inválidos', () => {
  expect(parseNumber('22,5')).toBe(22.5); expect(parseNumber('')).toBeNull(); expect(parseNumber('abc')).toBeNull(); expect(parseNumber('-3')).toBeNull();
  expect(parseNumber('0')).toBe(0); expect(parseNumber(undefined)).toBeNull(); expect(parseNumber(7)).toBe(7); expect(parseNumber(NaN)).toBeNull(); expect(parseNumber(' 70 ')).toBe(70); expect(parseNumber('Infinity')).toBeNull();
 });
});
describe('volume e contagem', () => {
 const sets = [[{ kg: '70', reps: '12', done: true }, { kg: '70,5', reps: '10', done: true }, { kg: '75', reps: '', done: true }, { kg: '75', reps: '8', done: false }, { kg: 'abc', reps: '8', done: true }]];
 it('soma só séries concluídas e válidas', () => { expect(sessionVolume(sets)).toBe(1545); expect(Number.isNaN(sessionVolume(sets))).toBe(false); });
 it('conta séries concluídas', () => { expect(countDoneSets(sets)).toBe(4); expect(countDoneSets([])).toBe(0); });
});
describe('lastPerformance', () => {
 const done = [{ kg: '70', reps: '8', done: true }];
 const days: Record<string, DayRecord> = {
  '2026-11-10': { log: { supino: [{ kg: '60', reps: '8', done: true }] } },
  '2026-11-12': { log: { supino: [{ kg: '65', reps: '8', done: false }] } },
  '2026-11-14': { log: { supino: done } },
  '2026-11-17': { log: { supino: [{ kg: '99', reps: '1', done: true }] } },
  '2026-11-20': { log: { supino: [{ kg: '80', reps: '1', done: true }] } },
 };
 it('ignora o próprio dia, futuros e dias sem série concluída', () => {
  expect(lastPerformance(days, 'supino', '2026-11-17')).toEqual({ day: '2026-11-14', sets: done });
  expect(lastPerformance(days, 'supino', '2026-11-13')).toEqual({ day: '2026-11-10', sets: [{ kg: '60', reps: '8', done: true }] });
  expect(lastPerformance(days, 'supino', '2026-11-10')).toBeNull();
  expect(lastPerformance(days, 'outro', '2026-12-01')).toBeNull();
 });
});
