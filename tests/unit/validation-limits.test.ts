import { describe, expect, it } from 'vitest';
import { foundation, migrate } from '../../src/data/migration';
import { parse, validateState } from '../../src/data/validation';
import { repairStoredState } from '../../src/data/repair';
import { checkStoredProfile } from '../../src/domain/profile';
import { LIMITS as L } from '../../src/domain/limits';

// Tudo sintético: nenhum dado real.
const NOW = 1_800_000_000_000;
const base = () => foundation(NOW) as any;
const withSettings = (patch: Record<string, unknown>) => { const s = base(); Object.assign(s.settings, patch); return s; };
const withProfile = (profile: unknown) => withSettings({ profile });
const day = '2026-03-02';
const withDay = (rec: Record<string, unknown>) => { const s = base(); s.history.days[day] = rec; return s; };
const rejects = (s: unknown, fragment?: string) => { try { validateState(s); } catch (e: any) { expect(e.code).toBe('validation'); if (fragment) expect(e.message).toContain(fragment); return; } throw new Error('deveria ter sido rejeitado'); };
const accepts = (s: unknown) => expect(() => validateState(s)).not.toThrow();
const txt = (n: number) => 'a'.repeat(n);

describe('B1: settings.profile em backup v3', () => {
 it('payload exato da auditoria (nome objeto, objetivo número) é rejeitado com mensagem em português', () => {
  rejects(withProfile({ name: { a: 1 }, goal: 5 }), 'Perfil do backup inválido. Nome: esperado texto.');
 });
 it.each([
  ['nome objeto', { name: { a: 1 }, goal: '' }, 'Nome: esperado texto'],
  ['nome nulo', { name: null, goal: '' }, 'Nome: esperado texto'],
  ['objetivo array', { name: 'x', goal: ['a'] }, 'Objetivo: esperado texto'],
  ['idade texto', { name: 'x', goal: 'y', age: '30' }, 'Idade: esperado número'],
  ['peso NaN (null no JSON)', { name: 'x', goal: 'y', weightKg: null }, 'Peso: esperado número'],
  ['peso Infinity', { name: 'x', goal: 'y', weightKg: Infinity }, 'número finito'],
  ['peso NaN', { name: 'x', goal: 'y', weightKg: NaN }, 'número finito'],
  ['altura texto', { name: 'x', goal: 'y', heightCm: '170' }, 'Altura: esperado número'],
  ['idade fora da faixa', { name: 'x', goal: 'y', age: 9 }, 'Idade: informe um valor entre 10 e 100'],
  ['idade decimal', { name: 'x', goal: 'y', age: 30.5 }, 'Idade: use um número inteiro'],
  ['altura fora da faixa', { name: 'x', goal: 'y', heightCm: 251 }, 'Altura: informe um valor entre 100 e 250'],
  ['peso fora da faixa (baixo)', { name: 'x', goal: 'y', weightKg: 29.9 }, 'Peso: informe um valor entre 30 e 300'],
  ['peso fora da faixa (alto)', { name: 'x', goal: 'y', weightKg: 300.1 }, 'Peso: informe um valor entre 30 e 300'],
  ['perfil texto', 'abc', 'Perfil: esperado objeto'],
  ['perfil nulo', null, 'Perfil: esperado objeto'],
  ['perfil lista', [], 'Perfil: esperado objeto'],
 ])('rejeita %s', (_n, profile, fragment) => rejects(withProfile(profile), fragment as string));
 it('limites exatos: nome 60, objetivo 140, idade 10/100, altura 100/250, peso 30/300', () => {
  accepts(withProfile({ name: txt(60), goal: txt(140), age: 10, heightCm: 100, weightKg: 30 }));
  accepts(withProfile({ name: '', goal: '', age: 100, heightCm: 250, weightKg: 300 }));
  accepts(withProfile({ name: 'Fulano de Teste', goal: 'Meta de teste', weightKg: 78.2 }));
  rejects(withProfile({ name: txt(61), goal: '' }), 'Nome: use no máximo 60');
  rejects(withProfile({ name: '', goal: txt(141) }), 'Objetivo: use no máximo 140');
 });
 it('perfil ausente ou vazio continua válido (backups antigos)', () => { accepts(base()); accepts(withProfile({ name: '', goal: '' })); accepts(withProfile({})); });
 it('checkStoredProfile reaproveita as faixas do formulário e devolve erros por campo', () => {
  expect(Object.keys(checkStoredProfile({ name: 1, goal: 2, age: 'x', weightKg: 1 })).sort()).toEqual(['age', 'goal', 'name', 'weightKg']);
  expect(checkStoredProfile({ name: 'ok', goal: 'ok', age: 30, heightCm: 175, weightKg: 70 })).toEqual({});
 });
});

