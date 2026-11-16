import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { CountUp } from '../../src/ui/motion/CountUp';
import { Reveal } from '../../src/ui/motion/Reveal';
import { AnimatedRing } from '../../src/ui/motion/AnimatedRing';
import { countText, easeOut, formatNumber, valueAt } from '../../src/ui/motion/format';
import { tiltFor } from '../../src/ui/motion/tilt';
import { weekStrip } from '../../src/features/inicio/semana';
import type { Plan } from '../../src/application/repository';

describe('formato e contagem', () => {
  it('formata em pt-BR com vírgula decimal e ponto de milhar', () => {
    expect(formatNumber(1850)).toBe('1.850');
    expect(formatNumber(72.5, 1)).toBe('72,5');
    expect(countText(33, 0, '', '%')).toBe('33%');
  });
  it('a contagem começa em from, é monotônica e termina exatamente em to', () => {
    expect(valueAt(0, 33, 0, 600)).toBe(0);
    expect(valueAt(0, 33, 600, 600)).toBe(33);
    expect(valueAt(0, 33, 900, 600)).toBe(33);
    let anterior = -1;
    for (let t = 0; t <= 600; t += 50) { const v = valueAt(0, 33, t, 600); expect(v).toBeGreaterThanOrEqual(anterior); anterior = v; }
    expect(easeOut(0.5)).toBeGreaterThan(0.5);
  });
  it('CountUp renderiza o valor final no texto (leitor de tela, testes e sem JavaScript)', () => {
    const html = renderToStaticMarkup(createElement(CountUp, { value: 1850, suffix: ' kcal' }));
    expect(html).toContain('1.850 kcal');
    expect(html).not.toContain('aria-live');
  });
  it('AnimatedRing mantém o papel de barra de progresso com o valor final', () => {
    const html = renderToStaticMarkup(createElement(AnimatedRing, { percent: 33.4, label: 'Semana 4 de 12: 33% do plano', size: 88, stroke: 5 }));
    expect(html).toContain('role="progressbar"');
    expect(html).toContain('aria-valuenow="33"');
    expect(html).toContain('stroke-linecap="round"');
    expect(html).toContain('33%');
  });
  it('Reveal aplica atraso de 60 ms por posição e limita o atraso', () => {
    expect(renderToStaticMarkup(createElement(Reveal, { i: 2, children: 'x' }))).toContain('animation-delay:120ms');
    expect(renderToStaticMarkup(createElement(Reveal, { i: 99, children: 'x' }))).toContain('animation-delay:360ms');
    expect(renderToStaticMarkup(createElement(Reveal, { i: 0, children: 'x' }))).not.toContain('animation-delay');
  });
});

describe('inclinação', () => {
  const rect = { left: 100, top: 100, width: 200, height: 100 };
  it('no centro não inclina; nas bordas chega a 4 graus e nunca passa', () => {
    expect(tiltFor(200, 150, rect)).toMatchObject({ rotateX: 0, rotateY: 0, nx: 0, ny: 0 });
    expect(tiltFor(300, 100, rect)).toMatchObject({ rotateY: 4, rotateX: 4 });
    expect(Math.abs(tiltFor(9999, -9999, rect).rotateY)).toBeLessThanOrEqual(4);
    expect(tiltFor(0, 0, { left: 0, top: 0, width: 0, height: 0 }).rotateX).toBe(0);
  });
});

describe('faixa da semana', () => {
  const sched = [{ k: 'bjj', gi: true }, { k: 'gym', s: 'LW' }, { k: 'gym', s: 'UA' }, { k: 'bjj', gi: false }, { k: 'gym', s: 'UB' }, { k: 'volei' }, { k: 'rest' }];
  const plan = { sess: { LW: { name: 'Lower' }, UA: { name: 'Upper A' }, UB: { name: 'Upper B' } }, order: ['LW', 'UA', 'UB'], ex: {} } as unknown as Plan;
  const days = { '2026-11-09': { acts: { bjj: true } }, '2026-11-10': { acts: { gym: true }, workouts: { LW: { sessionId: 'LW', startedAt: 1, finishedAt: 2, status: 'done', sets: 1, volume: 1 } } } };
  it('mapeia a rotina da semana de quarta 2026-11-11 com feito, hoje, pendente e previsto', () => {
    const w = weekStrip({ sched, plan, days: days as any, today: '2026-11-11' });
    expect(w.map(d => d.day)).toEqual(['2026-11-09', '2026-11-10', '2026-11-11', '2026-11-12', '2026-11-13', '2026-11-14', '2026-11-15']);
    expect(w[0].label).toBe('Segunda: Jiu-jitsu, feito');
    expect(w[1].label).toBe('Terça: Lower, feito');
    expect(w[2].label).toBe('Quarta: Upper A, hoje');
    expect(w[3].label).toBe('Quinta: Jiu-jitsu, previsto');
    expect(w[5].kind).toBe('jogo');
    expect(w[6].label).toBe('Domingo: Descanso');
  });
  it('dia passado sem registro fica pendente; antes do plano tudo é previsto', () => {
    expect(weekStrip({ sched, plan, days: {}, today: '2026-11-12' })[0].status).toBe('pendente');
    const pre = weekStrip({ sched, plan, days: {}, today: '2026-11-12', preplan: true });
    expect(pre[0].status).toBe('previsto');
    expect(pre[3].status).toBe('hoje');
  });
});
