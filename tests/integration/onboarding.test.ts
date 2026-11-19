import { afterEach, describe, expect, it } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import { createRepository } from '../../src/data/index';
import { foundation, migrate } from '../../src/data/migration';
import { validateState } from '../../src/data/validation';
import { applyOnboarding, applyOnboardingToState, canUndoOnboarding, previewOnboarding, undoOnboarding } from '../../src/application/onboarding';
import { RepositoryError } from '../../src/application/repository';
import type { Repository, StateV3 } from '../../src/application/repository';
import { dayTargetFor, defaultDietTargets, effectiveDietTargets, isExampleTarget, isValidDietTargets, validateDietTargets, withDietTargetsVersion } from '../../src/domain/dietTargets';
import { consistency } from '../../src/domain/evolution';
import type { OnboardingPreview } from '../../src/domain/onboarding';

// Dados sintéticos; relógio injetado. Nenhum dado pessoal.
const at = (y: number, m: number, d: number) => new Date(y, m - 1, d, 12, 0, 0).getTime();
const NOW = at(2026, 11, 19);
const TODAY = '2026-11-19';
const storage = (values: Record<string, string>) => ({ getItem: (key: string) => values[key] ?? null });
const repos: Repository[] = [];
function setup(options: any = {}) { const r = createRepository({ indexedDB: new IDBFactory(), storage: storage({}), storageManager: {}, basePath: '/teste/', now: () => NOW, ...options }); repos.push(r); return r; }
afterEach(() => { repos.splice(0).forEach(r => r.close()); });
const backup = (state: unknown) => JSON.stringify({ v: 3, app: 'treino12', exportedAt: 1, state });

function preview(over: Record<string, unknown> = {}): OnboardingPreview {
 const r = previewOnboarding({ safety: ['nenhum'], goal: 'recomp', experience: 'iniciante', daysPerWeek: 3, duration: 'medio', place: 'academia', activities: [], body: { sex: 'm', age: 30, heightCm: 175, weightKg: 80, lifestyle: 'pouco' }, ...over });
 if (!r.ok) throw new Error(JSON.stringify(r.errors));
 return r.preview;
}
async function withHistory(r: Repository): Promise<StateV3> {
 const { state } = await r.initialize();
 const s = structuredClone(state);
 s.history.days['2026-11-10'] = { log: { supino: [{ kg: '20', reps: '10', done: true }] }, notes: { geral: 'nota sintética' }, done: true };
 s.history.measurements['2026-11-10'] = { p: '80', c: '90' };
 s.settings.profile = { name: 'Teste', goal: '' };
 return r.save({ state: s, expectedRevision: state.revision });
}

