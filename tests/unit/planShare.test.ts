import { describe, expect, it } from 'vitest';
import { foundation } from '../../src/data/migration';
import { buildPlanShare, checkPlanShare, parsePlanShare, planShareDiff, planShareFilename, PLAN_SHARE_LIMITS as L } from '../../src/domain/planShare';
import type { PlanShareFile } from '../../src/domain/planShare';

// ADR 011, 1.3. Plano de fábrica e dados sintéticos; nada pessoal.
const base = () => foundation(Date.UTC(2026, 10, 20, 12));
function built(includeNotes = true): PlanShareFile { const r = buildPlanShare(base(), { name: 'Plano do amigo', includeNotes }); if (!r.ok) throw new Error(r.error); return r.file; }
const small = (): any => ({ app: 'fitnez-plano', v: 1, name: 'Teste', plan: { ex: { a: { n: 'Supino', s: [3, 3, 3], r: ['8–12', '8–12', '8–12'], m: 'kg' } }, sess: { A: { name: 'Treino A', ex: ['a'] } }, order: ['A'] } });
const ok = (v: unknown) => checkPlanShare(v).ok;
const keysDeep = (v: unknown, out = new Set<string>()): Set<string> => { if (v && typeof v === 'object') for (const [k, c] of Object.entries(v)) { if (!Array.isArray(v)) out.add(k); keysDeep(c, out); } return out; };

describe('buildPlanShare e parsePlanShare', () => {
 it('ida e volta dá o mesmo plano', () => {
  const r = buildPlanShare(base(), { name: 'Plano do amigo', includeNotes: true });
  if (!r.ok) throw new Error(r.error);
  const back = parsePlanShare(r.text);
  expect(back.ok).toBe(true); if (!back.ok) return;
  expect(back.value).toEqual(r.file);
  expect(r.filename).toBe('fitnez-plano-plano-do-amigo.json');
  const plan = base().catalog.plan;
  expect(back.value.plan.order).toEqual(plan.order);
  for (const [k, s] of Object.entries(back.value.plan.sess)) expect(s.ex).toEqual(plan.sess[k].ex);
  for (const [k, e] of Object.entries(back.value.plan.ex)) { expect(e.n).toBe(plan.ex[k].n); expect(e.s).toEqual(plan.ex[k].s); expect(e.r).toEqual(plan.ex[k].r); expect(e.t).toBe(plan.ex[k].t); }
  expect(back.value.sched).toEqual(base().settings.sched);
 });
 it('nada pessoal no arquivo (lista de chaves)', () => {
  const s = base();
  s.history.days['2026-11-19'] = { log: { supino: [{ kg: '30', reps: '8', done: true }] }, notes: { supino: 'nota pessoal' } };
  s.history.measurements['2026-11-19'] = { p: '80,1' };
  s.settings.profile = { name: 'Fulano Sintético', goal: 'x', weightKg: 80 };
  s.settings.exerciseNotes = { supino: 'banco na 4' };
  s.settings.plates = { bar: 20 };
  const r = buildPlanShare(s, { name: 'Meu plano', includeNotes: true }); if (!r.ok) throw new Error(r.error);
  const allowed = new Set(['app', 'v', 'name', 'plan', 'sched', 'ex', 'sess', 'order', 'alt', 'cond', 'rir', 'n', 's', 'r', 'm', 't', 'rest', 'g', 'sub', 'min', 'k', 'gi', 'label', ...Object.keys(r.file.plan.ex), ...Object.keys(r.file.plan.sess)]);
  for (const k of keysDeep(JSON.parse(r.text))) expect(allowed.has(k), k).toBe(true);
  for (const secret of ['Fulano', 'nota pessoal', 'banco na 4', '80,1', s.settings.start, 'recovery', 'meta']) expect(r.text).not.toContain(secret);
 });
 it('sem observações quando desmarcado', () => { expect(Object.values(built(false).plan.ex).some(e => e.t !== undefined)).toBe(false); expect(Object.values(built(true).plan.ex).some(e => e.t !== undefined)).toBe(true); });
 it('leva só os exercícios usados pelos treinos exportados', () => { const used = new Set(Object.values(built().plan.sess).flatMap(s => s.ex)); expect(Object.keys(built().plan.ex).every(k => used.has(k))).toBe(true); });
 it('rotina com treino inexistente sai sem rotina e com aviso', () => {
  const s = base(); s.settings.sched[1] = { k: 'gym', s: 'sumiu' };
  const r = buildPlanShare(s, { name: 'x', includeNotes: false }); if (!r.ok) throw new Error(r.error);
  expect(r.file.sched).toBeUndefined(); expect(r.warnings.length).toBe(1);
 });
 it('nome vazio ou longo demais não monta', () => {
  expect(buildPlanShare(base(), { name: '  ', includeNotes: true }).ok).toBe(false);
  expect(buildPlanShare(base(), { name: 'x'.repeat(61), includeNotes: true }).ok).toBe(false);
 });
 it('nome do arquivo sem acentos', () => { expect(planShareFilename('Força Total!')).toBe('fitnez-plano-forca-total.json'); expect(planShareFilename('***')).toBe('fitnez-plano-plano.json'); });
});

