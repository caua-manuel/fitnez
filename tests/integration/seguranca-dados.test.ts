import { afterEach, describe, expect, it } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import { createRepository } from '../../src/data/index';
import { createDemoRepository } from '../../src/data/demo';
import { databaseName, modeKeyName } from '../../src/data/names';
import { validateState } from '../../src/data/validation';
import { RECOVERY_KEEP, recoveryToPrune } from '../../src/data/recoveryPrune';
import { eraseAllData } from '../../src/application/eraseAll';
import { applyPlanShare, canUndoPlanShare, undoPlanShare } from '../../src/application/planShare';
import { applyOnboarding, canUndoOnboarding, previewOnboarding } from '../../src/application/onboarding';
import { checkPlanShare } from '../../src/domain/planShare';
import type { PlanShareFile } from '../../src/domain/planShare';
import { demoState } from '../../src/demo/generate';
import { RepositoryError } from '../../src/application/repository';
import type { Repository, StateV3 } from '../../src/application/repository';

// Correções de segurança do ADR 011 (docs/handoffs/seguranca-adr-011.md): A1, M1 e M4. Dados sintéticos.
const BASE = '/teste/';
const NOW = new Date(2026, 10, 20, 12).getTime();
const repos: Repository[] = [];
afterEach(() => { repos.splice(0).forEach(r => r.close()); });
const real = (factory: IDBFactory) => { const r = createRepository({ indexedDB: factory, storage: null, storageManager: {}, basePath: BASE, now: () => NOW }); repos.push(r); return r; };
const demo = (factory: IDBFactory) => { const r = createDemoRepository({ indexedDB: factory, basePath: BASE, now: () => NOW }); repos.push(r); return r; };
const memory = (values: Record<string, string>) => ({
 getItem: (k: string) => (k in values ? values[k]! : null), removeItem: (k: string) => { delete values[k]; },
 key: (i: number) => Object.keys(values)[i] ?? null, get length() { return Object.keys(values).length; },
});

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
async function recoveryKeys(factory: IDBFactory, name: string): Promise<string[]> {
 const db = await new Promise<IDBDatabase>((ok, ko) => { const q = factory.open(name); q.onsuccess = () => ok(q.result); q.onerror = () => ko(q.error); });
 const keys = await new Promise<IDBValidKey[]>((ok, ko) => { const q = db.transaction('recovery', 'readonly').objectStore('recovery').getAllKeys(); q.onsuccess = () => ok(q.result); q.onerror = () => ko(q.error); });
 db.close();
 return keys.map(String);
}
async function realWithData(factory: IDBFactory): Promise<StateV3> {
 const r = real(factory); const { state } = await r.initialize();
 state.history.measurements['2026-11-19'] = { p: '81,0' };
 const saved = await r.save({ state, expectedRevision: state.revision });
 r.close();
 return saved;
}

describe('A1: apagar tudo nunca toca o banco real na demonstração', () => {
 it('com a marca da demo no localStorage: recusa e nenhum byte do banco real muda', async () => {
  const factory = new IDBFactory();
  const saved = await realWithData(factory);
  const before = await dump(factory, databaseName(BASE));
  const local = memory({ [modeKeyName(BASE)]: 'demo', 'treino12:descanso': 'x' });
  const err = await eraseAllData({ expectedRevision: saved.revision, basePath: BASE, indexedDB: factory, storage: local, session: null }).catch(e => e);
  expect(err).toBeInstanceOf(RepositoryError);
  expect((err as RepositoryError).code).toBe('validation');
  expect(await dump(factory, databaseName(BASE))).toBe(before);
  expect(local.getItem('treino12:descanso')).toBe('x'); // nada do localStorage foi limpo
 });
 it('com mode: "demo": recusa mesmo sem acesso ao localStorage', async () => {
  const factory = new IDBFactory();
  const saved = await realWithData(factory);
  const before = await dump(factory, databaseName(BASE));
  await expect(eraseAllData({ expectedRevision: saved.revision, basePath: BASE, indexedDB: factory, storage: null, session: null, mode: 'demo' })).rejects.toMatchObject({ code: 'validation' });
  expect(await dump(factory, databaseName(BASE))).toBe(before);
 });
 it('no modo real continua apagando', async () => {
  const factory = new IDBFactory();
  const saved = await realWithData(factory);
  const r = await eraseAllData({ expectedRevision: saved.revision, basePath: BASE, indexedDB: factory, storage: memory({}), session: null, mode: 'real' });
  expect(r.state.history.measurements).toEqual({});
 });
});

