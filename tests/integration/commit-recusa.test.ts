import { afterEach, describe, expect, it } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import { createRepository } from '../../src/data/index';
import { createCommitter } from '../../src/app/commitQueue';
import { RepositoryError } from '../../src/application/repository';
import type { Repository, StateV3 } from '../../src/application/repository';

const repos: Repository[] = [];
afterEach(() => { repos.splice(0).forEach(r => r.close()); });
async function setup() {
 const r = createRepository({ indexedDB: new IDBFactory(), storage: { getItem: () => null }, storageManager: {}, basePath: '/teste/' });
 repos.push(r);
 const { state } = await r.initialize();
 const seen: StateV3[] = []; const errors: string[] = [];
 const c = createCommitter({ repository: r, onState: s => seen.push(s), onError: m => errors.push(m) });
 c.adopt(state);
 return { r, c, seen, errors };
}
const note = (day: string, text: string) => (s: StateV3): StateV3 => { s.history.days[day] = { ...(s.history.days[day] ?? {}), notes: { x: text } }; return s; };

describe('fila de gravações depois de uma mutação recusada', () => {
 it('descarta a mutação recusada, volta a tela ao salvo e a gravação seguinte funciona', async () => {
  const { r, c, seen, errors } = await setup();
  const realSave = r.save.bind(r);
  r.save = async input => {
   if (input.state.history.days['2026-11-17']?.notes?.x === 'inválido') throw new RepositoryError('validation', 'Registro inválido.');
   return realSave(input);
  };
  expect(await c.commit(note('2026-11-17', 'inválido'))).toBe(false);
  expect(errors).toEqual(['Registro inválido.']);
  expect(seen.at(-1)!.history.days['2026-11-17']).toBeUndefined();
  expect(await c.commit(note('2026-11-18', 'depois'))).toBe(true);
  expect(await c.commit(note('2026-11-19', 'mais'))).toBe(true);
  const saved = await r.read();
  expect(saved.history.days['2026-11-17']).toBeUndefined();
  expect(saved.history.days['2026-11-18'].notes?.x).toBe('depois');
  expect(saved.history.days['2026-11-19'].notes?.x).toBe('mais');
  expect(c.current()!.history.days['2026-11-18'].notes?.x).toBe('depois');
 });
 it('mutação feita enquanto a recusada gravava continua na tela e é gravada em seguida', async () => {
  const { r, c, seen } = await setup();
  const realSave = r.save.bind(r);
  r.save = async input => {
   if (input.state.history.days['2026-11-17']?.notes?.x === 'inválido') throw new RepositoryError('validation', 'Registro inválido.');
   return realSave(input);
  };
  const a = c.commit(note('2026-11-17', 'inválido'));
  const b = c.commit(note('2026-11-18', 'depois'));
  expect(await a).toBe(false); expect(await b).toBe(true);
  expect(seen.at(-1)!.history.days['2026-11-18'].notes?.x).toBe('depois');
  expect((await r.read()).history.days['2026-11-18'].notes?.x).toBe('depois');
 });
});

describe('fila de gravações depois de uma falha passageira', () => {
 for (const name of ['QuotaExceededError', 'AbortError', 'InvalidStateError', 'UnknownError']) {
  it(`${name}: mantém a mutação na tela e a próxima gravação grava tudo`, async () => {
   const { r, c, seen, errors } = await setup();
   const realSave = r.save.bind(r); let fail = true;
   r.save = async input => { if (fail) throw new DOMException('falha de disco', name); return realSave(input); };
   expect(await c.commit(note('2026-11-17', 'série'))).toBe(false);
   expect(errors.length).toBe(1);
   expect(seen.at(-1)!.history.days['2026-11-17'].notes?.x).toBe('série');
   fail = false;
   expect(await c.commit(note('2026-11-18', 'depois'))).toBe(true);
   const saved = await r.read();
   expect(saved.history.days['2026-11-17'].notes?.x).toBe('série');
   expect(saved.history.days['2026-11-18'].notes?.x).toBe('depois');
  });
 }
 it('RepositoryError de quota também mantém a mutação pendente', async () => {
  const { r, c } = await setup();
  const realSave = r.save.bind(r); let fail = true;
  r.save = async input => { if (fail) throw new RepositoryError('quota', 'Sem espaço.'); return realSave(input); };
  expect(await c.commit(note('2026-11-17', 'série'))).toBe(false);
  fail = false;
  expect(await c.commit(note('2026-11-18', 'depois'))).toBe(true);
  expect((await r.read()).history.days['2026-11-17'].notes?.x).toBe('série');
 });
});
