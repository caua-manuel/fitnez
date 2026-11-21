import { afterEach, describe, expect, it, vi } from 'vitest';
import { IDBFactory, IDBObjectStore } from 'fake-indexeddb';
import { createRepository } from '../../src/data/index';
import { validateState } from '../../src/data/validation';
import { applyPlanShare, applyPlanShareToState, canUndoPlanShare, undoPlanShare } from '../../src/application/planShare';
import { buildPlanShare, checkPlanShare } from '../../src/domain/planShare';
import type { PlanShareFile } from '../../src/domain/planShare';
import type { Repository, StateV3 } from '../../src/application/repository';

// ADR 011, 1.3: aplicar plano de amigo numa transação, desfazer, registros intactos, conflito. Dados sintéticos.
const NOW = new Date(2026, 10, 20, 12).getTime();
const repos: Repository[] = [];
function setup() { const r = createRepository({ indexedDB: new IDBFactory(), storage: null, storageManager: {}, basePath: '/teste/', now: () => NOW }); repos.push(r); return r; }
afterEach(() => { repos.splice(0).forEach(r => r.close()); vi.restoreAllMocks(); });

function friendFile(): PlanShareFile {
 const f: any = { app: 'fitnez-plano', v: 1, name: 'Plano do amigo', plan: {
  ex: { supino: { n: 'Supino com halteres', s: [4, 4, 4], r: ['6–8', '6–8', '6–8'], m: 'kg', rest: 120 }, remada_a: { n: 'Remada sentada na máquina', s: [3, 3, 3], r: ['10–12', '10–12', '10–12'], m: 'kg' }, crucifixo_x: { n: 'Crucifixo', s: [3, 3, 3], r: ['12', '12', '12'], m: 'kg', g: 'peito' } },
  sess: { A: { name: 'Treino A', ex: ['supino', 'remada_a'] }, B: { name: 'Treino B', ex: ['crucifixo_x', 'supino'] } }, order: ['A', 'B'], rir: Array(12).fill('2') },
  sched: [{ k: 'gym', s: 'A' }, { k: 'rest' }, { k: 'gym', s: 'B' }, { k: 'rest' }, { k: 'gym', s: 'A' }, { k: 'esporte', label: 'Futebol' }, { k: 'rest' }] };
 const c = checkPlanShare(f); if (!c.ok) throw new Error(c.error); return c.value;
}
async function withHistory(r: Repository): Promise<StateV3> {
 const { state } = await r.initialize();
 state.history.days['2026-11-18'] = { log: { supino: [{ kg: '22,5', reps: '8', done: true }], remada_a: [{ kg: '30', reps: '8', done: true }] }, notes: { supino: 'ok' } };
 state.history.measurements['2026-11-18'] = { p: '80,2' };
 state.settings.exerciseNotes = { supino: 'banco na 4' };
 return r.save({ state, expectedRevision: state.revision });
}

