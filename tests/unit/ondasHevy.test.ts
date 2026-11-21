import { describe, expect, it } from 'vitest';
import seed from '../../data/plan.json';
import type { DayRecord, Exercise, Plan } from '../../src/application/repository';
import { suggestNext } from '../../src/domain/progression';
import { confirmSet, lastWorkingSession, placeholderFor, previousSetAt, workingHistory } from '../../src/domain/setPlaceholder';
import { e1rm, exerciseHistory, personalRecords, previousSessionVolume, recordForSet, recordsOfDay, roundHalf, volumeComparison } from '../../src/domain/records';
import { platesPerSide, checkStoredPlates } from '../../src/domain/plates';
import { groupRange, groupStatus, plannedSetsByGroup, weeklySetsByGroup } from '../../src/domain/weeklySets';
import { SWAP_GROUPS, exercisesWithSwaps, setDaySwap, swapOptions, swapPrescription } from '../../src/domain/swap';
import { warmupSets } from '../../src/domain/warmup';
import { weekStreak } from '../../src/domain/weekStreak';
import { EXERCISE_NOTE_MAX, GUIDE_SAFETY, EXERCISE_GUIDE, checkStoredExerciseNotes, guideFor, setExerciseNote } from '../../src/domain/exerciseNotes';
import { countDoneSets, lastPerformance, sessionVolume, type SetEntry } from '../../src/domain/workout';
import { ASSISTANT_EXERCISE_IDS } from '../../src/domain/onboarding';

const plan = (seed as unknown as { plan: Plan }).plan;
const EX = plan.ex;
const S = (kg: string, reps: string, extra: Partial<SetEntry> = {}): SetEntry => ({ kg, reps, done: true, ...extra });
const sug = (kg: number | null, reason: 'sem-historico' | 'subir' | 'manter' | 'reduzir', reps = '5–8') => ({ kg, reps, reason, stagnant: false });

