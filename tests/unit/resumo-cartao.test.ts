import { describe, expect, it } from 'vitest';
import { cardContent, cardFilename, recordText, weekRange } from '../../src/features/resumo/content';
import { CARD_H, CARD_W, drawCard } from '../../src/features/resumo/draw';
import type { Ctx } from '../../src/features/resumo/draw';
import { DIET_FOOTNOTE } from '../../src/domain/weekSummary';
import type { WeekSummary } from '../../src/domain/weekSummary';

// Dados sintéticos. Canvas simulado: registra cada fillText e mede o texto por número de caracteres.
interface Fake extends Ctx { texts: Array<{ t: string; x: number; y: number }> }
function fakeCtx(): Fake {
 const texts: Fake['texts'] = [];
 const noop = () => undefined;
 const ctx = {
  texts, fillStyle: '', strokeStyle: '', lineWidth: 1, lineCap: 'butt', font: '400 10px x', textAlign: 'left', textBaseline: 'alphabetic', letterSpacing: '0px',
  fillText(t: string, x: number, y: number) { texts.push({ t, x, y }); },
  measureText(t: string) { const px = Number(/(\d+)px/.exec(ctx.font)?.[1] ?? 10); return { width: t.length * px * 0.55 } as TextMetrics; },
  fillRect: noop, beginPath: noop, moveTo: noop, lineTo: noop, stroke: noop, fill: noop, save: noop, restore: noop, translate: noop, scale: noop, rect: noop, roundRect: noop,
 };
 return ctx as unknown as Fake;
}

const base: WeekSummary = {
 week: 4, from: '2026-11-16', to: '2026-11-22', deload: false,
 workouts: { done: 4, partial: 1, planned: 5 }, sets: 82, volume: 12480.4,
 records: [
  { exId: 'supino', name: 'Supino reto', day: '2026-11-18', type: 'maxKg', kg: 62.5, reps: 8, e1rm: 79 },
  { exId: 'remada', name: 'Remada curvada', day: '2026-11-20', type: 'maxE1rm', kg: 50, reps: 10, e1rm: 66.6 },
 ],
 diet: { considered: 4, registered: 3, onTarget: 2, unregistered: 1, text: 'Dieta: na meta em 2 de 3 dias registrados. 1 dia sem registro.' },
 body: { weight: { before: 77, after: 76.6, delta: -0.4 }, waist: { before: 86, after: 85.2, delta: -0.8 } },
};
const today = '2026-11-20';
const bodyWords = /peso|cintura|\bkg\b.*−|cm/i;

