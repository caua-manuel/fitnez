import { describe, expect, it } from 'vitest';
import { adjustRest, restRemaining, restoreRest, REST_ENDED_GRACE_MS, REST_MAX_AHEAD_MS } from '../../src/domain/restTimer';

describe('restRemaining', () => {
 it('arredonda para cima e nunca fica negativo', () => {
  expect(restRemaining(10_000, 8_001)).toBe(2);
  expect(restRemaining(10_000, 8_000)).toBe(2);
  expect(restRemaining(10_000, 10_000)).toBe(0);
  expect(restRemaining(10_000, 11_000)).toBe(0);
 });
});

describe('adjustRest', () => {
 it('nunca devolve um carimbo anterior a agora', () => {
  expect(adjustRest(10_000, -15, 9_000)).toBe(9_000);
  expect(adjustRest(10_000, 15, 9_000)).toBe(25_000);
  expect(adjustRest(40_000, -15, 9_000)).toBe(25_000);
 });
});

describe('restoreRest (ADR 011, 2.1)', () => {
 const ctx = { id: 'UA', day: '2026-11-20', now: 1_000_000 };
 const saved = (over: Record<string, unknown> = {}) => JSON.stringify({ id: 'UA', day: '2026-11-20', exId: 'supino', endsAt: 1_030_000, total: 90, ...over });

 it('ativo: ainda correndo, com o restante pelo relógio', () => {
  const r = restoreRest(saved(), ctx);
  expect(r).toEqual({ kind: 'ativo', rest: { exId: 'supino', endsAt: 1_030_000, total: 90 }, remainingSec: 30 });
 });
 it('aceita o objeto já lido', () => { expect(restoreRest(JSON.parse(saved()), ctx).kind).toBe('ativo'); });
 it('terminado: no instante do fim e até 10 min depois', () => {
  expect(restoreRest(saved({ endsAt: ctx.now }), ctx)).toMatchObject({ kind: 'terminado', endedAgoSec: 0 });
  expect(restoreRest(saved({ endsAt: ctx.now - 125_400 }), ctx)).toMatchObject({ kind: 'terminado', endedAgoSec: 125, rest: { exId: 'supino' } });
  expect(restoreRest(saved({ endsAt: ctx.now - REST_ENDED_GRACE_MS }), ctx).kind).toBe('terminado');
 });
 it('nada: vencido há mais de 10 min', () => { expect(restoreRest(saved({ endsAt: ctx.now - REST_ENDED_GRACE_MS - 1 }), ctx)).toEqual({ kind: 'nada' }); });
 it('nada: outro treino ou outro dia', () => {
  expect(restoreRest(saved({ id: 'UB' }), ctx).kind).toBe('nada');
  expect(restoreRest(saved({ day: '2026-11-19' }), ctx).kind).toBe('nada');
 });
 it('nada: vazio, texto inválido ou formato errado', () => {
  for (const raw of [null, undefined, '', 'null', '{', '[]', '42', JSON.stringify({ id: 'UA', day: '2026-11-20' }), saved({ endsAt: '1030000' }), saved({ total: -1 }), saved({ exId: '' }), saved({ endsAt: Number.NaN })]) {
   expect(restoreRest(raw, ctx), String(raw)).toEqual({ kind: 'nada' });
  }
 });
 it('nada: fim absurdo no futuro (relógio trocado)', () => {
  expect(restoreRest(saved({ endsAt: ctx.now + REST_MAX_AHEAD_MS + 1 }), ctx).kind).toBe('nada');
  expect(restoreRest(saved({ endsAt: ctx.now + REST_MAX_AHEAD_MS }), ctx).kind).toBe('ativo');
 });
});