describe('aplicar e desfazer o assistente', () => {
 it('aplica numa gravação: plano, rotina, início, RIR, metas a partir de hoje, perfil e marcações; histórico intacto', async () => {
  const r = setup();
  const before = await withHistory(r);
  const p = preview();
  const after = await applyOnboarding(r, { preview: p, start: '2026-11-23', today: TODAY, expectedRevision: before.revision, now: NOW });
  expect(after.revision).toBe(before.revision + 1);
  expect(after.catalog.plan.order).toEqual(['CIA', 'CIB']);
  expect(after.catalog.plan.sess.UA).toBeUndefined();
  expect(after.catalog.plan.alt).toBeUndefined();
  expect(after.catalog.plan.ex.salto_l).toEqual(before.catalog.plan.ex.salto_l); // exercícios antigos ficam para o histórico
  expect(after.catalog.plan.ex.supino.s).toEqual([3, 3, 4]);
  expect(after.catalog.plan.rir).toHaveLength(12);
  expect(after.catalog.revision).toBe(before.catalog.revision + 1);
  expect(after.settings.sched.map(d => d.k)).toEqual(['gym', 'rest', 'gym', 'rest', 'gym', 'rest', 'rest']);
  expect(after.settings.start).toBe('2026-11-23');
  expect(after.settings.startConfirmed).toBe(true);
  expect(after.settings.dietTargets?.versions.at(-1)?.from).toBe(TODAY);
  expect(dayTargetFor('descanso', TODAY, after.settings).kcal).toBe(1900);
  expect(dayTargetFor('descanso', '2026-11-18', after.settings).kcal).toBe(2100); // dia passado mantém a meta do momento
  expect(after.settings.profile).toEqual({ name: 'Teste', goal: '', age: 30, heightCm: 175, weightKg: 80 });
  expect(after.settings.onboarding).toMatchObject({ v: 1, appliedOn: TODAY, dietTargetsDisabled: false, hideDietNumbers: false });
  expect(after.history).toEqual(before.history);
  expect(canUndoOnboarding(after)).toBe(true);
  expect(() => validateState(structuredClone(after))).not.toThrow();
 });

 it('desfaz: volta plano, rotina, início, metas, perfil e marcações; histórico intacto; 1 nível', async () => {
  const r = setup();
  const before = await withHistory(r);
  const applied = await applyOnboarding(r, { preview: preview(), start: '2026-11-23', today: TODAY, expectedRevision: before.revision, now: NOW });
  const s = structuredClone(applied);
  s.history.days['2026-11-19'] = { done: true }; // registro feito depois de aplicar
  const edited = await r.save({ state: s, expectedRevision: applied.revision });
  const undone = await undoOnboarding(r, { expectedRevision: edited.revision, now: NOW + 1 });
  expect(undone.catalog.plan).toEqual(before.catalog.plan);
  expect(undone.settings.sched).toEqual(before.settings.sched);
  expect(undone.settings.start).toBe(before.settings.start);
  expect('dietTargets' in undone.settings).toBe(false);
  expect(undone.settings.profile).toEqual(before.settings.profile);
  expect('onboarding' in undone.settings).toBe(false);
  expect(undone.history).toEqual(edited.history);
  expect(canUndoOnboarding(undone)).toBe(false);
  expect(Object.keys(undone.recovery).some(k => k.startsWith('before-onboarding-undo:'))).toBe(true);
  await expect(undoOnboarding(r, { expectedRevision: undone.revision })).rejects.toMatchObject({ code: 'validation' });
 });

 it('aplicar duas vezes: desfazer volta só ao penúltimo plano', async () => {
  const r = setup();
  const s0 = await withHistory(r);
  const s1 = await applyOnboarding(r, { preview: preview(), start: '2026-11-23', today: TODAY, expectedRevision: s0.revision, now: NOW });
  const s2 = await applyOnboarding(r, { preview: preview({ experience: 'intermediario', daysPerWeek: 4 }), start: '2026-11-23', today: TODAY, expectedRevision: s1.revision, now: NOW + 5 });
  const back = await undoOnboarding(r, { expectedRevision: s2.revision, now: NOW + 6 });
  expect(back.catalog.plan).toEqual(s1.catalog.plan);
  expect(back.settings.onboarding?.undoKey).toBeUndefined();
  expect(canUndoOnboarding(back)).toBe(false);
 });

 it('revisão desatualizada: conflito e nada gravado', async () => {
  const r = setup();
  const s = await withHistory(r);
  await expect(applyOnboarding(r, { preview: preview(), start: '2026-11-23', today: TODAY, expectedRevision: s.revision - 1 })).rejects.toBeInstanceOf(RepositoryError);
  expect((await r.read()).revision).toBe(s.revision);
 });

 it('data de início inválida é recusada', () => {
  expect(() => applyOnboardingToState(foundation(NOW), preview(), { start: '2026-02-30', today: TODAY, now: NOW })).toThrow(/data de início/);
 });

 it('segurança com meta própria: volta à meta de exemplo (nova versão); usuário novo: metas intactas', () => {
  const st = foundation(NOW);
  const custom = defaultDietTargets(); custom.days.academia = { kcal: 2300, carbs: 280 };
  st.settings.dietTargets = withDietTargetsVersion(undefined, '2026-11-01', custom);
  const p = preview({ safety: ['condicao'] });
  const next = applyOnboardingToState(st, p, { start: '2026-11-23', today: TODAY, now: NOW });
  expect(isExampleTarget(next.settings)).toBe(true);
  expect(effectiveDietTargets(next.settings, '2026-11-10').days.academia.kcal).toBe(2300);
  expect(next.settings.onboarding).toMatchObject({ dietTargetsDisabled: true, hideDietNumbers: false });
  const fresh = applyOnboardingToState(foundation(NOW), p, { start: '2026-11-23', today: TODAY, now: NOW });
  expect('dietTargets' in fresh.settings).toBe(false);
 });

 it('sem dados físicos: metas atuais ficam como estão', () => {
  const st = foundation(NOW);
  const custom = defaultDietTargets(); custom.fatG = 60;
  st.settings.dietTargets = withDietTargetsVersion(undefined, '2026-11-01', custom);
  const next = applyOnboardingToState(st, preview({ body: undefined }), { start: '2026-11-23', today: TODAY, now: NOW });
  expect(next.settings.dietTargets).toEqual(st.settings.dietTargets);
 });

 it('transtorno: esconde metas numéricas e não calcula', () => {
  const next = applyOnboardingToState(foundation(NOW), preview({ safety: ['transtorno'] }), { start: '2026-11-23', today: TODAY, now: NOW });
  expect(next.settings.onboarding).toMatchObject({ dietTargetsDisabled: true, hideDietNumbers: true });
  expect('dietTargets' in next.settings).toBe(false);
 });
});

