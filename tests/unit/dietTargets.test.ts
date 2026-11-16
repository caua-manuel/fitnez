import { describe, expect, it } from 'vitest';
import { dayTarget, dayTargetForProfile, progress } from '../../src/domain/diet';
import {
 DAY_TYPES, carbsFromRest, dayTargetFor, defaultDietTargets, isExampleTarget, isValidDietTargetsSetting, kcalFromMacros, macroTolerance,
 pushDietTargetsVersion, resolveDietTargets, restoreDefaultVersion, confirmExampleVersion, settingsWithDietTargets, validateDietTargets, waterCups, withDietTargetsVersion
} from '../../src/domain/dietTargets';
import type { DietTargets, DietTargetsInput } from '../../src/domain/dietTargets';

// Entrada base: o padrão de exemplo. `over` altera todos os tipos de dia (kcal, carboidrato) e os globais.
function input(over: { kcal?: unknown; carbs?: unknown; p?: unknown; g?: unknown; w?: unknown } = {}): DietTargetsInput {
 const days: any = {};
 for (const t of DAY_TYPES) days[t] = { kcal: over.kcal ?? 2450, carbs: over.carbs ?? 305 };
 return { days, proteinG: 'p' in over ? over.p : 185, fatG: 'g' in over ? over.g : 55, waterL: 'w' in over ? over.w : 3 };
}
const codes = (r: ReturnType<typeof validateDietTargets>) => (r.ok ? r.warnings.map(w => w.code) : []);
const T: DietTargets = (() => { const t = defaultDietTargets(); t.days.academia = { kcal: 2300, carbs: 280 }; t.proteinG = 160; t.fatG = 60; t.waterL = 3.5; return t; })();

describe('cálculo e coerência (1 a 10)', () => {
 it.each([[2450, 185, 305, 55, 2455, 123, 5], [2600, 185, 340, 55, 2595, 130, 5], [2500, 185, 315, 55, 2495, 125, 5], [2100, 185, 215, 55, 2095, 105, 5], [2000, 150, 285, 40, 2100, 100, 100], [2000, 150, 286, 40, 2104, 100, 104]])(
  'kcal %i p %i c %i g %i', (kcal, p, c, g, sum, tol, diff) => {
   expect(kcalFromMacros(p, c, g)).toBe(sum); expect(macroTolerance(kcal)).toBe(tol); expect(Math.abs(sum - kcal)).toBe(diff);
  });
 it('padrões não avisam; limite inclusivo; acima avisa', () => {
  const types = ['perna', 'academia', 'jiujitsu', 'volei', 'descanso'] as const;
  const r = validateDietTargets({ ...input(), days: Object.fromEntries(types.map(t => [t, { kcal: defaultDietTargets().days[t].kcal, carbs: defaultDietTargets().days[t].carbs }])) });
  expect(r.ok && r.warnings).toEqual([]);
  expect(codes(validateDietTargets(input({ kcal: 2000, carbs: 285, p: 150, g: 40 })))).toEqual([]); // 5
  expect(codes(validateDietTargets(input({ kcal: 2000, carbs: 286, p: 150, g: 40 })))).toContain('macros-incoerentes'); // 6
  const seven = validateDietTargets(input({ kcal: 2000 })); // 7
  expect(seven.ok).toBe(true); expect(codes(seven)).toContain('macros-incoerentes');
  expect(codes(validateDietTargets(input({ kcal: 2450, carbs: 340 })))).toContain('macros-incoerentes'); // 8
 });
 it('mensagem de incoerência usa milhar e vírgula', () => {
  const r = validateDietTargets(input({ kcal: 2000 }));
  expect(r.ok && r.warnings[0].message).toBe('Proteína, carboidrato e gordura somam cerca de 2.455 kcal, diferente das calorias informadas (2.000 kcal). Você pode salvar assim.');
 });
 it('carbsFromRest (9, 10)', () => { expect(carbsFromRest(2450, 185, 55)).toBe(304); expect(carbsFromRest(1000, 200, 100)).toBe(0); });
});