describe('B1: demais campos de settings lidos pela interface', () => {
 it('notificações, sono, revisão da dieta, tema e início', () => {
  rejects(withSettings({ notifications: 'sim' }), 'Notificações');
  rejects(withSettings({ notifications: { enabled: 'sim', restEnd: true } }), 'Notificações');
  rejects(withSettings({ notifications: { enabled: true } }), 'Aviso de descanso');
  accepts(withSettings({ notifications: { enabled: true, restEnd: false } }));
  rejects(withSettings({ sleepOk: { 3: 'sim' } }), 'Sono');
  rejects(withSettings({ sleepOk: [] }), 'Sono');
  accepts(withSettings({ sleepOk: { 3: true, 4: false } }));
  rejects(withSettings({ dietReviewDismissed: { a: 1 } }), 'Revisão da dieta');
  accepts(withSettings({ dietReviewDismissed: '2026-03-02' }));
  rejects(withSettings({ theme: { a: 1 } }), 'Tema inválido');
  rejects(withSettings({ startConfirmed: 'sim' }), 'Início confirmado');
  rejects(withSettings({ start: { a: 1 } }));
  rejects(withSettings({ sched: 'x' }), 'Rotina');
 });
 it('treinos do dia, atividades, notas e dieta do dia', () => {
  rejects(withDay({ workouts: { UA: { sessionId: { x: 1 }, status: 'done' } } }), 'Treino do dia');
  rejects(withDay({ workouts: { UA: { sessionId: 'UA', status: 'x' } } }), 'situação');
  rejects(withDay({ workout: { sessionId: 'UA', status: 'done', sets: '3' } }), 'sets');
  accepts(withDay({ workouts: { UA: { sessionId: 'UA', status: 'done', startedAt: 1, finishedAt: 2, sets: 3, volume: 10 } }, workout: { sessionId: 'UA', status: 'partial', startedAt: 1, sets: 1, volume: 0 }, acts: { gym: true, bjj: false } }));
  rejects(withDay({ acts: { gym: 'sim' } }), 'Atividade');
  rejects(withDay({ acts: [] }), 'Atividades');
  rejects(withDay({ notes: { e: { a: 1 } } }), 'Nota');
  rejects(withDay({ over: { a: 1 } }), 'Substituição');
  rejects(withDay({ diet: { pick: { cafe: 5 } } }), 'pick');
 });
 it('catálogo: nomes, observações e receitas devem ser texto', () => {
  const s1 = base(); const ex = Object.values(s1.catalog.plan.ex)[0] as any; ex.n = { a: 1 }; rejects(s1, 'Nome do exercício');
  const s2 = base(); const ex2 = Object.values(s2.catalog.plan.ex)[0] as any; ex2.t = 5; rejects(s2, 'Observação');
  const s3 = base(); (Object.values(s3.catalog.plan.sess)[0] as any).name = []; rejects(s3, 'Nome do treino');
  const s4 = base(); s4.catalog.recipes[0].dica = { a: 1 }; rejects(s4, 'dica');
  const s5 = base(); s5.catalog.recipes[0].t = 7; rejects(s5, 't: esperado texto');
  const s6 = base(); (Object.values(s6.catalog.diet)[0] as any)[0].name = { a: 1 }; rejects(s6, 'Refeição');
  const s7 = base(); s7.history.measurements['2026-03-02'] = { p: 70 }; rejects(s7, 'p: esperado texto');
 });
});

