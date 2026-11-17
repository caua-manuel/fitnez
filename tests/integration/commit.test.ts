import { afterEach, describe, expect, it } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import { createRepository } from '../../src/data/index';
import { createCommitter } from '../../src/app/commitQueue';
import type { Repository, StateV3 } from '../../src/application/repository';

const repos: Repository[] = [];
function setup(factory = new IDBFactory()) {
 const r = createRepository({ indexedDB: factory, storage: { getItem: () => null }, storageManager: {}, basePath: '/teste/' });
 repos.push(r); return { r, factory };
}
async function committerFor(r: Repository) {
 const { state } = await r.initialize();
 const seen: StateV3[] = []; const errors: string[] = [];
 const c = createCommitter({ repository: r, onState: s => seen.push(s), onError: m => errors.push(m) });
 c.adopt(state);
 return { c, seen, errors };
}
const note = (day: string, text: string) => (s: StateV3): StateV3 => { s.history.days[day] = { ...(s.history.days[day] ?? {}), notes: { x: text } }; return s; };

describe('commit com atualização otimista', () => {
 afterEach(() => { repos.splice(0).forEach(r => r.close()); });
 it('dois commits seguidos gravam ambos, em ordem, e a tela muda na hora', async () => {
  const { r } = setup(); const { c, seen } = await committerFor(r);
  const a = c.commit(note('2026-11-17', 'a')); expect(seen.at(-1)!.history.days['2026-11-17']).toBeDefined();
  const b = c.commit(note('2026-11-18', 'b'));
  expect(await a).toBe(true); expect(await b).toBe(true);
  const saved = await r.read();
  expect(saved.history.days['2026-11-17'].notes?.x).toBe('a'); expect(saved.history.days['2026-11-18'].notes?.x).toBe('b');
 });
 it('conflito de revisão reaplica a mutação sobre o estado novo e preserva as duas alterações', async () => {
  const { r, factory } = setup(); const { c } = await committerFor(r);
  const other = setup(factory).r; await other.initialize();
  const ext = await other.read(); ext.history.days['2026-11-20'] = { notes: { x: 'externo' } };
  await other.save({ state: ext, expectedRevision: ext.revision });
  expect(await c.commit(note('2026-11-17', 'local'))).toBe(true);
  const saved = await r.read();
  expect(saved.history.days['2026-11-20'].notes?.x).toBe('externo'); expect(saved.history.days['2026-11-17'].notes?.x).toBe('local');
 });
 it('falha de gravação devolve false e mantém o valor local; a próxima tentativa grava tudo', async () => {
  const { r } = setup(); const { c, seen, errors } = await committerFor(r);
  const realSave = r.save.bind(r); let fail = true;
  r.save = async input => { if (fail) throw new Error('falha sintética'); return realSave(input); };
  expect(await c.commit(note('2026-11-17', 'digitado'))).toBe(false);
  expect(errors.length).toBe(1); expect(seen.at(-1)!.history.days['2026-11-17'].notes?.x).toBe('digitado');
  fail = false;
  expect(await c.commit(note('2026-11-18', 'depois'))).toBe(true);
  const saved = await r.read();
  expect(saved.history.days['2026-11-17'].notes?.x).toBe('digitado'); expect(saved.history.days['2026-11-18'].notes?.x).toBe('depois');
 });
 it('mutação que lança erro devolve false sem alterar o estado', async () => {
  const { r } = setup(); const { c, seen } = await committerFor(r); const count = seen.length;
  expect(await c.commit(() => { throw new Error('x'); })).toBe(false); expect(seen.length).toBe(count);
 });
 it('releituras concorrentes (foco, outra aba) em qualquer instante nunca desfazem a troca de tema', async () => {
  // Regressão da investigação do CI (tema Escuro): o commit otimista deve sobreviver a refresh() antes, durante e depois da gravação.
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  for (let i = 0; i < 60; i++) {
   const { r } = setup(); const first = await r.initialize(); let shown = first.state;
   const c = createCommitter({ repository: r, onState: s => { shown = s; }, onError: () => undefined }); c.adopt(first.state);
   const refresh = async () => { const init = await r.initialize(); c.adopt(init.state); await r.protection(); };
   const jobs: Promise<unknown>[] = [];
   for (let k = Math.floor(rnd() * 4); k > 0; k--) jobs.push(sleep(rnd() * 6).then(refresh));
   await sleep(rnd() * 6);
   jobs.push(c.commit(s => { s.settings.theme = 'dark'; return s; }));
   if (rnd() < 0.7) jobs.push(sleep(rnd() * 6).then(refresh));
   await Promise.all(jobs); await sleep(10);
   expect(shown.settings.theme, 'tela na iteração ' + i).toBe('dark'); expect((await r.read()).settings.theme, 'banco na iteração ' + i).toBe('dark');
  }
 }, 60000);
});