describe('placeholderFor (seção 1, exemplos 1 a 9)', () => {
 const ph = (o: Partial<Parameters<typeof placeholderFor>[0]>) => placeholderFor({ ex: EX.supino!, week: 1, suggestion: sug(40, 'manter'), previous: [], today: [], index: 0, ...o });
 it('1 semana normal, manter', () => expect(ph({ previous: [S('40', '7')] })).toMatchObject({ kg: '40', reps: '7', podeConfirmar: true }));
 it('2 semana normal, subir', () => expect(ph({ suggestion: sug(42.5, 'subir'), previous: [S('40', '8')] })).toMatchObject({ kg: '42,5', reps: '5', podeConfirmar: true }));
 it('3 semana leve não sobe carga', () => expect(ph({ week: 3, suggestion: sug(42.5, 'subir'), previous: [S('40', '8')] })).toMatchObject({ kg: '40', reps: '8', podeConfirmar: true }));
 it('4 antes acima da faixa nova', () => expect(ph({ week: 4, suggestion: sug(45, 'manter'), previous: [S('45', '8')] })).toMatchObject({ kg: '45', reps: '6', podeConfirmar: true }));
 it('5 primeira vez kg', () => expect(ph({ suggestion: sug(null, 'sem-historico') })).toEqual({ kg: null, reps: null, podeConfirmar: false, falta: 'reps', dica: { kg: 'kg', reps: '5–8' } }));
 it('6 primeira vez, série 2', () => expect(ph({ suggestion: sug(null, 'sem-historico'), today: [S('30', '8')], index: 1 })).toMatchObject({ kg: '30', reps: '8', podeConfirmar: true }));
 it('7 mudou a carga hoje', () => expect(ph({ previous: [S('40', '8'), S('40', '7')], today: [S('37.5', '8')], index: 1 })).toMatchObject({ kg: '37,5', reps: '7', podeConfirmar: true }));
 it('defeito: mudou para 35 com sugestão 30, a série 3 segue 35', () => {
  const o = { suggestion: sug(30, 'manter'), previous: [S('30', '8'), S('30', '8'), S('30', '8')], today: [S('35', '8'), S('35', '8')], index: 2 };
  expect(ph(o)).toMatchObject({ kg: '35', podeConfirmar: true });
  expect(ph({ ...o, index: 1, today: [S('35', '8')] })).toMatchObject({ kg: '35' });
 });
 it('defeito: primeira vez com 2 séries feitas, a série 3 mostra a última carga', () => {
  expect(ph({ suggestion: sug(null, 'sem-historico'), today: [S('30', '8'), S('32.5', '8')], index: 2 })).toMatchObject({ kg: '32,5', reps: '8', podeConfirmar: true });
  expect(ph({ suggestion: sug(null, 'sem-historico'), today: [S('30', '8'), S('30', '8')], index: 2 })).toMatchObject({ kg: '30', podeConfirmar: true });
 });
 it('voltou à carga sugerida hoje: segue a sugestão', () => expect(ph({ suggestion: sug(30, 'manter'), today: [S('35', '8'), S('30', '8')], index: 2 })).toMatchObject({ kg: '30' }));
 it('8 rep sem histórico', () => expect(placeholderFor({ ex: EX.flexao!, week: 0, suggestion: sug(null, 'sem-historico', '5–12'), previous: [], today: [], index: 0 })).toMatchObject({ kg: null, reps: null, podeConfirmar: false }));
 it('9 bw: reps do Antes e ✓ grava kg vazio', () => {
  const p = placeholderFor({ ex: EX.barra!, week: 0, suggestion: suggestNext({ ex: EX.barra!, week: 0, history: [[S('', '6')]], lower: false }), previous: [S('', '6')], today: [], index: 0 });
  expect(p).toMatchObject({ kg: null, reps: '6', podeConfirmar: true });
  expect(confirmSet({}, p, EX.barra!)).toEqual({ ok: true, set: { kg: '', reps: '6', done: true } });
 });
 it('aquecimento não vira série anterior de hoje; série extra usa a anterior de hoje', () => {
  expect(ph({ today: [S('20', '8', { kind: 'warm' })], previous: [S('40', '7')] })).toMatchObject({ kg: '40', reps: '7' });
  expect(ph({ previous: [S('40', '7')], today: [S('40', '7'), S('40', '6')], index: 2 })).toMatchObject({ kg: '40', reps: '6' });
 });
 it('confirmSet: digitado vale o digitado; vazio pede carga ou repetições', () => {
  expect(confirmSet({ kg: '45' }, { kg: '40', reps: '7' }, EX.supino!)).toEqual({ ok: true, set: { kg: '45', reps: '7', done: true } });
  expect(confirmSet({}, { kg: null, reps: '8' }, EX.supino!)).toMatchObject({ ok: false, mensagem: 'Digite a carga' });
  expect(confirmSet({}, { kg: '40', reps: null }, EX.supino!)).toMatchObject({ ok: false, mensagem: 'Digite as repetições' });
  expect(confirmSet({ reps: '8' }, { kg: null, reps: null }, EX.supino!, 'warm')).toEqual({ ok: true, set: { kg: '', reps: '8', done: true, kind: 'warm' } });
 });
});

describe('Antes e histórico sem aquecimento', () => {
 const days: Record<string, DayRecord> = {
  '2026-11-10': { log: { supino: [S('20', '8', { kind: 'warm' }), S('40', '8'), S('40', '7')] } },
  '2026-11-12': { log: { supino: [{ kg: '', reps: '', done: false }] } },
 };
 it('previousSetAt pula aquecimento e dias sem série concluída', () => {
  expect(previousSetAt(days, 'supino', '2026-11-17', 0)).toEqual(S('40', '8'));
  expect(previousSetAt(days, 'supino', '2026-11-17', 1)).toEqual(S('40', '7'));
  expect(previousSetAt(days, 'supino', '2026-11-17', 2)).toBeNull();
  expect(previousSetAt(days, 'supino', '2026-11-10', 0)).toBeNull();
  expect(lastWorkingSession(days, 'supino', '2026-11-17')?.day).toBe('2026-11-10');
  expect(workingHistory(days, 'supino', '2026-11-17')).toHaveLength(1);
  expect(lastPerformance(days, 'supino', '2026-11-17')?.sets).toHaveLength(2);
 });
 it('volume, contagem e suggestNext ignoram aquecimento', () => {
  const rows = days['2026-11-10']!.log!.supino as SetEntry[];
  expect(sessionVolume([rows])).toBe(600);
  expect(countDoneSets([rows])).toBe(2);
  expect(suggestNext({ ex: EX.supino!, week: 0, history: [[S('100', '8', { kind: 'warm' }), S('40', '7')]], lower: false }).kg).toBe(40);
 });
});

