import { describe, expect, it } from 'vitest';
import seedPlan from '../../data/plan.json';
import type { Exercise } from '../../src/application/repository';
import {
 ASSISTANT_EXERCISE_IDS, MIN_PLAN_AGE, OLDER_AGE, RIR_CONSERVADOR, TRANSTORNO_MAX_DAYS, WARNING_ORDER, buildOnboardingPreview, buildPlanFromAnswers,
 defaultAnswers, effectiveExperience, planBlockedReason, safetyFlagsOf, storedAnswersOf, validateOnboardingAnswers
} from '../../src/domain/onboarding';
import type { OnboardingAnswers } from '../../src/domain/onboarding';
import { RIR_BEGINNER } from '../../src/domain/calendar';

// Regras do ADR 012 (docs/handoffs/conteudo-revisao-10-perfis.md, seções 2 e 3). Perfis fictícios.
const catalog = (seedPlan as any).plan.ex as Record<string, Exercise>;
const A = (over: Partial<OnboardingAnswers>): OnboardingAnswers => ({ ...defaultAnswers(), safety: ['nenhum'], ...over });
const DIA = ['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom'];
function week(a: OnboardingAnswers): string[] {
 const g = buildPlanFromAnswers(a, catalog);
 return g.sched.map((d, i) => `${DIA[i]}:${d.k === 'gym' ? g.plan.sess[d.s as string].name : d.k === 'bjj' ? 'luta' : d.k === 'esporte' ? String(d.label) : '-'}`);
}

describe('catálogo: exercícios novos do ADR 012', () => {
 it('ponte e sentar_levantar existem com os números do conteúdo; afundo_livre com a observação nova', () => {
  expect(catalog.ponte).toEqual({ n: 'Ponte de glúteo', s: [3, 3, 4], r: ['10–15', '12–15', '12–20'], m: 'rep', t: 'Deitado de costas, joelhos dobrados. Suba o quadril, aperte o glúteo e desça devagar.', rest: 60, g: 'posterior-gluteos' });
  expect(catalog.sentar_levantar).toEqual({ n: 'Sentar e levantar da cadeira', s: [3, 3, 4], r: ['8–12', '10–15', '12–15'], m: 'rep', t: 'Cadeira firme, encostada na parede. Levante sem usar as mãos se conseguir; se não, apoie as mãos nos joelhos.', rest: 90, g: 'quadriceps' });
  expect(catalog.afundo_livre.t).toBe('Repetições por perna. Fique ao lado de uma parede ou cadeira e apoie a mão.');
  expect(ASSISTANT_EXERCISE_IDS).toContain('ponte');
  expect(ASSISTANT_EXERCISE_IDS).toContain('sentar_levantar');
 });
 it('o plano de exemplo não usa os exercícios novos', () => {
  for (const s of Object.values((seedPlan as any).plan.sess) as any[]) { expect(s.ex).not.toContain('ponte'); expect(s.ex).not.toContain('sentar_levantar'); }
 });
});