describe('aplicar plano compartilhado', () => {
 it('uma única escrita de state; registros, medidas e notas intactos', async () => {
  const r = setup(); const before = await withHistory(r);
  const writes: string[] = []; const put = IDBObjectStore.prototype.put;
  vi.spyOn(IDBObjectStore.prototype, 'put').mockImplementation(function (this: IDBObjectStore, ...a: Parameters<typeof put>) { if (this.name === 'state') writes.push('state'); return put.apply(this, a); });
  const after = await applyPlanShare(r, { file: friendFile(), start: '2026-11-23', today: '2026-11-20', expectedRevision: before.revision });
  expect(writes).toEqual(['state']);
  expect(after.revision).toBe(before.revision + 1);
  expect(after.history).toEqual(before.history);
  expect(after.settings.exerciseNotes).toEqual(before.settings.exerciseNotes);
  expect(after.settings.profile).toEqual(before.settings.profile);
  expect(after.catalog.plan.order).toEqual(['A', 'B']);
  // mesmo exercício (supino): prescrição do arquivo, observação minha preservada; histórico continua no mesmo id
  expect(after.catalog.plan.ex.supino.s).toEqual([4, 4, 4]);
  expect(after.catalog.plan.ex.supino.t).toBe(before.catalog.plan.ex.supino.t);
  // remada_a com outro nome: entra como remada_a-2; a minha remada_a fica no catálogo
  expect(after.catalog.plan.sess.A.ex).toEqual(['supino', 'remada_a-2']);
  expect(after.catalog.plan.ex.remada_a).toEqual(before.catalog.plan.ex.remada_a);
  expect(after.catalog.plan.ex['remada_a-2'].n).toBe('Remada sentada na máquina');
  expect(after.catalog.plan.alt).toBeUndefined();
  expect(after.catalog.plan.rir).toEqual(Array(12).fill('2'));
  expect(after.settings.start).toBe('2026-11-23');
  expect(after.settings.planImport).toMatchObject({ v: 1, appliedOn: '2026-11-20', name: 'Plano do amigo' });
  expect(canUndoPlanShare(after)).toBe(true);
  // sem marcar a rotina: a minha continua, só os dias que apontariam para treino sumido assumem os novos
  expect(after.settings.sched.map(d => d.k)).toEqual(before.settings.sched.map(d => d.k));
  expect(after.settings.sched.filter(d => d.k === 'gym').map(d => d.s)).toEqual(['A', 'B', 'A']);
  validateState(after);
 });
 it('com a rotina marcada, a rotina do arquivo entra', async () => {
  const r = setup(); const before = await withHistory(r);
  const after = await applyPlanShare(r, { file: friendFile(), start: '2026-11-23', today: '2026-11-20', includeSched: true, expectedRevision: before.revision });
  expect(after.settings.sched).toEqual(friendFile().sched);
 });
 it('desfazer devolve plano e rotina idênticos e mantém os registros', async () => {
  const r = setup(); const before = await withHistory(r);
  const applied = await applyPlanShare(r, { file: friendFile(), start: '2026-11-23', today: '2026-11-20', includeSched: true, expectedRevision: before.revision });
  const undone = await undoPlanShare(r, { expectedRevision: applied.revision, now: NOW + 1 });
  expect(undone.catalog.plan).toEqual(before.catalog.plan);
  expect(undone.settings.sched).toEqual(before.settings.sched);
  expect(undone.settings.start).toBe(before.settings.start);
  expect(undone.settings.planImport).toBeUndefined();
  expect(undone.history).toEqual(before.history);
  expect(canUndoPlanShare(undone)).toBe(false);
  await expect(undoPlanShare(r, { expectedRevision: undone.revision })).rejects.toMatchObject({ code: 'validation' });
 });
 it('conflito de revisão não grava', async () => {
  const r = setup(); const before = await withHistory(r);
  await expect(applyPlanShare(r, { file: friendFile(), start: '2026-11-23', today: '2026-11-20', expectedRevision: before.revision - 1 })).rejects.toMatchObject({ code: 'conflict' });
  // outra aba grava entre a leitura e a gravação
  const other = applyPlanShareToState(before, friendFile(), { start: '2026-11-23', today: '2026-11-20', now: NOW });
  const s = await r.read(); s.settings.theme = 'dark'; await r.save({ state: s, expectedRevision: s.revision });
  await expect(r.save({ state: other, expectedRevision: before.revision })).rejects.toMatchObject({ code: 'conflict' });
  expect((await r.read()).catalog.plan).toEqual(before.catalog.plan);
 });
 it('arquivo adulterado depois da revisão é recusado na aplicação', async () => {
  const r = setup(); const before = await withHistory(r);
  const bad: any = friendFile(); bad.plan.ex.supino.historico = [1];
  await expect(applyPlanShare(r, { file: bad, start: '2026-11-23', today: '2026-11-20', expectedRevision: before.revision })).rejects.toMatchObject({ code: 'validation' });
  expect(await r.read()).toEqual(before);
 });
 it('ida e volta entre dois aparelhos: exportar de um e aplicar no outro dá o mesmo plano', async () => {
  const a = setup(); const sa = await withHistory(a);
  sa.catalog.plan.sess.UA.name = 'Superior A'; const saved = await a.save({ state: sa, expectedRevision: sa.revision });
  const built = buildPlanShare(saved, { name: 'Meu', includeNotes: true }); if (!built.ok) throw new Error(built.error);
  const b = setup(); const { state } = await b.initialize();
  const applied = await applyPlanShare(b, { file: built.file, start: '2026-11-23', today: '2026-11-20', includeSched: true, expectedRevision: state.revision });
  expect(applied.catalog.plan.order).toEqual(saved.catalog.plan.order.map(k => (k === 'UA' ? 'UA-2' : k)));
  expect(applied.catalog.plan.sess['UA-2'].name).toBe('Superior A');
  for (const k of applied.catalog.plan.sess['UA-2'].ex) expect(applied.catalog.plan.ex[k]).toEqual(saved.catalog.plan.ex[k]);
 });
});
