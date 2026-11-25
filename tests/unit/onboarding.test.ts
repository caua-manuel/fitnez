import { describe, expect, it } from 'vitest';
import seedPlan from '../../data/plan.json';
import type { Exercise } from '../../src/application/repository';
import {
 ASSISTANT_EXERCISE_IDS, buildDietTargetsFromAnswers, buildOnboardingPreview, buildPlanFromAnswers, checkStoredOnboarding,
 defaultAnswers, defaultOnboardingStart, storedAnswersOf, validateOnboardingAnswers
} from '../../src/domain/onboarding';
import type { OnboardingAnswers } from '../../src/domain/onboarding';
import { activityFor, anyDayTypeOf, dayTypeOf } from '../../src/domain/dayActivity';
import { RIR, RIR_BEGINNER, phaseOf, rirSequence } from '../../src/domain/calendar';
import { RIR_CONSERVADOR } from '../../src/domain/onboarding';
import { validateDietTargets } from '../../src/domain/dietTargets';
import { muscleGroupOf } from '../../src/domain/muscleGroups';

// Contrato: docs/handoffs/conteudo-assistente-inicio.md, seção 7 (15 perfis) e exemplos de divisão (a) a (e).
const catalog = (seedPlan as any).plan.ex as Record<string, Exercise>;
const A = (over: Partial<OnboardingAnswers>): OnboardingAnswers => ({ ...defaultAnswers(), safety: ['nenhum'], ...over });
const body = (sex: 'm' | 'f' | 'nao_informar', age: number, heightCm: number, weightKg: number, lifestyle: 'pouco' | 'moderado' | 'muito') => ({ sex, age, heightCm, weightKg, lifestyle });
const ORDER = ['descanso', 'academia', 'perna', 'jiujitsu', 'volei'] as const;

function gymWeek(a: OnboardingAnswers) {
 const g = buildPlanFromAnswers(a, catalog);
 return g.sched.map((d, i) => (d.k === 'gym' ? `${i}:${g.plan.sess[d.s].name}` : null)).filter(Boolean);
}
function expectDiet(a: OnboardingAnswers, kcal: number[], carbs: number[], p: number, fat: number, water: number) {
 const r = buildDietTargetsFromAnswers(a);
 expect(r.kind).toBe('targets');
 if (r.kind !== 'targets') return;
 expect(ORDER.map(t => r.targets.days[t].kcal)).toEqual(kcal);
 expect(ORDER.map(t => r.targets.days[t].carbs)).toEqual(carbs);
 expect([r.targets.proteinG, r.targets.fatG, r.targets.waterL]).toEqual([p, fat, water]);
 // Esporte = mesmo acréscimo do vôlei (300 kcal)
 expect(r.targets.days.esporte).toEqual(r.targets.days.volei);
 expect(validateDietTargets(r.targets, { weightKg: a.body?.weightKg }).ok).toBe(true);
 return r;
}

describe('catálogo do assistente', () => {
 it('todas as IDs usadas existem em data/plan.json e têm grupo g válido', () => {
  for (const id of ASSISTANT_EXERCISE_IDS) {
   expect(catalog[id], id).toBeDefined();
   // Alguns ids do plano de exemplo (barra, cruc, lat_b...) não têm g: o grupo vem do mapa por id (muscleGroupOf, abaixo).
   if (catalog[id].g !== undefined) expect(typeof catalog[id].g, id).toBe('string');
   expect(muscleGroupOf(id, catalog[id]), id).not.toBeNull();
  }
 });
 it('19 exercícios novos (2 do ADR 012); os do plano de exemplo mantêm séries, repetições e descanso', () => {
  const novos = ['goblet', 'agach_livre', 'ponte_h', 'ponte_uni', 'ponte', 'afundo_livre', 'sentar_levantar', 'stiff_uni', 'supino_chao', 'flexao', 'flexao_fechada', 'pike', 'puxada_elastico', 'remada_mochila', 'face_elastico', 'ytw', 'pant_degrau', 'deadbug', 'prancha'];
  expect(novos.every(id => catalog[id])).toBe(true);
  expect(catalog.supino).toMatchObject({ s: [4, 5, 5], r: ['5–8', '4–6', '3–5'], rest: 150 });
  expect(catalog.prancha).toMatchObject({ m: 's', s: [2, 3, 3], r: ['20–30', '30–40', '30–45'], rest: 45, g: 'core' });
  const sess = (seedPlan as any).plan.sess;
  for (const s of Object.values(sess) as any[]) for (const id of s.ex) expect(novos).not.toContain(id);
 });
});