describe('lista branca estrita', () => {
 it.each([
  ['arquivo', (f: any) => { f.extra = 1; }],
  ['plano', (f: any) => { f.plan.extra = 1; }],
  ['exercício', (f: any) => { f.plan.ex.a.kg = '30'; }],
  ['treino', (f: any) => { f.plan.sess.A.log = {}; }],
  ['dia da rotina', (f: any) => { f.sched = Array.from({ length: 7 }, () => ({ k: 'rest' })); f.sched[0].notes = 'x'; }],
  ['histórico', (f: any) => { f.history = {}; }],
  ['perfil', (f: any) => { f.profile = {}; }],
  ['meta', (f: any) => { f.meta = {}; }],
 ])('chave desconhecida em %s rejeita', (_w, bad) => { const f = small(); expect(ok(f)).toBe(true); bad(f); expect(ok(f)).toBe(false); });
 it('chave perigosa rejeita', () => { const r = parsePlanShare('{"app":"fitnez-plano","v":1,"name":"x","__proto__":{"a":1},"plan":{"ex":{},"sess":{"A":{"name":"A","ex":[]}},"order":["A"]}}'); expect(r.ok).toBe(false); });
 it('número infinito rejeita', () => { const r = parsePlanShare(JSON.stringify(small()).replace('"m":"kg"', '"m":"kg","rest":1e999')); expect(r.ok).toBe(false); });
 it('app errado e versão mais nova', () => {
  expect(checkPlanShare({ ...small(), app: 'treino12' })).toMatchObject({ ok: false });
  const newer = checkPlanShare({ ...small(), v: 2, coisaNova: 1 });
  expect(newer.ok).toBe(false); if (!newer.ok) expect(newer.error).toMatch(/versão mais nova/);
  expect(ok({ ...small(), v: 0 })).toBe(false);
 });
 it('JSON quebrado', () => { expect(parsePlanShare('{').ok).toBe(false); expect(parsePlanShare('[]').ok).toBe(false); });
});

