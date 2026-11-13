import { describe, expect, it } from 'vitest';
import { activityFor, dayTypeOf } from '../../src/domain/dayActivity';

const sched = [{ k: 'bjj', gi: true }, { k: 'gym', s: 'LW' }, { k: 'gym', s: 'UA' }, { k: 'bjj', gi: false }, { k: 'gym', s: 'UB' }, { k: 'volei' }, { k: 'rest' }];
describe('atividade do dia', () => {
 it('rotina padrão', () => {
  expect(activityFor({ sched, weekday: 0 })).toEqual({ kind: 'bjj', gi: true });
  expect(activityFor({ sched, weekday: 3 })).toEqual({ kind: 'bjj', gi: false });
  expect(activityFor({ sched, weekday: 1 })).toEqual({ kind: 'gym', sessionId: 'LW' });
  expect(activityFor({ sched, weekday: 5, alt: 'LB' })).toEqual({ kind: 'volei', altSessionId: 'LB' });
  expect(activityFor({ sched, weekday: 5 })).toEqual({ kind: 'volei' });
  expect(activityFor({ sched, weekday: 6 })).toEqual({ kind: 'rest' });
 });
 it('troca do dia substitui a rotina', () => {
  expect(activityFor({ sched, weekday: 0, override: 'UB' })).toEqual({ kind: 'gym', sessionId: 'UB' });
  expect(activityFor({ sched, weekday: 6, override: 'UA' })).toEqual({ kind: 'gym', sessionId: 'UA' });
 });
 it('rotina incompleta ou dia inválido vira descanso', () => { expect(activityFor({ sched: [], weekday: 2 })).toEqual({ kind: 'rest' }); expect(activityFor({ sched, weekday: 9 })).toEqual({ kind: 'rest' }); });
 it('tipo do dia', () => {
  expect(dayTypeOf({ kind: 'gym', sessionId: 'LW' }, 'Lower')).toBe('perna');
  expect(dayTypeOf({ kind: 'gym', sessionId: 'UA' }, 'Upper A')).toBe('academia');
  expect(dayTypeOf({ kind: 'gym', sessionId: 'LB' }, 'Lower B (opcional)')).toBe('perna');
  expect(dayTypeOf({ kind: 'gym', sessionId: 'P' }, 'Treino de perna')).toBe('perna');
  expect(dayTypeOf({ kind: 'gym', sessionId: 'X' })).toBe('academia');
  expect(dayTypeOf({ kind: 'bjj', gi: true })).toBe('jiujitsu');
  expect(dayTypeOf({ kind: 'volei' })).toBe('volei');
  expect(dayTypeOf({ kind: 'rest' })).toBe('descanso');
 });
});
