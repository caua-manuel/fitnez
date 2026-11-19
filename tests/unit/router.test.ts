import { describe, expect, it } from 'vitest';
import { hrefFor, parseRoute } from '../../src/app/router';

describe('rotas por hash', () => {
 it('vazio ou desconhecido cai no início', () => {
  expect(parseRoute('')).toEqual({ tab: 'inicio' });
  expect(parseRoute('#')).toEqual({ tab: 'inicio' });
  expect(parseRoute('#xyz')).toEqual({ tab: 'inicio' });
  expect(parseRoute('#treino/UA/voar')).toEqual({ tab: 'treino', view: 'detalhe', id: 'UA' });
 });
 it('abas simples', () => {
  expect(parseRoute('#dieta')).toEqual({ tab: 'dieta' });
  expect(parseRoute('#evolucao')).toEqual({ tab: 'evolucao' });
  expect(parseRoute('#perfil')).toEqual({ tab: 'perfil' });
 });
 it('treino: lista, detalhe, executar com dia, concluído e editar', () => {
  expect(parseRoute('#treino')).toEqual({ tab: 'treino', view: 'lista' });
  expect(parseRoute('#treino/UA')).toEqual({ tab: 'treino', view: 'detalhe', id: 'UA' });
  expect(parseRoute('#treino/UA/executar?dia=2026-11-17')).toEqual({ tab: 'treino', view: 'executar', id: 'UA', day: '2026-11-17' });
  expect(parseRoute('#treino/UA/concluido?dia=2026-11-17')).toEqual({ tab: 'treino', view: 'concluido', id: 'UA', day: '2026-11-17' });
  expect(parseRoute('#treino/UA/editar')).toEqual({ tab: 'treino', view: 'editar', id: 'UA' });
  expect(parseRoute('#treino/UA/executar?dia=lixo')).toEqual({ tab: 'treino', view: 'executar', id: 'UA' });
 });
 it('treino: novo treino e editor de exercício (\"_\" marca novo)', () => {
  expect(parseRoute('#treino/_/novo')).toEqual({ tab: 'treino', view: 'novo' });
  expect(parseRoute('#treino/_/hoje')).toEqual({ tab: 'treino', view: 'hoje' });
  expect(hrefFor({ tab: 'treino', view: 'hoje' })).toBe('#treino/_/hoje');
  expect(parseRoute('#treino/novo')).toEqual({ tab: 'treino', view: 'detalhe', id: 'novo' });
  expect(parseRoute('#treino/UA/exercicio/supino')).toEqual({ tab: 'treino', view: 'exercicio', id: 'UA', ex: 'supino' });
  expect(parseRoute('#treino/UA/exercicio/_')).toEqual({ tab: 'treino', view: 'exercicio', id: 'UA' });
  expect(parseRoute('#treino/UA/exercicio')).toEqual({ tab: 'treino', view: 'exercicio', id: 'UA' });
  for (const h of ['#treino/_/novo', '#treino/UA/exercicio/supino', '#treino/UA/exercicio/_']) expect(hrefFor(parseRoute(h))).toBe(h);
 });
 it('dieta: refeição, gerenciar e dia', () => {
  expect(parseRoute('#dieta/almoco')).toEqual({ tab: 'dieta', meal: 'almoco' });
  expect(parseRoute('#dieta/almoco/gerenciar')).toEqual({ tab: 'dieta', meal: 'almoco', manage: true });
  expect(parseRoute('#dieta/pos?dia=2026-11-10')).toEqual({ tab: 'dieta', meal: 'pos', day: '2026-11-10' });
  expect(parseRoute('#dieta?dia=2026-11-10')).toEqual({ tab: 'dieta', day: '2026-11-10' });
  expect(parseRoute('#dieta/xyz')).toEqual({ tab: 'dieta' });
  expect(parseRoute('#dieta/almoco?dia=lixo')).toEqual({ tab: 'dieta', meal: 'almoco' });
 });
 it('hrefFor(parseRoute(h)) === h para rotas válidas', () => {
  for (const h of ['#dieta/cafe', '#dieta/jantar/gerenciar', '#dieta/almoco?dia=2026-11-10', '#dieta/almoco/gerenciar?dia=2026-11-10', '#dieta?dia=2026-11-10', '#inicio', '#dieta', '#evolucao', '#perfil', '#treino', '#treino/UA', '#treino/UA/executar?dia=2026-11-17', '#treino/UA/concluido?dia=2026-11-17', '#treino/UA/editar', '#treino/novo/editar']) expect(hrefFor(parseRoute(h))).toBe(h);
 });
});