describe('limites: aceita no valor, rejeita no valor + 1', () => {
 const exN = (n: number) => { const f = small(); f.plan.ex = {}; for (let i = 0; i < n; i++) f.plan.ex[`e${i}`] = { n: `E${i}`, s: [1, 1, 1], r: ['1', '1', '1'], m: 'rep' }; f.plan.sess.A.ex = ['e0']; return f; };
 const sessN = (n: number) => { const f = small(); f.plan.sess = {}; f.plan.order = []; for (let i = 0; i < n; i++) { f.plan.sess[`s${i}`] = { name: `S${i}`, ex: ['a'] }; f.plan.order.push(`s${i}`); } return f; };
 const cases: [string, (n: number) => any, number][] = [
  ['exercícios', exN, L.exercises],
  ['treinos', sessN, L.sessions],
  ['nome do arquivo', n => ({ ...small(), name: 'x'.repeat(n) }), L.fileName],
  ['nome do exercício', n => { const f = small(); f.plan.ex.a.n = 'x'.repeat(n); return f; }, L.exerciseName],
  ['nome do treino', n => { const f = small(); f.plan.sess.A.name = 'x'.repeat(n); return f; }, L.sessionName],
  ['descrição', n => { const f = small(); f.plan.sess.A.sub = 'x'.repeat(n); return f; }, L.sub],
  ['duração', n => { const f = small(); f.plan.sess.A.min = 'x'.repeat(n); return f; }, L.min],
  ['observação', n => { const f = small(); f.plan.ex.a.t = 'x'.repeat(n); return f; }, L.note],
  ['repetições', n => { const f = small(); f.plan.ex.a.r[0] = 'x'.repeat(n); return f; }, L.reps],
  ['séries', n => { const f = small(); f.plan.ex.a.s[1] = n; return f; }, L.setsMax],
  ['descanso', n => { const f = small(); f.plan.ex.a.rest = n; return f; }, L.restMax],
  ['id', n => { const f = small(); const id = 'a'.repeat(n); f.plan.ex = { [id]: f.plan.ex.a }; f.plan.sess.A.ex = [id]; return f; }, 40],
  ['itens do condomínio', n => { const f = small(); f.plan.cond = Array(n).fill('x'); return f; }, L.condItems],
  ['linha do condomínio', n => { const f = small(); f.plan.cond = ['x'.repeat(n)]; return f; }, L.condLine],
  ['nome do esporte', n => { const f = small(); f.sched = Array.from({ length: 7 }, () => ({ k: 'rest' })); f.sched[2] = { k: 'esporte', label: 'x'.repeat(n) }; return f; }, L.sportLabel],
 ];
 it.each(cases)('%s', (_n, make, max) => { expect(ok(make(max))).toBe(true); expect(ok(make(max + 1))).toBe(false); });
 it('séries de 1 a 10 (0 rejeita), inteiras', () => { const f = small(); f.plan.ex.a.s = [1, 1, 1]; expect(ok(f)).toBe(true); f.plan.ex.a.s = [0, 1, 1]; expect(ok(f)).toBe(false); f.plan.ex.a.s = [1.5, 1, 1]; expect(ok(f)).toBe(false); });
 it('descanso de 0 a 600 (negativo rejeita)', () => { const f = small(); f.plan.ex.a.rest = 0; expect(ok(f)).toBe(true); f.plan.ex.a.rest = -1; expect(ok(f)).toBe(false); });
 it('s e r com 3 blocos', () => { const f = small(); f.plan.ex.a.s = [3, 3]; expect(ok(f)).toBe(false); const g = small(); g.plan.ex.a.r = ['8', '8', '8', '8']; expect(ok(g)).toBe(false); });
 it('tipo m e grupo g só da lista', () => {
  const f = small(); f.plan.ex.a.m = 'kgx'; expect(ok(f)).toBe(false);
  const g = small(); g.plan.ex.a.g = 'peito'; expect(ok(g)).toBe(true); g.plan.ex.a.g = ''; expect(ok(g)).toBe(true); g.plan.ex.a.g = 'pescoço'; expect(ok(g)).toBe(false);
 });
 it('id com caractere fora do padrão rejeita', () => { const f = small(); f.plan.ex = { 'a b': f.plan.ex.a }; f.plan.sess.A.ex = ['a b']; expect(ok(f)).toBe(false); });
 it('arquivo de 200 KB: rejeita antes do parse', () => {
  const f = small(); const text = JSON.stringify(f);
  const pad = (n: number) => text.slice(0, -1) + ' '.repeat(n - new TextEncoder().encode(text).byteLength) + '}';
  expect(parsePlanShare(pad(L.bytes)).ok).toBe(true);
  expect(parsePlanShare(pad(L.bytes + 1))).toMatchObject({ ok: false });
 });
 it('rotina com 7 dias e treino existente', () => {
  const f = small(); f.sched = Array.from({ length: 7 }, () => ({ k: 'rest' })); f.sched[0] = { k: 'gym', s: 'A' }; expect(ok(f)).toBe(true);
  f.sched[0] = { k: 'gym', s: 'Z' }; expect(ok(f)).toBe(false);
  f.sched[0] = { k: 'gym' }; expect(ok(f)).toBe(false);
  f.sched = f.sched.slice(0, 6); expect(ok(f)).toBe(false);
 });
 it('treino apontando para exercício inexistente e ordem com treino inexistente rejeitam', () => {
  const f = small(); f.plan.sess.A.ex = ['nada']; expect(ok(f)).toBe(false);
  const g = small(); g.plan.order = ['B']; expect(ok(g)).toBe(false);
  const h = small(); h.plan.alt = 'B'; expect(ok(h)).toBe(false);
 });
});