describe('M1: assinatura meta.demo', () => {
 it('o gerador assina; a demo guarda a assinatura ao salvar; banco da demo só inicializado não tem assinatura', async () => {
  const factory = new IDBFactory();
  const d = demo(factory);
  const { state } = await d.initialize();
  expect(state.meta.demo).toBeUndefined(); // marca sem demo gravada: a tela volta ao modo real
  const generated = demoState('2026-11-20', state);
  expect(generated.meta.demo).toBe(true);
  const saved = await d.save({ state: generated, expectedRevision: state.revision });
  expect(saved.meta.demo).toBe(true);
  expect((await d.read()).meta.demo).toBe(true);
  // Gravações seguintes (a tela manda o estado sem mudar meta) mantêm a assinatura.
  const again = await d.save({ state: saved, expectedRevision: saved.revision });
  expect(again.meta.demo).toBe(true);
 });
 it('o banco real nunca grava meta.demo', async () => {
  const factory = new IDBFactory();
  const r = real(factory); const { state } = await r.initialize();
  const fake = demoState('2026-11-20', state);
  const saved = await r.save({ state: fake, expectedRevision: state.revision });
  expect(saved.meta.demo).toBeUndefined();
  expect((await r.read()).meta.demo).toBeUndefined();
  expect(await dump(factory, databaseName(BASE))).not.toContain('"demo":true');
 });
 it('importar no banco real um backup com meta.demo = true é recusado', async () => {
  const factory = new IDBFactory();
  const r = real(factory); const { state } = await r.initialize();
  const fake = demoState('2026-11-20', state);
  const text = JSON.stringify({ app: 'treino12', v: 3, exportedAt: NOW, state: fake });
  await expect(r.prepareImport(text)).rejects.toMatchObject({ code: 'validation' });
  delete fake.meta.demo;
  await expect(r.prepareImport(JSON.stringify({ app: 'treino12', v: 3, exportedAt: NOW, state: fake }))).resolves.toMatchObject({ summary: expect.any(Object) });
 });
 it('validateState: meta.demo só como verdadeiro/falso', async () => {
  const { state } = await real(new IDBFactory()).initialize();
  expect(() => validateState({ ...state, meta: { ...state.meta, demo: true } })).not.toThrow();
  expect(() => validateState({ ...state, meta: { ...state.meta, demo: 'sim' } })).toThrow(RepositoryError);
 });
});

function friendFile(n: number): PlanShareFile {
 const c = checkPlanShare({ app: 'fitnez-plano', v: 1, name: `Plano ${n}`, plan: {
  ex: { supino: { n: 'Supino com halteres', s: [4, 4, 4], r: ['6–8', '6–8', '6–8'], m: 'kg' } },
  sess: { A: { name: 'Treino A', ex: ['supino'] } }, order: ['A'] } });
 if (!c.ok) throw new Error(c.error);
 return c.value;
}