describe('limites absolutos e avisos (11 a 26)', () => {
 const err = (r: ReturnType<typeof validateDietTargets>, key: string) => !r.ok && key in r.errors;
 it('kcal 11 a 15', () => {
  expect(err(validateDietTargets(input({ kcal: 999 })), 'days.perna.kcal')).toBe(true);
  expect(codes(validateDietTargets(input({ kcal: 1000 })))).toContain('kcal-baixa');
  expect(codes(validateDietTargets(input({ kcal: 6000 })))).toContain('kcal-alta');
  expect(validateDietTargets(input({ kcal: 6001 })).ok).toBe(false);
  expect(codes(validateDietTargets(input({ kcal: 1399 })))).toContain('kcal-baixa');
  expect(codes(validateDietTargets(input({ kcal: 1400 })))).not.toContain('kcal-baixa');
  expect(codes(validateDietTargets(input({ kcal: 4500 })))).not.toContain('kcal-alta');
  expect(codes(validateDietTargets(input({ kcal: 4501 })))).toContain('kcal-alta');
 });
 it('proteína 16', () => {
  expect(validateDietTargets(input({ p: 19 })).ok).toBe(false);
  expect(validateDietTargets(input({ p: 20 })).ok).toBe(true);
  expect(validateDietTargets(input({ p: 400 })).ok).toBe(true);
  expect(validateDietTargets(input({ p: 401 })).ok).toBe(false);
 });
 it('carboidrato 17', () => {
  expect(validateDietTargets(input({ carbs: -1 })).ok).toBe(false);
  expect(validateDietTargets(input({ carbs: 0 })).ok).toBe(true);
  expect(validateDietTargets(input({ carbs: 800 })).ok).toBe(true);
  expect(validateDietTargets(input({ carbs: 801 })).ok).toBe(false);
 });
 it('gordura 18 e 19', () => {
  expect(validateDietTargets(input({ g: 19 })).ok).toBe(false);
  expect(codes(validateDietTargets(input({ g: 20 })))).toContain('gordura-baixa');
  expect(validateDietTargets(input({ g: 300 })).ok).toBe(true);
  expect(validateDietTargets(input({ g: 301 })).ok).toBe(false);
  expect(codes(validateDietTargets(input({ g: 29 })))).toContain('gordura-baixa');
  expect(codes(validateDietTargets(input({ g: 30 })))).not.toContain('gordura-baixa');
 });
 it('água 20 a 23', () => {
  expect(validateDietTargets(input({ w: 0.5 })).ok).toBe(false);
  expect(validateDietTargets(input({ w: 1 })).ok).toBe(true);
  const six = validateDietTargets(input({ w: 6 })); expect(six.ok).toBe(true); expect(codes(six)).toContain('agua-alta');
  expect(validateDietTargets(input({ w: 6.5 })).ok).toBe(false);
  const v = validateDietTargets(input({ w: '3,5' })); expect(v.ok && v.value.waterL).toBe(3.5);
  expect(err(validateDietTargets(input({ w: 2.75 })), 'waterL')).toBe(true);
  expect(codes(validateDietTargets(input({ w: 5 })))).not.toContain('agua-alta');
  expect(codes(validateDietTargets(input({ w: 5.5 })))).toContain('agua-alta');
 });
 it('entrada inválida 24 a 26', () => {
  expect(validateDietTargets(input({ kcal: 2450.5 })).ok).toBe(false);
  const dec = validateDietTargets(input({ kcal: '2450,5' })); expect(!dec.ok && dec.errors['days.perna.kcal']).toMatch(/número inteiro/);
  for (const bad of ['', 'abc', NaN, Infinity, -100]) expect(validateDietTargets(input({ kcal: bad })).ok).toBe(false);
  const empty = validateDietTargets(input({ kcal: '' })); expect(!empty.ok && empty.errors['days.perna.kcal']).toBe('Calorias: preencha este campo.');
  const range = validateDietTargets(input({ kcal: 999 })); expect(!range.ok && range.errors['days.perna.kcal']).toBe('Calorias: informe um valor entre 1.000 e 6.000 kcal.');
  const p = validateDietTargets(input({ p: ' 185 ' })); expect(p.ok && p.value.proteinG).toBe(185);
  expect(validateDietTargets({ ...input(), days: {} }).ok).toBe(false); // dias obrigatórios
 });
 it('proteína automática vira null e usa o peso na coerência', () => {
  const r = validateDietTargets(input({ p: null }), { weightKg: 80 });
  expect(r.ok && r.value.proteinG).toBeNull();
  expect(r.ok && r.warnings.filter(w => w.code.startsWith('proteina'))).toEqual([]);
 });
});

