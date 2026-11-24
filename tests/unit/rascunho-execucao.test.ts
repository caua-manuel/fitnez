import { describe, expect, it } from 'vitest';
import { applyDraft, draftKey, parseDraft, pickDraft } from '../../src/features/treino/rascunho';

describe('rascunho da execução', () => {
 const rows = { sup: [{ kg: '40', reps: '10', done: true }, { kg: '42,5', reps: '', done: false }, { kg: '', reps: '', done: false }] };
 it('guarda só linhas não concluídas com algo digitado', () => {
  expect(pickDraft(rows)).toEqual({ sup: { '1': { kg: '42,5', reps: '' } } });
 });
 it('restaura sem marcar série como feita e sem mexer em linha concluída', () => {
  const fresh = { sup: [{ kg: '40', reps: '10', done: true }, { kg: '', reps: '', done: false }, { kg: '', reps: '', done: false }] };
  const d = parseDraft(JSON.stringify({ sup: { '0': { kg: '99', reps: '9' }, '1': { kg: '42,5', reps: '8' } } }));
  const out = applyDraft(fresh, d);
  expect(out.sup[0]).toEqual({ kg: '40', reps: '10', done: true });
  expect(out.sup[1]).toEqual({ kg: '42,5', reps: '8', done: false });
  expect(out.sup.every((s, i) => s.done === fresh.sup[i]!.done)).toBe(true);
 });
 it('ignora texto inválido', () => {
  expect(parseDraft('{x')).toEqual({});
  expect(parseDraft(JSON.stringify({ sup: { '1': { kg: '<b>', reps: '8' }, a: { kg: '1', reps: '1' } } }))).toEqual({});
 });
 it('a chave separa base, dia, sessão e modo', () => {
  const real = (n: string) => `treino12:${n}`, demo = (n: string) => `treino12:demo:${n}`;
  expect(draftKey('/fitnez/', '2026-11-23', 'A', real)).toBe('treino12:rascunho:/fitnez/:2026-11-23:A');
  expect(draftKey('/fitnez/', '2026-11-23', 'A', demo)).not.toBe(draftKey('/fitnez/', '2026-11-23', 'A', real));
 });
});