describe('recordes (seção 2, exemplos 1 a 8)', () => {
 const hist = (...sets: SetEntry[]): Record<string, DayRecord> => (sets.length ? { '2026-11-10': { log: { supino: sets } } } : {});
 const rec = (h: Record<string, DayRecord>, set: SetEntry, exId = 'supino') => recordForSet({ ex: EX[exId]!, bests: personalRecords(h, exId, EX[exId], '2026-11-17'), set });
 it('Epley', () => { expect(e1rm(60, 8)).toBeCloseTo(76); expect(e1rm(40, 15)).toBeNull(); expect(roundHalf(76.67)).toBe(76.5); });
 it('1 maior carga', () => expect(rec(hist(S('60', '8'), S('60', '8')), S('62.5', '6'))).toMatchObject({ type: 'maxKg', types: ['maxKg'] }));
 it('2 mais repetições e 1RM: mostra 1RM', () => expect(rec(hist(S('60', '8')), S('60', '9'))).toMatchObject({ type: 'maxE1rm', types: ['maxE1rm', 'maxRepsAtKg'] }));
 it('3 1RM com ganho ≥ 0,5', () => { const r = rec(hist(S('60', '8')), S('57.5', '10'))!; expect(r.type).toBe('maxE1rm'); expect(roundHalf(r.e1rm!)).toBe(76.5); });
 it('4 reps acima de 10 em carga nova', () => expect(rec(hist(S('60', '8')), S('40', '15'))).toBeNull());
 it('5 primeira vez', () => expect(rec({}, S('50', '10'))).toBeNull());
 it('6 empate', () => expect(rec(hist(S('60', '8')), S('60', '8'))).toBeNull());
 it('7 aquecimento', () => expect(rec(hist(S('60', '8')), S('70', '1', { kind: 'warm' }))).toBeNull());
 it('8 bw excluído', () => expect(rec({ '2026-11-10': { log: { barra: [S('0', '10')] } } }, S('0', '12'), 'barra')).toBeNull());
 it('1RM com ganho < 0,5 não conta', () => expect(rec(hist(S('60', '8')), S('57.25', '10'))).toBeNull()); // 76,33 contra 76
 it('dentro do dia compara com as séries anteriores de hoje', () => {
  const bests = personalRecords(hist(S('60', '8')), 'supino', EX.supino, '2026-11-17');
  expect(recordForSet({ ex: EX.supino!, bests, todayBefore: [S('62.5', '6')], set: S('62.5', '6') })).toBeNull();
  expect(recordForSet({ ex: EX.supino!, bests, todayBefore: [S('62.5', '6')], set: S('65', '5') })?.type).toBe('maxKg');
 });
 it('recordsOfDay: melhor tipo por exercício', () => {
  const days: Record<string, DayRecord> = { ...hist(S('60', '8')), '2026-11-17': { log: { supino: [S('60', '9'), S('62.5', '6')], barra: [S('', '10')] } } };
  expect(recordsOfDay(days, plan, '2026-11-17').map(r => [r.exId, r.type])).toEqual([['supino', 'maxKg']]);
 });
 it('volume comparado com a sessão anterior', () => {
  const days: Record<string, DayRecord> = { '2026-11-10': { workouts: { UA: { sessionId: 'UA', startedAt: 1, status: 'done', sets: 10, volume: 8000 } } } };
  const prev = previousSessionVolume(days, 'UA', '2026-11-17');
  expect(prev).toBe(8000);
  expect(volumeComparison(8420, prev)).toEqual({ volume: 8420, previous: 8000, pct: 5 });
  expect(volumeComparison(100, null).pct).toBeNull();
  expect(previousSessionVolume(days, 'UB', '2026-11-17')).toBeNull();
 });
});

