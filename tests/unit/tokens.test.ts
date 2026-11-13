import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { contrast, palette, scale } from '../../src/ui/tokens';

const css = readFileSync('src/ui/styles.css', 'utf8');

function block(selector: string): string {
  const start = css.indexOf(selector + '{');
  expect(start, `bloco ${selector} ausente`).toBeGreaterThanOrEqual(0);
  return css.slice(start, css.indexOf('}', start));
}

describe.each(['light', 'dark'] as const)('tokens do tema %s', (theme) => {
  const t = palette[theme];
  it('texto principal sobre cartão >= 4,5', () => { expect(contrast(t.foreground, t.card)).toBeGreaterThanOrEqual(4.5); });
  it('texto sobre primário >= 4,5', () => { expect(contrast(t.primaryForeground, t.primary)).toBeGreaterThanOrEqual(4.5); });
  it('texto auxiliar sobre cartão >= 4,5', () => { expect(contrast(t.mutedForeground, t.card)).toBeGreaterThanOrEqual(4.5); });
  it('contorno de campo sobre secundário >= 3', () => { expect(contrast(t.input, t.secondary)).toBeGreaterThanOrEqual(3); });
  it('contorno de campo sobre fundo e cartão >= 3', () => { expect(contrast(t.input, t.background)).toBeGreaterThanOrEqual(3); expect(contrast(t.input, t.card)).toBeGreaterThanOrEqual(3); });
  it('texto auxiliar sobre secundário e fundo da página >= 4,5', () => { for (const bg of [t.secondary, t.background, theme === 'light' ? '#F3F5F9' : t.secondary]) expect(contrast(t.mutedForeground, bg)).toBeGreaterThanOrEqual(4.5); });
  it('borda de campo no CSS usa o token de contorno', () => { expect(css).toContain('--field-border:' + palette.light.input); expect(css.toLowerCase()).toContain('--field-border:' + palette.dark.input.toLowerCase()); });
  it('todo valor aparece literalmente no CSS', () => {
    const b = block(theme === 'light' ? ':root' : '[data-theme="dark"]').toLowerCase();
    for (const [name, value] of Object.entries(t)) expect(b, `${theme}.${name}`).toContain(value.toLowerCase());
  });
});

describe('direção visual premium minimalista', () => {
  it('botão sem brilho e sem pílula; sombra de cartão mínima', () => {
    expect(css).toContain('--shadow-blue:none');
    expect(css).toContain('--shadow-card:0 1px 2px rgb(16 24 40 / .04)');
    expect(css).toContain('--radius-card:16px');
    expect(css).toContain('--radius-button:14px');
  });
  it('folha de 430px no computador', () => { expect(css).toContain('--sheet-width:430px'); });
});

describe('controles sem rótulo de texto: contraste de componente >= 3 (WCAG 1.4.11)', () => {
  for (const theme of ['light', 'dark'] as const) {
    const t = palette[theme]; const off = scale.switchOff[theme];
    const surfaces = theme === 'light' ? [t.background, t.card, t.secondary, '#F3F5F9'] : [t.background, t.card, t.secondary];
    it(`interruptor desligado (${theme}) contra fundo, cartão e superfícies`, () => { for (const bg of surfaces) expect(contrast(off, bg), bg).toBeGreaterThanOrEqual(3); });
    it(`polegar branco contra trilho desligado (${theme})`, () => { expect(contrast('#FFFFFF', off)).toBeGreaterThanOrEqual(3); });
    it(`interruptor ligado: trilho primário contra cartão e polegar contra trilho (${theme})`, () => { expect(contrast(t.primary, t.card)).toBeGreaterThanOrEqual(3); expect(contrast(t.primaryForeground, t.primary)).toBeGreaterThanOrEqual(3); });
    it(`caixa, círculo da refeição e rádio desmarcados usam o contorno de campo (${theme})`, () => { for (const bg of surfaces) expect(contrast(t.input, bg), bg).toBeGreaterThanOrEqual(3); });
  }
  it('valores do interruptor aparecem no CSS', () => {
    expect(block('.switch')).toContain('--switch-off:' + scale.switchOff.light);
    expect(css.toLowerCase()).toContain('[data-theme="dark"] .switch{--switch-off:' + scale.switchOff.dark.toLowerCase() + '}');
  });
});
