import { afterEach, describe, expect, it } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import { createRepository } from '../../src/data/index';
import type { Repository } from '../../src/application/repository';

// Campos novos das ondas Hevy no backup e no estado: aquecimento, trocas do dia, notas por exercício e anilhas.
// Fixtures sintéticos: nada aqui é dado real.
const NOW = 1_800_000_000_000;
const repos: Repository[] = [];
function setup() { const r = createRepository({ indexedDB: new IDBFactory(), storage: { getItem: () => null }, storageManager: {}, basePath: '/teste/', now: () => NOW }); repos.push(r); return r; }
afterEach(() => { repos.splice(0).forEach(r => r.close()); });
const backup = (state: unknown) => JSON.stringify({ app: 'treino12', v: 3, exportedAt: NOW, state });

describe('ondas Hevy: validação de importação e gravação', () => {
 it('aceita aquecimento, troca do dia, notas e anilhas, e grava ida e volta', async () => {
  const r = setup(); const { state } = await r.initialize();
  const next = structuredClone(state) as any;
  next.history.days['2026-11-17'] = { log: { flexao: [{ kg: '20', reps: '8', done: true, kind: 'warm' }, { kg: '', reps: '10', done: true }] }, swaps: { supino: 'flexao' } };
  next.settings.exerciseNotes = { supino: 'Banco na posição 4' };
  next.settings.plates = { bar: 15, available: [20, 10, 5, 2.5] };
  await expect(r.prepareImport(backup(next))).resolves.toBeDefined();
  const saved = await r.save({ state: next, expectedRevision: state.revision });
  expect(saved.history.days['2026-11-17']).toEqual(next.history.days['2026-11-17']);
  expect((await r.read()).settings.exerciseNotes).toEqual({ supino: 'Banco na posição 4' });
 });
 it.each([
  ['tipo de série desconhecido', (s: any) => { s.history.days['2026-11-17'] = { log: { supino: [{ kg: '1', reps: '1', done: true, kind: 'drop' }] } }; }, 'Tipo de série'],
  ['nota com 141 caracteres', (s: any) => { s.settings.exerciseNotes = { supino: 'a'.repeat(141) }; }, 'Notas dos exercícios'],
  ['nota não texto', (s: any) => { s.settings.exerciseNotes = { supino: 1 }; }, 'Notas dos exercícios'],
  ['barra inexistente', (s: any) => { s.settings.plates = { bar: 7, available: [] }; }, 'Anilhas'],
  ['troca não texto', (s: any) => { s.history.days['2026-11-17'] = { swaps: { supino: 3 } }; }, 'Troca'],
 ])('recusa %s e não altera o estado', async (_n, mutate, msg) => {
  const r = setup(); const { state } = await r.initialize();
  const bad = structuredClone(state) as any; mutate(bad);
  await expect(r.prepareImport(backup(bad))).rejects.toMatchObject({ code: 'validation', message: expect.stringContaining(msg) });
  expect(await r.read()).toEqual(state);
 });
 it('backups antigos sem os campos novos continuam importando (v3, v2 e v1)', async () => {
  const r = setup(); const { state } = await r.initialize();
  await expect(r.prepareImport(backup(state))).resolves.toBeDefined();
  for (const v of [1, 2]) await expect(r.prepareImport(JSON.stringify({ v, start: '2026-01-05', log: { '2026-03-02': { supino: [{ kg: '40', reps: '8', done: true }] } } }))).resolves.toMatchObject({ sourceVersion: v });
 });
});
