import { describe, expect, it } from 'vitest';
import { validateMeasurement } from '../../src/domain/measurements';

const today = '2026-11-12';
const ok = (values: Record<string, string>, date = today) => validateMeasurement({ date, today, values });

describe('validateMeasurement', () => {
 it('aceita vírgula e ponto e devolve o texto aparado', () => {
  expect(ok({ p: ' 78,2 ', c: '86.5' })).toEqual({ ok: true, value: { date: today, values: { p: '78,2', c: '86.5' } } });
 });
 it('aceita os limites exatos', () => {
  expect(ok({ p: '30', c: '10', t: '250', b: '250' }).ok).toBe(true);
  expect(ok({ p: '300' }).ok).toBe(true);
 });
 it('recusa peso fora de 30 a 300 kg', () => {
  for (const v of ['900', '29,9', '300,1', '0']) {
   const r = ok({ p: v });
   expect(r.ok).toBe(false);
   if (!r.ok) expect(r.errors.p).toContain('entre 30 e 300 kg');
  }
 });
 it('recusa cintura, coxa e braço fora de 10 a 250 cm, só no campo errado', () => {
  const r = ok({ p: '80', c: '9', t: '251', b: '34' });
  expect(r.ok).toBe(false);
  if (!r.ok) { expect(Object.keys(r.errors).sort()).toEqual(['c', 't']); expect(r.errors.c).toContain('entre 10 e 250 cm'); }
 });
 it('recusa texto e formatos estranhos', () => {
  for (const v of ['abc', '78,2,1', '-5', '1e3']) expect(ok({ p: v }).ok).toBe(false);
  const r = ok({ p: 'abc' });
  if (!r.ok) expect(r.errors.p).toContain('use só números');
 });
 it('sem nenhuma medida: erro de formulário; campos vazios são ignorados', () => {
  const r = ok({ p: '', c: '  ' });
  expect(r).toEqual({ ok: false, errors: { form: 'Preencha pelo menos uma medida.' } });
  expect(ok({ p: '', c: '86' })).toEqual({ ok: true, value: { date: today, values: { c: '86' } } });
 });
 it('data: hoje e passado valem; futura e inválida não', () => {
  expect(ok({ p: '80' }, '2026-11-01').ok).toBe(true);
  const f = ok({ p: '80' }, '2026-11-13');
  expect(f.ok).toBe(false);
  if (!f.ok) expect(f.errors.date).toContain('futura');
  for (const d of ['', '2026-02-30', '12/11/2026']) { const r = ok({ p: '80' }, d); expect(r.ok).toBe(false); if (!r.ok) expect(r.errors.date).toBeTruthy(); }
 });
 it('junta erros de data e de valor', () => {
  const r = ok({ p: '900' }, '2027-01-01');
  expect(r.ok).toBe(false);
  if (!r.ok) expect(Object.keys(r.errors).sort()).toEqual(['date', 'p']);
 });
});
