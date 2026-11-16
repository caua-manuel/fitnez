import { describe, expect, it } from 'vitest';
import type { DayRecord, Plan } from '../../src/application/repository';
import { addDays } from '../../src/domain/calendar';
import { thirdClassEligibility } from '../../src/domain/jiujitsu';

const start = '2026-01-05'; // segunda
const plan: Plan = { ex: {}, order: [], sess: { UA: { name: 'Upper A', ex: ['sup'] }, LW: { name: 'Lower', ex: ['agach'] }, UB: { name: 'Upper B', ex: ['rem'] } } };
const dayOf = (w: number, i: number) => addDays(start, w * 7 + i);
type Opts = { bjj?: number; feel?: number; kgUA?: number; kgLW?: number };
function build(weeks: number[], o: (w: number) => Opts = () => ({})) {
 const days: Record<string, DayRecord> = {};
 for (const w of weeks) {
  const x = o(w);
  const n = x.bjj ?? 2;
  for (let i = 0; i < n; i++) days[dayOf(w, 1 + i * 2)] = { acts: { bjj: true }, feel: x.feel ?? 3 };
  const kua = x.kgUA ?? 40, klw = x.kgLW ?? 60;
  days[dayOf(w, 0)] = { workout: { sessionId: 'UA', startedAt: 1, status: 'done', sets: 1, volume: 1 }, log: { sup: [{ kg: String(kua), reps: '8', done: true }] } };
  days[dayOf(w, 4)] = { workout: { sessionId: 'LW', startedAt: 1, status: 'done', sets: 1, volume: 1 }, log: { agach: [{ kg: String(klw), reps: '8', done: true }] } };
 }
 return days;
}
const sleep = { 4: true, 5: true, 6: true };
const run = (today: string, days: Record<string, DayRecord>, sleepOkByWeek?: Record<number, boolean>) => thirdClassEligibility({ start, today, days, sleepOkByWeek, plan });
const key = (r: ReturnType<typeof run>, k: string) => r.criteria.find(c => c.key === k)!;

describe('thirdClassEligibility', () => {
 it('antes da semana 6 fica indisponível', () => {
  const r = run(dayOf(4, 2), build([1, 2, 3]), sleep);
  expect(r.status).toBe('indisponivel');
  expect(key(r, 'semana').ok).toBe(false);
 });
 it('elegível com tudo em ordem', () => {
  const r = run(dayOf(5, 2), build([2, 3, 4], w => ({ kgUA: 40 + w, kgLW: 60 + w })), { 2: true, 3: true, 4: true });
  expect(r.status).toBe('elegivel');
  expect(r.criteria.every(c => c.ok === true)).toBe(true);
  expect(r.summary).toMatch(/Você pode considerar uma 3ª aula/);
 });
 it('nota 5 em uma semana reprova aulas', () => {
  const r = run(dayOf(5, 2), build([2, 3, 4], w => ({ feel: w === 3 ? 5 : 3 })), { 2: true, 3: true, 4: true });
  expect(key(r, 'aulas').ok).toBe(false);
  expect(r.status).toBe('ainda-nao');
  expect(r.summary).toMatch(/^Ainda não: faltam? /);
  expect(r.summary).toMatch(r.summary.includes(',') ? /^Ainda não: faltam / : /^Ainda não: falta /);
 });
 it('semana com só 1 aula reprova', () => {
  const r = run(dayOf(5, 2), build([2, 3, 4], w => ({ bjj: w === 2 ? 1 : 2 })), { 2: true, 3: true, 4: true });
  expect(key(r, 'aulas').ok).toBe(false);
 });
 it('sem dados de sono: null e ainda-nao', () => {
  const r = run(dayOf(5, 2), build([2, 3, 4]));
  expect(key(r, 'sono').ok).toBeNull();
  expect(r.status).toBe('ainda-nao');
 });
 it('cargas caindo reprova', () => {
  const r = run(dayOf(5, 2), build([2, 3, 4], w => ({ kgUA: 60 - w * 5 })), { 2: true, 3: true, 4: true });
  expect(key(r, 'cargas').ok).toBe(false);
  expect(r.status).toBe('ainda-nao');
 });
 it('entradas vazias sem NaN nem exceção', () => {
  const r = run(dayOf(6, 0), {});
  expect(r.status).toBe('ainda-nao');
  expect(key(r, 'cargas').ok).toBeNull();
  expect(JSON.stringify(r)).not.toMatch(/NaN/);
  expect(() => thirdClassEligibility({ start: '', today: '', days: {} })).not.toThrow();
  expect(thirdClassEligibility({ start, today: dayOf(6, 0), days: undefined as any }).status).toBe('ainda-nao');
 });
});