describe('privacidade: sexo e marcações de saúde nunca são gravados', () => {
 const SENSITIVE = /"sex"|"safety"|"body"|menor18|gestacao|transtorno|nao_informar|"lifestyle"/;
 it('estado salvo, recuperação e backup exportado não contêm sexo nem marcações', async () => {
  const r = setup();
  const s0 = await withHistory(r);
  expect(JSON.stringify(s0)).not.toMatch(SENSITIVE); // linha de base: o estado comum não tem nada disso
  const p = preview({ safety: ['gestacao', 'transtorno', 'menor18', 'condicao'], body: { sex: 'nao_informar', age: 17, heightCm: 160, weightKg: 55, lifestyle: 'muito' } });
  const s1 = await applyOnboarding(r, { preview: p, start: '2026-11-23', today: TODAY, expectedRevision: s0.revision, now: NOW });
  const s2 = await undoOnboarding(r, { expectedRevision: s1.revision, now: NOW + 1 });
  const s3 = await applyOnboarding(r, { preview: preview({ safety: ['transtorno'], body: { sex: 'f', age: 30, heightCm: 165, weightKg: 60 } }), start: '2026-11-23', today: TODAY, expectedRevision: s2.revision, now: NOW + 2 });
  for (const s of [s1, s2, s3, await r.read()]) expect(JSON.stringify(s)).not.toMatch(SENSITIVE);
  const { text } = await r.export();
  expect(text).not.toMatch(SENSITIVE);
  expect(text).not.toMatch(/"f"/);
 });
 it('importação recusa backup com sexo ou marcações em settings.onboarding', async () => {
  const r = setup();
  const s = await withHistory(r);
  const next = applyOnboardingToState(s, preview(), { start: '2026-11-23', today: TODAY, now: NOW });
  await expect(r.prepareImport(backup(next))).resolves.toBeTruthy();
  for (const bad of [{ sex: 'm' }, { safety: ['transtorno'] }]) {
   const b = structuredClone(next); Object.assign(b.settings.onboarding!, bad);
   await expect(r.prepareImport(backup(b))).rejects.toMatchObject({ code: 'validation' });
  }
 });
});

