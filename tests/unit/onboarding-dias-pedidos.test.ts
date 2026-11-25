import { describe, expect, it } from 'vitest';
import seedPlan from '../../data/plan.json';
import type { Exercise } from '../../src/application/repository';
import { ASSISTANT_EXERCISE_IDS, EXPERIENCES, PLACES, TRANSTORNO_MAX_DAYS, buildOnboardingPreview, buildPlanFromAnswers, defaultAnswers } from '../../src/domain/onboarding';
import type { DaysPerWeek, Experience, OnboardingAnswers } from '../../src/domain/onboarding';
import { muscleGroupOf } from '../../src/domain/muscleGroups';

// ADR 014 (docs/handoffs/conteudo-dias-pedidos.md): sem teto por experiência; a pessoa recebe os dias que pediu.
const catalog = (seedPlan as any).plan.ex as Record<string, Exercise>;
const A = (over: Partial<OnboardingAnswers>): OnboardingAnswers => ({ ...defaultAnswers(), safety: ['nenhum'], ...over });
const DAYS: readonly DaysPerWeek[] = [2, 3, 4, 5, 6];
const hasLegsName = (name: string) => /Pernas|Corpo inteiro/.test(name);
function week(a: OnboardingAnswers): string[] {
 const g = buildPlanFromAnswers(a, catalog);
 return g.sched.map(d => (d.k === 'gym' ? g.plan.sess[d.s as string].name : '-'));
}

describe('dias pedidos: a divisão tem exatamente o número pedido', () => {
 for (const exp of EXPERIENCES) for (const d of DAYS) for (const place of PLACES) {
  it(`${exp}, ${d} dias, ${place}`, () => {
   const g = buildPlanFromAnswers(A({ experience: exp, daysPerWeek: d, place }), catalog);
   expect(g.gymDays).toBe(d);
   expect(g.scheduledGymDays).toBe(d);
   expect(g.sched.filter(x => x.k === 'gym')).toHaveLength(d);
   expect(g.daysReason).toBeNull();
   // Todos os exercícios existem no catálogo e na lista do assistente; nenhum treino vazio.
   for (const k of g.plan.order) {
    const s = g.plan.sess[k];
    expect(s.ex.length, k).toBeGreaterThan(0);
    for (const id of s.ex) {
     expect(catalog[id], id).toBeDefined();
     expect(ASSISTANT_EXERCISE_IDS).toContain(id);
     expect(g.plan.ex[id], id).toBeDefined();
    }
   }
   for (const x of g.sched) if (x.k === 'gym') expect(g.plan.sess[x.s as string]).toBeDefined();
   // Treinos com pernas (Pernas e Corpo inteiro) nunca em dias seguidos, contando domingo e segunda.
   const legs = g.sched.map(x => x.k === 'gym' && hasLegsName(g.plan.sess[x.s as string].name));
   for (let i = 0; i < 7; i++) expect(legs[i] && legs[(i + 1) % 7], `pernas em ${i} e ${(i + 1) % 7}`).toBe(false);
  });
 }
});

describe('tabela de divisões (academia, 45 a 60 min, sem atividades fixas)', () => {
 const T: Record<Experience, Record<number, string[]>> = {
  nunca: {
   2: ['Corpo inteiro A', '-', '-', 'Corpo inteiro B', '-', '-', '-'],
   3: ['Corpo inteiro A', '-', 'Corpo inteiro B', '-', 'Corpo inteiro A', '-', '-'],
   4: ['Superior A', 'Pernas A', '-', 'Superior B', 'Pernas B', '-', '-'],
   5: ['Superior', 'Pernas A', 'Empurrar', '-', 'Puxar', 'Pernas B', '-'],
   6: ['Empurrar', 'Puxar', 'Pernas A', 'Empurrar', 'Puxar', 'Pernas B', '-']
  },
  iniciante: {} as Record<number, string[]>,
  intermediario: {} as Record<number, string[]>
 };
 T.nunca[6] = ['Empurrar A', 'Puxar A', 'Pernas A', 'Empurrar B', 'Puxar B', 'Pernas B', '-'];
 T.iniciante = { ...T.nunca };
 T.intermediario = { ...T.nunca, 3: ['Superior A', '-', 'Pernas A', '-', 'Corpo inteiro B', '-', '-'] };
 for (const exp of EXPERIENCES) for (const d of DAYS) {
  it(`${exp}, ${d} dias`, () => { expect(week(A({ experience: exp, daysPerWeek: d }))).toEqual(T[exp][d]); });
 }
});

