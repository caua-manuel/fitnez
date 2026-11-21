import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { foundation } from '../../src/data/migration';
import { validateState } from '../../src/data/validation';
import { demoState, DEMO_PARAMS } from '../../src/demo/generate';
import { phaseOf } from '../../src/domain/calendar';
import { listWorkouts } from '../../src/domain/workoutRecord';
import { parseNumber, setsForWeek } from '../../src/domain/workout';
import { repRange } from '../../src/domain/progression';
import { exerciseHistory } from '../../src/domain/records';
import { planWeekIndex, stagnation } from '../../src/domain/stagnation';
import { isLower, muscleGroupOf } from '../../src/domain/muscleGroups';

// ADR 011, 1.1: gerador da demonstração. Números de docs/handoffs/conteudo-adr-011.md (parte A), em DEMO_PARAMS.
const empty = () => foundation(Date.UTC(2026, 10, 1, 12));
const TODAY = '2026-11-20';

describe('demoState', () => {
 it('mesma entrada dá saída idêntica', () => { expect(JSON.stringify(demoState(TODAY, empty()))).toBe(JSON.stringify(demoState(TODAY, empty()))); });
 it('não altera a entrada', () => { const e = empty(); const copy = structuredClone(e); demoState(TODAY, e); expect(e).toEqual(copy); });
 it.each(['2026-11-20', '2026-11-16', '2026-11-22', '2027-03-01'])('validateState aceita, nada depois de hoje e hoje na semana 5 (%s)', today => {
  const s = demoState(today, empty());
  expect(() => validateState(s)).not.toThrow();
  for (const d of [...Object.keys(s.history.days), ...Object.keys(s.history.measurements)]) expect(d <= today).toBe(true);
  const p = phaseOf(s.settings.start, today);
  expect(p.kind === 'week' && p.week).toBe(4);
  expect(new Date(`${s.settings.start}T12:00:00Z`).getUTCDay()).toBe(1);
  expect(s.settings.startConfirmed).toBe(true);
 });
 it('treinos nos dias da rotina, com 1 falta e 1 parcial', () => {
  const s = demoState(TODAY, empty());
  let gymDays = 0, done = 0, partial = 0;
  for (let i = 0; ; i++) {
   const day = new Date(Date.parse(`${s.settings.start}T12:00:00Z`) + i * 86400000).toISOString().slice(0, 10);
   if (day >= TODAY) break;
   const act = s.settings.sched[i % 7];
   const ws = listWorkouts(s.history.days[day]);
   if (act.k !== 'gym') { expect(ws).toEqual([]); continue; }
   gymDays++;
   for (const w of ws) { expect(w.sessionId).toBe(act.s); if (w.status === 'done') done++; else partial++; }
  }
  expect(partial).toBe(1);
  expect(done).toBe(gymDays - 2);
 });
 it('semana leve com metade das séries; cargas não caem e não sobem na semana leve', () => {
  const s = demoState(TODAY, empty());
  const plan = s.catalog.plan;
  const byEx: Record<string, { week: number; kg: number; sets: number }[]> = {};
  for (const day of Object.keys(s.history.days).sort()) {
   const p = phaseOf(s.settings.start, day); if (p.kind !== 'week') continue;
   for (const [ex, rows] of Object.entries(s.history.days[day].log ?? {})) {
    const kgs = rows.map(r => parseNumber(r.kg)).filter((n): n is number => n !== null);
    (byEx[ex] ??= []).push({ week: p.week, kg: kgs.length ? Math.max(...kgs) : 0, sets: rows.length });
    expect(rows.length).toBe(setsForWeek(plan.ex[ex], p.week).sets);
   }
  }
  let rose = false;
  for (const [ex, list] of Object.entries(byEx)) {
   for (let i = 1; i < list.length; i++) {
    expect(list[i].kg, ex).toBeGreaterThanOrEqual(list[i - 1].kg);
    if (list[i].week === 3) expect(list[i].kg, ex).toBe(list[i - 1].kg);
    if (list[i].kg > list[i - 1].kg) rose = true;
   }
   const deload = list.find(x => x.week === 3), normal = list.find(x => x.week === 2);
   if (deload && normal) expect(deload.sets).toBeLessThan(normal.sets);
  }
  expect(rose).toBe(true);
 });
 it('medidas semanais, dieta em parte dos dias e perfil fictício', () => {
  const s = demoState(TODAY, empty());
  expect(Object.keys(s.history.measurements)).toHaveLength(5);
  const withDiet = Object.values(s.history.days).filter(d => d.diet).length;
  expect(withDiet).toBeGreaterThan(0); expect(withDiet).toBeLessThan(32);
  expect(s.settings.profile?.name).toBe(DEMO_PARAMS.profile.name);
 });
});