describe('tipo de dia Esporte e backups', () => {
 it('estado v3 antigo (sem esporte, sem rir, sem onboarding, metas com 5 tipos) continua válido sem conversão', async () => {
  const old = foundation(at(2026, 1, 5));
  old.settings.dietTargets = withDietTargetsVersion(undefined, '2026-01-05', defaultDietTargets());
  expect('esporte' in old.settings.dietTargets.versions[0].targets!.days).toBe(false);
  expect(() => validateState(structuredClone(old))).not.toThrow();
  const r = setup();
  await r.initialize();
  const prev = await r.prepareImport(backup(old));
  const imported = await r.confirmImport({ token: prev.token, expectedRevision: prev.expectedRevision });
  expect(imported.settings.sched).toEqual(old.settings.sched);
  expect(imported.settings.dietTargets).toEqual(old.settings.dietTargets);
  // Dia de esporte sem meta própria usa a do vôlei
  expect(dayTargetFor('esporte', '2026-02-01', imported.settings).kcal).toBe(dayTargetFor('volei', '2026-02-01', imported.settings).kcal);
 });
 it('backups v1 e v2 migram como antes', () => {
  for (const v of [1, 2]) {
   const s = migrate({ v, start: '2026-01-05', sched: [{ k: 'bjj', gi: true }, { k: 'gym', s: 'UA' }, { k: 'volei' }, { k: 'rest' }, { k: 'rest' }, { k: 'rest' }, { k: 'rest' }], log: {} } as any, NOW);
   expect(s.settings.sched[2]).toEqual({ k: 'volei' });
   expect('onboarding' in s.settings).toBe(false);
   expect(() => validateState(structuredClone(s))).not.toThrow();
  }
 });
 it('rotina com esporte, acts.esporte, plan.rir e metas com esporte passam na validação', () => {
  const s = applyOnboardingToState(foundation(NOW), preview({ activities: [{ kind: 'esporte', days: [5], label: 'Futebol' }] }), { start: '2026-11-23', today: TODAY, now: NOW });
  s.history.days['2026-11-28'] = { acts: { esporte: true } };
  expect(s.settings.sched[5]).toEqual({ k: 'esporte', label: 'Futebol' });
  const t = s.settings.dietTargets!.versions.at(-1)!.targets!;
  expect(t.days.esporte).toEqual(t.days.volei);
  expect(isValidDietTargets(t)).toBe(true);
  expect(() => validateState(structuredClone(s))).not.toThrow();
  expect(consistency(s.history.days, s.settings.sched, '2026-11-23', '2026-11-29').done).toBe(1);
 });
 it('rejeita rótulo de esporte acima do limite, RIR sem 12 semanas e meta de esporte fora da faixa', () => {
  const s = foundation(NOW);
  const a = structuredClone(s); a.settings.sched[0] = { k: 'esporte', label: 'x'.repeat(61) };
  expect(() => validateState(a)).toThrow(/Nome do esporte/);
  const b = structuredClone(s); b.catalog.plan.rir = Array(11).fill('2');
  expect(() => validateState(b)).toThrow(/RIR/);
  const c = structuredClone(s); const t = defaultDietTargets(); (t.days as any).esporte = { kcal: 900, carbs: 100 };
  c.settings.dietTargets = { schema: 1, versions: [{ from: TODAY, targets: t }] };
  expect(() => validateState(c)).toThrow(/metas/);
  const d = structuredClone(s); d.settings.sched[0] = { k: 'futebol' };
  expect(() => validateState(d)).toThrow(/Atividade/);
 });
 it('formulário de metas preserva esporte quando vem preenchido e aceita sem ele', () => {
  const base = { days: { perna: { kcal: 2600, carbs: 340 }, academia: { kcal: 2450, carbs: 305 }, jiujitsu: { kcal: 2500, carbs: 315 }, volei: { kcal: 2500, carbs: 315 }, descanso: { kcal: 2100, carbs: 215 } }, proteinG: 'auto', fatG: 55, waterL: 3 };
  const without = validateDietTargets(base);
  expect(without.ok && 'esporte' in without.value.days).toBe(false);
  const withSport = validateDietTargets({ ...base, days: { ...base.days, esporte: { kcal: '2400', carbs: '290' } } });
  expect(withSport.ok && withSport.value.days.esporte).toEqual({ kcal: 2400, carbs: 290 });
  const bad = validateDietTargets({ ...base, days: { ...base.days, esporte: { kcal: '', carbs: '1' } } });
  expect(bad.ok).toBe(false);
 });
});