describe('exerciseHistory', () => {
 it('sessões do mais recente, melhor série e 1RM por sessão, sem aquecimento', () => {
  const days: Record<string, DayRecord> = {
   '2026-11-12': { log: { supino: [S('30', '8', { kind: 'warm' }), S('60', '8'), S('60', '8'), S('57.5', '9')] } },
   '2026-11-19': { log: { supino: [S('62.5', '6'), S('60', '8'), { kg: '60', reps: '', done: false }] } },
  };
  const h = exerciseHistory(days, 'supino', EX.supino);
  expect(h.map(s => s.day)).toEqual(['2026-11-19', '2026-11-12']);
  expect(h[0]!.sets).toEqual([{ kg: 62.5, reps: 6 }, { kg: 60, reps: 8 }]);
  expect(h[0]!.best).toEqual({ kg: 60, reps: 8 });
  expect(h[0]!.e1rm).toBeCloseTo(76);
  expect(h[0]!.maxKg).toBe(62.5);
  expect(h[1]!.sets).toHaveLength(3);
  expect(exerciseHistory(days, 'barra', EX.barra)).toEqual([]);
 });
 it('exercício sem carga: sem 1RM', () => {
  const h = exerciseHistory({ '2026-11-12': { log: { barra: [S('', '8'), S('', '10')] } } }, 'barra', EX.barra);
  expect(h[0]).toMatchObject({ e1rm: null, best: { kg: null, reps: 10 }, maxKg: null });
 });
});

describe('platesPerSide (seção 8)', () => {
 it.each([
  [62.5, 20, undefined, [20, 1.25], 62.5, true],
  [100, 20, undefined, [25, 15], 100, true],
  [61, 20, undefined, [20], 60, false],
  [20, 20, undefined, [], 20, true],
  [47.5, 15, undefined, [15, 1.25], 47.5, true],
  [60, 20, [25, 15, 10, 5, 2.5, 1.25], [15, 5], 60, true],
 ])('%s kg, barra %s', (total, bar, avail, perSide, achieved, exact) => {
  expect(platesPerSide(total, bar, avail)).toEqual({ ok: true, perSide, achieved, exact, bar });
 });
 it('abaixo da barra e sem barra', () => {
  expect(platesPerSide(15, 20)).toEqual({ ok: false, error: 'abaixo-da-barra' });
  expect(platesPerSide(10, 0)).toMatchObject({ perSide: [5], exact: true });
  expect(platesPerSide(NaN)).toEqual({ ok: false, error: 'carga-invalida' });
 });
 it('valida configuração guardada', () => {
  expect(checkStoredPlates({ bar: 15, available: [20, 5] })).toBeNull();
  expect(checkStoredPlates({ bar: 12, available: [] })).toMatch(/barra/);
  expect(checkStoredPlates({ bar: 20, available: [3] })).toMatch(/anilha/);
 });
});

describe('séries por grupo (seção 3)', () => {
 const st = (group: any, sets: number, experience: any, inProgress = false, deload = false) => groupStatus({ group, sets, experience, inProgress, deload });
 it('exemplos 1 a 7', () => {
  expect(st('peito', 5, 'iniciante')).toBe('abaixo');
  expect(st('peito', 5, 'iniciante', true)).toBeNull();
  expect(st('biceps', 3, 'iniciante')).toBe('dentro');
  expect(st('quadriceps', 15, undefined)).toBe('dentro');
  expect(st('quadriceps', 16, undefined)).toBe('dentro');
  expect(st('quadriceps', 17, undefined)).toBe('acima');
  expect(st('costas', 8, 'nunca')).toBe('dentro');
  expect(st('peito', 3, 'iniciante', false, true)).toBeNull();
  expect(st('core', 9, 'intermediario')).toBeNull();
  expect(st('quadriceps', 17, undefined, true)).toBe('acima');
 });
 it('conta séries de trabalho concluídas na semana pelo grupo do exercício feito', () => {
  const days: Record<string, DayRecord> = {
   '2026-11-16': { log: { supino: [S('20', '8', { kind: 'warm' }), S('40', '8'), S('40', '8')], farmer: [S('20', '30')] } },
   '2026-11-22': { log: { flexao: [S('', '10'), { kg: '', reps: '', done: false }], pallof: [S('5', '10')] } },
   '2026-11-23': { log: { supino: [S('40', '8')] } },
  };
  expect(weeklySetsByGroup(days, plan, '2026-11-16')).toEqual({ peito: 3, core: 1 });
 });
});