describe('validação das respostas', () => {
 it('passo 0 é obrigatório e "nenhum" não combina com outra opção', () => {
  expect(validateOnboardingAnswers(defaultAnswers()).ok).toBe(false);
  expect(validateOnboardingAnswers({ ...defaultAnswers(), safety: ['nenhum', 'gestacao'] }).ok).toBe(false);
  expect(validateOnboardingAnswers({ ...defaultAnswers(), safety: ['nenhum'] }).ok).toBe(true);
 });
 it('rejeita opção fora da lista, dia repetido entre atividades e dados físicos fora da faixa', () => {
  expect(validateOnboardingAnswers(A({ daysPerWeek: 7 as any })).ok).toBe(false);
  expect(validateOnboardingAnswers(A({ activities: [{ kind: 'luta', days: [0] }, { kind: 'corrida', days: [0] }] })).ok).toBe(false);
  const r = validateOnboardingAnswers(A({ body: { age: '9' as any, heightCm: 175, weightKg: '80,5' as any } }));
  expect(r.ok).toBe(false);
  if (!r.ok) expect(Object.keys(r.errors)).toEqual(['body.age']);
  const ok = validateOnboardingAnswers(A({ body: { age: '30' as any, heightCm: '175' as any, weightKg: '80,5' as any } }));
  expect(ok.ok && ok.value.body).toEqual({ age: 30, heightCm: 175, weightKg: 80.5 });
 });
 it('nome do esporte: até 30 caracteres, vazio vira "Esporte"', () => {
  expect(validateOnboardingAnswers(A({ activities: [{ kind: 'esporte', days: [5], label: 'x'.repeat(31) }] })).ok).toBe(false);
  const g = buildPlanFromAnswers(A({ activities: [{ kind: 'esporte', days: [5], label: '  ' }] }), catalog);
  expect(g.sched[5]).toEqual({ k: 'esporte', label: 'Esporte' });
 });
});

