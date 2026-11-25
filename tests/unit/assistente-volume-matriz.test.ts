import { describe, expect, it } from 'vitest';
import seedPlan from '../../data/plan.json';
import type { Exercise } from '../../src/application/repository';
import { muscleGroupOf } from '../../src/domain/muscleGroups';
import type { MuscleGroup } from '../../src/domain/muscleGroups';
import { DURATIONS, EXPERIENCES, PLACES, buildPlanFromAnswers, defaultAnswers, storedAnswersOf } from '../../src/domain/onboarding';
import type { DaysPerWeek, Duration, Experience, GeneratedPlan, OnboardingAnswers, Place } from '../../src/domain/onboarding';
import { PAIN_AVOID } from '../../src/domain/painRules';
import { DURATION_MAX_MIN, MIN_EXERCISES, PAIN_REGIONS, PRIORITIES, VOLUME, isCoreId, orderClass } from '../../src/domain/planEngine';
import { BIG_GROUPS, GROUP_RANGES, plannedSetsByGroup } from '../../src/domain/weeklySets';

// ADR 015: testes de propriedade da matriz do assistente (dias 2 a 6 × experiência × local × tempo).
// Faixas e exceções vêm de weeklySets.ts e do ADR 010: tempo curto sem mínimo nos grupos grandes; com 2 dias em tempo médio,
// mínimo de 2 × séries principais. Com tempo longo cobra-se o mínimo da faixa.
const catalog = (seedPlan as any).plan.ex as Record<string, Exercise>;
const A = (over: Partial<OnboardingAnswers>): OnboardingAnswers => ({ ...defaultAnswers(), safety: ['nenhum'], goal: 'recomp', ...over });
const DAYS: readonly DaysPerWeek[] = [2, 3, 4, 5, 6];
const SMALL: readonly MuscleGroup[] = ['press', 'ombro-lateral', 'ombro-posterior', 'biceps', 'triceps', 'panturrilha'];
const REQUIRED: readonly MuscleGroup[] = [...SMALL, 'core'];

interface Cell { exp: Experience; place: Place; duration: Duration; days: DaysPerWeek }
const CELLS: Cell[] = [];
for (const exp of EXPERIENCES) for (const place of PLACES) for (const duration of DURATIONS) for (const days of DAYS) CELLS.push({ exp, place, duration, days });
const label = (c: Cell) => `${c.exp}, ${c.place}, ${c.duration}, ${c.days} dias`;
const gen = (c: Cell, extra: Partial<OnboardingAnswers> = {}): GeneratedPlan => buildPlanFromAnswers(A({ experience: c.exp, place: c.place, duration: c.duration, daysPerWeek: c.days, ...extra }), catalog);
const weekly = (g: GeneratedPlan) => plannedSetsByGroup(g.plan, g.sched, 0);
const idsOf = (g: GeneratedPlan, key: string) => g.plan.sess[key].ex;
const groupOf = (g: GeneratedPlan, id: string) => muscleGroupOf(id, g.plan.ex[id]);
const distinctKeys = (g: GeneratedPlan) => [...new Set(g.sched.filter(d => d.k === 'gym').map(d => d.s as string))];

describe('matriz: grupos grandes dentro da faixa (fora as exceções documentadas)', () => {
 for (const c of CELLS) it(label(c), () => {
  const g = gen(c);
  const w = weekly(g);
  const r = GROUP_RANGES[g.experience].big;
  const min = c.duration === 'curto' ? 0 : c.days === 2 && c.duration === 'medio' ? Math.min(r[0], 2 * VOLUME[g.experience].ps[0]) : r[0];
  for (const grp of BIG_GROUPS) {
   expect(w[grp] ?? 0, `${grp} abaixo`).toBeGreaterThanOrEqual(min);
   expect(w[grp] ?? 0, `${grp} acima`).toBeLessThanOrEqual(r[1]);
  }
 });
});

