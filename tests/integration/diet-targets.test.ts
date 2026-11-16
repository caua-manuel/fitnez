import { afterEach, describe, expect, it } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import { createRepository } from '../../src/data/index';
import { migrate } from '../../src/data/migration';
import { validateState } from '../../src/data/validation';
import { dayTargetFor, defaultDietTargets, isExampleTarget, restoreDefaultVersion, settingsWithDietTargets, withDietTargetsVersion } from '../../src/domain/dietTargets';
import { eraseAllData } from '../../src/application/eraseAll';
import type { Repository } from '../../src/application/repository';

// Dados sintéticos; relógio injetado.
const at = (y: number, m: number, d: number) => new Date(y, m - 1, d, 12, 0, 0).getTime();
const storage = (values: Record<string, string>) => ({ getItem: (key: string) => values[key] ?? null });
const repos: Repository[] = [];
function setup(options: any = {}) { const r = createRepository({ indexedDB: new IDBFactory(), storage: storage({}), storageManager: {}, basePath: '/teste/', now: () => at(2026, 11, 16), ...options }); repos.push(r); return r; }
afterEach(() => { repos.splice(0).forEach(r => r.close()); });
const backup = (state: unknown) => JSON.stringify({ v: 3, app: 'treino12', exportedAt: 1, state });
const custom = () => { const t = defaultDietTargets(); t.days.academia = { kcal: 2300, carbs: 280 }; t.proteinG = 160; return t; };

describe('metas editáveis: dados', () => {
 it('usuário novo e estado v3 sem o campo: meta de exemplo, sem criar o campo', async () => {
  const { state } = await setup().initialize();
  expect('dietTargets' in state.settings).toBe(false);
  expect(isExampleTarget(state.settings)).toBe(true);
  expect(() => validateState(structuredClone(state))).not.toThrow();
  expect(dayTargetFor('academia', '2026-11-16', state.settings).kcal).toBe(2450);
 });
 it('backups v1 e v2 legados migram sem criar o campo', async () => {
  for (const v of [1, 2]) { const s = migrate({ v, start: '2026-01-05', log: {} } as any, at(2026, 11, 16)); expect('dietTargets' in s.settings).toBe(false); expect(isExampleTarget(s.settings)).toBe(true); }
  const r = setup({ storage: storage({ 'treino12-v2': JSON.stringify({ v: 2, start: '2026-01-05', log: {} }) }) });
  const { state } = await r.initialize();
  expect('dietTargets' in state.settings).toBe(false);
 });
 it('backup v3 antigo sem o campo importa e fica em meta de exemplo', async () => {
  const r = setup(); const { state } = await r.initialize();
  const p = await r.prepareImport(backup(structuredClone(state)));
  const restored = await r.confirmImport({ token: p.token, expectedRevision: p.expectedRevision });
  expect(isExampleTarget(restored.settings)).toBe(true);
 });
 it('salvar nova versão persiste, vale a partir da data e restaura/desfaz', async () => {
  const r = setup(); const { state } = await r.initialize();
  const previous = state.settings.dietTargets;
  const next = structuredClone(state);
  next.settings = settingsWithDietTargets(next.settings, withDietTargetsVersion(previous, '2026-11-16', custom()));
  const saved = await r.save({ state: next, expectedRevision: state.revision });
  const reread = await r.read();
  expect(reread.settings.dietTargets?.versions).toHaveLength(1);
  expect(dayTargetFor('academia', '2026-11-16', reread.settings).kcal).toBe(2300);
  expect(dayTargetFor('academia', '2026-11-15', reread.settings).kcal).toBe(2450); // dia passado preserva
  // restaurar padrão
  const restored = structuredClone(saved);
  restored.settings = settingsWithDietTargets(restored.settings, restoreDefaultVersion(saved.settings.dietTargets, '2026-11-20'));
  const saved2 = await r.save({ state: restored, expectedRevision: saved.revision });
  expect(isExampleTarget(saved2.settings)).toBe(true);
  expect(dayTargetFor('academia', '2026-11-18', saved2.settings).kcal).toBe(2300); // histórico mantido
  // desfazer: regrava a lista anterior
  const undone = structuredClone(saved2);
  undone.settings = settingsWithDietTargets(undone.settings, saved.settings.dietTargets);
  const saved3 = await r.save({ state: undone, expectedRevision: saved2.revision });
  expect(isExampleTarget(saved3.settings)).toBe(false);
  expect(saved3.settings.dietTargets?.versions).toHaveLength(1);
  // desfazer a primeira edição remove o campo
  const none = structuredClone(saved3);
  none.settings = settingsWithDietTargets(none.settings, undefined);
  const saved4 = await r.save({ state: none, expectedRevision: saved3.revision });
  expect('dietTargets' in saved4.settings).toBe(false);
 });
 it('ida e volta: exportar e importar preserva as versões', async () => {
  const a = setup(); const { state } = await a.initialize();
  const next = structuredClone(state);
  next.settings = settingsWithDietTargets(next.settings, withDietTargetsVersion(withDietTargetsVersion(undefined, '2026-11-10', custom()), '2026-11-20', null));
  await a.save({ state: next, expectedRevision: state.revision });
  const exported = await a.export();
  const b = setup(); await b.initialize();
  const p = await b.prepareImport(exported.text);
  const imported = await b.confirmImport({ token: p.token, expectedRevision: p.expectedRevision });
  expect(imported.settings.dietTargets).toEqual(next.settings.dietTargets);
  expect(dayTargetFor('academia', '2026-11-15', imported.settings).protein).toBe(160);
 });
 it('backup com valor fora dos limites é rejeitado, sem tocar nos dados', async () => {
  const r = setup(); const { state } = await r.initialize();
  const bad: any = structuredClone(state);
  bad.settings.dietTargets = withDietTargetsVersion(undefined, '2026-11-10', custom());
  bad.settings.dietTargets.versions[0].targets.days.academia.kcal = 999;
  await expect(r.prepareImport(backup(bad))).rejects.toMatchObject({ code: 'validation', message: 'As metas de dieta do backup são inválidas.' });
  expect(() => validateState(bad)).toThrow(/metas de dieta/);
  const worse: any = structuredClone(state); worse.settings.dietTargets = { schema: 1, versions: 'x' };
  expect(() => validateState(worse)).toThrow();
  expect(() => r.save({ state: bad, expectedRevision: state.revision })).toThrow(/metas de dieta/); // save valida antes de enfileirar
  expect((await r.read()).revision).toBe(state.revision);
 });
 it('apagar tudo remove as metas (volta a meta de exemplo)', async () => {
  const factory = new IDBFactory();
  const r = setup({ indexedDB: factory }); const { state } = await r.initialize();
  const next = structuredClone(state);
  next.settings = settingsWithDietTargets(next.settings, withDietTargetsVersion(undefined, '2026-11-16', custom()));
  const saved = await r.save({ state: next, expectedRevision: state.revision });
  const erased = await eraseAllData({ expectedRevision: saved.revision, basePath: '/teste/', indexedDB: factory, storage: null, session: null });
  expect('dietTargets' in erased.state.settings).toBe(false);
  expect(isExampleTarget(erased.state.settings)).toBe(true);
 });
});
