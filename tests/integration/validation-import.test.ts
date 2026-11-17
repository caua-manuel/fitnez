import { afterEach, describe, expect, it } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import { createRepository } from '../../src/data/index';
import { open, request, completed } from '../../src/data/idb';
import type { Repository, StateV3 } from '../../src/application/repository';

// Fixtures sintéticos: nada aqui é dado real.
const NOW = 1_800_000_000_000;
const BASE = '/teste/';
const DB_NAME = `treino12:${encodeURIComponent(BASE)}`;
const repos: Repository[] = [];
function setup(options: any = {}) { const r = createRepository({ indexedDB: new IDBFactory(), storage: { getItem: () => null }, storageManager: {}, basePath: BASE, now: () => NOW, ...options }); repos.push(r); return r; }
afterEach(() => { repos.splice(0).forEach(r => r.close()); });
const backup = (state: unknown) => JSON.stringify({ app: 'treino12', v: 3, exportedAt: NOW, state });
const legacy = (v: 1 | 2) => ({ v, start: '2026-01-05', log: { '2026-03-02': { ex1: [{ kg: '22,5', reps: '08', done: true }] } }, meas: { '2026-03-03': { p: '70,5' } }, notes: { '2026-03-02': { ex1: 'nota' } }, opt: { '2026-03-02': true } });

describe('importação: backup malformado ou malicioso', () => {
 it('B1: perfil com nome objeto é recusado na prévia e o estado atual fica intacto', async () => {
  const r = setup(); const { state } = await r.initialize();
  const bad = structuredClone(state) as any; bad.settings.profile = { name: { a: 1 }, goal: 5 };
  await expect(r.prepareImport(backup(bad))).rejects.toMatchObject({ code: 'validation', message: expect.stringContaining('Perfil do backup inválido') });
  expect(await r.read()).toEqual(state);
 });
 it.each([
  ['idade texto', { name: 'x', goal: 'y', age: '30' }], ['peso Infinity (1e999)', null], ['objetivo array', { name: 'x', goal: ['a'] }], ['nome com 61 caracteres', { name: 'a'.repeat(61), goal: '' }],
 ])('recusa %s', async (_n, profile) => {
  const r = setup(); const { state } = await r.initialize();
  const bad = structuredClone(state) as any; bad.settings.profile = profile ?? { name: 'x', goal: 'y', weightKg: 0 };
  let text = backup(bad); if (profile === null) text = text.replace('"weightKg": 0', '"weightKg": 1e999').replace('"weightKg":0', '"weightKg":1e999');
  await expect(r.prepareImport(text)).rejects.toMatchObject({ code: 'validation' });
  expect(await r.read()).toEqual(state);
 });
 it('texto acima do limite é recusado; no limite é aceito', async () => {
  const r = setup(); const { state } = await r.initialize();
  const at = structuredClone(state) as any; at.history.days['2026-03-02'] = { notes: { e: 'a'.repeat(2000) } };
  await expect(r.prepareImport(backup(at))).resolves.toBeDefined();
  at.history.days['2026-03-02'].notes.e = 'a'.repeat(2001);
  await expect(r.prepareImport(backup(at))).rejects.toMatchObject({ code: 'validation', message: expect.stringContaining('2000') });
 });
 it('save também recusa perfil inválido', async () => {
  const r = setup(); const { state } = await r.initialize(); (state.settings as any).profile = { name: { a: 1 }, goal: '' };
  await expect((async () => r.save({ state, expectedRevision: state.revision }))()).rejects.toMatchObject({ code: 'validation' });
 });
});

