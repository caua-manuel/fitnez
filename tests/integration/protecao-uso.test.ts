import { afterEach, describe, expect, it, vi } from 'vitest';
import { IDBFactory, IDBObjectStore } from 'fake-indexeddb';
import { createRepository } from '../../src/data/index';
import { foundation } from '../../src/data/migration';
import type { Repository, StateV3 } from '../../src/application/repository';

// ADR 011, 1.2 e 1.4: dias de uso, lembrete, "Agora não" e registro dos pedidos. Relógio injetado, dados sintéticos.
const DAY = 86400000;
const repos: Repository[] = [];
function setup(clock: { t: number }, options: any = {}) { const r = createRepository({ indexedDB: new IDBFactory(), storage: null, storageManager: {}, basePath: '/teste/', now: () => clock.t, ...options }); repos.push(r); return r; }
afterEach(() => { repos.splice(0).forEach(r => r.close()); vi.restoreAllMocks(); });
async function touch(r: Repository, n: number): Promise<StateV3> { const s = await r.read(); s.history.measurements[`2026-01-${String(n).padStart(2, '0')}`] = { p: '80' }; return r.save({ state: s, expectedRevision: s.revision }); }

describe('dias de uso (meta.usage)', () => {
 it('a contagem vai no mesmo estado do save (uma única escrita de state)', async () => {
  const clock = { t: new Date(2026, 10, 20, 10).getTime() }; const r = setup(clock); await r.initialize();
  const puts: string[] = []; const put = IDBObjectStore.prototype.put;
  vi.spyOn(IDBObjectStore.prototype, 'put').mockImplementation(function (this: IDBObjectStore, ...args: Parameters<typeof put>) { if (this.name === 'state') puts.push(JSON.stringify((args[0] as StateV3).meta.usage)); return put.apply(this, args); });
  const saved = await touch(r, 1);
  expect(puts).toEqual([JSON.stringify({ lastDay: '2026-11-20', daysSinceBackup: 1 })]);
  expect(saved.meta.usage).toEqual({ lastDay: '2026-11-20', daysSinceBackup: 1 });
  await touch(r, 2); expect((await r.read()).meta.usage?.daysSinceBackup).toBe(1); // mesmo dia
 });
 it('abrir sem gravar não conta; 7º dia de uso dispara; confirmBackup zera', async () => {
  const clock = { t: new Date(2026, 10, 1, 10).getTime() }; const r = setup(clock); await r.initialize();
  for (let i = 1; i <= 6; i++) { await touch(r, i); clock.t += DAY; }
  clock.t += 30 * DAY; await r.initialize(); expect((await r.protection()).backupDue).toBe(false);
  await touch(r, 7); expect((await r.protection()).backupDue).toBe(true);
  const b = await r.export(); expect((await r.protection()).backupDue).toBe(true); // gerar não basta
  const confirmed = await r.confirmBackup({ expectedRevision: b.revision });
  expect(confirmed.meta.usage?.daysSinceBackup).toBe(0);
  expect((await r.protection()).backupDue).toBe(false);
  await touch(r, 8); expect((await r.read()).meta.usage?.daysSinceBackup).toBe(0); // mesmo dia do backup
 });
 it('"Agora não" some só hoje e não conta como dia de uso', async () => {
  const clock = { t: new Date(2026, 10, 1, 10).getTime() }; const r = setup(clock); await r.initialize();
  for (let i = 1; i <= 7; i++) { await touch(r, i); clock.t += DAY; }
  clock.t -= DAY; expect((await r.protection()).backupDue).toBe(true);
  const s = await r.read(); const snoozed = await r.snoozeBackup({ expectedRevision: s.revision });
  expect(snoozed.meta.prompts?.backupSnoozedOn).toBe('2026-11-07');
  expect(snoozed.meta.usage).toEqual(s.meta.usage);
  expect((await r.protection()).backupDue).toBe(false);
  clock.t += DAY; expect((await r.protection()).backupDue).toBe(true);
  await expect(r.snoozeBackup({ expectedRevision: s.revision })).rejects.toMatchObject({ code: 'conflict' });
 });
 it('relógio para trás não conta nem zera', async () => {
  const clock = { t: new Date(2026, 10, 10, 10).getTime() }; const r = setup(clock); await r.initialize();
  await touch(r, 1); clock.t -= 5 * DAY; await touch(r, 2);
  expect((await r.read()).meta.usage).toEqual({ lastDay: '2026-11-10', daysSinceBackup: 1 });
 });
 it('markPrompt grava persistAskedAt e installShownAt; nome desconhecido é recusado', async () => {
  const clock = { t: 1800000000000 }; const r = setup(clock); const { state } = await r.initialize();
  const a = await r.markPrompt({ prompt: 'persist', expectedRevision: state.revision });
  clock.t += 5; const b = await r.markPrompt({ prompt: 'install', expectedRevision: a.revision });
  expect(b.meta.prompts).toEqual({ persistAskedAt: 1800000000000, installShownAt: 1800000000005 });
  await expect(r.markPrompt({ prompt: 'x' as never, expectedRevision: b.revision })).rejects.toMatchObject({ code: 'validation' });
  // save do cliente não apaga os pedidos (meta é do repositório)
  const s = await r.read(); delete s.meta.prompts; const saved = await r.save({ state: s, expectedRevision: s.revision });
  expect(saved.meta.prompts?.installShownAt).toBe(1800000000005);
 });
 it('backup v3 sem meta.usage importa e passa a contar na próxima gravação', async () => {
  const clock = { t: new Date(2026, 10, 20, 10).getTime() }; const r = setup(clock); await r.initialize();
  const old = foundation(1); old.history.measurements['2026-01-01'] = { p: '80' }; delete old.meta.usage;
  const p = await r.prepareImport(JSON.stringify({ app: 'treino12', v: 3, exportedAt: 1, state: old }));
  const imported = await r.confirmImport({ token: p.token, expectedRevision: p.expectedRevision });
  expect(imported.meta.usage).toBeUndefined();
  expect((await r.protection()).backupDue).toBe(false);
  expect((await touch(r, 2)).meta.usage).toEqual({ lastDay: '2026-11-20', daysSinceBackup: 1 });
 });
 it('backup com meta.usage inválido é recusado sem alterar dados', async () => {
  const clock = { t: 1 }; const r = setup(clock); const { state } = await r.initialize();
  const bad = foundation(1); (bad.meta as any).usage = { lastDay: 'x', daysSinceBackup: 1 };
  await expect(r.prepareImport(JSON.stringify({ app: 'treino12', v: 3, exportedAt: 1, state: bad }))).rejects.toMatchObject({ code: 'validation' });
  expect(await r.read()).toEqual(state);
 });
});