describe('15 perfis da especificação (seção 7)', () => {
 it('1: recomp, iniciante, 3, medio, academia', () => {
  const a = A({ goal: 'recomp', experience: 'iniciante', daysPerWeek: 3, body: body('m', 30, 175, 80, 'pouco') });
  expect(gymWeek(a)).toEqual(['0:Corpo inteiro A', '2:Corpo inteiro B', '4:Corpo inteiro A']);
  const g = buildPlanFromAnswers(a, catalog);
  expect(g.plan.sess.CIA.ex).toHaveLength(6);
  expect(g.plan.sess.CIB.ex).toHaveLength(6);
  expectDiet(a, [1900, 2050, 2100, 2200, 2150], [169, 206, 219, 244, 231], 160, 65, 3);
 });
 it('2: perder, nunca, 3, curto, casa_livre', () => {
  const a = A({ goal: 'perder', experience: 'nunca', daysPerWeek: 3, duration: 'curto', place: 'casa_livre', body: body('f', 25, 162, 60, 'moderado') });
  expect(gymWeek(a)).toEqual(['0:Corpo inteiro A', '2:Corpo inteiro B', '4:Corpo inteiro A']);
  const g = buildPlanFromAnswers(a, catalog);
  // ADR 012: nunca + casa sem equipamento usa a ponte com as duas pernas; principais sem carga com 90 s.
  // ADR 015: curto tem 5 exercícios por treino; a panturrilha entra no lugar do abdômen que o tempo não comporta.
  expect(g.plan.sess.CIA.ex).toEqual(['agach_livre', 'flexao', 'remada_mochila', 'ponte', 'pant_degrau']);
  expect(g.plan.sess.CIB.ex).toHaveLength(5);
  for (const id of ['agach_livre', 'flexao', 'remada_mochila', 'ponte']) expect(g.plan.ex[id].rest, id).toBe(90);
  expect(g.plan.ex.remada_mochila.r).toEqual(['10–15', '10–15', '8–12']);
  expectDiet(a, [1400, 1550, 1600, 1650, 1600], [118, 155, 168, 180, 168], 120, 50, 2);
 });
 it('3: saude, nunca, 2, curto, casa_equip, sem dados', () => {
  const a = A({ goal: 'saude', experience: 'nunca', daysPerWeek: 2, duration: 'curto', place: 'casa_equip' });
  expect(gymWeek(a)).toEqual(['0:Corpo inteiro A', '3:Corpo inteiro B']);
  expect(buildDietTargetsFromAnswers(a)).toMatchObject({ kind: 'none', reason: 'sem-dados', warnings: ['sem-dados'] });
  expect(buildOnboardingPreview(a, catalog).flags).toEqual({ dietTargetsDisabled: false, hideDietNumbers: false });
 });
 it('4: massa, iniciante, 4, medio, academia', () => {
  const a = A({ goal: 'massa', experience: 'iniciante', daysPerWeek: 4, body: body('m', 22, 180, 70, 'pouco') });
  expect(gymWeek(a)).toEqual(['0:Superior A', '1:Pernas A', '3:Superior B', '4:Pernas B']);
  expectDiet(a, [2250, 2500, 2550, 2650, 2600], [314, 376, 389, 414, 401], 125, 55, 2.5);
 });
 it('5: recomp, iniciante, 3, luta seg e qui', () => {
  const a = A({ goal: 'recomp', experience: 'iniciante', daysPerWeek: 3, activities: [{ kind: 'luta', days: [0, 3] }], body: body('f', 35, 165, 70, 'moderado') });
  expect(gymWeek(a)).toEqual(['1:Corpo inteiro A', '2:Corpo inteiro B', '4:Corpo inteiro A']);
  const g = buildPlanFromAnswers(a, catalog);
  expect(g.sched[0]).toEqual({ k: 'bjj', gi: true });
  expect(g.sched[3]).toEqual({ k: 'bjj', gi: true });
  expectDiet(a, [1650, 1800, 1850, 1950, 1900], [149, 186, 199, 224, 211], 140, 55, 2.5);
 });
 it('6: perder, nunca, IMC 33,1: leg no lugar de agach e peso de referência', () => {
  const a = A({ goal: 'perder', experience: 'nunca', daysPerWeek: 3, body: body('m', 40, 178, 105, 'pouco') });
  const g = buildPlanFromAnswers(a, catalog);
  expect(g.plan.sess.CIA.ex[0]).toBe('leg');
  expect(Object.keys(g.plan.ex)).not.toContain('agach');
  expectDiet(a, [1950, 2050, 2100, 2150, 2150], [181, 206, 219, 231, 231], 160, 65, 3.5);
 });
 it('7: menor de 18: treino leve com RIR de iniciante, sem dieta', () => {
  const a = A({ goal: 'recomp', experience: 'intermediario', daysPerWeek: 5, safety: ['menor18'], body: { age: 16 } });
  const g = buildPlanFromAnswers(a, catalog);
  expect(g.experience).toBe('nunca'); // treino leve: regras de quem nunca treinou
  // ADR 014: sem teto por experiência, recebe os 5 dias pedidos (Superior/Pernas + Empurrar/Puxar).
  expect(gymWeek(a)).toEqual(['0:Superior', '1:Pernas A', '2:Empurrar', '4:Puxar', '5:Pernas B']);
  expect(g.daysReason).toBeNull();
  expect(g.plan.rir).toEqual([...RIR_BEGINNER]);
  const p = buildOnboardingPreview(a, catalog);
  expect(p.diet).toMatchObject({ kind: 'none', reason: 'seguranca' });
  expect(p.warnings).toContain('menor18');
  expect(p.flags).toEqual({ dietTargetsDisabled: true, hideDietNumbers: false });
 });
 it('7b: idade abaixo de 18 sem marcar conta como menor', () => {
  const p = buildOnboardingPreview(A({ body: body('m', 15, 170, 60, 'pouco') }), catalog);
  expect(p.diet.kind).toBe('none');
  expect(p.warnings).toContain('menor18');
 });
 it('8: gestação: não gera plano nem metas (ADR 012)', () => {
  const a = A({ goal: 'perder', experience: 'iniciante', place: 'casa_equip', safety: ['gestacao'], body: body('f', 30, 165, 65, 'pouco') });
  expect(() => buildPlanFromAnswers(a, catalog)).toThrow(/gestação/);
  const p = buildOnboardingPreview(a, catalog);
  expect(p).toMatchObject({ blocked: 'gestacao', generated: null, requiresClearance: false, usedDayTypes: [] });
  expect(p.summary).toMatchObject({ gymDays: 0, scheduledGymDays: 0, sessionNames: [] });
  expect(p.diet).toMatchObject({ kind: 'none', reason: 'seguranca', effectiveGoal: 'saude' });
  expect(p.warnings).toEqual(['gestacao']);
 });
 it('9: transtorno: Superior/Pernas 4 dias, sem dieta e números escondidos', () => {
  const a = A({ goal: 'perder', experience: 'iniciante', daysPerWeek: 4, safety: ['transtorno'], body: body('f', 30, 165, 65, 'pouco') });
  expect(gymWeek(a)).toEqual(['0:Superior A', '1:Pernas A', '3:Superior B', '4:Pernas B']);
  const p = buildOnboardingPreview(a, catalog);
  expect(p.diet.kind).toBe('none');
  expect(p.flags).toEqual({ dietTargetsDisabled: true, hideDietNumbers: true });
  expect(p.summary.kcalMin).toBeNull();
 });
 it('10: perder com IMC 18,4 vira saude', () => {
  const a = A({ goal: 'perder', experience: 'iniciante', body: body('f', 28, 160, 47, 'moderado') });
  const r = expectDiet(a, [1500, 1700, 1750, 1850, 1800], [210, 260, 273, 298, 285], 75, 40, 2);
  expect(r).toMatchObject({ effectiveGoal: 'saude', warnings: ['imc-baixo'] });
 });
 it('11: intermediário 5 dias com corrida no domingo: Pernas B troca com Puxar e sai da véspera da corrida', () => {
  const a = A({ goal: 'saude', experience: 'intermediario', daysPerWeek: 5, duration: 'longo', activities: [{ kind: 'corrida', days: [6] }], body: body('nao_informar', 45, 170, 75, 'muito') });
  expect(gymWeek(a)).toEqual(['0:Superior', '1:Pernas A', '2:Empurrar', '4:Pernas B', '5:Puxar']);
  const g = buildPlanFromAnswers(a, catalog);
  expect(g.sched[6]).toEqual({ k: 'esporte', label: 'Corrida' });
  expect(g.plan.rir).toBeUndefined();
  expectDiet(a, [2200, 2400, 2450, 2550, 2500], [295, 345, 358, 383, 370], 120, 60, 2.5);
 });
 it('12: nunca, 6 dias pedidos, luta seg/ter/qui e esporte sáb: 2 dias qua e sex', () => {
  const a = A({ goal: 'perder', experience: 'nunca', daysPerWeek: 6, activities: [{ kind: 'luta', days: [0, 1, 3] }, { kind: 'esporte', days: [5], label: 'Futebol' }], body: body('m', 30, 175, 80, 'pouco') });
  expect(gymWeek(a)).toEqual(['2:Corpo inteiro A', '4:Corpo inteiro B']);
  expect(buildPlanFromAnswers(a, catalog).sched[5]).toEqual({ k: 'esporte', label: 'Futebol' });
  expectDiet(a, [1750, 1850, 1900, 1950, 1900], [131, 156, 169, 181, 169], 160, 65, 3);
 });
 it('13: intermediário 4 dias curto em casa, sem dados: 5 exercícios por treino (ADR 015)', () => {
  const a = A({ goal: 'recomp', experience: 'intermediario', daysPerWeek: 4, duration: 'curto', place: 'casa_equip' });
  const g = buildPlanFromAnswers(a, catalog);
  expect(g.plan.order).toEqual(['SUPA', 'PERA', 'SUPB', 'PERB']);
  for (const k of g.plan.order) expect(g.plan.sess[k].ex).toHaveLength(5);
  expect(buildDietTargetsFromAnswers(a).kind).toBe('none');
 });
 it('14: condição de saúde: plano leve (nunca), ponte com halter, RIR conservador, liberação médica e sem dieta (ADR 012)', () => {
  const p = buildOnboardingPreview(A({ goal: 'perder', experience: 'iniciante', safety: ['condicao'], body: body('m', 50, 175, 90, 'pouco') }), catalog);
  expect(p.diet).toMatchObject({ kind: 'none', reason: 'seguranca' });
  expect(p.warnings).toEqual(['condicao']);
  expect(p.requiresClearance).toBe(true);
  const g = p.generated!;
  expect(g.experience).toBe('nunca');
  expect(g.plan.rir).toEqual([...RIR_CONSERVADOR]);
  expect(Object.keys(g.plan.ex)).toContain('ponte_h');
  expect(Object.keys(g.plan.ex)).not.toContain('hip_b');
 });
 it('15: massa, intermediário, 2 dias longo: 8 exercícios', () => {
  const a = A({ goal: 'massa', experience: 'intermediario', daysPerWeek: 2, duration: 'longo', body: body('m', 30, 175, 80, 'pouco') });
  expect(gymWeek(a)).toEqual(['0:Corpo inteiro A', '3:Corpo inteiro B']);
  const g = buildPlanFromAnswers(a, catalog);
  expect(g.plan.sess.CIA.ex).toHaveLength(8);
  expect(g.plan.sess.CIB.ex).toHaveLength(8);
  expectDiet(a, [2300, 2550, 2600, 2700, 2650], [284, 346, 359, 384, 371], 145, 65, 3);
 });
});

