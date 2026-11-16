import { afterEach, describe, expect, it } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import { createRepository } from '../../src/data/index';
import { foundation, migrate } from '../../src/data/migration';
import { validateState } from '../../src/data/validation';
import { defaultPlanStart, isStartConfirmed, localDayOf } from '../../src/domain/planStart';
import { mondayOf } from '../../src/domain/calendar';
import type { Repository } from '../../src/application/repository';

// Dados sintéticos. Datas neutras; o relógio é injetado.
const at = (y: number, m: number, d: number) => new Date(y, m - 1, d, 12, 0, 0).getTime();
const storage = (values: Record<string, string>) => ({ getItem: (key: string) => values[key] ?? null });
const repos: Repository[] = [];
function setup(options: any = {}) { const r = createRepository({ indexedDB: new IDBFactory(), storage: storage({}), storageManager: {}, basePath: '/teste/', ...options }); repos.push(r); return r; }
afterEach(() => { repos.splice(0).forEach(r => r.close()); });

describe('data de início padrão (funções puras)', () => {
 it('segunda-feira da semana de hoje, pela data local', () => {
  expect(defaultPlanStart(at(2026, 3, 12))).toBe('2026-03-09'); // quinta
  expect(defaultPlanStart(at(2026, 3, 9))).toBe('2026-03-09'); // segunda
  expect(defaultPlanStart(at(2026, 3, 15))).toBe('2026-03-09'); // domingo
  expect(defaultPlanStart(at(2026, 1, 1))).toBe('2025-12-29'); // virada de ano
  expect(localDayOf(at(2026, 3, 12))).toBe('2026-03-12');
 });
 it('só startConfirmed === false significa padrão', () => {
  expect(isStartConfirmed({ startConfirmed: false })).toBe(false);
  expect(isStartConfirmed({ startConfirmed: true })).toBe(true);
  expect(isStartConfirmed({})).toBe(true);
  expect(isStartConfirmed(undefined)).toBe(true);
 });
});

describe('estado de fábrica e migração', () => {
 it('usuário novo nasce com início padrão não confirmado', async () => {
  const r = setup({ now: () => at(2026, 3, 12) });
  const { state } = await r.initialize();
  expect(state.settings.start).toBe('2026-03-09');
  expect(mondayOf(state.settings.start)).toBe(state.settings.start);
  expect(isStartConfirmed(state.settings)).toBe(false);
  expect(() => validateState(structuredClone(state))).not.toThrow();
 });
 it('foundation não carrega mais data fixa do plano semente', () => {
  expect(foundation(at(2027, 6, 2)).settings.start).toBe('2027-05-31');
 });
 it('migração legada com start preserva a data e marca confirmada', () => {
  const s = migrate({ v: 2, start: '2026-01-05', log: {} } as any, at(2026, 3, 12));
  expect(s.settings.start).toBe('2026-01-05');
  expect(isStartConfirmed(s.settings)).toBe(true);
 });
 it('migração legada sem start usa o padrão e deixa a escolha para o usuário', () => {
  const s = migrate({ v: 1, log: {} } as any, at(2026, 3, 12));
  expect(s.settings.start).toBe('2026-03-09');
  expect(isStartConfirmed(s.settings)).toBe(false);
 });
 it('protótipo salvo em treino12-v2 via initialize mantém a data e fica confirmado', async () => {
  const r = setup({ now: () => at(2026, 3, 12), storage: storage({ 'treino12-v2': JSON.stringify({ v: 2, start: '2026-01-05', log: {} }) }) });
  const { state } = await r.initialize();
  expect(state.settings.start).toBe('2026-01-05');
  expect(isStartConfirmed(state.settings)).toBe(true);
 });
 it('estado v3 salvo antes do campo (sem startConfirmed) valida e conta como confirmado', async () => {
  const r = setup({ now: () => at(2026, 3, 12) });
  const { state } = await r.initialize();
  const old: any = structuredClone(state); delete old.settings.startConfirmed; old.settings.start = '2026-01-05';
  expect(() => validateState(old)).not.toThrow();
  const p = await r.prepareImport(JSON.stringify({ v: 3, app: 'treino12', exportedAt: 1, state: old }));
  const restored = await r.confirmImport({ token: p.token, expectedRevision: p.expectedRevision });
  expect(restored.settings.start).toBe('2026-01-05');
  expect(isStartConfirmed(restored.settings)).toBe(true);
 });
 it('rejeita startConfirmed que não seja booleano', async () => {
  const r = setup({ now: () => at(2026, 3, 12) });
  const { state } = await r.initialize();
  const bad: any = structuredClone(state); bad.settings.startConfirmed = 'sim';
  expect(() => validateState(bad)).toThrow();
 });
 it('mudar a data pelo save confirma; manter a data exige gravar startConfirmed', async () => {
  const r = setup({ now: () => at(2026, 3, 12) });
  const { state } = await r.initialize();
  const changed = structuredClone(state); changed.settings.start = '2026-03-16';
  const saved = await r.save({ state: changed, expectedRevision: state.revision });
  expect(saved.settings.start).toBe('2026-03-16');
  expect(isStartConfirmed(saved.settings)).toBe(true);
  const kept = await setup({ now: () => at(2026, 3, 12) }).initialize();
  const same = structuredClone(kept.state); same.settings.startConfirmed = true;
  expect(isStartConfirmed(same.settings)).toBe(true);
 });
});