describe('backups legítimos continuam importando', () => {
 it.each([1, 2] as const)('v%i antigo importa sem conversão de valores', async (v) => {
  const r = setup(); const { state } = await r.initialize();
  const p = await r.prepareImport(JSON.stringify(legacy(v))); expect(p.sourceVersion).toBe(v);
  const next = await r.confirmImport({ token: p.token, expectedRevision: state.revision });
  expect(next.history.days['2026-03-02'].log!.ex1[0]).toEqual({ kg: '22,5', reps: '08', done: true });
  expect(next.history.measurements['2026-03-03'].p).toBe('70,5');
 });
 it('v3 sem os campos novos (sem perfil, notificações, sono) importa', async () => {
  const a = setup(); await a.initialize(); const text = (await a.export()).text;
  const parsed = JSON.parse(text); expect(parsed.state.settings.profile).toBeUndefined();
  const b = setup(); const init = await b.initialize();
  const p = await b.prepareImport(text); await expect(b.confirmImport({ token: p.token, expectedRevision: init.state.revision })).resolves.toBeDefined();
 });
 it('ida e volta: exporta com perfil completo e importa de novo, igual', async () => {
  const a = setup(); const { state } = await a.initialize();
  state.settings.profile = { name: 'Pessoa Teste', goal: 'Meta de teste', age: 30, heightCm: 175, weightKg: 78.2 };
  state.settings.notifications = { enabled: true, restEnd: false }; state.settings.sleepOk = { 0: true };
  state.history.days['2026-03-02'] = { notes: { e: 'nota' }, workouts: { UA: { sessionId: 'UA', status: 'done', startedAt: 1, finishedAt: 2, sets: 3, volume: 10 } }, acts: { gym: true } };
  await a.save({ state, expectedRevision: state.revision });
  const exported = await a.export(); const b = setup(); const init = await b.initialize();
  const p = await b.prepareImport(exported.text); const next = await b.confirmImport({ token: p.token, expectedRevision: init.state.revision });
  expect(next.settings.profile).toEqual({ name: 'Pessoa Teste', goal: 'Meta de teste', age: 30, heightCm: 175, weightKg: 78.2 });
  expect(next.settings.notifications).toEqual({ enabled: true, restEnd: false });
  expect(next.history.days['2026-03-02']).toEqual(state.history.days['2026-03-02']);
  expect(next.catalog).toEqual(state.catalog);
 });
});

// Escreve direto no banco, como o app fazia antes da validação do perfil.
async function putRaw(state: StateV3) {
 const factory = new IDBFactory();
 const first = setup({ indexedDB: factory }); const init = await first.initialize(); first.close();
 const db = await open(factory, DB_NAME);
 const tx = db.transaction(['state'], 'readwrite'); const done = completed(tx);
 const stored = structuredClone(init.state) as any; Object.assign(stored, { settings: { ...stored.settings, ...state.settings } });
 tx.objectStore('state').put(stored, 'active'); await done;
 const readBack = async () => { const t = db.transaction(['state'], 'readonly'); const v = await request<any>(t.objectStore('state').get('active')); await completed(t); return v; };
 return { factory, db, readBack };
}

describe('estado já salvo e inválido não derruba o carregamento', () => {
 it('perfil com nome objeto: abre, devolve perfil corrigido e preserva o original em recovery', async () => {
  const original = { name: { a: 1 }, goal: 'meta ok', age: '30', weightKg: 70 };
  const { factory, db, readBack } = await putRaw({ settings: { profile: original } } as any);
  const r = setup({ indexedDB: factory });
  const init = await r.initialize();
  expect(init.status).toBe('ready');
  expect(init.state.settings.profile).toEqual({ name: '', goal: 'meta ok', weightKg: 70 });
  const saved = await readBack();
  const entry = Object.entries(saved.recovery ?? {}).find(([k]) => k.startsWith('invalid-profile:')) as any;
  expect(entry).toBeDefined(); expect(entry[1].profile).toEqual(original);
  expect(saved.settings.profile).toEqual({ name: '', goal: 'meta ok', weightKg: 70 });
  expect((await r.read()).settings.profile).toEqual({ name: '', goal: 'meta ok', weightKg: 70 });
  // O reparo é gravado uma vez: reabrir não cria outra entrada.
  const again = setup({ indexedDB: factory }); const second = await again.initialize();
  expect(Object.keys(second.state.recovery).filter(k => k.startsWith('invalid-profile:'))).toHaveLength(1);
  // Salvar depois do reparo funciona e mantém o original.
  const s = await r.read(); s.settings.profile = { ...s.settings.profile!, name: 'Pessoa Teste' };
  const saved2 = await r.save({ state: s, expectedRevision: s.revision });
  expect(saved2.settings.profile!.name).toBe('Pessoa Teste'); expect(Object.keys(saved2.recovery).some(k => k.startsWith('invalid-profile:'))).toBe(true);
  db.close();
 });
 it('perfil que nem é objeto também é tratado sem perder o resto', async () => {
  const { factory, db } = await putRaw({ settings: { profile: 'lixo', theme: 'dark' } } as any);
  const r = setup({ indexedDB: factory }); const init = await r.initialize();
  expect(init.state.settings.profile).toBeUndefined(); expect(init.state.settings.theme).toBe('dark');
  expect(Object.values(init.state.recovery).some((x: any) => x.profile === 'lixo')).toBe(true);
  db.close();
 });
 it('perfil válido não cria recuperação nem altera a revisão', async () => {
  const { factory, db } = await putRaw({ settings: { profile: { name: 'x', goal: 'y' } } } as any);
  const r = setup({ indexedDB: factory }); const before = (await r.read()).revision; const init = await r.initialize();
  expect(init.state.revision).toBe(before); expect(Object.keys(init.state.recovery).some(k => k.startsWith('invalid-profile:'))).toBe(false);
  db.close();
 });
});
