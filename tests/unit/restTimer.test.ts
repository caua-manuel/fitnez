import { describe, expect, it } from 'vitest';
import { adjustRest, restRemaining } from '../../src/domain/restTimer';

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