describe('cartão do resumo da semana', () => {
 it('sem a opção, nenhum texto desenhado fala de peso ou cintura (mesmo se o resumo trouxer medidas)', () => {
  const ctx = fakeCtx();
  const drawn = drawCard(ctx, cardContent(base, { today, body: false }));
  const all = drawn.join(' | ');
  expect(all).not.toMatch(/peso/i);
  expect(all).not.toMatch(/cintura/i);
  expect(all).not.toMatch(/76[,.]6|85[,.]2|−0[,.]4|−0[,.]8/);
  expect(ctx.texts.map(t => t.t)).toEqual(drawn);
 });

 it('com a opção marcada, desenha só a variação de peso e cintura', () => {
  const drawn = drawCard(fakeCtx(), cardContent(base, { today, body: true }));
  expect(drawn).toContain('Peso');
  expect(drawn).toContain('−0,4 kg');
  expect(drawn).toContain('Cintura');
  expect(drawn).toContain('−0,8 cm');
  expect(drawn.join(' ')).not.toMatch(/76[,.]6|85[,.]2/); // só a variação, não o peso absoluto
 });

 it('com o domínio devolvendo body null, a opção não inventa números', () => {
  const c = cardContent({ ...base, body: null }, { today, body: true });
  expect(c.body).toBeNull();
  expect(drawCard(fakeCtx(), c).join(' ')).not.toMatch(bodyWords);
 });

 it('dieta: linha e rodapé uma vez; somem quando o domínio devolve diet null', () => {
  const withDiet = drawCard(fakeCtx(), cardContent(base, { today, body: false })).join(' ');
  expect(withDiet).toContain('Dieta: na meta em 2 de 3 dias registrados.');
  expect(withDiet.split('Na meta:').length - 1).toBe(1);
  const hidden = drawCard(fakeCtx(), cardContent({ ...base, diet: null }, { today, body: false })).join(' ');
  expect(hidden).not.toMatch(/dieta|na meta/i);
  expect(cardContent({ ...base, diet: null }, { today, body: false }).diet).toBeNull();
  expect(cardContent(base, { today, body: false }).diet?.footnote).toBe(DIET_FOOTNOTE);
 });

 it('sem nome nem idade: o cartão só tem a marca e os números da semana', () => {
  const drawn = drawCard(fakeCtx(), cardContent(base, { today, body: false }));
  expect(drawn[0]).toBe('Fitnez');
  expect(drawn).toContain('Semana 5');
  expect(drawn).toContain('4');
  expect(drawn).toContain('de 5');
  expect(drawn).toContain('82');
  expect(drawn).toContain('12.480 kg');
  expect(drawn).toContain('Supino reto: 62,5 kg × 8');
  expect(drawn).toContain('Remada curvada: máx. estimado 66,5 kg');
  expect(cardFilename(base)).toBe('fitnez-semana-5.png');
 });

 it('tudo fica dentro da área do cartão, inclusive com muitos recordes, medidas e dieta', () => {
  const many = Array.from({ length: 12 }, (_, i) => ({ ...base.records[0]!, exId: `e${i}`, name: `Exercício com um nome bem comprido número ${i + 1}` }));
  const ctx = fakeCtx();
  drawCard(ctx, cardContent({ ...base, records: many }, { today, body: true }));
  expect(ctx.texts.filter(t => t.t.startsWith("Exercício")).length).toBeGreaterThanOrEqual(1);
  for (const t of ctx.texts) { expect(t.y).toBeGreaterThan(0); expect(t.y).toBeLessThanOrEqual(CARD_H - 60); expect(t.x).toBeLessThan(CARD_W); }
  expect(ctx.texts.some(t => /^e mais \d+ recordes$/.test(t.t))).toBe(true);
  const ys = ctx.texts.map(t => t.y);
  const footY = ctx.texts.find(t => t.t.startsWith('Dieta:'))!.y;
  const lastRecord = Math.max(...ctx.texts.filter(t => t.t.startsWith('Exercício') || t.t.startsWith('e mais')).map(t => t.y));
  expect(lastRecord).toBeLessThan(footY);
  expect(Math.max(...ys)).toBeLessThanOrEqual(CARD_H - 60);
 });

 it('variação: sinal tipográfico e vírgula; zero vira "sem mudança" na tela e no cartão', () => {
  const mk = (dw: number, dc: number) => ({ ...base, body: { weight: { before: 77, after: 77 + dw, delta: dw }, waist: { before: 86, after: 86 + dc, delta: dc } } });
  expect(cardContent(mk(-0.3, 0.2), { today, body: true }).body).toEqual([{ label: 'Peso', value: '−0,3 kg' }, { label: 'Cintura', value: '+0,2 cm' }]);
  const zero = cardContent(mk(0, 0), { today, body: true });
  expect(zero.body).toEqual([{ label: 'Peso', value: 'sem mudança' }, { label: 'Cintura', value: 'sem mudança' }]);
  const drawn = drawCard(fakeCtx(), zero);
  expect(drawn).toContain('sem mudança');
  expect(drawn.join(' ')).not.toMatch(/0 (kg|cm)/);
 });

 it('textos de apoio', () => {
  expect(weekRange('2026-11-16', '2026-11-22')).toBe('16 a 22 de novembro');
  expect(weekRange('2026-10-27', '2026-11-02')).toBe('27 de outubro a 2 de novembro');
  expect(weekRange('2026-12-28', '2027-01-03')).toBe('28 de dezembro de 2026 a 3 de janeiro de 2027');
  expect(recordText(base.records[0]!)).toBe('Supino reto: 62,5 kg × 8');
  const c = cardContent({ ...base, deload: true }, { today, body: false });
  expect(c.sub).toBe('16 a 22 de novembro · semana leve · até hoje');
  expect(c.workouts.label).toBe('treinos do plano · 1 parcial');
  expect(cardContent(base, { today: '2026-11-23', body: false }).sub).toBe('16 a 22 de novembro');
 });
});