describe('volume semanal no bloco 1 (peito / costas / quadríceps / posterior e glúteos)', () => {
 const FAIXA = { nunca: [4, 8], iniciante: [6, 10], intermediario: [8, 16] } as const;
 function weekly(a: OnboardingAnswers): number[] {
  const g = buildPlanFromAnswers(a, catalog);
  const out: Record<string, number> = { peito: 0, costas: 0, quadriceps: 0, 'posterior-gluteos': 0 };
  for (const x of g.sched) if (x.k === 'gym') for (const id of g.plan.sess[x.s as string].ex) {
   const grp = muscleGroupOf(id, g.plan.ex[id]);
   if (grp && grp in out) out[grp] += g.plan.ex[id].s[0];
  }
  return [out.peito, out.costas, out.quadriceps, out['posterior-gluteos']];
 }
 it('nenhuma combinação da academia passa do máximo da faixa', () => {
  for (const exp of EXPERIENCES) for (const d of DAYS) for (const duration of ['curto', 'medio', 'longo'] as const) {
   for (const v of weekly(A({ experience: exp, daysPerWeek: d, duration }))) expect(v, `${exp} ${d} ${duration}`).toBeLessThanOrEqual(FAIXA[exp][1]);
  }
 });
 // Divisões novas ou alteradas pelo ADR 014: valores exatos e dentro da faixa inteira.
 const NOVAS: Array<[Experience, DaysPerWeek, number[]]> = [
  ['nunca', 4, [4, 8, 8, 8]],
  ['nunca', 5, [6, 8, 8, 8]],
  ['nunca', 6, [8, 8, 8, 8]],
  ['iniciante', 5, [6, 8, 8, 8]],
  ['iniciante', 6, [8, 8, 8, 8]],
  ['intermediario', 5, [8, 10, 8, 8]],
  ['intermediario', 6, [8, 10, 8, 8]]
 ];
 it.each(NOVAS)('%s, %i dias: %j', (exp, d, expected) => {
  const vals = weekly(A({ experience: exp, daysPerWeek: d }));
  expect(vals).toEqual(expected);
  for (const v of vals) { expect(v).toBeGreaterThanOrEqual(FAIXA[exp][0]); expect(v).toBeLessThanOrEqual(FAIXA[exp][1]); }
 });
 it('ADR 015: as séries do principal vêm do volume da semana, não de uma tabela por dias', () => {
  const s = (exp: Experience, d: DaysPerWeek) => buildPlanFromAnswers(A({ experience: exp, daysPerWeek: d }), catalog).plan.ex.supino.s;
  expect(s('iniciante', 6)[0]).toBe(2);
  for (const [exp, d] of [['iniciante', 5], ['intermediario', 6]] as const) { const v = s(exp, d); expect(v[0]).toBeGreaterThanOrEqual(2); expect(v[0]).toBeLessThanOrEqual(5); expect(v[1]).toBeGreaterThanOrEqual(v[0]); }
 });
});

