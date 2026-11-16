import { describe, expect, it } from 'vitest';
import type { Exercise, Plan } from '../../src/application/repository';
import { addExerciseToSession, createSession, deleteSession, duplicateSession, moveExercise, removeExerciseFromSession, upsertExercise } from '../../src/domain/planEdit';
import { isLower, muscleGroupOf } from '../../src/domain/muscleGroups';

const plan = (): Plan => ({
 ex: { a: { n: 'A', s: [3, 3, 3], r: ['8', '8', '8'], m: 'kg' }, b: { n: 'B', s: [3, 3, 3], r: ['8', '8', '8'], m: 'kg' }, c: { n: 'C', s: [3, 3, 3], r: ['8', '8', '8'], m: 'kg' } },
 sess: { UA: { name: 'Upper A', sub: 's', min: '60 min', ex: ['a', 'b', 'c'] } },
 order: ['UA'],
});
const frozen = (p: Plan) => JSON.stringify(p);

describe('planEdit', () => {
 it('createSession cria treino vazio com id novo e não muta o original', () => {
  const p = plan(); const before = frozen(p);
  const r = createSession(p, { name: 'Treino de teste', min: '45 min' });
  expect(frozen(p)).toBe(before);
  expect(r.plan.sess[r.id]).toEqual({ name: 'Treino de teste', min: '45 min', ex: [] });
  expect(r.plan.order).toEqual(['UA', r.id]);
  expect(createSession(r.plan, { name: 'Treino de teste' }).id).not.toBe(r.id);
 });
 it('deleteSession mantém plan.ex intacto e remove de sess e order', () => {
  const p = plan(); const r = deleteSession(p, 'UA');
  expect(r.sess.UA).toBeUndefined(); expect(r.order).toEqual([]); expect(r.ex).toEqual(p.ex);
 });
 it('removeExerciseFromSession não apaga o exercício do catálogo', () => {
  const r = removeExerciseFromSession(plan(), 'UA', 'b');
  expect(r.sess.UA.ex).toEqual(['a', 'c']); expect(r.ex.b).toBeDefined();
 });
 it('duplicateSession gera id novo, nome com (cópia) e exercícios compartilhados', () => {
  const r = duplicateSession(plan(), 'UA');
  expect(r.id).not.toBe('UA'); expect(r.plan.sess[r.id].name).toBe('Upper A (cópia)'); expect(r.plan.sess[r.id].ex).toEqual(['a', 'b', 'c']);
  expect(Object.keys(r.plan.ex)).toEqual(['a', 'b', 'c']); expect(r.plan.order).toEqual(['UA', r.id]);
  r.plan.sess[r.id].ex.pop(); expect(r.plan.sess.UA.ex).toHaveLength(3);
 });
 it('upsertExercise cria e edita com rest e g; rejeita rest negativo', () => {
  const ex: Exercise = { n: 'Novo exercício', s: [3, 3, 3], r: ['8', '8', '8'], m: 'kg', rest: 90, g: 'peito' };
  const created = upsertExercise(plan(), null, ex);
  expect(created.plan.ex[created.id]).toEqual(ex);
  const edited = upsertExercise(created.plan, created.id, { ...ex, rest: 120 });
  expect(edited.id).toBe(created.id); expect(edited.plan.ex[created.id].rest).toBe(120);
  expect(() => upsertExercise(plan(), null, { ...ex, rest: -1 })).toThrow();
  expect(() => upsertExercise(plan(), 'a', { ...ex, rest: Number.NaN })).toThrow();
 });
 it('addExerciseToSession acrescenta uma vez só', () => {
  const p = createSession(plan(), { name: 'X' });
  const r = addExerciseToSession(addExerciseToSession(p.plan, p.id, 'a'), p.id, 'a');
  expect(r.sess[p.id].ex).toEqual(['a']);
  expect(() => addExerciseToSession(p.plan, p.id, 'inexistente')).toThrow();
 });
 it('moveExercise reordena e ignora índices inválidos', () => {
  expect(moveExercise(plan(), 'UA', 0, 2).sess.UA.ex).toEqual(['b', 'c', 'a']);
  expect(moveExercise(plan(), 'UA', 2, 0).sess.UA.ex).toEqual(['c', 'a', 'b']);
  expect(moveExercise(plan(), 'UA', 0, 9).sess.UA.ex).toEqual(['a', 'b', 'c']);
 });
});
describe('muscleGroups', () => {
 const ex = { n: 'x', s: [1, 1, 1], r: ['1', '1', '1'], m: 'kg' } as Exercise;
 it('g explícito vence o mapa; desconhecido é null', () => {
  expect(muscleGroupOf('supino', ex)).toBe('peito'); expect(muscleGroupOf('supino', { ...ex, g: 'costas' })).toBe('costas');
  expect(muscleGroupOf('custom_1', ex)).toBeNull(); expect(muscleGroupOf('custom_1', { ...ex, g: 'invalido' })).toBeNull();
 });
 it('isLower', () => { expect(isLower('quadriceps')).toBe(true); expect(isLower('posterior-gluteos')).toBe(true); expect(isLower('panturrilha')).toBe(true); expect(isLower('peito')).toBe(false); expect(isLower('core')).toBe(false); expect(isLower(null)).toBe(false); });
});

import { createSessionWithExercise, restoreSeedPlan, sessionsUsing, updateSession } from '../../src/domain/planEdit';
import { RECORD_TYPES, emptyDraft, draftFrom, restLabel, stepText, validateDraft, validateSessionFields } from '../../src/domain/exerciseDraft';