describe('matriz: grupos pequenos, grupo ausente, treinos e ordem', () => {
 for (const c of CELLS) it(label(c), () => {
  const g = gen(c);
  const w = weekly(g);
  const hi = GROUP_RANGES[g.experience].small[1];
  for (const grp of SMALL) expect(w[grp] ?? 0, `${grp} acima do máximo`).toBeLessThanOrEqual(hi);
  // Grupo com 0 série só quando falta equipamento (a revisão avisa) ou quando as vagas do tempo não comportam todos (rodízio).
  const semEquip = new Set(g.notes.filter(n => n.kind === 'sem_equipamento').map(n => n.group));
  const zeros = REQUIRED.filter(grp => !(w[grp] ?? 0) && !semEquip.has(grp));
  const slots = distinctKeys(g).reduce((a, k) => a + new Set(idsOf(g, k).filter(id => orderClass(id) > 0 && REQUIRED.includes(groupOf(g, id) as MuscleGroup)).map(id => groupOf(g, id))).size, 0);
  const required = REQUIRED.filter(grp => !semEquip.has(grp)).length;
  expect(zeros.length, `grupos zerados: ${zeros.join(', ')}`).toBeLessThanOrEqual(Math.max(0, required - slots));
  for (const k of distinctKeys(g)) {
   const ids = idsOf(g, k);
   expect(g.sessionMinutes[k], `${k} minutos`).toBeLessThanOrEqual(DURATION_MAX_MIN[c.duration]);
   expect(new Set(ids).size, `${k} repetido no dia`).toBe(ids.length);
   if (ids.length < MIN_EXERCISES) expect(g.notes.some(n => n.kind === 'treino_curto' && n.session === k), `${k} curto sem aviso`).toBe(true);
   // Ordem: compostos, isoladores e core por último.
   const cls = ids.map(orderClass);
   expect(cls, `${k} ordem`).toEqual([...cls].sort((x, y) => x - y));
   ids.forEach((id, i) => { if (isCoreId(id)) expect(cls[i]).toBe(2); });
  }
 });
});

describe('matriz: sem sessões quase idênticas (Pernas A e B, Empurrar e Puxar do plano de 6 dias)', () => {
 const differ = (a: string[], b: string[]) => b.filter(id => !a.includes(id)).length >= Math.ceil(b.length / 2);
 for (const c of CELLS.filter(x => x.days >= 4 && x.place !== 'casa_livre' && x.duration !== 'curto')) it(label(c), () => {
  const g = gen(c);
  const pairs: Array<[string, string]> = [['PERA', 'PERB']];
  if (c.days === 6) pairs.push(['EMP', 'EMP2'], ['PUX', 'PUX2']);
  for (const [x, y] of pairs) if (g.plan.sess[x] && g.plan.sess[y]) expect(differ(idsOf(g, x), idsOf(g, y)), `${x} e ${y}`).toBe(true);
 });
 // Limite do catálogo, documentado: em casa sem equipamento há uma opção por padrão de movimento, então Pernas A e B (e Empurrar e Puxar de 6 dias) ficam parecidos.
});

describe('objetivo: massa no topo, saúde na base', () => {
 for (const exp of EXPERIENCES) for (const days of [3, 4, 5] as DaysPerWeek[]) it(`${exp}, ${days} dias, academia, longo`, () => {
  const base: Cell = { exp, place: 'academia', duration: 'longo', days };
  const sum = (goal: 'saude' | 'perder' | 'recomp' | 'massa') => { const w = weekly(gen(base, { goal })); return BIG_GROUPS.reduce((a, grp) => a + (w[grp] ?? 0), 0); };
  expect(sum('massa')).toBeGreaterThanOrEqual(sum('recomp'));
  expect(sum('recomp')).toBeGreaterThanOrEqual(sum('perder'));
  expect(sum('perder')).toBeGreaterThanOrEqual(sum('saude'));
  expect(sum('massa')).toBeGreaterThan(sum('saude'));
 });
});

describe('2 dias: intermediário', () => {
 it('longo cobra o mínimo da faixa (8); a revisão sugere o terceiro dia, sem bloquear', () => {
  for (const place of PLACES) {
   const longo = weekly(gen({ exp: 'intermediario', place, duration: 'longo', days: 2 }));
   for (const grp of BIG_GROUPS) expect(longo[grp] ?? 0, `${place} ${grp}`).toBeGreaterThanOrEqual(8);
   expect(gen({ exp: 'intermediario', place, duration: 'medio', days: 2 }).warnings).toContain('tres-dias');
   expect(gen({ exp: 'intermediario', place, duration: 'medio', days: 3 }).warnings).not.toContain('tres-dias');
  }
 });
});