describe('M4: poda do recovery na mesma transação', () => {
 it('mais de 400 aplicações de plano: só os 3 desfazer mais recentes ficam e o desfazer continua funcionando', async () => {
  const factory = new IDBFactory();
  const r = real(factory);
  let { state } = await r.initialize();
  for (let i = 0; i < 405; i++) {
   state = await applyPlanShare(r, { file: friendFile(i), start: '2026-11-23', today: '2026-11-20', expectedRevision: state.revision, now: NOW + i * 1000 });
   if (i % 50 === 0) { state = await undoPlanShare(r, { expectedRevision: state.revision, now: NOW + i * 1000 + 500 }); }
  }
  const keys = await recoveryKeys(factory, databaseName(BASE));
  expect(keys.filter(k => k.startsWith('plan-import-undo:')).length).toBe(RECOVERY_KEEP);
  expect(keys.filter(k => k.startsWith('before-plan-import-undo:')).length).toBeLessThanOrEqual(RECOVERY_KEEP);
  expect(Object.keys(state.recovery).filter(k => k.startsWith('plan-import-undo:')).length).toBe(RECOVERY_KEEP);
  expect(state.recovery[state.settings.planImport!.undoKey!]).toBeDefined();
  expect(canUndoPlanShare(state)).toBe(true);
  const undone = await undoPlanShare(r, { expectedRevision: state.revision, now: NOW + 1e7 });
  expect(undone.settings.planImport?.name).toBe('Plano 403');
  // Releitura do banco confere com o estado devolvido.
  expect(Object.keys((await r.read()).recovery).sort()).toEqual(Object.keys(undone.recovery).sort());
 }, 120_000);
 it('assistente aplicado muitas vezes: só 3 onboarding-undo, sem editar application/onboarding.ts', async () => {
  const factory = new IDBFactory();
  const r = real(factory);
  let { state } = await r.initialize();
  const p = previewOnboarding({ safety: ['nenhum'], goal: 'recomp', experience: 'iniciante', daysPerWeek: 3, duration: 'medio', place: 'academia', activities: [], body: { sex: 'm', age: 30, heightCm: 175, weightKg: 80, lifestyle: 'pouco' } });
  if (!p.ok) throw new Error(JSON.stringify(p.errors));
  for (let i = 0; i < 12; i++) state = await applyOnboarding(r, { preview: p.preview, start: '2026-11-23', today: '2026-11-20', expectedRevision: state.revision, now: NOW + i * 1000 });
  const keys = await recoveryKeys(factory, databaseName(BASE));
  expect(keys.filter(k => k.startsWith('onboarding-undo:')).length).toBe(RECOVERY_KEEP);
  expect(canUndoOnboarding(state)).toBe(true);
 });
});

describe('recoveryToPrune', () => {
 const rec = (t: number) => ({ kind: 'x', createdAt: t });
 it('mantém os 3 mais novos por prefixo e não toca outros registros', () => {
  const recovery: Record<string, unknown> = {
   'plan-import-undo:1': rec(1), 'plan-import-undo:2': rec(2), 'plan-import-undo:3': rec(3), 'plan-import-undo:4': rec(4),
   'before-plan-import-undo:9': rec(9), 'legacy:treino12-v2': { raw: '' }, 'before-import:r1:1': rec(1), 'before-import:r2:2': rec(2), 'before-import:r3:3': rec(3), 'before-import:r4:4': rec(4),
  };
  expect(recoveryToPrune(recovery)).toEqual(['plan-import-undo:1']);
 });
 it('relógio para trás: a chave apontada pelo desfazer atual nunca sai', () => {
  const recovery: Record<string, unknown> = { 'onboarding-undo:10': rec(10), 'onboarding-undo:20': rec(20), 'onboarding-undo:30': rec(30), 'onboarding-undo:40': rec(40), 'onboarding-undo:5': rec(5) };
  const settings = { onboarding: { undoKey: 'onboarding-undo:5' } } as unknown as StateV3['settings'];
  expect(recoveryToPrune(recovery, settings)).toEqual(['onboarding-undo:10']);
 });
 it('mesmo instante: o sufixo :n maior é o mais novo', () => {
  const recovery: Record<string, unknown> = { 'plan-import-undo:7': {}, 'plan-import-undo:7:2': {}, 'plan-import-undo:7:3': {}, 'plan-import-undo:7:4': {} };
  expect(recoveryToPrune(recovery)).toEqual(['plan-import-undo:7']);
 });
});
