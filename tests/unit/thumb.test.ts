import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { PHOTOS } from '../../src/ui/photos';
import { Thumb, fallbackIcon, splitMealId } from '../../src/ui/Thumb';

const html = (props: Parameters<typeof Thumb>[0]) => renderToStaticMarkup(createElement(Thumb, props));

describe('Thumb', () => {
  it('prefixo de refeição escolhe o ícone e a opção define o tom', () => {
    expect(splitMealId('almoco-b')).toEqual({ meal: 'almoco', option: 'b' });
    expect(fallbackIcon('meal', 'almoco-a')).toBe('garfo');
    for (const id of ['pos', 'pos-a', 'pos-b', 'pos-c']) expect(fallbackIcon('meal', id)).toBe('shake');
    expect(html({ kind: 'meal', id: 'pos-a', size: 56 })).toContain('ic-shake');
    expect(fallbackIcon('meal', 'cafe-a')).toBe('dieta');
    expect(fallbackIcon('meal', 'desconhecido-a')).toBe('garfo');
    const m = html({ kind: 'meal', id: 'almoco-b', size: 56 });
    expect(m).not.toContain('<img');
    expect(m).toContain('thumb-opt-b');
    expect(m).toContain('ic-garfo');
    expect(m).toContain('width:56px;height:56px');
  });
  it('id desconhecido de exercício usa o grupo e depois o ícone padrão', () => {
    expect(fallbackIcon('exercise', 'zzz', 'Cardio')).toBe('fogo');
    expect(fallbackIcon('exercise', 'zzz', 'xyz')).toBe('treino');
    const m = html({ kind: 'exercise', group: 'Cardio', size: 56 });
    expect(m).toContain('ic-fogo');
    expect(m).toContain('opacity="0.2"'); // Phosphor duotone (peso padrão do tile), sem traço fino
  });
  it('id no manifesto pede a foto; fora dele não há img', () => {
    PHOTOS.meal = new Set(['almoco-a']);
    try {
      expect(html({ kind: 'meal', id: 'almoco-a' })).toContain('img/meal/almoco-a.jpg');
      expect(html({ kind: 'meal', id: 'almoco-c' })).not.toContain('<img');
    } finally { PHOTOS.meal = new Set(); }
  });
  it('variante hero mantém proporção 4:3 e viewBox fixo', () => {
    const m = html({ kind: 'hero', size: 128 });
    expect(m).toContain('thumb-hero');
    expect(m).toContain('width:128px;height:96px');
    expect(m).toContain('viewBox="0 0 160 120"');
  });
});