describe('troca só hoje (seção 4)', () => {
 it('1 supino, academia, iniciante, com inclinado no treino', () => expect(swapOptions('supino', 'academia', 'iniciante', ['inclinado'])).toEqual(['supino_chao', 'flexao', 'cruc']));
 it('2 puxada, iniciante: sem barra, depois o horizontal', () => expect(swapOptions('puxada', 'academia', 'iniciante')).toEqual(['puxada_elastico', 'remada_a', 'remada_b', 'remada_mochila']));
 it('intermediário vê a barra', () => expect(swapOptions('puxada')).toContain('barra'));
 it('3 lat_a em casa sem equipamento', () => expect(swapOptions('lat_a', 'casa_livre', 'iniciante')).toEqual([]));
 it('4 supino por flexão na week 1', () => expect(swapPrescription(EX.supino!, EX.flexao!, 1)).toEqual({ sets: 4, reps: '5–12', rest: 90 }));
 it('5 farmer sem troca', () => expect(swapOptions('farmer')).toEqual([]));
 it('todas as IDs da tabela existem no catálogo', () => { for (const g of SWAP_GROUPS) for (const id of [...g.academia, ...g.casa_equip, ...g.casa_livre]) expect(EX[id], id).toBeTruthy(); });
 it('troca fica só no dia e não muta a entrada', () => {
  const day: DayRecord = { log: {} };
  const d1 = setDaySwap(day, 'supino', 'flexao');
  expect(day.swaps).toBeUndefined();
  expect(exercisesWithSwaps(['supino', 'remada_a'], d1)).toEqual(['flexao', 'remada_a']);
  expect(setDaySwap(d1, 'supino', null).swaps).toBeUndefined();
 });
});

describe('aquecimento sugerido (seção 5)', () => {
 const w = (exId: string, baseKg: number | null, earlier: string[] = []) => warmupSets({ exId, ex: EX[exId]!, baseKg, earlier: earlier.map(id => ({ id, ex: EX[id]! })) });
 it('1 supino 60', () => expect(w('supino', 60)).toEqual([{ kg: 30, reps: 8 }, { kg: 42.5, reps: 4 }]));
 it('2 leg 120', () => expect(w('leg', 120)).toEqual([{ kg: 60, reps: 8 }, { kg: 85, reps: 4 }]));
 // O contrato escreve "12 × 8"; a regra escrita (múltiplo de 2,5 kg mais próximo) dá 12,5. Seguimos a regra; divergência relatada no handoff.
 it('3 goblet 24', () => expect(w('goblet', 24)).toEqual([{ kg: 12.5, reps: 8 }]));
 it('4 goblet 18', () => expect(w('goblet', 18)).toEqual([]));
 it('5 inclinado depois de supino', () => expect(w('inclinado', 50, ['supino'])).toEqual([]));
 it('6 lat_a não é composto', () => expect(w('lat_a', 10)).toEqual([]));
 it('7 agach sem histórico', () => expect(w('agach', null)).toEqual([]));
});

describe('weekStreak (seção 6)', () => {
 const start = '2026-11-02'; // segunda
 const sched = plan ? (seed as any).sched : [];
 const build = (perWeek: number[]) => {
  const days: Record<string, DayRecord> = {};
  perWeek.forEach((n, w) => { for (let i = 0; i < n; i++) { const d = new Date(Date.UTC(2026, 10, 2 + w * 7 + i)).toISOString().slice(0, 10); days[d] = { workouts: { UA: { sessionId: 'UA', startedAt: 1, status: 'done', sets: 1, volume: 1 } } }; } });
  return days;
 };
 const lastDay = (weeks: number) => new Date(Date.UTC(2026, 10, 2 + weeks * 7 - 1)).toISOString().slice(0, 10);
 const run = (perWeek: number[], s = sched, today = lastDay(perWeek.length)) => weekStreak({ days: build(perWeek), sched: s, start, today });
 it('1', () => expect(run([3, 2, 3])).toEqual({ count: 3, show: true }));
 it('2 perdão e semana leve', () => expect(run([3, 3, 1, 1])).toEqual({ count: 3, show: true }));
 it('3', () => expect(run([3, 0, 0, 3])).toEqual({ count: 1, show: false }));
 it('4', () => expect(run([2, 0, 2, 0, 2])).toEqual({ count: 1, show: false }));
 it('5 semana atual em andamento', () => expect(run([3, 3, 1], sched, '2026-11-17')).toEqual({ count: 2, show: true }));
 it('6 meta 2', () => expect(run([1, 1, 1], [{ k: 'gym' }, { k: 'gym' }, { k: 'rest' }])).toEqual({ count: 3, show: true }));
 it('treino livre não conta e pré-semana é zero', () => {
  const days: Record<string, DayRecord> = { '2026-11-03': { workouts: { livre: { sessionId: 'livre', startedAt: 1, status: 'done', sets: 1, volume: 1 } } } };
  expect(weekStreak({ days, sched, start, today: '2026-11-09' }).count).toBe(0);
  expect(weekStreak({ days, sched, start, today: '2026-10-01' }).count).toBe(0);
 });
});