describe('B2: limites por campo (no limite passa, acima falha)', () => {
 const plan = (fn: (p: any) => void) => { const s = base(); fn(s.catalog.plan); return s; };
 const firstEx = (p: any) => Object.values(p.ex)[0] as any;
 const firstSess = (p: any) => Object.values(p.sess)[0] as any;
 it.each([
  ['nome do exercício', (p: any) => { firstEx(p).n = txt(L.name); }, (p: any) => { firstEx(p).n = txt(L.name + 1); }],
  ['observação do exercício', (p: any) => { firstEx(p).t = txt(L.exerciseNote); }, (p: any) => { firstEx(p).t = txt(L.exerciseNote + 1); }],
  ['nome do treino', (p: any) => { firstSess(p).name = txt(L.name); }, (p: any) => { firstSess(p).name = txt(L.name + 1); }],
  ['descrição do treino', (p: any) => { firstSess(p).sub = txt(L.sub); }, (p: any) => { firstSess(p).sub = txt(L.sub + 1); }],
  ['duração do treino', (p: any) => { firstSess(p).min = txt(L.min); }, (p: any) => { firstSess(p).min = txt(L.min + 1); }],
  ['repetições', (p: any) => { firstEx(p).r = [txt(L.value)]; }, (p: any) => { firstEx(p).r = [txt(L.value + 1)]; }],
  ['colunas de séries', (p: any) => { firstEx(p).s = Array(L.seriesColumns).fill(3); }, (p: any) => { firstEx(p).s = Array(L.seriesColumns + 1).fill(3); }],
  ['item do condomínio', (p: any) => { p.cond = [txt(L.line)]; }, (p: any) => { p.cond = [txt(L.line + 1)]; }],
  ['exercícios do treino', (p: any) => { firstSess(p).ex = Array(L.sessionExercises).fill('a'); }, (p: any) => { firstSess(p).ex = Array(L.sessionExercises + 1).fill('a'); }],
  ['ordem', (p: any) => { p.order = Array(L.order).fill('a'); }, (p: any) => { p.order = Array(L.order + 1).fill('a'); }],
 ])('plano: %s', (_n, ok, bad) => { accepts(plan(ok)); rejects(plan(bad), 'no máximo'); });
 it('quantidade de exercícios e treinos', () => {
  const many = (n: number) => Object.fromEntries(Array.from({ length: n }, (_, i) => [`e${i}`, { n: 'x', s: [3], r: ['8'], m: 'kg' }]));
  accepts(plan(p => { p.ex = many(L.exercises); })); rejects(plan(p => { p.ex = many(L.exercises + 1); }), 'Exercícios');
  const sess = (n: number) => Object.fromEntries(Array.from({ length: n }, (_, i) => [`t${i}`, { name: 'x', ex: [] }]));
  accepts(plan(p => { p.sess = sess(L.sessions); })); rejects(plan(p => { p.sess = sess(L.sessions + 1); }), 'Treinos');
 });
 it('nota do dia, valores de série e medidas', () => {
  accepts(withDay({ notes: { e: txt(L.dayNote) } })); rejects(withDay({ notes: { e: txt(L.dayNote + 1) } }), 'Nota');
  accepts(withDay({ log: { e: [{ kg: txt(L.value), reps: '8' }] } })); rejects(withDay({ log: { e: [{ kg: txt(L.value + 1) }] } }), 'kg');
  const m = (v: string) => { const s = base(); s.history.measurements[day] = { p: v }; return s; };
  accepts(m(txt(L.value))); rejects(m(txt(L.value + 1)), 'p: use no máximo');
  accepts(withDay({ over: txt(L.id) })); rejects(withDay({ over: txt(L.id + 1) }), 'Substituição');
 });
 it('quantidade de entradas por dia e no histórico', () => {
  const entries = (n: number, v: unknown) => Object.fromEntries(Array.from({ length: n }, (_, i) => [`k${i}`, v]));
  accepts(withDay({ notes: entries(L.perDayEntries, 'x') })); rejects(withDay({ notes: entries(L.perDayEntries + 1, 'x') }), 'Notas');
  accepts(withDay({ cond: entries(L.perDayEntries, true) })); rejects(withDay({ cond: entries(L.perDayEntries + 1, true) }), 'Condomínio');
  accepts(withDay({ log: { e: Array(L.rowsPerExercise).fill({ kg: '1' }) } })); rejects(withDay({ log: { e: Array(L.rowsPerExercise + 1).fill({ kg: '1' }) } }), 'Séries');
  accepts(withDay({ log: entries(L.exercisesPerDay, []) })); rejects(withDay({ log: entries(L.exercisesPerDay + 1, []) }), 'Registros');
  const days = (n: number) => { const s = base(); const t0 = Date.UTC(2000, 0, 1); for (let i = 0; i < n; i++) s.history.days[new Date(t0 + i * 86400000).toISOString().slice(0, 10)] = {}; return s; };
  accepts(days(L.days)); rejects(days(L.days + 1), 'Dias');
  const meas = (n: number) => { const s = base(); const t0 = Date.UTC(2000, 0, 1); for (let i = 0; i < n; i++) s.history.measurements[new Date(t0 + i * 86400000).toISOString().slice(0, 10)] = {}; return s; };
  accepts(meas(L.measurements)); rejects(meas(L.measurements + 1), 'Medidas');
 });
 it('receitas e cardápio', () => {
  const r = (fn: (x: any) => void) => { const s = base(); fn(s.catalog.recipes[0]); return s; };
  accepts(r(x => { x.n = txt(L.name); x.dica = txt(L.recipeText); x.pas = [txt(L.line)]; })); rejects(r(x => { x.n = txt(L.name + 1); }), 'Nome receita');
  rejects(r(x => { x.dica = txt(L.recipeText + 1); }), 'dica'); rejects(r(x => { x.pas = [txt(L.line + 1)]; }), 'pas');
  rejects(r(x => { x.ing = Array(L.recipeLines + 1).fill('a'); }), 'ing');
  const o = (fn: (x: any) => void) => { const s = base(); fn((Object.values(s.catalog.diet)[0] as any)[0]); return s; };
  accepts(o(x => { x.name = txt(L.name); x.items = [txt(L.line)]; })); rejects(o(x => { x.name = txt(L.name + 1); }), 'Refeição'); rejects(o(x => { x.items = [txt(L.line + 1)]; }), 'Ingrediente');
 });
 it('snapshots e recovery: quantidade e tamanho', () => {
  const snaps = (n: number) => { const s = base(); for (let i = 0; i < n; i++) s.snapshots[`s${i}`] = {}; return s; };
  accepts(snaps(L.snapshots)); rejects(snaps(L.snapshots + 1), 'Snapshots');
  const rec = (n: number) => { const s = base(); for (let i = 0; i < n; i++) s.recovery[`r${i}`] = {}; return s; };
  accepts(rec(L.recovery)); rejects(rec(L.recovery + 1), 'Recuperação');
  const big = (n: number) => { const s = base(); s.snapshots.x = { blob: txt(n) }; return s; };
  accepts(big(L.snapshotChars - 20)); rejects(big(L.snapshotChars), 'Snapshot: excede');
  const s = base(); s.snapshots.x = 'texto'; rejects(s, 'Snapshot: esperado objeto');
 });
 it('mensagens dizem o campo, o limite e o recebido (nada é truncado)', () => {
  rejects(withDay({ notes: { e: txt(L.dayNote + 5) } }), `use no máximo ${L.dayNote} caracteres (recebido: ${L.dayNote + 5})`);
 });
});

