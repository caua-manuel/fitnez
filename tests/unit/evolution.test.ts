import { describe, expect, it } from 'vitest';
import type { DayRecord, Plan } from '../../src/application/repository';
import {
 consistency, planConsistency, periodRange, strengthChange, strengthSeries, waistDelta, waistSeries, hipDelta, hipSeries, weightDelta, weightSeries, measureSeries, parseMeasure, formatSigned, weeklyValues, pctOf,
} from '../../src/domain/evolution';

// 2026-11-16 é segunda-feira.
const START = '2026-11-16';
const plan = { ex: { sup: { n: 'Supino', s: [4], r: ['8'], m: 'kg' }, abd: { n: 'Prancha', s: [3], r: ['30'], m: 's' } }, sess: {}, order: [] } as unknown as Plan;
const set = (kg: string, done = true) => ({ kg, reps: '8', done });
const sched = [{ k: 'bjj', gi: true }, { k: 'gym', s: 'LW' }, { k: 'gym', s: 'UA' }, { k: 'bjj', gi: false }, { k: 'gym', s: 'UB' }, { k: 'volei' }, { k: 'rest' }];

describe('periodRange', () => {
 it('12 semanas começam na segunda do início do plano', () => {
  expect(periodRange('2026-11-18', 12, START)).toEqual({ from: '2026-11-16', to: '2026-11-18' });
 });
 it('4 semanas recuam 3 segundas a partir da semana de hoje', () => {
  expect(periodRange('2027-01-20', 4, START)).toEqual({ from: '2026-12-28', to: '2027-01-20' });
 });
 it('não passa do fim do plano', () => {
  expect(periodRange('2028-01-01', 4, START)).toEqual({ from: '2027-01-11', to: '2027-02-07' });
 });
 it('antes do plano devolve intervalo vazio (from > to)', () => {
  const r = periodRange('2026-11-10', 12, START);
  expect(r.from > r.to).toBe(true);
 });
});

describe('parseMeasure', () => {
 it('aceita vírgula e ignora inválidos', () => {
  expect(parseMeasure('78,2')).toBe(78.2);
  expect(parseMeasure('86')).toBe(86);
  expect(parseMeasure('abc')).toBeNull();
  expect(parseMeasure('')).toBeNull();
  expect(parseMeasure(undefined)).toBeNull();
  expect(parseMeasure('0')).toBeNull();
 });
});

describe('strengthSeries / strengthChange', () => {
 const range = periodRange('2026-12-02', 12, START); // semanas 0..2
 it('sem dados: tudo null, sem NaN', () => {
  const s = strengthSeries({}, plan, range);
  expect(s).toEqual([{ week: 0, avgLoadKg: null }, { week: 1, avgLoadKg: null }, { week: 2, avgLoadKg: null }]);
  expect(strengthChange(s)).toBeNull();
 });
 it('média semanal só das séries feitas de exercícios com carga, com vírgula e inválidos ignorados', () => {
  const days: Record<string, DayRecord> = {
   '2026-11-17': { log: { sup: [set('20'), set('30'), set('99', false), set('x')], abd: [set('500')], orfao: [set('90')] } },
   '2026-11-24': { log: { sup: [set('25,5'), set('')] } },
   '2026-12-02': { log: { sup: [set('30')] } },
  };
  const s = strengthSeries(days, plan, range);
  expect(s).toEqual([{ week: 0, avgLoadKg: 25 }, { week: 1, avgLoadKg: 25.5 }, { week: 2, avgLoadKg: 30 }]);
  expect(strengthChange(s)).toBeCloseTo(20, 5);
  expect(s.every(p => p.avgLoadKg === null || Number.isFinite(p.avgLoadKg))).toBe(true);
 });
 it('mudança nula com menos de 2 pontos e usa primeira e última com dado', () => {
  expect(strengthChange([{ week: 0, avgLoadKg: 20 }, { week: 1, avgLoadKg: null }])).toBeNull();
  expect(strengthChange([{ week: 0, avgLoadKg: 20 }, { week: 1, avgLoadKg: null }, { week: 2, avgLoadKg: 15 }])).toBeCloseTo(-25, 5);
  expect(strengthChange([])).toBeNull();
 });
 it('dias fora do período são ignorados', () => {
  const days = { '2026-11-10': { log: { sup: [set('80')] } } } as Record<string, DayRecord>;
  expect(strengthSeries(days, plan, periodRange('2026-11-20', 12, START)).every(p => p.avgLoadKg === null)).toBe(true);
 });
 it('antes do plano: lista vazia', () => {
  expect(strengthSeries({}, plan, periodRange('2026-11-01', 12, START))).toEqual([]);
 });
});