describe('divisões (a) a (e)', () => {
 it('(a) intermediário 3 dias: Superior A seg, Pernas A qua, Corpo inteiro B sex', () => {
  expect(gymWeek(A({ experience: 'intermediario', daysPerWeek: 3 }))).toEqual(['0:Superior A', '2:Pernas A', '4:Corpo inteiro B']);
 });
 it('(b) iniciante 6 dias: 6 treinos, Empurrar, Puxar e Pernas duas vezes (ADR 014)', () => {
  expect(gymWeek(A({ experience: 'iniciante', daysPerWeek: 6 }))).toEqual(['0:Empurrar A', '1:Puxar A', '2:Pernas A', '3:Empurrar B', '4:Puxar B', '5:Pernas B']);
 });
 it('(c) nunca 5 dias: 5 treinos (ADR 014)', () => {
  expect(gymWeek(A({ experience: 'nunca', daysPerWeek: 5 }))).toHaveLength(5);
 });
 it('(d) casa_livre, Corpo inteiro A, medio: bíceps pulado, 6ª vaga é core', () => {
  const g = buildPlanFromAnswers(A({ place: 'casa_livre', duration: 'medio' }), catalog);
  // ADR 015: sem equipamento não há elevação lateral nem bíceps (aviso na revisão); a panturrilha e o core ocupam as vagas.
  expect(g.plan.sess.CIA.ex).toEqual(['agach_livre', 'flexao', 'remada_mochila', 'ponte', 'pant_degrau', 'deadbug']);
 });
 it('(e) luta todos os dias: 2 treinos curtos fora da rotina e aviso semana-cheia (decisão do dono)', () => {
  const g = buildPlanFromAnswers(A({ daysPerWeek: 4, experience: 'iniciante', activities: [{ kind: 'luta', days: [0, 1, 2, 3, 4, 5, 6] }] }), catalog);
  expect(g.warnings).toEqual(['semana-cheia']);
  expect(g.gymDays).toBe(2);
  expect(g.scheduledGymDays).toBe(0);
  expect(g.plan.order).toEqual(['CIA', 'CIB']);
  expect(g.duration).toBe('curto');
  expect(g.sched.every(d => d.k === 'bjj')).toBe(true);
 });
 it('6 dias fixos: o dia livre fica de descanso', () => {
  const g = buildPlanFromAnswers(A({ activities: [{ kind: 'luta', days: [0, 1, 2, 3, 4, 5] }] }), catalog);
  expect(g.sched[6]).toEqual({ k: 'rest' });
  expect(g.warnings).toEqual(['semana-cheia']);
 });
 it('Pernas na véspera de luta troca com o próximo treino que não é de pernas; pernas não ficam em dias seguidos', () => {
  // iniciante 4 dias, luta na quarta: dias livres preferidos seg, ter, qui, sex; Pernas A (ter) é véspera da quarta.
  // A troca deixa Pernas A (qui) e Pernas B (sex) seguidas; o sábado livre resolve (ADR 012).
  expect(gymWeek(A({ experience: 'iniciante', daysPerWeek: 4, activities: [{ kind: 'luta', days: [2] }] }))).toEqual(['0:Superior A', '1:Superior B', '3:Pernas A', '5:Pernas B']);
 });
 it('treinos de perna são reconhecidos como dia de perna', () => {
  const g = buildPlanFromAnswers(A({ experience: 'iniciante', daysPerWeek: 4 }), catalog);
  const types = g.sched.map((_, i) => { const act = activityFor({ sched: g.sched, weekday: i }); return dayTypeOf(act, act.kind === 'gym' ? g.plan.sess[act.sessionId].name : undefined); });
  expect(types).toEqual(['academia', 'perna', 'descanso', 'academia', 'perna', 'descanso', 'descanso']);
 });
});