describe('legados v1 e v2 continuam entrando sem conversão', () => {
 const legacy = (v: number) => ({ v, start: '2026-01-05', log: { '2026-03-02': { e: [{ kg: '22,5', reps: '08', done: true }] } }, meas: { '2026-03-03': { p: '70,5', c: '80' } }, notes: { '2026-03-02': { e: 'nota' } }, diet: { '2026-03-02': { pick: { cafe: 'a' }, water: 2 } }, done: { '2026-03-02': true }, feel: { '2026-03-02': 4 }, opt: { '2026-03-02': true } });
 it.each([1, 2])('v%i antigo com campos mínimos', (v) => { const s = migrate(parse(JSON.stringify(legacy(v))), NOW); accepts(s); expect(s.history.measurements['2026-03-03'].p).toBe('70,5'); });
 it('v1 sem nenhum campo novo e só com start', () => { accepts(migrate(parse('{"v":1,"start":"2026-01-05"}'), NOW)); });
 it('v3 sem os campos novos (sem profile, notifications, sleepOk, workouts, acts)', () => { const s = base(); accepts(s); expect(s.settings.profile).toBeUndefined(); });
 it('v3 completo com perfil e treinos do dia no formato que o app grava', () => {
  const s = withProfile({ name: 'Pessoa Teste', goal: 'Teste', age: 30, heightCm: 175, weightKg: 78.2 });
  s.settings.notifications = { enabled: true, restEnd: true }; s.settings.sleepOk = { 0: true };
  s.history.days[day] = { done: true, workouts: { UA: { sessionId: 'UA', startedAt: 1, finishedAt: 2, status: 'done', sets: 3, volume: 100 } }, workout: { sessionId: 'UA', startedAt: 1, status: 'partial', sets: 1, volume: 5 }, acts: { gym: true } };
  accepts(s);
 });
 it('as sementes do app (plano, dieta, receitas) cabem folgadamente nos limites', () => { accepts(base()); });
 it('limites de legado: dias, medidas', () => {
  const t0 = Date.UTC(2000, 0, 1); const logs: Record<string, unknown> = {}; for (let i = 0; i <= L.days; i++) logs[new Date(t0 + i * 86400000).toISOString().slice(0, 10)] = {};
  expect(() => migrate(parse(JSON.stringify({ v: 2, notes: logs })), NOW)).toThrow(/no máximo/);
  expect(() => migrate(parse(JSON.stringify({ v: 2, plan: { ex: {}, sess: {}, order: [], cond: [txt(L.line + 1)] } })), NOW)).toThrow(/Item/);
 });
});