describe('segurança: bloqueio, plano leve e liberação médica', () => {
 it('gestação bloqueia; amamentação é separada e segue a condição de saúde', () => {
  expect(planBlockedReason(A({ safety: ['gestacao'] }))).toBe('gestacao');
  expect(planBlockedReason(A({ safety: ['amamentacao'] }))).toBeNull();
  const p = buildOnboardingPreview(A({ safety: ['amamentacao'], experience: 'intermediario', daysPerWeek: 5, body: { sex: 'f', age: 30, heightCm: 165, weightKg: 62 } }), catalog);
  expect(p).toMatchObject({ blocked: null, requiresClearance: true, flags: { dietTargetsDisabled: true, hideDietNumbers: false } });
  expect(p.diet).toMatchObject({ kind: 'none', reason: 'seguranca' });
  expect(p.warnings).toEqual(['amamentacao']);
  expect(p.generated!.experience).toBe('nunca');
  expect(p.generated!.plan.rir).toEqual([...RIR_CONSERVADOR]);
  expect(Object.keys(p.generated!.plan.ex)).not.toContain('hip_b');
  expect(validateOnboardingAnswers({ ...defaultAnswers(), safety: ['amamentacao'] }).ok).toBe(true);
  expect(validateOnboardingAnswers({ ...defaultAnswers(), safety: ['amamentacao', 'nenhum'] }).ok).toBe(false);
 });
 it(`menos de ${MIN_PLAN_AGE} anos informados: não gera plano; ${MIN_PLAN_AGE} anos gera o plano leve`, () => {
  expect(planBlockedReason(A({ body: { age: 13 } }))).toBe('menor14');
  expect(planBlockedReason(A({ body: { age: 10 }, safety: ['menor18'] }))).toBe('menor14');
  expect(planBlockedReason(A({ body: { age: 14 } }))).toBeNull();
  expect(planBlockedReason(A({ safety: ['menor18'] }))).toBeNull(); // sem idade informada, fica o plano leve do menor de 18
  expect(() => buildPlanFromAnswers(A({ body: { age: 12 } }), catalog)).toThrow(/14 anos/);
  const p = buildOnboardingPreview(A({ body: { age: 12 } }), catalog);
  expect(p).toMatchObject({ blocked: 'menor14', generated: null, requiresClearance: false });
  expect(p.warnings).toEqual(['menor18']);
  expect(buildPlanFromAnswers(A({ body: { age: 14 }, experience: 'intermediario' }), catalog).experience).toBe('nunca');
 });
 it('gestação tem prioridade sobre a idade', () => {
  expect(planBlockedReason(A({ safety: ['gestacao'], body: { age: 12 } }))).toBe('gestacao');
 });
 it('condição de saúde: sem barra e sem flexão pike; liberação só quando não bloqueado', () => {
  const casa = buildPlanFromAnswers(A({ safety: ['condicao'], place: 'casa_livre', experience: 'intermediario', daysPerWeek: 3, duration: 'longo' }), catalog);
  expect(Object.keys(casa.plan.ex)).not.toContain('pike');
  expect(Object.keys(casa.plan.ex)).toContain('ponte');
  expect(buildOnboardingPreview(A({ safety: ['condicao', 'gestacao'] }), catalog)).toMatchObject({ blocked: 'gestacao', requiresClearance: false });
  expect(buildOnboardingPreview(A({ safety: ['transtorno'] }), catalog).requiresClearance).toBe(false);
 });
 it('as respostas guardadas continuam sem marcação de saúde', () => {
  const s = storedAnswersOf(A({ safety: ['amamentacao', 'condicao'] }));
  expect(JSON.stringify(s)).not.toMatch(/amamentacao|condicao|safety/);
 });
});

describe(`${OLDER_AGE} anos ou mais`, () => {
 it('nunca (salvo intermediário), RIR conservador, exercícios estáveis em casa e aviso idade60', () => {
  const a = A({ experience: 'iniciante', place: 'casa_livre', daysPerWeek: 4, duration: 'longo', body: { age: 60 } });
  expect(effectiveExperience(a)).toBe('nunca');
  const g = buildPlanFromAnswers(a, catalog);
  expect(g.plan.rir).toEqual([...RIR_CONSERVADOR]);
  const ids = Object.keys(g.plan.ex);
  for (const id of ['sentar_levantar', 'ponte']) expect(ids).toContain(id);
  for (const id of ['agach_livre', 'ponte_uni', 'stiff_uni', 'pike']) expect(ids).not.toContain(id);
  expect(g.warnings).toEqual(['idade60', 'duracao-reduzida']);
  // 59 anos: sem ajuste.
  expect(buildPlanFromAnswers(A({ experience: 'iniciante', place: 'casa_livre', body: { age: 59 } }), catalog).plan.rir).toEqual([...RIR_BEGINNER]);
 });
 it('intermediário com 60+ mantém a experiência, mas o RIR e as trocas são os conservadores', () => {
  const g = buildPlanFromAnswers(A({ experience: 'intermediario', place: 'casa_livre', daysPerWeek: 4, body: { age: 65 } }), catalog);
  expect(g.experience).toBe('intermediario');
  expect(g.plan.rir).toEqual([...RIR_CONSERVADOR]);
  expect(Object.keys(g.plan.ex)).not.toContain('stiff_uni');
  expect(Object.keys(g.plan.ex)).toContain('sentar_levantar');
 });
});