describe('séries, repetições, descanso e RIR', () => {
 it('iniciante: principal [3,3,4] 120 s; acessória [2,3,3] 60 s; core 45 s', () => {
  const g = buildPlanFromAnswers(A({ experience: 'iniciante', duration: 'longo' }), catalog);
  // ADR 015: o motor escolhe de 2 a 4 séries no bloco 1; a progressão entre blocos segue a tabela do iniciante.
  expect(g.plan.ex.supino).toMatchObject({ r: ['8–12', '8–10', '6–10'], rest: 120 });
  expect(g.plan.ex.supino.s[0]).toBeGreaterThanOrEqual(2);
  expect(g.plan.ex.supino.s[0]).toBeLessThanOrEqual(4);
  expect(g.plan.ex.supino.s).toEqual([g.plan.ex.supino.s[0], g.plan.ex.supino.s[0], g.plan.ex.supino.s[0] + 1]);
  expect(g.plan.ex.lat_a).toMatchObject({ r: ['12–15', '10–15', '10–12'], rest: 60 });
  expect(g.plan.ex.pallof.rest).toBe(45);
 });
 it('intermediário: principal [3,4,4] 150 s; exercícios rep/s mantêm a faixa própria', () => {
  const g = buildPlanFromAnswers(A({ experience: 'intermediario', daysPerWeek: 4, place: 'casa_livre', duration: 'longo' }), catalog);
  expect(g.plan.ex.flexao).toMatchObject({ r: ['5–12', '8–15', '10–20'], rest: 90 }); // ADR 012: sem carga, 90 s
  expect(g.plan.ex.flexao.s).toEqual([g.plan.ex.flexao.s[0], g.plan.ex.flexao.s[0] + 1, g.plan.ex.flexao.s[0] + 1]);
  expect(g.plan.ex.prancha).toMatchObject({ r: ['20–30', '30–40', '30–45'], rest: 45 });
 });
 it('RIR: plan.rir para nunca e iniciante; phaseOf usa a sequência do plano', () => {
  expect(buildPlanFromAnswers(A({ experience: 'nunca' }), catalog).plan.rir).toEqual([...RIR_BEGINNER]);
  expect(RIR_BEGINNER.every(x => !x.startsWith('1'))).toBe(true);
  expect(rirSequence({})).toBe(RIR);
  expect(rirSequence({ rir: ['x'] })).toBe(RIR);
  const p = phaseOf('2026-01-05', '2026-01-26', rirSequence({ rir: [...RIR_BEGINNER] }));
  expect(p.kind === 'week' && p.rir).toBe('4');
  const q = phaseOf('2026-01-05', '2026-02-02', rirSequence({ rir: [...RIR_BEGINNER] }));
  expect(q.kind === 'week' && q.rir).toBe('2–3');
  expect((phaseOf('2026-01-05', '2026-02-02') as any).rir).toBe(RIR[4]);
 });
 it('determinístico: mesma resposta, mesmo resultado', () => {
  const a = A({ goal: 'massa', experience: 'iniciante', daysPerWeek: 4, body: body('m', 22, 180, 70, 'pouco') });
  expect(buildOnboardingPreview(a, catalog)).toEqual(buildOnboardingPreview(structuredClone(a), catalog));
 });
});