describe('repairStoredState (estado salvo já inválido)', () => {
 it('perfil válido ou ausente não muda nada', () => { const s = withProfile({ name: 'x', goal: 'y' }); expect(repairStoredState(s, NOW)).toEqual({ state: s, repaired: false }); expect(repairStoredState(base(), NOW).repaired).toBe(false); });
 it('corrige só os campos inválidos, guarda o original e não altera a entrada', () => {
  const s = withProfile({ name: { a: 1 }, goal: 'meta ok', age: '30', weightKg: 70, extra: 'k' }); const before = structuredClone(s);
  const r = repairStoredState(s, NOW);
  expect(s).toEqual(before);
  expect(r.repaired).toBe(true);
  expect(r.state.settings.profile).toEqual({ name: '', goal: 'meta ok', weightKg: 70, extra: 'k' });
  const entry = Object.entries(r.state.recovery).find(([k]) => k.startsWith('invalid-profile:'))![1] as any;
  expect(entry.profile).toEqual(before.settings.profile); expect(entry.fields.sort()).toEqual(['age', 'name']);
  accepts(r.state);
 });
 it('perfil que nem é objeto é removido e preservado', () => {
  const r = repairStoredState(withProfile('texto'), NOW); expect(r.state.settings.profile).toBeUndefined();
  expect((Object.values(r.state.recovery)[0] as any).profile).toBe('texto'); accepts(r.state);
 });
});