describe('proteína por g/kg (27 a 32)', () => {
 it('com peso 80', () => {
  expect(codes(validateDietTargets(input({ p: 63 }), { weightKg: 80 }))).toContain('proteina-baixa');
  expect(codes(validateDietTargets(input({ p: 64 }), { weightKg: 80 }))).not.toContain('proteina-baixa');
  expect(codes(validateDietTargets(input({ p: 240 }), { weightKg: 80 }))).not.toContain('proteina-alta');
  expect(codes(validateDietTargets(input({ p: 241 }), { weightKg: 80 }))).toContain('proteina-alta');
 });
 it('sem peso ou peso inválido não avisa g/kg', () => {
  expect(codes(validateDietTargets(input({ p: 63 })))).not.toContain('proteina-baixa');
  expect(codes(validateDietTargets(input({ p: 63 }), { weightKg: 29 }))).not.toContain('proteina-baixa');
 });
});

describe('resolução por data (33 a 43)', () => {
 const day = (d: string, type: any = 'academia', settings: any = undefined, profile?: any) => dayTargetFor(type, d, settings, profile);
 const V = { dietTargets: { schema: 1, versions: [{ from: '2026-11-10', targets: T }] } };
 const pick = (t: any) => [t.kcal, t.carbs, t.protein, t.fat, t.waterL];
 it('sem dietTargets (33 a 35)', () => {
  expect(pick(day('2026-11-16'))).toEqual([2450, 305, 185, 55, 3]);
  expect(pick(day('2026-11-16', 'academia', {}, { weightKg: 80 }))).toEqual([2450, 305, 192, 55, 3]);
  expect(pick(day('2026-11-16', 'academia', {}, { weightKg: 29 }))).toEqual([2450, 305, 185, 55, 3]);
  expect(isExampleTarget({})).toBe(true); expect(isExampleTarget(undefined)).toBe(true);
 });
 it('versão por data (36 a 39)', () => {
  expect(pick(day('2026-11-10', 'academia', V, { weightKg: 80 }))).toEqual([2300, 280, 160, 60, 3.5]);
  expect(pick(day('2026-11-09', 'academia', V, { weightKg: 80 }))).toEqual([2450, 305, 192, 55, 3]);
  expect(pick(day('2026-12-01', 'academia', V))).toEqual([2300, 280, 160, 60, 3.5]);
  const auto = { dietTargets: { schema: 1, versions: [{ from: '2026-11-10', targets: { ...T, proteinG: null } }] } };
  expect(day('2026-11-12', 'academia', auto, { weightKg: 80 }).protein).toBe(192);
  expect(day('2026-11-12', 'academia', { ...auto, profile: { weightKg: 90 } }).protein).toBe(216); // perfil vem das settings
 });
 it('restaurar padrão preserva o passado (40)', () => {
  const s = { dietTargets: { schema: 1, versions: [{ from: '2026-11-10', targets: T }, { from: '2026-11-20', targets: null }] } };
  expect(day('2026-11-15', 'academia', s).kcal).toBe(2300);
  expect(day('2026-11-20', 'academia', s).kcal).toBe(2450);
  expect(isExampleTarget(s)).toBe(true);
  expect(resolveDietTargets(s, '2026-11-15').isExample).toBe(false);
  expect(resolveDietTargets(s, '2026-11-20').isExample).toBe(true);
  expect(isExampleTarget(V)).toBe(false);
 });
 it('push: mesmo dia substitui (41), limite de 100 (42), relógio voltou (43)', () => {
  const a = pushDietTargetsVersion([], '2026-11-10', T);
  const b = pushDietTargetsVersion(a, '2026-11-10', null);
  expect(b).toEqual([{ from: '2026-11-10', targets: null }]); expect(a[0].targets).toEqual(T);
  let list = [] as ReturnType<typeof pushDietTargetsVersion>;
  const base = Date.UTC(2026, 0, 1);
  for (let i = 0; i < 101; i++) list = pushDietTargetsVersion(list, new Date(base + i * 86400000).toISOString().slice(0, 10), T);
  expect(list).toHaveLength(100);
  expect(list[0].from).toBe('1970-01-01');
  expect(list[1].from).toBe('2026-01-03');
  expect(isValidDietTargetsSetting({ schema: 1, versions: list })).toBe(true);
  const back = pushDietTargetsVersion([{ from: '2026-11-10', targets: T }], '2026-11-01', null);
  expect(back).toEqual([{ from: '2026-11-10', targets: null }]);
  const two = pushDietTargetsVersion(pushDietTargetsVersion([], '2026-11-10', T), '2026-11-15', null);
  expect(two.map(v => v.from)).toEqual(['2026-11-10', '2026-11-15']);
 });
 it('não altera a entrada e permite desfazer', () => {
  const original = { schema: 1 as const, versions: [{ from: '2026-11-10', targets: T }] };
  const snapshot = structuredClone(original);
  const next = restoreDefaultVersion(original, '2026-11-20');
  expect(original).toEqual(snapshot);
  expect(next.versions).toHaveLength(2);
  const settings = settingsWithDietTargets({ start: 'x', dietTargets: next } as any, original);
  expect(settings.dietTargets).toEqual(snapshot);
  expect('dietTargets' in settingsWithDietTargets(settings, undefined)).toBe(false);
 });
 it('"usar esta meta" confirma o padrão com proteína automática', () => {
  const s = confirmExampleVersion(undefined, '2026-11-16');
  expect(s.versions[0].targets).toEqual(defaultDietTargets());
  expect(s.versions[0].targets?.proteinG).toBeNull();
  expect(isExampleTarget({ dietTargets: s })).toBe(false);
  expect(pick(day('2026-11-16', 'academia', { dietTargets: s }, { weightKg: 80 }))).toEqual([2450, 305, 192, 55, 3]);
  expect(withDietTargetsVersion(undefined, '2026-11-16', null).versions).toEqual([{ from: '2026-11-16', targets: null }]);
 });
});