describe('duração, dias e motivo do corte', () => {
 it('nunca + longo vira medio (6 exercícios) com aviso; iniciante mantém o longo', () => {
  const g = buildPlanFromAnswers(A({ experience: 'nunca', duration: 'longo', daysPerWeek: 3 }), catalog);
  expect(g.duration).toBe('medio');
  expect(g.warnings).toEqual(['duracao-reduzida']);
  for (const k of g.plan.order) expect(g.plan.sess[k].ex).toHaveLength(6);
  expect(g.plan.sess.CIA.min).toBe('45 a 60 min');
  expect(buildPlanFromAnswers(A({ experience: 'iniciante', duration: 'longo' }), catalog).duration).toBe('longo');
 });
 it(`transtorno alimentar: no máximo ${TRANSTORNO_MAX_DAYS} dias e sem duração longa (sem aviso de duração)`, () => {
  const g = buildPlanFromAnswers(A({ safety: ['transtorno'], experience: 'intermediario', daysPerWeek: 6, duration: 'longo' }), catalog);
  expect(g.gymDays).toBe(4);
  expect(g.duration).toBe('medio');
  expect(g.daysReason).toBe('teto');
  expect(g.warnings).toEqual([]);
 });
 it('daysReason: teto, atividades ou null', () => {
  expect(buildPlanFromAnswers(A({ experience: 'nunca', daysPerWeek: 5 }), catalog).daysReason).toBe('teto');
  expect(buildPlanFromAnswers(A({ experience: 'nunca', daysPerWeek: 3 }), catalog).daysReason).toBeNull();
  // intermediário, 5 dias, luta em 3 dias: 5 + 3 > 6, cai para 3.
  const g = buildPlanFromAnswers(A({ experience: 'intermediario', daysPerWeek: 5, activities: [{ kind: 'luta', days: [0, 2, 4] }] }), catalog);
  expect([g.gymDays, g.daysReason]).toEqual([3, 'atividades']);
  // teto e atividades juntos: vale "atividades".
  expect(buildPlanFromAnswers(A({ experience: 'intermediario', daysPerWeek: 6, activities: [{ kind: 'luta', days: [1, 3] }] }), catalog).daysReason).toBe('atividades');
  // semana cheia: null.
  expect(buildPlanFromAnswers(A({ daysPerWeek: 4, activities: [{ kind: 'luta', days: [0, 1, 2, 3, 4, 5] }] }), catalog).daysReason).toBeNull();
  const p = buildOnboardingPreview(A({ experience: 'nunca', daysPerWeek: 5 }), catalog);
  expect(p.summary).toMatchObject({ gymDays: 3, daysRequested: 5, daysReason: 'teto' });
 });
});

describe('repetições, observação e descanso', () => {
 it('"por perna" e "por lado" vão para a observação quando a faixa é trocada', () => {
  const g = buildPlanFromAnswers(A({ experience: 'intermediario', daysPerWeek: 4, duration: 'longo' }), catalog);
  expect(g.plan.ex.pallof).toMatchObject({ t: 'Repetições por lado. Sem girar o tronco.' });
  expect(g.plan.ex.bulg).toMatchObject({ r: ['10–12', '10–12', '8–12'], t: 'Repetições por perna. Amplitude sem dor no joelho.' });
  const i = buildPlanFromAnswers(A({ experience: 'iniciante', daysPerWeek: 4 }), catalog);
  expect(i.plan.ex.afundo).toMatchObject({ r: ['12–15', '10–15', '10–12'], t: 'Repetições por perna. Passo controlado.' });
  // Repetições do catálogo: a observação não muda.
  const casa = buildPlanFromAnswers(A({ place: 'casa_livre', experience: 'iniciante', daysPerWeek: 3 }), catalog);
  expect(casa.plan.ex.deadbug.t).toBe(catalog.deadbug.t);
 });
 it('principal sem carga: 90 s; remada com mochila mantém a faixa do catálogo; com carga segue a tabela', () => {
  const g = buildPlanFromAnswers(A({ experience: 'intermediario', place: 'casa_livre', daysPerWeek: 4, duration: 'longo' }), catalog);
  expect(g.plan.ex.remada_mochila).toMatchObject({ s: [3, 4, 4], r: ['10–15', '10–15', '8–12'], rest: 90 });
  expect(g.plan.ex.agach_livre.rest).toBe(90);
  expect(g.plan.ex.prancha.rest).toBe(45);
  const academia = buildPlanFromAnswers(A({ experience: 'intermediario', daysPerWeek: 4 }), catalog);
  expect(academia.plan.ex.supino).toMatchObject({ r: ['6–10', '6–8', '5–8'], rest: 150 });
  const eq = buildPlanFromAnswers(A({ experience: 'iniciante', place: 'casa_equip' }), catalog);
  expect(eq.plan.ex.puxada_elastico.rest).toBe(90);
 });
});