describe('instruções e nota fixa', () => {
 it('57 exercícios com instruções, cobrindo plano e assistente (2 do ADR 012)', () => {
  expect(Object.keys(EXERCISE_GUIDE.itens)).toHaveLength(57);
  for (const id of Object.keys(EX)) expect(guideFor(id), id).not.toBeNull();
  for (const id of ASSISTANT_EXERCISE_IDS) expect(guideFor(id), id).not.toBeNull();
  expect(GUIDE_SAFETY).toHaveLength(2);
  expect(guideFor('supino')!.passos.length).toBeGreaterThanOrEqual(2);
  expect(guideFor('inexistente')).toBeNull();
  expect(guideFor('constructor')).toBeNull();
 });
 it('nota: grava aparada, apaga vazia, limite 140', () => {
  expect(setExerciseNote({}, 'supino', '  Banco na posição 4 ')).toEqual({ ok: true, value: { supino: 'Banco na posição 4' } });
  expect(setExerciseNote({ supino: 'x' }, 'supino', ' ')).toEqual({ ok: true, value: {} });
  expect(setExerciseNote({}, 'supino', 'a'.repeat(EXERCISE_NOTE_MAX + 1)).ok).toBe(false);
  expect(checkStoredExerciseNotes({ supino: 'a'.repeat(140) })).toBeNull();
  expect(checkStoredExerciseNotes({ supino: 'a'.repeat(141) })).toMatch(/140/);
  expect(checkStoredExerciseNotes({ supino: 3 })).toMatch(/texto/);
 });
});

// Conferência (conteudo-divergencias-ondas.md): o plano de exemplo nunca passa do máximo da faixa intermediária;
// abaixo do mínimo é aceito quando é o previsto pelo plano (piso = min(faixa, previsto)).
describe('plano de exemplo e séries previstas', () => {
 const sched = (seed as any).sched;
 it('nenhum grupo acima do máximo intermediário em nenhuma semana', () => {
  for (let w = 0; w < 12; w++) for (const [g, n] of Object.entries(plannedSetsByGroup(plan, sched, w))) {
   const r = groupRange(g as any, 'intermediario');
   if (r) expect(n, `semana ${w} ${g}`).toBeLessThanOrEqual(r.max);
  }
 });
 it.each([0, 8])('week %s: quadríceps 7 e panturrilha 3 previstos; piso pelo previsto', w => {
  const p = plannedSetsByGroup(plan, sched, w);
  expect([p.quadriceps, p.panturrilha]).toEqual([7, 3]);
  const st = (group: any, sets: number) => groupStatus({ group, sets, experience: 'intermediario', inProgress: false, deload: false, planned: p[group as 'quadriceps'] });
  expect([st('quadriceps', 7), st('quadriceps', 6), st('panturrilha', 3), st('panturrilha', 2)]).toEqual(['dentro', 'abaixo', 'dentro', 'abaixo']);
  // sem planned, vale o mínimo da faixa
  expect(groupStatus({ group: 'quadriceps', sets: 7, experience: 'intermediario', inProgress: false, deload: false })).toBe('abaixo');
  // planned maior que o mínimo não sobe o piso
  expect(groupStatus({ group: 'peito', sets: 8, experience: 'intermediario', inProgress: false, deload: false, planned: 12 })).toBe('dentro');
 });
});