describe('prioridade muscular', () => {
 const GROUPS_OF: Record<string, MuscleGroup[]> = { peito: ['peito'], costas: ['costas'], ombros: ['ombro-lateral', 'ombro-posterior', 'press'], bracos: ['biceps', 'triceps'], gluteos: ['posterior-gluteos'], pernas: ['quadriceps', 'posterior-gluteos'] };
 for (const exp of EXPERIENCES) for (const p of PRIORITIES.filter(x => x !== 'equilibrado')) it(`${exp}, ${p}`, () => {
  const c: Cell = { exp, place: 'academia', duration: 'longo', days: 4 };
  const eq = weekly(gen(c, { goal: 'saude' }));
  const pr = weekly(gen(c, { goal: 'saude', priority: p }));
  // Sobe, salvo quando a estrutura da semana já deixa o grupo no máximo da faixa.
  const full = GROUPS_OF[p].every(grp => (eq[grp] ?? 0) >= (BIG_GROUPS.includes(grp) ? GROUP_RANGES[exp].big[1] : GROUP_RANGES[exp].small[1]));
  if (!full) expect(GROUPS_OF[p].some(grp => (pr[grp] ?? 0) > (eq[grp] ?? 0)), 'algum grupo da prioridade sobe').toBe(true);
  for (const grp of GROUPS_OF[p]) expect(pr[grp] ?? 0, `${grp} não cai`).toBeGreaterThanOrEqual(eq[grp] ?? 0);
  // Os outros grupos não perdem o mínimo nem passam a faixa.
  const range = GROUP_RANGES[exp];
  for (const grp of [...BIG_GROUPS, ...SMALL]) {
   if (GROUPS_OF[p].includes(grp)) continue;
   const [lo, hi] = BIG_GROUPS.includes(grp) ? range.big : range.small;
   expect(pr[grp] ?? 0, `${grp} mínimo`).toBeGreaterThanOrEqual(Math.min(lo, eq[grp] ?? 0));
   expect(pr[grp] ?? 0, `${grp} máximo`).toBeLessThanOrEqual(hi);
  }
 });
 it('com tempo curto o isolador sai e os compostos ficam', () => {
  const g = gen({ exp: 'iniciante', place: 'academia', duration: 'curto', days: 4 }, { priority: 'bracos' });
  for (const k of distinctKeys(g)) expect(idsOf(g, k).filter(id => orderClass(id) === 0).length).toBeGreaterThanOrEqual(3);
 });
 it('menor de 18 e transtorno alimentar ficam em equilibrado', () => {
  for (const safety of [['menor18'], ['transtorno']] as const) {
   const com = buildPlanFromAnswers(A({ experience: 'iniciante', duration: 'medio', daysPerWeek: 4, safety: [...safety], priority: 'peito' }), catalog);
   const sem = buildPlanFromAnswers(A({ experience: 'iniciante', duration: 'medio', daysPerWeek: 4, safety: [...safety] }), catalog);
   expect(com.plan).toEqual(sem.plan);
  }
 });
});

