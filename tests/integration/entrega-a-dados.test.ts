import { afterEach, describe, expect, it } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import { createRepository } from '../../src/data/index';
import type { Repository, StateV3 } from '../../src/application/repository';
import { muscleGroupOf } from '../../src/domain/muscleGroups';
import seedPlan from '../../data/plan.json';

const repos: Repository[] = [];
function setup() { const r = createRepository({ indexedDB: new IDBFactory(), storage: { getItem: () => null }, storageManager: {}, basePath: '/teste/' }); repos.push(r); return r; }
afterEach(() => { repos.splice(0).forEach(r => r.close()); });

function enrich(state: StateV3): StateV3 {
 state.catalog.plan.ex.supino.g = 'peito';
 state.settings.profile = { name: 'Teste', goal: 'Hipertrofia' };
 state.settings.notifications = { enabled: true, restEnd: false };
 state.history.days['2026-11-17'] = {
  acts: { gym: true, bjj: false },
  workout: { sessionId: 'UA', startedAt: 1800000000000, finishedAt: 1800003600000, status: 'done', sets: 2, volume: 1545 },
  log: { supino: [{ kg: '70,5', reps: '10', done: true }] },
 };
 state.history.days['2026-11-18'] = { workout: { sessionId: 'UB', startedAt: 1800086400000, status: 'partial', sets: 0, volume: 0 } };
 return state;
}

describe('Entrega A: campos opcionais no v3', () => {
 it('salvar e reler preserva acts, workout, profile, notifications e ex.g', async () => {
  const r = setup(); const { state } = await r.initialize();
  const saved = await r.save({ state: enrich(structuredClone(state)), expectedRevision: state.revision });
  const read = await r.read();
  expect(read.history.days).toEqual(saved.history.days);
  expect(read.history.days['2026-11-17'].workout?.volume).toBe(1545);
  expect(read.history.days['2026-11-17'].acts).toEqual({ gym: true, bjj: false });
  expect(read.history.days['2026-11-18'].workout?.finishedAt).toBeUndefined();
  expect(read.settings.profile).toEqual({ name: 'Teste', goal: 'Hipertrofia' });
  expect(read.settings.notifications).toEqual({ enabled: true, restEnd: false });
  expect(read.catalog.plan.ex.supino.g).toBe('peito');
 });
 it('backup exportado e reimportado preserva os mesmos campos', async () => {
  const a = setup(); const { state } = await a.initialize();
  await a.save({ state: enrich(structuredClone(state)), expectedRevision: state.revision });
  const backup = await a.export();
  const b = setup(); await b.initialize();
  const preview = await b.prepareImport(backup.text);
  const restored = await b.confirmImport({ token: preview.token, expectedRevision: preview.expectedRevision });
  const original = await a.read();
  expect(restored.history.days).toEqual(original.history.days);
  expect(restored.settings.profile).toEqual(original.settings.profile);
  expect(restored.settings.notifications).toEqual(original.settings.notifications);
  expect(restored.catalog.plan.ex.supino.g).toBe('peito');
 });
 it('só 6 ids sem grupo e as somas por grupo em UA, UB e LW batem a tabela-alvo', () => {
  const plan = (seedPlan as any).plan; const ex = plan.ex as Record<string, any>;
  expect(Object.keys(ex)).toHaveLength(57); // 38 do plano de exemplo + 17 do assistente de início (ADR 008) + 2 do ADR 012
  const missing = Object.entries(ex).filter(([id, e]) => muscleGroupOf(id, e) === null).map(([id]) => id).sort();
  expect(missing).toEqual(['copen_b', 'copen_l', 'farmer', 'pescoco', 'salto_b', 'salto_l']);
  const sum: Record<string, number[]> = {};
  for (const sid of ['UA', 'UB', 'LW']) for (const id of plan.sess[sid].ex as string[]) {
   const g = muscleGroupOf(id, ex[id]); if (!g) continue;
   sum[g] ??= [0, 0, 0]; (ex[id].s as number[]).forEach((n, b) => { sum[g][b] += n; });
  }
  expect(sum.core).toEqual([9, 10, 9]);
  expect(sum.quadriceps).toEqual([7, 8, 7]);
 });
 it('estado inicial: g das sementes (ADR 008) é o mesmo grupo do mapa', async () => {
  const r = setup(); const { state } = await r.initialize();
  expect(state.catalog.plan.ex.supino.g).toBe('peito'); // antes do ADR 008 a semente não tinha g
  expect(muscleGroupOf('supino', state.catalog.plan.ex.supino)).toBe('peito');
 });
});