describe('sanidade (44 a 46) e regressão do padrão', () => {
 it('sem edição equivale exatamente ao comportamento anterior, para todos os tipos e pesos', () => {
  for (const t of DAY_TYPES) for (const profile of [undefined, null, {}, { weightKg: 80 }, { weightKg: 29 }, { weightKg: 77.3 }]) {
   expect(dayTargetFor(t, '2026-11-16', undefined, profile)).toEqual(dayTargetForProfile(t, profile));
   expect(dayTargetFor(t, '2026-11-16', {}, profile)).toEqual(dayTargetForProfile(t, profile));
  }
  const exp = { perna: [2600, 340], academia: [2450, 305], jiujitsu: [2500, 315], volei: [2500, 315], descanso: [2100, 215] } as const;
  for (const t of DAY_TYPES) { const d = dayTargetFor(t, '2026-11-16', undefined); expect([d.kcal, d.carbs]).toEqual(exp[t]); expect([d.fat, d.waterL]).toEqual([55, 3]); }
  expect(dayTarget('volei', { protein: 200, fat: 60 })).toMatchObject({ protein: 200, fat: 60, kcal: 2500, carbs: 315, waterL: 3 });
 });
 it('progress com meta padrão e carboidrato 0 (45)', () => {
  const t = dayTargetFor('academia', '2026-11-16', undefined);
  expect(progress({ kcal: 1225, p: 92.5, c: 152.5, g: 55 }, t)).toEqual(progress({ kcal: 1225, p: 92.5, c: 152.5, g: 55 }, dayTarget('academia')));
  expect(progress({ kcal: 10, p: 1, c: 5, g: 1 }, { ...t, carbs: 0 }).carbs).toBe(0);
 });
 it('copos de água (46)', () => { expect(waterCups(3)).toBe(6); expect(waterCups(3.5)).toBe(7); expect(waterCups(1)).toBe(2); });
});

describe('formato salvo', () => {
 const ok = { schema: 1, versions: [{ from: '2026-11-10', targets: T }, { from: '2026-11-20', targets: null }] };
 it('aceita válido e vazio; rejeita fora do limite, ordem, data e schema', () => {
  expect(isValidDietTargetsSetting(ok)).toBe(true);
  expect(isValidDietTargetsSetting({ schema: 1, versions: [] })).toBe(true);
  const bad = structuredClone(ok) as any; bad.versions[0].targets.days.perna.kcal = 999;
  expect(isValidDietTargetsSetting(bad)).toBe(false);
  expect(isValidDietTargetsSetting({ schema: 2, versions: [] })).toBe(false);
  expect(isValidDietTargetsSetting({ schema: 1, versions: [{ from: '2026-11-20', targets: null }, { from: '2026-11-20', targets: null }] })).toBe(false);
  expect(isValidDietTargetsSetting({ schema: 1, versions: [{ from: '2026-02-30', targets: null }] })).toBe(false);
  const water = structuredClone(ok) as any; water.versions[0].targets.waterL = 2.75;
  expect(isValidDietTargetsSetting(water)).toBe(false);
  expect(isValidDietTargetsSetting({ schema: 1, versions: Array.from({ length: 101 }, (_, i) => ({ from: `2026-01-${String(i % 28 + 1).padStart(2, '0')}`, targets: null })) })).toBe(false);
 });
});