describe('planEdit: criação com exercício, edição e restauração', () => {
 it('createSessionWithExercise cria treino com um exercício novo que mantém o descanso', () => {
  const p = plan(); const before = frozen(p);
  const r = createSessionWithExercise(p, { name: 'Treino de teste' }, { n: 'Remada', s: [3, 3, 3], r: ['8', '8', '8'], m: 'kg', rest: 90 });
  expect(frozen(p)).toBe(before);
  expect(r.plan.sess[r.id].ex).toEqual([r.exId]);
  expect(r.plan.ex[r.exId].rest).toBe(90);
 });
 it('updateSession troca nome e remove descrição e duração vazias', () => {
  const r = updateSession(plan(), 'UA', { name: 'Novo nome' });
  expect(r.sess.UA).toEqual({ name: 'Novo nome', ex: ['a', 'b', 'c'] });
  expect(updateSession(plan(), 'UA', { name: 'x', sub: 'd', min: '55' }).sess.UA).toMatchObject({ sub: 'd', min: '55' });
  expect(() => updateSession(plan(), 'nao', { name: 'x' })).toThrow();
 });
 it('restoreSeedPlan devolve treinos e exercícios originais e preserva exercícios criados', () => {
  const seed = plan();
  const edited = upsertExercise(deleteSession(plan(), 'UA'), 'a', { n: 'A mudado', s: [1, 1, 1], r: ['1', '1', '1'], m: 'kg', rest: 10 }).plan;
  const custom = upsertExercise(edited, null, { n: 'Meu', s: [3, 3, 3], r: ['8', '8', '8'], m: 'kg' });
  const r = restoreSeedPlan(custom.plan, seed);
  expect(r.sess).toEqual(seed.sess); expect(r.order).toEqual(['UA']);
  expect(r.ex.a).toEqual(seed.ex.a); expect(r.ex[custom.id].n).toBe('Meu');
 });
 it('sessionsUsing lista treinos que usam o exercício', () => {
  expect(sessionsUsing(plan(), 'a')).toEqual(['UA']); expect(sessionsUsing(plan(), 'zzz')).toEqual([]);
 });
});

describe('exerciseDraft', () => {
 const ok = () => ({ ...emptyDraft(), n: 'Remada' });
 it('padrão ao criar: descanso 90 s, 3 blocos', () => {
  const r = validateDraft(ok());
  expect(r.errors).toEqual({}); expect(r.value).toMatchObject({ n: 'Remada', s: [3, 3, 3], rest: 90, m: 'kg' });
 });
 it('preserva campos extras do exercício e remove observação vazia', () => {
  const base = { n: 'A', s: [3, 3, 3], r: ['8', '8', '8'], m: 'kg', t: 'x', extra: 1 };
  const d = { ...draftFrom('a', base), t: '  ' };
  const v = validateDraft(d, base).value!;
  expect(v.extra).toBe(1); expect(v.t).toBeUndefined();
 });
 it('normaliza faixa com hífen para travessão e aceita descanso 0', () => {
  const d = { ...ok(), reps: ['5-8', '4 - 6', '3'], rest: '0' };
  const v = validateDraft(d).value!;
  expect(v.r).toEqual(['5–8', '4–6', '3']); expect(v.rest).toBe(0);
 });
 it('erros em português e sem valor', () => {
  const r = validateDraft({ ...ok(), n: ' ', sets: ['0', 'x', '3'], reps: ['', '8', '8'], rest: '1,5' });
  expect(Object.keys(r.errors).sort()).toEqual(['n', 'reps0', 'rest', 'sets0', 'sets1']);
  expect(r.value).toBeUndefined();
  expect(validateDraft({ ...ok(), rest: '99999' }).errors.rest).toMatch(/30 min.*1\.800 s/);
  expect(validateDraft({ ...ok(), rest: '' }).errors.rest).toMatch(/Informe/);
 });
 it('draftFrom usa o descanso existente e o grupo da semente', () => {
  const d = draftFrom('supino', { n: 'Supino', s: [4, 5, 5], r: ['5–8', '4–6', '3–5'], m: 'kg', rest: 150 });
  expect(d.rest).toBe('150'); expect(d.g).toBe('peito'); expect(d.sets).toEqual(['4', '5', '5']);
  expect(draftFrom('supino', { n: 'S', s: [3], r: ['8'], m: 'kg', g: '' }).g).toBe('');
  expect(draftFrom('x', { n: 'S', s: [3], r: ['8'], m: 'kg' }).rest).toBe('90');
 });
 it('stepText respeita limites e texto inválido; restLabel; 5 tipos', () => {
  expect(stepText('90', 15, 0, 1800)).toBe('105'); expect(stepText('0', -15, 0, 1800)).toBe('0'); expect(stepText('abc', 15, 0, 1800)).toBe('15');
  expect(restLabel(90)).toBe('1 min 30 s'); expect(restLabel(45)).toBe('45 s'); expect(restLabel(120)).toBe('2 min');
  expect(RECORD_TYPES.map(t => t.id)).toEqual(['kg', 'bw', 'rep', 's', 'kgs']);
 });
 it('validateSessionFields', () => {
  expect(validateSessionFields({ name: ' Peito ', sub: '', min: '70 - 80' }).value).toEqual({ name: 'Peito', min: '70 a 80' });
  expect(validateSessionFields({ name: '', sub: '', min: 'muito' }).errors).toMatchObject({ name: expect.any(String), min: expect.any(String) });
 });
});

describe('muscleGroupOf: sem grupo explícito', () => {
 it('g vazio não cai no mapa das sementes', () => {
  expect(muscleGroupOf('supino', { n: 'S', s: [3], r: ['8'], m: 'kg', g: '' })).toBeNull();
  expect(muscleGroupOf('supino', { n: 'S', s: [3], r: ['8'], m: 'kg' })).toBe('peito');
 });
});