describe('medidas', () => {
 const meas = {
  '2026-11-16': { p: '82,0', c: '91', b: '33', t: '58,5' },
  '2026-12-01': { p: '80,5', c: '89,5', b: 'abc' },
  '2026-12-20': { p: '78,2', c: '88' },
  '2026-11-01': { p: '90', c: '100' },
 };
 const range = periodRange('2026-12-30', 12, START);
 it('weightSeries ordena por dia, no período, com vírgula', () => {
  expect(weightSeries(meas, range)).toEqual([{ day: '2026-11-16', kg: 82 }, { day: '2026-12-01', kg: 80.5 }, { day: '2026-12-20', kg: 78.2 }]);
 });
 it('weightDelta primeiro→último em kg e %', () => {
  const d = weightDelta(weightSeries(meas, range))!;
  expect(d.kg).toBeCloseTo(-3.8, 5);
  expect(d.pct).toBeCloseTo(-4.634, 2);
 });
 it('cintura e demais medidas', () => {
  expect(waistSeries(meas, range).map(p => p.cm)).toEqual([91, 89.5, 88]);
  expect(waistDelta(waistSeries(meas, range))!.cm).toBeCloseTo(-3, 5);
  expect(measureSeries(meas, range, 'b').map(p => p.value)).toEqual([33]);
  expect(measureSeries(meas, range, 't').map(p => p.value)).toEqual([58.5]);
 });
 it('quadril: série e variação', () => {
  const m = { '2026-11-16': { q: '100' }, '2026-12-01': { q: '98,5' }, '2026-12-20': { p: '80' } };
  expect(hipSeries(m, range).map(p => p.cm)).toEqual([100, 98.5]);
  expect(hipDelta(hipSeries(m, range))!.cm).toBeCloseTo(-1.5, 5);
  expect(hipDelta([])).toBeNull();
  expect(measureSeries(m, range, 'q').length).toBe(2);
 });
 it('sem dados ou 1 ponto: delta nulo', () => {
  expect(weightSeries({}, range)).toEqual([]);
  expect(weightDelta([])).toBeNull();
  expect(weightDelta([{ day: '2026-11-16', kg: 80 }])).toBeNull();
  expect(waistDelta([])).toBeNull();
 });
 it('dia antes do plano: vazio', () => {
  expect(weightSeries(meas, periodRange('2026-11-01', 12, START))).toEqual([]);
 });
});

describe('formatSigned', () => {
 it('usa vírgula, sinal tipográfico e unidade', () => {
  expect(formatSigned(-3.8, 'kg')).toBe('−3,8 kg');
  expect(formatSigned(2, 'cm')).toBe('+2 cm');
  expect(formatSigned(0, 'cm')).toBe('0 cm');
 });
});

describe('consistency', () => {
 const today = '2026-11-26'; // quinta da semana 2 (idx 1)
 it('sem registros: previstos contados, feitos 0', () => {
  const c = consistency({}, sched, START, today);
  // semana 1: seg bjj, ter gym, qua gym, qui bjj, sex gym, sáb volei = 6; semana 2 até ontem (seg..qua)=3 e hoje (qui, não feito) fora
  expect(c.planned).toBe(6 + 3);
  expect(c.done).toBe(0);
  expect(c.pct).toBe(0);
  expect(c.byWeek).toEqual([{ week: 0, done: 0, planned: 6 }, { week: 1, done: 0, planned: 3 }]);
 });
 it('conta treino de academia pelo status done e aulas/jogos por acts', () => {
  const days: Record<string, DayRecord> = {
   '2026-11-17': { workout: { sessionId: 'LW', startedAt: 1, finishedAt: 2, status: 'done', sets: 1, volume: 1 } },
   '2026-11-18': { workout: { sessionId: 'UA', startedAt: 1, status: 'partial', sets: 1, volume: 1 } },
   '2026-11-16': { acts: { bjj: true } },
   '2026-11-21': { acts: { volei: true } },
   '2026-11-26': { acts: { bjj: true } },
  };
  const c = consistency(days, sched, START, today);
  expect(c.done).toBe(4); // inclui hoje por estar feito
  expect(c.planned).toBe(10);
  expect(c.pct).toBe(40);
  expect(c.byWeek[0]).toEqual({ week: 0, done: 3, planned: 6 });
 });
 it('antes do plano e sem rotina: nulo', () => {
  const c = consistency({}, sched, START, '2026-11-10');
  expect(c).toEqual({ done: 0, planned: 0, pct: null, byWeek: [] });
  expect(consistency({}, [], START, today).pct).toBeNull();
 });
 it('com período: só semanas dentro do intervalo, semana relativa ao início dele', () => {
  const c = consistency({}, sched, START, '2026-12-10', periodRange('2026-12-10', 4, START));
  expect(c.byWeek.map(w => w.week)).toEqual([0, 1, 2, 3]);
  expect(c.byWeek.every(w => Number.isFinite(w.planned))).toBe(true);
 });
});

describe('constância: fonte única entre Perfil e Evolução', () => {
 const today = '2026-11-18'; // quarta da semana 1
 const days: Record<string, DayRecord> = { '2026-11-18': { workout: { sessionId: 'UA', startedAt: 1, finishedAt: 2, status: 'done', sets: 1, volume: 1 } } };
 it('Perfil (planConsistency) e Evolução (consistency com periodRange de 12 semanas) dão o mesmo resultado', () => {
  const evolucao = consistency(days, sched, START, today, periodRange(today, 12, START));
  const perfil = planConsistency(days, sched, START, today);
  expect(perfil).toEqual(evolucao);
  expect(perfil.pct).toBe(33); // 1 de 3: seg (aula) e ter (academia) não feitas + hoje (academia) feita
 });
 it('semana atual conta só até hoje: o previsto cresce com os dias e hoje só entra se feito', () => {
  expect(planConsistency({}, sched, START, '2026-11-17').planned).toBe(1); // só a segunda (bjj)
  expect(planConsistency({}, sched, START, '2026-11-19').planned).toBe(3); // seg, ter, qua
  expect(planConsistency(days, sched, START, today).planned).toBe(3); // seg, ter e hoje (feito)
 });
});

describe('weeklyValues / pctOf', () => {
 it('último valor por semana, vazias em null', () => {
  const range = periodRange('2026-12-02', 12, START);
  const pts = [{ day: '2026-11-16', value: 80 }, { day: '2026-11-18', value: 79 }, { day: '2026-12-01', value: 77 }];
  expect(weeklyValues(pts, range, 4)).toEqual([79, null, 77, null]);
  expect(weeklyValues([], periodRange('2026-11-01', 12, START), 2)).toEqual([null, null]);
 });
 it('pctOf', () => { expect(pctOf(5, 6)).toBe(83); expect(pctOf(0, 0)).toBeNull(); });
});
