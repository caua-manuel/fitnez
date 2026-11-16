import { afterEach, describe, expect, it, vi } from 'vitest';
import { IDBFactory, IDBObjectStore } from 'fake-indexeddb';
import { createRepository } from '../../src/data/index';
import { eraseAllData } from '../../src/application/eraseAll';
import type { Repository } from '../../src/application/repository';

// Fixtures sintéticos, sem dados reais.
const BASE = '/teste/';
function memory(initial: Record<string, string>) {
 const m = new Map(Object.entries(initial));
 return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), removeItem: (k: string) => void m.delete(k), key: (i: number) => [...m.keys()][i] ?? null, get length() { return m.size; }, keys: () => [...m.keys()] };
}
const legacyV2 = JSON.stringify({ v: 2, start: '2026-01-05', log: { '2026-11-17': { orfao: [{ kg: '22,5', reps: '8', done: true }] } }, meas: { '2026-11-18': { p: '70,5' } } });
const repos: Repository[] = [];
afterEach(() => { repos.splice(0).forEach(r => r.close()); vi.restoreAllMocks(); });

async function populated() {
 const factory = new IDBFactory();
 const local = memory({ 'treino12-v2': legacyV2, 'treino-theme': 'dark', 'treino12:descanso': '{"id":"x"}', 'outro-app': 'fica' });
 const session = memory({ 'treino12:cursor:2026-11-17:a': '2', 'treino12:treino-novo': 'id1', 'outra-chave': 'fica' });
 const repo = createRepository({ indexedDB: factory, storage: local, storageManager: {}, basePath: BASE }); repos.push(repo);
 const { state } = await repo.initialize();
 state.settings.profile = { name: 'Ana', goal: 'forca', weightKg: 70 };
 state.settings.theme = 'dark';
 state.history.days['2026-11-20'] = { done: true, notes: { a: 'x' } };
 state.history.measurements['2026-11-20'] = { p: '71' };
 state.catalog.plan.sess.UA.name = 'Editado'; state.catalog.revision = 3;
 const saved = await repo.save({ state, expectedRevision: state.revision });
 await repo.export();
 return { factory, local, session, repo, saved: await repo.read(), saved0: saved };
}
const erase = (ctx: Awaited<ReturnType<typeof populated>>, expectedRevision: number) => eraseAllData({ expectedRevision, basePath: BASE, indexedDB: ctx.factory, storage: ctx.local, session: ctx.session });

describe('apagar todos os dados', () => {
 it('apaga banco, recovery, localStorage e sessionStorage e volta ao padrão', async () => {
  const ctx = await populated();
  expect(Object.keys(ctx.saved.recovery).length).toBeGreaterThan(0);
  const result = await erase(ctx, ctx.saved.revision);
  expect(result.storageWarnings).toEqual([]);
  const s = await ctx.repo.read();
  expect(s).toEqual(result.state);
  expect(s.revision).toBe(ctx.saved.revision + 1);
  expect(s.history).toEqual({ days: {}, measurements: {} });
  expect(s.snapshots).toEqual({}); expect(s.recovery).toEqual({});
  expect(s.settings.profile).toBeUndefined(); expect(s.settings.theme).toBe('auto');
  expect(s.catalog.revision).toBe(0); expect(s.catalog.plan.sess.UA.name).not.toBe('Editado');
  expect(s.meta.lastBackupGeneratedAt).toBeNull(); expect(s.meta.lastBackupConfirmedAt).toBeNull();
  expect(s.meta.migrationStatus).toBe('none');
  expect(ctx.local.keys()).toEqual(['outro-app']);
  expect(ctx.session.keys()).toEqual(['outra-chave']);
 });
 it('não deixa resíduo: reabrir não ressuscita o protótipo e o estado é igual ao de primeira abertura', async () => {
  const ctx = await populated();
  await erase(ctx, ctx.saved.revision);
  const fresh = createRepository({ indexedDB: new IDBFactory(), storage: memory({}), storageManager: {}, basePath: BASE }); repos.push(fresh);
  const first = (await fresh.initialize()).state;
  const again = createRepository({ indexedDB: ctx.factory, storage: ctx.local, storageManager: {}, basePath: BASE }); repos.push(again);
  const init = await again.initialize();
  expect(init.status).toBe('ready');
  const strip = (x: any) => ({ ...x, revision: 0, meta: { ...x.meta, initializedAt: 0, updatedAt: 0 } });
  expect(strip(init.state)).toEqual(strip(first));
 });
 it('é idempotente', async () => {
  const ctx = await populated();
  const a = await erase(ctx, ctx.saved.revision);
  const b = await erase(ctx, a.state.revision);
  expect(b.storageWarnings).toEqual([]);
  expect(b.state.revision).toBe(a.state.revision + 1);
  expect(b.state.history).toEqual({ days: {}, measurements: {} });
  expect(ctx.local.keys()).toEqual(['outro-app']);
 });
 it('funciona sem banco inicializado', async () => {
  const factory = new IDBFactory();
  const r = await eraseAllData({ expectedRevision: 0, basePath: BASE, indexedDB: factory, storage: memory({}), session: memory({}) });
  expect(r.state.revision).toBe(1);
  const repo = createRepository({ indexedDB: factory, storage: memory({}), storageManager: {}, basePath: BASE }); repos.push(repo);
  expect((await repo.initialize()).state.revision).toBe(1);
 });
 it('revisão desatualizada: conflito e nada é apagado', async () => {
  const ctx = await populated();
  await expect(erase(ctx, ctx.saved.revision - 1)).rejects.toMatchObject({ code: 'conflict' });
  expect(await ctx.repo.read()).toEqual(ctx.saved);
  expect(ctx.local.keys()).toContain('treino12-v2'); expect(ctx.session.keys()).toContain('treino12:treino-novo');
 });
 it('falha na transação: tudo ou nada, storage intacto', async () => {
  const ctx = await populated();
  const original = IDBObjectStore.prototype.put;
  vi.spyOn(IDBObjectStore.prototype, 'put').mockImplementation(function (this: IDBObjectStore, ...args: Parameters<typeof original>) { if (this.name === 'state') throw new DOMException('quota sintética', 'QuotaExceededError'); return original.apply(this, args); });
  await expect(erase(ctx, ctx.saved.revision)).rejects.toMatchObject({ code: 'quota' });
  vi.restoreAllMocks();
  expect(await ctx.repo.read()).toEqual(ctx.saved);
  expect(ctx.local.keys()).toContain('treino12-v2'); expect(ctx.session.keys()).toContain('treino12:cursor:2026-11-17:a');
 });
 it('storage sem remoção vira aviso, mas o banco já foi apagado', async () => {
  const ctx = await populated();
  const r = await eraseAllData({ expectedRevision: ctx.saved.revision, basePath: BASE, indexedDB: ctx.factory, storage: { getItem: () => null }, session: null });
  expect(r.storageWarnings).toEqual(['Não foi possível limpar localStorage.']);
  expect((await ctx.repo.read()).history.days).toEqual({});
 });
});