describe('treinos novos: Empurrar, Puxar e Superior', () => {
 it('exercícios na academia (45 a 60 min, iniciante, 6 dias)', () => {
  const g = buildPlanFromAnswers(A({ experience: 'iniciante', daysPerWeek: 6 }), catalog);
  expect(g.plan.order).toEqual(['EMP', 'PUX', 'PERA', 'EMP2', 'PUX2', 'PERB']);
  expect(g.plan.sess.EMP.ex).toEqual(['supino', 'inclinado', 'press_b', 'lat_a', 'tri_a', 'pallof']);
  expect(g.plan.sess.EMP2.ex).toEqual(['inclinado', 'press_a', 'cruc', 'lat_b', 'tri_b', 'deadbug']);
  expect(g.plan.sess.PUX.ex).toEqual(['puxada', 'remada_b', 'face', 'rosca_a', 'prancha', 'pallof']);
  expect(g.plan.sess.PUX2.ex).toEqual(['puxada', 'remada_b', 'inverso', 'rosca_b', 'deadbug', 'pallof']);
  expect(g.plan.sess.EMP.sub).toBe('Peito, ombros e tríceps');
  expect(g.plan.sess.PUX.sub).toBe('Costas, ombros, bíceps e abdômen');
 });
 it('5 dias: o Superior B se chama "Superior" (não há Superior A)', () => {
  const g = buildPlanFromAnswers(A({ experience: 'intermediario', daysPerWeek: 5 }), catalog);
  expect(g.plan.order).toEqual(['SUPB', 'PERA', 'EMP', 'PUX', 'PERB']);
  expect(g.plan.sess.SUPB.name).toBe('Superior');
  expect(buildPlanFromAnswers(A({ experience: 'intermediario', daysPerWeek: 4 }), catalog).plan.sess.SUPB.name).toBe('Superior B');
 });
 it('quem nunca treinou com 6 dias de 60 a 90 min: 45 a 60 min, 6 exercícios e aviso', () => {
  const g = buildPlanFromAnswers(A({ experience: 'nunca', daysPerWeek: 6, duration: 'longo' }), catalog);
  expect(g.gymDays).toBe(6);
  expect(g.duration).toBe('medio');
  expect(g.warnings).toEqual(['duracao-reduzida']);
  for (const k of g.plan.order) expect(g.plan.sess[k].ex).toHaveLength(6);
 });
 it('condição de saúde com 6 dias: 6 treinos leves, sem hip thrust com barra', () => {
  const p = buildOnboardingPreview(A({ safety: ['condicao'], experience: 'intermediario', daysPerWeek: 6 }), catalog);
  expect(p.requiresClearance).toBe(true);
  expect(p.generated!.experience).toBe('nunca');
  expect(p.generated!.gymDays).toBe(6);
  expect(Object.keys(p.generated!.plan.ex)).not.toContain('hip_b');
 });
});

describe('travas que continuam', () => {
 it(`transtorno alimentar: no máximo ${TRANSTORNO_MAX_DAYS} treinos, com daysReason "teto"`, () => {
  for (const exp of EXPERIENCES) {
   const g5 = buildPlanFromAnswers(A({ safety: ['transtorno'], experience: exp, daysPerWeek: 5 }), catalog);
   expect([g5.gymDays, g5.daysReason]).toEqual([4, 'teto']);
   const g4 = buildPlanFromAnswers(A({ safety: ['transtorno'], experience: exp, daysPerWeek: 4 }), catalog);
   expect([g4.gymDays, g4.daysReason]).toEqual([4, null]);
  }
 });
 it('atividades fixas: no máximo 6 dias ativos (daysReason "atividades")', () => {
  const g = buildPlanFromAnswers(A({ experience: 'nunca', daysPerWeek: 6, activities: [{ kind: 'luta', days: [1] }] }), catalog);
  expect([g.gymDays, g.daysReason]).toEqual([5, 'atividades']);
  expect(g.sched[1]).toEqual({ k: 'bjj', gi: true });
 });
 it('5 dias com 1 atividade fixa em qualquer dia: pernas nunca na véspera nem em dias seguidos', () => {
  for (const exp of EXPERIENCES) for (let d = 0; d < 7; d++) {
   const g = buildPlanFromAnswers(A({ experience: exp, daysPerWeek: 5, activities: [{ kind: 'corrida', days: [d] }] }), catalog);
   expect(g.gymDays).toBe(5);
   expect(g.sched[d]).toEqual({ k: 'esporte', label: 'Corrida' });
   const legs = g.sched.map(x => x.k === 'gym' && hasLegsName(g.plan.sess[x.s as string].name));
   for (let i = 0; i < 7; i++) {
    if (!legs[i]) continue;
    expect(g.sched[(i + 1) % 7].k, `${exp}, corrida ${d}, pernas ${i}`).not.toBe('esporte');
    expect(legs[(i + 1) % 7], `${exp}, corrida ${d}, pernas ${i} seguidas`).toBe(false);
   }
  }
 });
 it('gestação e menos de 14 anos continuam sem plano', () => {
  expect(() => buildPlanFromAnswers(A({ safety: ['gestacao'], daysPerWeek: 6 }), catalog)).toThrow(/gestação/);
  expect(() => buildPlanFromAnswers(A({ daysPerWeek: 6, body: { age: 12 } }), catalog)).toThrow(/14 anos/);
 });
});