describe('prévia e privacidade das respostas guardadas', () => {
 it('faixa de kcal usa só os tipos de dia da rotina gerada', () => {
  const p = buildOnboardingPreview(A({ goal: 'recomp', experience: 'iniciante', body: body('m', 30, 175, 80, 'pouco') }), catalog);
  expect(p.usedDayTypes).toEqual(['academia', 'descanso']);
  expect([p.summary.kcalMin, p.summary.kcalMax, p.summary.proteinG]).toEqual([1900, 2050, 160]);
  expect(p.summary.sessionNames).toEqual(['Corpo inteiro A', 'Corpo inteiro B']);
 });
 it('respostas guardadas não têm passo 0 nem dados físicos', () => {
  const s = storedAnswersOf(A({ safety: ['transtorno', 'gestacao'], body: body('f', 30, 165, 60, 'pouco'), activities: [{ kind: 'esporte', days: [5], label: 'Vôlei de praia' }] }));
  expect(Object.keys(s).sort()).toEqual(['activities', 'daysPerWeek', 'duration', 'experience', 'goal', 'place']);
  expect(JSON.stringify(s)).not.toMatch(/safety|sex|transtorno|gestacao|"f"/);
 });
 it('checkStoredOnboarding rejeita sexo, marcações e campos desconhecidos', () => {
  const ok = { v: 1, appliedOn: '2026-11-19', answers: storedAnswersOf(A({})), dietTargetsDisabled: false, hideDietNumbers: false };
  expect(checkStoredOnboarding(ok, 200, 60)).toBeNull();
  expect(checkStoredOnboarding({ ...ok, sex: 'f' }, 200, 60)).toMatch(/não permitido/);
  expect(checkStoredOnboarding({ ...ok, answers: { ...ok.answers, safety: ['transtorno'] } }, 200, 60)).toMatch(/não permitido/);
  expect(checkStoredOnboarding({ ...ok, answers: { ...ok.answers, body: { sex: 'm' } } }, 200, 60)).toMatch(/não permitido/);
  expect(checkStoredOnboarding({ ...ok, v: 2 }, 200, 60)).toMatch(/versão/);
  expect(checkStoredOnboarding({ ...ok, answers: { ...ok.answers, daysPerWeek: 9 } }, 200, 60)).not.toBeNull();
 });
 it('início padrão: próxima segunda (hoje, se for segunda)', () => {
  expect(defaultOnboardingStart('2026-11-19')).toBe('2026-11-23');
  expect(defaultOnboardingStart('2026-11-23')).toBe('2026-11-23');
  expect(defaultOnboardingStart('2026-11-22')).toBe('2026-11-23');
 });
});

