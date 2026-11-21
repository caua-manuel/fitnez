import { afterEach, describe, expect, it } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import { createRepository } from '../../src/data/index';
import { createDemoRepository, deleteDemoDatabase, demoDatabaseName } from '../../src/data/demo';
import { databaseName } from '../../src/data/names';
import { hasUserData } from '../../src/domain/userData';
import { demoState } from '../../src/demo/generate';
import type { Repository } from '../../src/application/repository';

// ADR 011, 1.1: isolamento da demonstração em banco próprio. Dados sintéticos.
const BASE = '/teste/';
const NOW = new Date(2026, 10, 20, 12).getTime();
const repos: Repository[] = [];
afterEach(() => { repos.splice(0).forEach(r => r.close()); });
const real = (factory: IDBFactory, storage: any = null) => { const r = createRepository({ indexedDB: factory, storage, storageManager: { persisted: async () => true, estimate: async () => ({ usage: 1, quota: 2 }) }, basePath: BASE, now: () => NOW }); repos.push(r); return r; };
const demo = (factory: IDBFactory) => { const r = createDemoRepository({ indexedDB: factory, basePath: BASE, now: () => NOW }); repos.push(r); return r; };

/** Todos os registros de todas as stores do banco, serializados (byte a byte). */
async function dump(factory: IDBFactory, name: string): Promise<string> {
 const db = await new Promise<IDBDatabase>((ok, ko) => { const q = factory.open(name); q.onsuccess = () => ok(q.result); q.onerror = () => ko(q.error); });
 const out: Record<string, unknown> = { version: db.version };
 for (const store of Array.from(db.objectStoreNames)) {
  const tx = db.transaction(store, 'readonly'); const os = tx.objectStore(store);
  const [keys, values] = await Promise.all([os.getAllKeys(), os.getAll()].map(q => new Promise<unknown[]>((ok, ko) => { q.onsuccess = () => ok(q.result as unknown[]); q.onerror = () => ko(q.error); })));
  out[store] = keys.map((k, i) => [k, values[i]]);
 }
 db.close();
 return JSON.stringify(out);
}
const names = async (f: IDBFactory) => (await f.databases()).map(d => d.name).sort();

async function enterDemo(factory: IDBFactory): Promise<Repository> {
 const d = demo(factory); const { state } = await d.initialize();
 await d.save({ state: demoState('2026-11-20', state), expectedRevision: state.revision });
 return d;
}

describe('modo demonstração', () => {
 it('entrar e sair não muda nenhum byte do banco real', async () => {
  const factory = new IDBFactory();
  const r = real(factory); const { state } = await r.initialize();
  state.history.measurements['2026-11-19'] = { p: '81,0' };
  await r.save({ state, expectedRevision: state.revision }); await r.export();
  r.close();
  const before = await dump(factory, databaseName(BASE));
  const d = await enterDemo(factory);
  const s = await d.read(); s.settings.theme = 'dark'; await d.save({ state: s, expectedRevision: s.revision }); // usar a demo
  expect(await names(factory)).toEqual([databaseName(BASE), demoDatabaseName(BASE)].sort());
  d.close(); await deleteDemoDatabase({ indexedDB: factory, basePath: BASE });
  expect(await dump(factory, databaseName(BASE))).toBe(before);
  expect(await names(factory)).toEqual([databaseName(BASE)]);
 });
 it('na demo o banco real nunca é criado', async () => {
  const factory = new IDBFactory();
  await enterDemo(factory);
  expect(await names(factory)).toEqual([demoDatabaseName(BASE)]);
 });
 it('demo recusa export, importação e confirmação de backup; proteção indisponível', async () => {
  const factory = new IDBFactory(); const d = await enterDemo(factory);
  const s = await d.read();
  await expect(d.export()).rejects.toMatchObject({ code: 'validation' });
  await expect(d.prepareImport('{}')).rejects.toMatchObject({ code: 'validation' });
  await expect(d.confirmImport({ token: 'x', expectedRevision: s.revision })).rejects.toMatchObject({ code: 'validation' });
  await expect(d.confirmBackup({ expectedRevision: s.revision })).rejects.toMatchObject({ code: 'validation' });
  expect(await d.protection({ requestPersistence: true })).toMatchObject({ persistence: 'unavailable', backupDue: false });
  expect(hasUserData(s)).toBe(true);
  expect(await d.read()).toEqual(s);
 });
 it('sair apaga o banco da demo; apagar de novo é idempotente', async () => {
  const factory = new IDBFactory(); const d = await enterDemo(factory);
  await deleteDemoDatabase({ indexedDB: factory, basePath: BASE }); // conexão aberta fecha no versionchange
  await deleteDemoDatabase({ indexedDB: factory, basePath: BASE });
  expect(await names(factory)).toEqual([]);
  d.close();
  await expect(deleteDemoDatabase({ indexedDB: null })).resolves.toBeUndefined();
 });
 it('marca sem banco: a demo abre vazia, sem ler o protótipo legado, e pode ser regenerada', async () => {
  const factory = new IDBFactory();
  const legacy = { getItem: (k: string) => (k === 'treino12-v2' ? JSON.stringify({ v: 2, meas: { '2026-01-01': { p: '70' } } }) : null) };
  const d = createDemoRepository({ indexedDB: factory, basePath: BASE, now: () => NOW, ...({ storage: legacy } as object) }); repos.push(d);
  const init = await d.initialize();
  expect(init.status).toBe('ready');
  expect(hasUserData(init.state)).toBe(false);
  expect(Object.keys(init.state.recovery)).toEqual([]);
  const saved = await d.save({ state: demoState('2026-11-20', init.state), expectedRevision: init.state.revision });
  expect(Object.keys(saved.history.days).length).toBeGreaterThan(10);
 });
 it('abas de modos diferentes não se misturam (canal e banco seguem o nome)', async () => {
  const factory = new IDBFactory();
  const r = real(factory); await r.initialize();
  const d = await enterDemo(factory);
  expect(hasUserData(await r.read())).toBe(false);
  expect(hasUserData(await d.read())).toBe(true);
 });
});