describe('src/demo só por import()', () => {
 const files = (dir: string): string[] => readdirSync(dir).flatMap(f => { const p = join(dir, f); return statSync(p).isDirectory() ? files(p) : /\.(ts|tsx)$/.test(f) ? [p] : []; });
 it('nenhum import estático de src/demo fora de src/demo; dinâmico só em src/app', () => {
  const root = join(__dirname, '..', '..', 'src');
  for (const file of files(root)) {
   const rel = relative(root, file).split(sep).join('/');
   if (rel.startsWith('demo/')) continue;
   const text = readFileSync(file, 'utf8');
   expect(/(?:^|\n)\s*(?:import|export)\s[^;]*?from\s+['"][^'"]*\/demo\//.test(text), rel).toBe(false);
   if (/import\(\s*['"][^'"]*\/demo\//.test(text)) expect(rel.startsWith('app/'), rel).toBe(true);
  }
 });
 it('o arquivo de entrada tem nome próprio (generate.ts, nunca index.ts)', () => {
  const dir = join(__dirname, '..', '..', 'src', 'demo');
  expect(readdirSync(dir)).toContain('generate.ts');
  expect(readdirSync(dir)).not.toContain('index.ts');
 });
});

describe('demoState: números do conteúdo (docs/handoffs/conteudo-adr-011.md, parte A)', () => {
 const s = demoState(TODAY, empty());
 const start = s.settings.start;
 const at = (week: number, weekday: number) => new Date(Date.parse(`${start}T12:00:00Z`) + (week * 7 + weekday) * 86400000).toISOString().slice(0, 10);

 it('A.1: perfil fictício, peso igual à última medida e sem metas próprias', () => {
  expect(s.settings.profile).toEqual({ name: 'Exemplo', goal: 'Recomposição corporal: perder gordura e manter a força', age: 30, heightCm: 178, weightKg: 76.3 });
  expect(s.settings.dietTargets).toBeUndefined();
 });
 it('A.2: hoje = semana 5 (índice 4) e hoje não tem registro', () => {
  expect(phaseOf(start, TODAY)).toMatchObject({ kind: 'week', week: 4 });
  expect(s.history.days[TODAY]).toBeUndefined();
  expect(at(4, 0) <= TODAY && TODAY <= at(4, 6)).toBe(true);
 });
 it('A.2: jiu-jitsu nas segundas e quintas, vôlei nos sábados, nota do dia no treino', () => {
  for (let w = 0; w < 4; w++) {
   expect(s.history.days[at(w, 0)]?.acts?.bjj).toBe(true);
   expect(s.history.days[at(w, 3)]?.acts?.bjj).toBe(true);
   expect(s.history.days[at(w, 5)]?.acts?.volei).toBe(true);
   if (w !== 1) expect(s.history.days[at(w, 4)]?.feel).toBe(w === 3 ? 2 : 3); // UB
   expect(s.history.days[at(w, 1)]?.feel).toBe(w === 3 ? 2 : 4); // Lower
  }
 });
 it('A.3: 1 falta na sexta da semana 2 e treino parcial na terça da semana 3', () => {
  const fri = s.history.days[at(1, 4)];
  expect(listWorkouts(fri)).toEqual([]);
  expect(fri?.log).toBeUndefined();
  const tue = s.history.days[at(2, 1)]!;
  const [w] = listWorkouts(tue);
  expect(w).toMatchObject({ sessionId: 'LW', status: 'partial' });
  expect(Object.keys(tue.log ?? {})).toEqual(['salto_l', 'agach', 'stiff', 'bulg']);
  expect(w!.startedAt).toBe(Date.parse(`${at(2, 1)}T18:30:00-03:00`));
  expect(w!.finishedAt! - w!.startedAt).toBe(40 * 60000);
  const ua = listWorkouts(s.history.days[at(0, 2)])[0]!;
  expect(ua.finishedAt! - ua.startedAt).toBe(75 * 60000);
 });
 it('A.4: supino 28 × 6/6/6/5, 7/7/7/6, 8/8/8/7, leve 5/5, semana 5 6/6/6/6/6', () => {
  const sup = (w: number) => (s.history.days[at(w, 2)]!.log!.supino as { kg: string; reps: string }[]).map(r => `${r.kg}x${r.reps}`).join(' ');
  expect(sup(0)).toBe('28x6 28x6 28x6 28x5');
  expect(sup(1)).toBe('28x7 28x7 28x7 28x6');
  expect(sup(2)).toBe('28x8 28x8 28x8 28x7');
  expect(sup(3)).toBe('28x5 28x5');
  if (s.history.days[at(4, 2)]) expect(sup(4)).toBe('28x6 28x6 28x6 28x6 28x6');
 });
 it('A.4: casos sem faixa legível e cargas iniciais', () => {
  const rows = (w: number, d: number, ex: string) => s.history.days[at(w, d)]!.log![ex] as { kg: string; reps: string }[];
  expect(rows(0, 2, 'pallof').every(r => r.kg === '15' && r.reps === '10')).toBe(true);
  expect(rows(0, 2, 'farmer').every(r => r.kg === '28' && r.reps === '35')).toBe(true);
  expect(rows(0, 2, 'barra').every(r => r.kg === '0')).toBe(true);
  expect(rows(0, 4, 'lat_b')[0]!.kg).toBe('7,5');
  expect(rows(0, 4, 'pescoco').every(r => r.kg === '' && r.reps === '20')).toBe(true);
  expect(rows(0, 1, 'copen_l').every(r => r.kg === '' && r.reps === '25')).toBe(true);
  expect(rows(0, 1, 'salto_l').every(r => r.kg === '' && r.reps === '3')).toBe(true);
  for (let w = 0; w < 4; w++) expect(rows(w, 1, 'bulg').every(r => r.kg === '14')).toBe(true);
 });
 it('A.4: toda subida de carga vem depois de uma sessão normal com todas as séries no topo', () => {
  const plan = s.catalog.plan;
  const byEx: Record<string, { week: number; kg: number; rows: { kg: string; reps: string }[] }[]> = {};
  for (const day of Object.keys(s.history.days).sort()) {
   const p = phaseOf(start, day); if (p.kind !== 'week') continue;
   for (const [ex, rows] of Object.entries(s.history.days[day]!.log ?? {})) {
    const kgs = rows.map(r => parseNumber(r.kg)).filter((n): n is number => n !== null);
    (byEx[ex] ??= []).push({ week: p.week, kg: kgs.length ? Math.max(...kgs) : 0, rows: rows as { kg: string; reps: string }[] });
   }
  }
  let rises = 0;
  for (const [ex, list] of Object.entries(byEx)) {
   for (let i = 1; i < list.length; i++) {
    if (list[i]!.kg <= list[i - 1]!.kg) continue;
    rises++;
    expect(list[i]!.week % 4, ex).not.toBe(3);
    const prev = list.slice(0, i).reverse().find(x => x.week % 4 !== 3)!;
    const top = repRange(setsForWeek(plan.ex[ex]!, prev.week).reps)!.max;
    expect(prev.rows.every(r => Number(r.reps) >= top), ex).toBe(true);
    expect(list[i]!.kg - prev.kg, ex).toBe(isLower(muscleGroupOf(ex, plan.ex[ex])) ? 5 : 2.5);
   }
  }
  expect(rises).toBeGreaterThan(0);
 });
 it('A.5: medidas nas segundas, peso 77,0 -> 76,3 e cintura 86,0 -> 85,2', () => {
  const m = s.history.measurements;
  expect(Object.keys(m).sort()).toEqual([0, 1, 2, 3, 4].map(w => at(w, 0)));
  expect([0, 1, 2, 3, 4].map(w => m[at(w, 0)]!.p)).toEqual(['77,0', '76,8', '76,6', '76,6', '76,3']);
  expect([0, 1, 2, 3, 4].map(w => m[at(w, 0)]!.c)).toEqual(['86,0', '85,8', '85,5', '85,5', '85,2']);
 });
 it('A.6: dieta em 22 de 28 dias nas 4 primeiras semanas; sábados nunca; opção da semana', () => {
  let withDiet = 0;
  for (let i = 0; i < 28; i++) {
   const d = s.history.days[at(0, i)]?.diet as { pick: Record<string, string>; eaten: Record<string, boolean>; skip: Record<string, boolean>; water: number; crea: boolean } | undefined;
   if (!d) continue;
   withDiet++;
   const w = Math.floor(i / 7), wd = i % 7;
   expect(wd, at(0, i)).not.toBe(5);
   expect(d.pick.cafe).toBe(['A', 'B', 'C', 'A'][w]);
   expect(d.crea).toBe(true);
   if (wd === 6) expect(d.skip.lanche).toBe(true);
   const noDinner = wd === 3 && (w === 1 || w === 3);
   expect(!!d.eaten.jantar).toBe(!noDinner);
   expect(d.water).toBe(noDinner ? 4 : 6);
  }
  expect(withDiet).toBe(22);
  // Semana 5: só os dias úteis antes de hoje (hoje é sexta: seg a qui), opção B.
  const week5 = [0, 1, 2, 3, 4, 5, 6].map(d => at(4, d)).filter(d => d < TODAY);
  expect(week5.filter(d => s.history.days[d]?.diet).length).toBe(4);
  expect((s.history.days[at(4, 0)]!.diet as { pick: Record<string, string> }).pick.cafe).toBe('B');
 });
});

describe('demoState e o aviso de estagnação (A.4, último item; regra C.2.6)', () => {
 it.each(['2026-11-16', '2026-11-18', '2026-11-19', '2026-11-20', '2026-11-22', '2027-03-01'])('hoje %s: nenhum aviso de estagnação na demo', today => {
  const s = demoState(today, empty());
  const hits = Object.entries(s.catalog.plan.ex)
   .filter(([id, ex]) => stagnation({ ex, sessions: exerciseHistory(s.history.days, id, ex), start: s.settings.start, today, week: planWeekIndex(s.settings.start, today), beginner: Array.isArray(s.catalog.plan.rir) }) !== null)
   .map(([id]) => id);
  expect(hits).toEqual([]);
 });
});
