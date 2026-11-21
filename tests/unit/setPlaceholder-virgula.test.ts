import { describe, expect, it } from 'vitest';
import type { Exercise } from '../../src/application/repository';
import { confirmSet, placeholderFor } from '../../src/domain/setPlaceholder';
import type { Suggestion } from '../../src/domain/progression';
import { parseNumber, sessionVolume } from '../../src/domain/workout';

// Carga aceita pela caixa (placeholder) grava no formato pt-BR, igual ao digitado.
const EX: Exercise = { n: 'Supino', m: 'kg', s: [3, 3, 3], r: ['8–12', '8–12', '8–12'] };
const sug = (kg: number | null): Suggestion => ({ kg, reps: '8–12', reason: 'manter', stagnant: false });
const ph = (kg: number | null, today: { kg: string; reps: string; done: boolean }[] = []) =>
 placeholderFor({ ex: EX, week: 1, suggestion: sug(kg), previous: [{ kg: '30', reps: '10', done: true }], today, index: today.length });

describe('placeholder com vírgula', () => {
 it('sugestão 30,5 aceita grava "30,5"', () => {
  const p = ph(30.5);
  expect(p.kg).toBe('30,5');
  const r = confirmSet({}, p, EX);
  expect(r).toEqual({ ok: true, set: { kg: '30,5', reps: '10', done: true } });
  if (r.ok) { expect(parseNumber(r.set.kg)).toBe(30.5); expect(sessionVolume([[r.set]])).toBe(305); }
 });
 it('inteiro grava "30"', () => {
  const p = ph(30);
  expect(p.kg).toBe('30');
  expect(confirmSet({}, p, EX)).toEqual({ ok: true, set: { kg: '30', reps: '10', done: true } });
 });
 it('carga mudada hoje (digitada com ponto ou vírgula) segue com vírgula; igual à planejada não vira "mudada"', () => {
  expect(ph(30, [{ kg: '32.5', reps: '10', done: true }]).kg).toBe('32,5');
  expect(ph(30, [{ kg: '32,5', reps: '10', done: true }]).kg).toBe('32,5');
  expect(ph(30.5, [{ kg: '30.5', reps: '10', done: true }]).kg).toBe('30,5');
  expect(ph(30.5, [{ kg: '30,5', reps: '10', done: true }]).kg).toBe('30,5');
 });
 it('digitado vale o digitado', () => {
  expect(confirmSet({ kg: '31,25' }, ph(30.5), EX)).toMatchObject({ ok: true, set: { kg: '31,25' } });
 });
});
