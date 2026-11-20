import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { DayRecord, Plan } from '../../src/application/repository';
import { addDays } from '../../src/domain/calendar';
import { FEEL_SCALE, FEEL_VALUES, feelAriaLabel, feelLegend, thirdClassEligibility } from '../../src/domain/jiujitsu';

// Escala "Como terminou" (aula de jiu-jitsu): a tela e a regra da 3ª aula precisam usar o mesmo significado.
// Fonte única: FEEL_SCALE em src/domain/jiujitsu.ts.

// Mesmos auxiliares de tests/unit/jiujitsu.test.ts (lá não são exportados).
const start = '2026-01-05'; // segunda
const plan: Plan = { ex: {}, order: [], sess: { UA: { name: 'Upper A', ex: ['sup'] }, LW: { name: 'Lower', ex: ['agach'] }, UB: { name: 'Upper B', ex: ['rem'] } } };
const dayOf = (w: number, i: number) => addDays(start, w * 7 + i);
type Opts = { bjj?: number; feel?: number; kgUA?: number; kgLW?: number };
function build(weeks: number[], o: (w: number) => Opts = () => ({})) {
 const days: Record<string, DayRecord> = {};
 for (const w of weeks) {
  const x = o(w);
  const n = x.bjj ?? 2;
  for (let i = 0; i < n; i++) days[dayOf(w, 1 + i * 2)] = { acts: { bjj: true }, feel: x.feel ?? 3 };
  const kua = x.kgUA ?? 40, klw = x.kgLW ?? 60;
  days[dayOf(w, 0)] = { workout: { sessionId: 'UA', startedAt: 1, status: 'done', sets: 1, volume: 1 }, log: { sup: [{ kg: String(kua), reps: '8', done: true }] } };
  days[dayOf(w, 4)] = { workout: { sessionId: 'LW', startedAt: 1, status: 'done', sets: 1, volume: 1 }, log: { agach: [{ kg: String(klw), reps: '8', done: true }] } };
 }
 return days;
}
const sleep = { 2: true, 3: true, 4: true };
const run = (days: Record<string, DayRecord>) => thirdClassEligibility({ start, today: dayOf(5, 2), days, sleepOkByWeek: sleep, plan });
const aulas = (r: ReturnType<typeof run>) => r.criteria.find(c => c.key === 'aulas')!;
// Cargas subindo para que só a escala decida o resultado.
const subindo = (feel: number) => (w: number): Opts => ({ kgUA: 40 + w, kgLW: 60 + w, feel: w === 3 ? feel : 3 });

describe('escala "Como terminou"', () => {
 it('(a) legenda visível', () => {
  expect(feelLegend()).toBe('1 = leve, 5 = destruído');
 });

 it('(b) rótulos acessíveis', () => {
  expect(feelAriaLabel(1)).toBe('Nota 1 de 5, leve');
  expect(feelAriaLabel(3)).toBe('Nota 3 de 5');
  expect(feelAriaLabel(5)).toBe('Nota 5 de 5, destruído');
  expect(FEEL_VALUES).toEqual([1, 2, 3, 4, 5]);
 });

 it('(c) "destruído" é o máximo da escala', () => {
  expect(FEEL_SCALE.labels[FEEL_SCALE.destroyed]).toBe('destruído');
  expect(FEEL_SCALE.destroyed).toBe(FEEL_SCALE.max);
  expect(Math.max(...FEEL_VALUES)).toBe(FEEL_SCALE.destroyed);
 });

 it('(d) a regra da 3ª aula usa o mesmo valor: "destruído" reprova, "leve" aprova', () => {
  const ruim = run(build([2, 3, 4], subindo(FEEL_SCALE.destroyed)));
  expect(aulas(ruim).ok).toBe(false);
  expect(ruim.status).toBe('ainda-nao');
  const bom = run(build([2, 3, 4], subindo(FEEL_SCALE.min)));
  expect(aulas(bom).ok).toBe(true);
  expect(bom.status).toBe('elegivel');
 });

 it('(e) Início usa feelLegend e feelAriaLabel e não repete a escala escrita à mão', () => {
  const src = readFileSync(resolve(__dirname, '../../src/features/inicio/Inicio.tsx'), 'utf8');
  const imp = src.match(/import\s*\{([^}]*)\}\s*from\s*'[^']*domain\/jiujitsu'/);
  expect(imp, 'import de domain/jiujitsu').not.toBeNull();
  const names = (imp as RegExpMatchArray)[1].split(',').map(s => s.trim());
  expect(names).toContain('feelLegend');
  expect(names).toContain('feelAriaLabel');
  expect(src).toMatch(/feelLegend\(\)/);
  expect(src).toMatch(/feelAriaLabel\(/);
  expect(src).not.toContain('destruído');
  expect(src).not.toContain('= leve');
 });
});
