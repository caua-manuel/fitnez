import { expect, it } from 'vitest';
import { plan } from '../../data/plan.json';
import { EXERCISE_GUIDE } from '../../src/domain/exerciseNotes';

it('todo exercício do catálogo tem passos e erro comum preenchidos', () => {
 for (const id of Object.keys(plan.ex)) {
  const item = EXERCISE_GUIDE.itens[id];
  expect(item?.passos, `${id}: passos`).toMatch(/\S/);
  expect(item?.erro, `${id}: erro`).toMatch(/\S/);
 }
});