describe('tipo de dia Esporte', () => {
 it('rotina com esporte: atividade, rótulo e tipo de dia', () => {
  const sched = [{ k: 'esporte', label: 'Futebol' }, { k: 'esporte' }];
  expect(activityFor({ sched, weekday: 0 })).toEqual({ kind: 'esporte', label: 'Futebol' });
  expect(activityFor({ sched, weekday: 1 })).toEqual({ kind: 'esporte', label: 'Esporte' });
  expect(anyDayTypeOf({ kind: 'esporte', label: 'Futebol' })).toBe('esporte');
  expect(dayTypeOf({ kind: 'esporte', label: 'Futebol' })).toBe('volei'); // compatibilidade com telas antigas
 });
});

// Ajuste de volume (docs/handoffs/conteudo-ajuste-volume-assistente.md, ADR 010): séries do bloco 1 por grupo grande.
describe('volume semanal por grupo nos 15 perfis (bloco 1)', () => {
 const BIG = ['peito', 'costas', 'quadriceps', 'posterior-gluteos'] as const;
 const FAIXA = { nunca: [4, 8], iniciante: [6, 10], intermediario: [8, 16] } as const;
 const PRINCIPAL_S0 = { nunca: 2, iniciante: 3, intermediario: 3 } as const;
 function weekly(a: OnboardingAnswers) {
  const g = buildPlanFromAnswers(a, catalog);
  const gym = g.sched.filter(d => d.k === 'gym').map(d => d.s as string);
  const sessions = gym.length ? gym : g.plan.order; // semana cheia: treinos fora da rotina
  const out: Record<string, number> = { peito: 0, costas: 0, quadriceps: 0, 'posterior-gluteos': 0 };
  for (const k of sessions) for (const id of g.plan.sess[k].ex) { const grp = muscleGroupOf(id, g.plan.ex[id]); if (grp && grp in out) out[grp] += g.plan.ex[id].s[0]; }
  return { g, days: sessions.length, vals: BIG.map(k => out[k]) };
 }
 const P1 = A({ goal: 'recomp', experience: 'iniciante', daysPerWeek: 3, body: body('m', 30, 175, 80, 'pouco') });
 const P4 = A({ goal: 'massa', experience: 'iniciante', daysPerWeek: 4, body: body('m', 22, 180, 70, 'pouco') });
 const PROFILES: Array<[string, OnboardingAnswers, number[]]> = [
  ['1', P1, [8, 8, 8, 8]],
  ['2', A({ goal: 'perder', experience: 'nunca', daysPerWeek: 3, duration: 'curto', place: 'casa_livre' }), [6, 6, 6, 6]],
  ['3', A({ goal: 'saude', experience: 'nunca', daysPerWeek: 2, duration: 'curto', place: 'casa_equip' }), [4, 4, 4, 4]],
  ['4', P4, [8, 8, 10, 10]],
  ['5', A({ goal: 'recomp', experience: 'iniciante', daysPerWeek: 3, activities: [{ kind: 'luta', days: [0, 3] }] }), [8, 8, 8, 8]],
  ['6', A({ goal: 'perder', experience: 'nunca', daysPerWeek: 3, body: body('m', 40, 178, 105, 'pouco') }), [6, 6, 6, 6]],
  ['7', A({ goal: 'recomp', experience: 'intermediario', daysPerWeek: 5, safety: ['menor18'], body: { age: 16 } }), [6, 8, 8, 8]],
  ['9', A({ goal: 'perder', experience: 'iniciante', daysPerWeek: 4, safety: ['transtorno'] }), [6, 8, 8, 8]],
  ['10', A({ goal: 'perder', experience: 'iniciante', body: body('f', 28, 160, 47, 'moderado') }), [6, 6, 6, 6]],
  ['11', A({ goal: 'saude', experience: 'intermediario', daysPerWeek: 5, duration: 'longo', activities: [{ kind: 'corrida', days: [6] }] }), [8, 10, 8, 8]],
  ['12', A({ goal: 'perder', experience: 'nunca', daysPerWeek: 6, activities: [{ kind: 'luta', days: [0, 1, 3] }, { kind: 'esporte', days: [5], label: 'Futebol' }] }), [5, 5, 5, 5]],
  ['13', A({ goal: 'recomp', experience: 'intermediario', daysPerWeek: 4, duration: 'curto', place: 'casa_equip' }), [4, 8, 12, 11]],
  ['14', A({ goal: 'perder', experience: 'iniciante', safety: ['condicao'] }), [6, 6, 6, 6]],
  ['15', A({ goal: 'massa', experience: 'intermediario', daysPerWeek: 2, duration: 'longo' }), [9, 9, 8, 8]],
 ];
 it.each(PROFILES)('perfil %s: peito / costas / quadríceps / posterior e faixa', (_n, a, expected) => {
  const { g, days, vals } = weekly(a);
  expect(vals).toEqual(expected);
  const [min, max] = FAIXA[g.experience];
  for (const v of vals) {
   expect(v).toBeLessThanOrEqual(max);
   if (g.duration === 'curto') continue;
   expect(v).toBeGreaterThanOrEqual(days === 2 ? 2 * PRINCIPAL_S0[g.experience] : min);
  }
 });
 it('perfil 4: Superior A e B diferem, sem exercício repetido (ADR 015)', () => {
  const g = buildPlanFromAnswers(P4, catalog);
  expect(g.plan.sess.SUPA.ex).toEqual(['supino', 'puxada', 'press_b', 'remada_b', 'lat_a', 'rosca_a']);
  expect(g.plan.sess.SUPB.ex).toEqual(['remada_b', 'inclinado', 'puxada', 'press_a', 'face', 'tri_b']);
  expect(g.plan.sess.PERA.ex).toEqual(['agach', 'hip_b', 'afundo', 'mesa', 'pant_pe', 'pallof']);
  expect(g.plan.sess.PERB.ex).toEqual(['leg', 'ponte_h', 'afundo', 'mesa', 'pant_sent', 'deadbug']);
 });
 it('intermediário: o Superior B puxa na vertical (barra fixa ou puxada)', () => {
  const g = buildPlanFromAnswers(A({ experience: 'intermediario', daysPerWeek: 4 }), catalog);
  expect(g.plan.sess.SUPB.ex.some(id => id === 'barra' || id === 'puxada')).toBe(true);
 });
 it('perfis 12, 15 e 3: Corpo inteiro B com 2 dias usa empurrar inclinado e o novo subtítulo', () => {
  const g12 = buildPlanFromAnswers(PROFILES.find(p => p[0] === '12')![1], catalog);
  expect(g12.plan.sess.CIA.ex).toEqual(['leg', 'supino', 'puxada', 'hip_b', 'lat_a', 'rosca_a']);
  expect(g12.plan.sess.CIB.ex).toEqual(['press_b', 'remada_b', 'afundo', 'inclinado', 'mesa', 'face']);
  expect(g12.plan.sess.CIB.sub).toBe('Pernas, peito, costas e abdômen');
  const g15 = buildPlanFromAnswers(PROFILES.find(p => p[0] === '15')![1], catalog);
  expect(g15.plan.sess.CIA.ex).toEqual(['agach', 'supino', 'puxada', 'hip_b', 'lat_a', 'rosca_a', 'pant_pe', 'pallof']);
  expect(g15.plan.sess.CIB.ex).toEqual(['stiff', 'press_b', 'remada_b', 'bulg', 'inclinado', 'face', 'tri_a', 'pant_sent']);
  const g3 = buildPlanFromAnswers(PROFILES.find(p => p[0] === '3')![1], catalog);
  expect(g3.plan.sess.CIA.ex).toEqual(['goblet', 'supino_chao', 'puxada_elastico', 'ponte_h', 'lat_a']);
  expect(g3.plan.sess.CIB.ex).toEqual(['stiff', 'press_b', 'remada_b', 'bulg', 'supino_chao']);
 });
 it('com 3 dias o Corpo inteiro B não muda', () => {
  const g = buildPlanFromAnswers(P1, catalog);
  expect(g.plan.sess.CIB.ex).toContain('press_b');
  expect(g.plan.sess.CIB.sub).toBe('Pernas, ombros, costas e abdômen');
 });
});