describe('planShareDiff', () => {
 it('colisão de id: mesmo nome e tipo = mesmo exercício; diferente ganha id livre', () => {
  const plan = base().catalog.plan;
  const f = small(); f.plan.ex = { supino: { ...f.plan.ex.a, n: '  SUPINO com Halteres ' }, remada_a: { ...f.plan.ex.a, n: 'Outra coisa' }, novo: { ...f.plan.ex.a, n: 'Novo' } };
  f.plan.sess = { UA: { name: 'Upper A', ex: ['supino', 'remada_a', 'novo'] }, X: { name: 'X', ex: [] } }; f.plan.order = ['UA', 'X'];
  const c = checkPlanShare(f); if (!c.ok) throw new Error(c.error);
  const d = planShareDiff(plan, c.value, base().settings.sched);
  expect(d.exercises.same).toEqual(['supino']);
  expect(d.exercises.renamed).toEqual([{ from: 'remada_a', to: 'remada_a-2', name: 'Outra coisa' }]);
  expect(d.exercises.added).toEqual(['novo']);
  expect(d.sessions.same).toEqual(['UA']); expect(d.sessions.added).toEqual(['X']);
  expect(d.kept).toContain('remada_a');
  // minha rotina: LW e UB deixam de existir e assumem os treinos novos na ordem
  expect(d.schedRemap).toEqual([{ day: 1, from: 'LW', to: 'UA' }, { day: 4, from: 'UB', to: 'X' }]);
 });
 it('mesmo id de exercício com tipo diferente também renomeia', () => {
  const f = small(); f.plan.ex = { supino: { ...f.plan.ex.a, n: 'Supino com halteres', m: 'rep' } }; f.plan.sess.A.ex = ['supino'];
  const c = checkPlanShare(f); if (!c.ok) throw new Error(c.error);
  expect(planShareDiff(base().catalog.plan, c.value).exercises.renamed[0].to).toBe('supino-2');
 });
});

describe('revisão de segurança (B1 a B4)', () => {
 const week = (over: Record<string, unknown>[] = []) => { const s: any[] = [{ k: 'gym', s: 'A' }, { k: 'rest' }, { k: 'rest' }, { k: 'rest' }, { k: 'rest' }, { k: 'rest' }, { k: 'rest' }]; over.forEach((d, i) => { s[i + 1] = d; }); return s; };
 it('B1: rotina com campos só do tipo certo de dia', () => {
  expect(ok({ ...small(), sched: week([{ k: 'bjj', gi: true }, { k: 'esporte', label: 'Futebol' }]) })).toBe(true);
  expect(ok({ ...small(), sched: week([{ k: 'rest', s: 'A' }]) })).toBe(false);
  expect(ok({ ...small(), sched: week([{ k: 'gym', s: 'A', gi: true }]) })).toBe(false);
  expect(ok({ ...small(), sched: week([{ k: 'volei', label: 'Vôlei' }]) })).toBe(false);
 });
 it('B2: caracteres de controle e de direção recusados; quebra de linha só na observação e no condomínio', () => {
  for (const bad of ['Supino\u202Eodalos', 'Supino\u2066x\u2069', 'Sup\u0000ino', 'Sup\u200Fino', 'Supino\nbanco', 'Sup\u0085ino']) {
   const f = small(); f.plan.ex.a.n = bad;
   expect(ok(f), JSON.stringify(bad)).toBe(false);
  }
  const named = small(); named.name = 'Plano\u202E'; expect(ok(named)).toBe(false);
  const note = small(); note.plan.ex.a.t = 'Linha 1\nLinha 2'; expect(ok(note)).toBe(true);
  const noteBidi = small(); noteBidi.plan.ex.a.t = 'ok\u202E'; expect(ok(noteBidi)).toBe(false);
  const cond = small(); cond.plan.cond = ['Item\tcom tab']; expect(ok(cond)).toBe(true);
  const acc = small(); acc.plan.ex.a.n = 'Supino inclinado com halteres, ação e pausa'; expect(ok(acc)).toBe(true);
 });
 it('B3: ids com nomes de Object.prototype recusados', () => {
  for (const bad of ['toString', 'hasOwnProperty', 'valueOf', 'isPrototypeOf']) {
   const f = small(); f.plan.ex[bad] = f.plan.ex.a; f.plan.sess.A.ex = [bad]; delete f.plan.ex.a;
   expect(ok(f), bad).toBe(false);
   const g = small(); g.plan.sess[bad] = g.plan.sess.A; g.plan.order = [bad]; delete g.plan.sess.A;
   expect(ok(g), bad).toBe(false);
  }
 });
 it('B4: id renomeado cabe em 40 caracteres e o plano continua exportável', () => {
  const long = 'x'.repeat(40);
  const cur = base().catalog.plan;
  cur.ex[long] = { n: 'Outro exercício', s: [3, 3, 3], r: ['8', '8', '8'], m: 'kg' };
  const f = small(); f.plan.ex = { [long]: f.plan.ex.a }; f.plan.sess.A.ex = [long];
  const c = checkPlanShare(f); if (!c.ok) throw new Error(c.error);
  const d = planShareDiff(cur, c.value);
  const to = d.mapping.ex[long]!;
  expect(to).not.toBe(long);
  expect(to.length).toBeLessThanOrEqual(40);
  expect(to.endsWith('-2')).toBe(true);
 });
});
