import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { MuscleGroup } from '../../src/domain/muscleGroups';
import { ExerciseIllustration, HeroIllustration, MealIllustration, MuscleIllustration } from '../../src/ui/illustrations';
import type { MealKey } from '../../src/ui/illustrations';

const GROUPS: Array<MuscleGroup | null> = ['peito', 'costas', 'ombro-lateral', 'ombro-posterior', 'press', 'biceps', 'triceps', 'quadriceps', 'posterior-gluteos', 'panturrilha', 'core', null];
const MEALS: MealKey[] = ['cafe', 'almoco', 'lanche', 'pos', 'jantar'];
const POSES = ['supino', 'remada_a', 'barra', 'agach', 'stiff', 'hip_l', 'lat_a', 'rosca_a', 'tri_a', 'puxada'];

function expectSvg(html: string) {
  expect(html.startsWith('<svg')).toBe(true);
  expect(html).toMatch(/viewBox="[-\d. ]+"/);
  expect(html.length).toBeGreaterThan(300);
  expect(html).not.toContain('<text');
  expect(html).not.toMatch(/lorem|undefined|NaN|\[object/i);
}

describe('ilustrações SVG', () => {
  it('renderiza todos os grupos musculares em miniatura e em hero', () => {
    for (const group of GROUPS) {
      expectSvg(renderToStaticMarkup(createElement(MuscleIllustration, { group })));
      expectSvg(renderToStaticMarkup(createElement(MuscleIllustration, { group, variant: 'hero' })));
    }
  });
  it('renderiza o hero com vários grupos e sem grupo', () => {
    expectSvg(renderToStaticMarkup(createElement(HeroIllustration, { groups: ['peito', 'triceps'] })));
    expectSvg(renderToStaticMarkup(createElement(HeroIllustration, { groups: ['costas', 'biceps'] })));
    expectSvg(renderToStaticMarkup(createElement(HeroIllustration, {})));
  });
  it('renderiza todas as refeições', () => {
    for (const meal of MEALS) expectSvg(renderToStaticMarkup(createElement(MealIllustration, { meal })));
  });
  it('renderiza as poses dos principais exercícios e o fallback por grupo', () => {
    for (const exId of POSES) expectSvg(renderToStaticMarkup(createElement(ExerciseIllustration, { exId, group: null })));
    expectSvg(renderToStaticMarkup(createElement(ExerciseIllustration, { exId: 'cruc', group: 'peito' })));
    expectSvg(renderToStaticMarkup(createElement(ExerciseIllustration, { exId: 'farmer', group: null })));
  });
  it('é decorativa por padrão e acessível com title', () => {
    const decor = renderToStaticMarkup(createElement(MealIllustration, { meal: 'cafe' }));
    expect(decor).toContain('aria-hidden="true"');
    expect(decor).not.toContain('role="img"');
    expect(decor).not.toContain('<title>');
    const named = renderToStaticMarkup(createElement(MuscleIllustration, { group: 'peito', title: 'Peito' }));
    expect(named).toContain('role="img"');
    expect(named).toContain('<title>Peito</title>');
    expect(named).not.toContain('aria-hidden');
  });
  it('respeita size e mantém a proporção', () => {
    const html = renderToStaticMarkup(createElement(MealIllustration, { meal: 'jantar', size: 120 }));
    expect(html).toContain('width="120"');
    expect(html).toContain('height="90"');
  });
  it('gera ids únicos por instância (sem colisão de gradientes)', () => {
    const html = renderToStaticMarkup(createElement('div', null, createElement(MealIllustration, { meal: 'cafe' }), createElement(MealIllustration, { meal: 'cafe' })));
    const ids = [...html.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
