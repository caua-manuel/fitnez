import { describe, expect, it } from 'vitest';
import { csvFilename, exportDietCsv, exportLoadsCsv, exportMeasuresCsv, toCsv } from '../../src/domain/csv';
import type { DayRecord, Plan } from '../../src/application/repository';
import type { DietOption, MealKey } from '../../src/domain/diet';

const plan: Plan = {
 ex: {
  sup: { n: 'Supino teste', s: [3], r: ['8'], m: 'kg', g: 'peito' },
  evil: { n: '=HYPERLINK("http://x.test","clique")', s: [1], r: ['8'], m: 'kg', g: 'costas' },
 },
 sess: { UA: { name: 'Upper A', ex: ['sup', 'evil'] } },
 order: ['UA'],
};
const L = (s: string) => s.split('\r\n');

describe('toCsv', () => {
 it('usa ; e CRLF, sem BOM por padrão', () => {
  expect(toCsv([['a', 'b'], ['c', 'd']])).toBe('a;b\r\nc;d');
 });
 it('escapa aspas, separador e quebras de linha', () => {
  expect(toCsv([['diz "oi"', 'a;b', 'l1\nl2', 'l1\r\nl2']])).toBe('"diz ""oi""";"a;b";"l1\nl2";"l1\r\nl2"');
 });
 it('com separador vírgula, cita campos com vírgula', () => {
  expect(toCsv([['a,b', 'c']], { separator: ',' })).toBe('"a,b",c');
 });
 it('números com vírgula decimal, null vazio, sem NaN', () => {
  const out = toCsv([[1.5, 2, null, NaN, Infinity]]);
  expect(out).toBe('1,5;2;;;');
  expect(out).not.toMatch(/NaN|Infinity/);
 });
 it('BOM opcional', () => {
  expect(toCsv([['a']], { bom: true })).toBe('﻿a');
 });
 it('número negativo continua número (sem apóstrofo)', () => {
  expect(toCsv([[-2.5]])).toBe('-2,5');
 });
 it('protege contra injeção de fórmula em texto', () => {
  for (const c of ['=1+1', '+1', '-1', '@x', '\tx', '\rx']) {
   const out = toCsv([[c]]);
   expect(out.replace(/^"/, '').startsWith("'")).toBe(true);
  }
  expect(toCsv([['=A1']])).toBe("'=A1");
  expect(toCsv([['normal']])).toBe('normal');
 });
});

describe('csvFilename', () => {
 it('monta nomes por tipo', () => {
  expect(csvFilename('cargas', '2026-11-16')).toBe('fitnez-cargas-2026-11-16.csv');
  expect(csvFilename('medidas', '2026-11-16')).toBe('fitnez-medidas-2026-11-16.csv');
  expect(csvFilename('dieta', '2026-11-16')).toBe('fitnez-dieta-2026-11-16.csv');
 });
});

describe('exportLoadsCsv', () => {
 const HEAD = 'data;treino;exercício;grupo muscular;série;carga (kg);repetições;concluída';
 it('sem dados: só cabeçalho', () => {
  expect(exportLoadsCsv({}, plan)).toBe(HEAD);
 });
 it('exporta séries, normaliza vírgula e mantém texto inválido', () => {
  const days: Record<string, DayRecord> = {
   '2026-11-17': {
    workouts: { UA: { sessionId: 'UA', startedAt: 1, status: 'done', sets: 2, volume: 0 } },
    log: { sup: [{ kg: '22,5', reps: '8', done: true }, { kg: 'meio', reps: '8-10', done: false }] },
   },
  };
  const l = L(exportLoadsCsv(days, plan));
  expect(l[0]).toBe(HEAD);
  expect(l[1]).toBe('2026-11-17;Upper A;Supino teste;peito;1;22,5;8;sim');
  expect(l[2]).toBe('2026-11-17;Upper A;Supino teste;peito;2;meio;8-10;não');
 });
 it('exercício removido e nome malicioso protegido', () => {
  const days: Record<string, DayRecord> = {
   '2026-11-18': { log: { fantasma: [{ kg: '10', reps: '5', done: true }], evil: [{ kg: '1', reps: '1', done: true }] } },
  };
  const l = L(exportLoadsCsv(days, plan));
  expect(l[1]).toBe('2026-11-18;;Exercício removido;;1;10;5;sim');
  expect(l[2]).toContain(`"'=HYPERLINK(""http://x.test"",""clique"")"`);
  expect(l[2]).not.toMatch(/;=HYPERLINK/);
 });
 it('ordena por data e não gera NaN', () => {
  const days: Record<string, DayRecord> = {
   '2026-11-19': { log: { sup: [{ kg: undefined, reps: null, done: true }] } },
   '2026-11-17': { log: { sup: [{ kg: '5', reps: '5', done: true }] } },
  };
  const out = exportLoadsCsv(days, plan);
  expect(out).not.toMatch(/NaN|undefined|null/);
  expect(L(out)[1].startsWith('2026-11-17')).toBe(true);
 });
});

describe('exportMeasuresCsv', () => {
 const HEAD = 'data;peso (kg);cintura (cm);quadril (cm);coxa (cm);braço (cm)';
 it('sem dados: só cabeçalho', () => { expect(exportMeasuresCsv({})).toBe(HEAD); });
 it('medidas parciais e vírgula', () => {
  const l = L(exportMeasuresCsv({ '2026-11-20': { p: '70,5', c: '86' }, '2026-11-10': { q: '95', t: 'x' } }));
  expect(l[1]).toBe('2026-11-10;;;95;x;');
  expect(l[2]).toBe('2026-11-20;70,5;86;;;');
 });
});

describe('exportDietCsv', () => {
 const opt = (key: string, name: string, kcal: number): DietOption => ({ key, name, kcal, p: 30, c: 50.5, g: 10, items: [] });
 const catalog = { cafe: [opt('A', 'Editado agora', 999)], almoco: [opt('B', 'Prato B', 700)], lanche: [], pos: [], jantar: [] } as Record<MealKey, DietOption[]>;
 const HEAD = 'data;refeição;opção;nome;kcal;proteína (g);carboidrato (g);gordura (g);consumida;água (copos de 500 ml);creatina';
 it('sem dados: só cabeçalho', () => { expect(exportDietCsv({}, catalog)).toBe(HEAD); });
 it('consumed prevalece sobre catálogo editado; total do dia; água e creatina', () => {
  const days: Record<string, DayRecord> = {
   '2026-11-17': { diet: {
    pick: { cafe: 'A', almoco: 'B' }, eaten: { cafe: true }, skip: {}, water: 4, crea: true,
    consumed: { cafe: { key: 'A', name: 'Nome antigo', kcal: 400, p: 20, c: 40, g: 8 } },
   } },
  };
  const l = L(exportDietCsv(days, catalog));
  expect(l[1]).toBe('2026-11-17;Café da manhã;A;Nome antigo;400;20;40;8;sim;;');
  expect(l[2]).toBe('2026-11-17;Almoço;B;Prato B;700;30;50,5;10;não;;');
  expect(l[3]).toBe('2026-11-17;Total do dia;;;400;20;40;8;;4;sim');
 });
 it('sem NaN com dados incompletos', () => {
  const out = exportDietCsv({ '2026-11-18': { diet: { pick: { cafe: 'Z' }, eaten: { cafe: true } } } }, catalog);
  expect(out).not.toMatch(/NaN|undefined|null/);
 });
});