describe('dias da semana: pernas', () => {
 it('Pernas B no fim da semana troca com um treino anterior (perfil 9 do QA)', () => {
  expect(week(A({ experience: 'iniciante', daysPerWeek: 4, duration: 'curto', place: 'casa_equip', activities: [{ kind: 'corrida', days: [5, 6] }] })))
   .toEqual(['seg:Superior A', 'ter:Pernas A', 'qua:-', 'qui:Pernas B', 'sex:Superior B', 'sáb:Corrida', 'dom:Corrida']);
 });
 it('pernas em dias seguidos vão para o dia livre (perfis 4 e 7 do QA)', () => {
  expect(week(A({ experience: 'intermediario', daysPerWeek: 5, duration: 'longo' })))
   .toEqual(['seg:Superior A', 'ter:Pernas A', 'qua:Superior B', 'qui:-', 'sex:Pernas B', 'sáb:-', 'dom:Corpo inteiro A']);
  expect(week(A({ experience: 'intermediario', daysPerWeek: 6, duration: 'longo', activities: [{ kind: 'luta', days: [1, 3] }] })))
   .toEqual(['seg:Superior A', 'ter:luta', 'qua:Superior B', 'qui:luta', 'sex:Pernas A', 'sáb:-', 'dom:Pernas B']);
 });
 it('sem dia livre que resolva, fica como está', () => {
  // iniciante 3 dias com luta seg e qui: Corpo inteiro ter, qua e sex; sábado é ao lado de sexta, domingo é véspera da luta.
  expect(week(A({ experience: 'iniciante', daysPerWeek: 3, activities: [{ kind: 'luta', days: [0, 3] }] })))
   .toEqual(['seg:luta', 'ter:Corpo inteiro A', 'qua:Corpo inteiro B', 'qui:luta', 'sex:Corpo inteiro A', 'sáb:-', 'dom:-']);
 });
 it('nunca põe pernas no dia ou na véspera de atividade fixa quando havia alternativa', () => {
  for (let d = 0; d < 7; d++) {
   const g = buildPlanFromAnswers(A({ experience: 'iniciante', daysPerWeek: 4, activities: [{ kind: 'corrida', days: [d] }] }), catalog);
   const legDays = g.sched.map((x, i) => (x.k === 'gym' && /Pernas/.test(g.plan.sess[x.s as string].name) ? i : -1)).filter(i => i >= 0);
   for (const i of legDays) expect(g.sched[(i + 1) % 7].k, `corrida ${d}, pernas ${i}`).not.toBe('esporte');
  }
 });
});

describe('prévia: avisos e subtítulos', () => {
 it('ordem de exibição: segurança, idade60, sem-dados, imc, duracao-reduzida, semana-cheia', () => {
  const p = buildOnboardingPreview(A({ safety: ['condicao'], experience: 'nunca', duration: 'longo', body: { age: 70 } }), catalog);
  expect(p.warnings).toEqual(['condicao', 'idade60', 'duracao-reduzida']);
  const q = buildOnboardingPreview(A({ experience: 'nunca', duration: 'longo', body: { age: 62 } }), catalog);
  expect(q.warnings).toEqual(['idade60', 'sem-dados', 'duracao-reduzida']);
  expect(WARNING_ORDER.slice(0, 5)).toEqual(['menor18', 'gestacao', 'amamentacao', 'condicao', 'transtorno']);
 });
 it('"core" vira "abdômen" nos subtítulos', () => {
  for (const a of [A({ daysPerWeek: 3 }), A({ daysPerWeek: 2 }), A({ experience: 'iniciante', daysPerWeek: 4 }), A({ experience: 'intermediario', daysPerWeek: 5 })]) {
   const g = buildPlanFromAnswers(a, catalog);
   for (const k of g.plan.order) expect(g.plan.sess[k].sub).not.toMatch(/core/);
  }
  expect(buildPlanFromAnswers(A({ experience: 'iniciante', daysPerWeek: 4 }), catalog).plan.sess.PERA.sub).toBe('Pernas, glúteos e abdômen');
 });
 it('determinístico e sem efeito sobre as marcações efetivas', () => {
  const a = A({ safety: ['amamentacao'], body: { age: 61 } });
  expect(buildOnboardingPreview(a, catalog)).toEqual(buildOnboardingPreview(structuredClone(a), catalog));
  expect(safetyFlagsOf(a)).toEqual(['amamentacao']);
 });
});