describe('dores por região', () => {
 for (const region of PAIN_REGIONS) for (const place of PLACES) for (const exp of EXPERIENCES) for (const days of [2, 4, 6] as DaysPerWeek[]) it(`${region}, ${place}, ${exp}, ${days} dias`, () => {
  const c: Cell = { exp, place, duration: 'medio', days };
  const g = gen(c, { pains: [region] });
  const avoid = new Set(PAIN_AVOID[region]);
  const all = g.plan.order.flatMap(k => g.plan.sess[k].ex);
  expect(all.filter(id => avoid.has(id)), 'exercício evitado no plano').toEqual([]);
  // Nunca bloqueia o plano inteiro: todos os treinos existem e têm exercícios.
  expect(g.plan.order.length).toBe(days);
  for (const k of g.plan.order) { expect(g.plan.sess[k].ex.length, k).toBeGreaterThanOrEqual(2); if (g.plan.sess[k].ex.length < MIN_EXERCISES) expect(g.notes.some(n => n.kind === 'treino_curto' && n.session === k), `${k} curto sem aviso`).toBe(true); }
  // A revisão lista o que foi trocado.
  const base = gen(c);
  for (const id of new Set(base.plan.order.flatMap(k => base.plan.sess[k].ex))) if (avoid.has(id)) expect(g.notes.some(n => n.kind === 'dor' && n.region === region && n.from === id), `sem aviso para ${id}`).toBe(true);
  for (const n of g.notes.filter(x => x.kind === 'dor')) { expect(avoid.has(n.from!)).toBe(true); if (n.to) expect(all).toContain(n.to); }
 });
 it('sem região marcada o plano é idêntico', () => {
  const c: Cell = { exp: 'iniciante', place: 'academia', duration: 'medio', days: 4 };
  expect(gen(c, { pains: [] }).plan).toEqual(gen(c).plan);
 });
 it('trocas esperadas (academia, iniciante, médio, 4 dias)', () => {
  const c: Cell = { exp: 'iniciante', place: 'academia', duration: 'medio', days: 4 };
  const ids = (r: typeof PAIN_REGIONS[number]) => { const g = gen(c, { pains: [r] }); return g.plan.order.flatMap(k => g.plan.sess[k].ex); };
  expect(ids('ombro')).toContain('supino_chao');
  expect(ids('lombar')).toContain('leg');
  expect(ids('joelho').filter(i => i === 'agach' || i === 'afundo')).toEqual([]);
  expect(ids('punho_cotovelo').filter(i => i === 'rosca_a' || i === 'tri_a')).toEqual([]);
 });
});

describe('treinou nos últimos 3 meses', () => {
 for (const place of PLACES) for (const days of DAYS) it(`intermediário que não treinou recebe o plano de iniciante (${place}, ${days} dias)`, () => {
  const sem = buildPlanFromAnswers(A({ experience: 'intermediario', trainedRecently: false, daysPerWeek: days, place }), catalog);
  const ini = buildPlanFromAnswers(A({ experience: 'iniciante', daysPerWeek: days, place }), catalog);
  expect(sem.plan).toEqual(ini.plan);
  expect(sem.experience).toBe('iniciante');
 });
 it('"sim" não muda nada', () => {
  expect(buildPlanFromAnswers(A({ experience: 'intermediario', trainedRecently: true }), catalog).plan).toEqual(buildPlanFromAnswers(A({ experience: 'intermediario' }), catalog).plan);
 });
});

describe('equipamento em casa', () => {
 it('com elástico, casa livre ganha bíceps e ombro lateral; sem, a revisão avisa', () => {
  const c: Cell = { exp: 'iniciante', place: 'casa_livre', duration: 'longo', days: 4 };
  const sem = gen(c);
  expect(weekly(sem)['biceps'] ?? 0).toBe(0);
  expect(sem.notes.filter(n => n.kind === 'sem_equipamento').map(n => n.group)).toEqual(expect.arrayContaining(['biceps', 'ombro-lateral']));
  const com = gen(c, { equipment: ['elastico'] });
  expect(weekly(com)['biceps'] ?? 0).toBeGreaterThan(0);
  expect(weekly(com)['ombro-lateral'] ?? 0).toBeGreaterThan(0);
  expect(com.notes.filter(n => n.kind === 'sem_equipamento')).toEqual([]);
 });
});

describe('formato guardado', () => {
 it('respostas novas não entram em StoredAnswers', () => {
  const s = storedAnswersOf(A({ priority: 'peito', pains: ['joelho'], equipment: ['elastico'], trainedRecently: false }));
  expect(Object.keys(s).sort()).toEqual(['activities', 'daysPerWeek', 'duration', 'experience', 'goal', 'place']);
 });
 it('todo exercício gerado existe no catálogo e tem 3 blocos de séries', () => {
  for (const c of CELLS.filter(x => x.duration === 'medio')) {
   const g = gen(c);
   for (const id of g.plan.order.flatMap(k => g.plan.sess[k].ex)) { expect(catalog[id], id).toBeDefined(); expect(g.plan.ex[id].s).toHaveLength(3); }
  }
 });
});
