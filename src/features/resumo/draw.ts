import type { CardContent } from './content';

// Desenho do cartão compartilhável (ADR 011, 2.5): canvas 1080 × 1350, Figtree local, cores do DESIGN.md.
// Premium minimalista: fundo liso, linhas finas, sem pílulas, sem brilho; azul só no número de destaque.
// Sem nome, idade ou fotos: tudo o que é desenhado vem de CardContent.

export const CARD_W = 1080;
export const CARD_H = 1350;
const M = 96; // margem
const FONT = "Figtree, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";

export interface Palette { background: string; foreground: string; muted: string; border: string; primary: string; leaf: string; card: string }
export const LIGHT: Palette = { background: '#FFFFFF', foreground: '#111113', muted: '#5E5E66', border: '#E6E6E8', primary: '#0A58F0', leaf: '#4DB33D', card: '#FFFFFF' };

/** Subconjunto do contexto 2D usado aqui (facilita o teste com canvas simulado). */
export type Ctx = Pick<CanvasRenderingContext2D,
 'fillStyle' | 'strokeStyle' | 'lineWidth' | 'lineCap' | 'font' | 'textAlign' | 'textBaseline' | 'fillText' | 'measureText'
 | 'fillRect' | 'beginPath' | 'moveTo' | 'lineTo' | 'stroke' | 'fill' | 'save' | 'restore' | 'translate' | 'scale' | 'rect'> & {
 roundRect?: CanvasRenderingContext2D['roundRect'];
 letterSpacing?: string;
};

const font = (weight: number, px: number) => `${weight} ${px}px ${FONT}`;

function wrap(ctx: Ctx, text: string, max: number): string[] {
 const words = text.split(' ');
 const lines: string[] = [];
 let cur = '';
 for (const w of words) {
  const next = cur ? `${cur} ${w}` : w;
  if (cur && ctx.measureText(next).width > max) { lines.push(cur); cur = w; } else cur = next;
 }
 if (cur) lines.push(cur);
 return lines;
}

/** Corta com reticências para caber em uma linha. */
function fit(ctx: Ctx, text: string, max: number): string {
 if (ctx.measureText(text).width <= max) return text;
 let t = text;
 while (t.length > 1 && ctx.measureText(`${t}…`).width > max) t = t.slice(0, -1);
 return `${t.trimEnd()}…`;
}

function hairline(ctx: Ctx, y: number, p: Palette) {
 ctx.fillStyle = p.border;
 ctx.fillRect(M, y, CARD_W - 2 * M, 2);
}

function rounded(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
 if (typeof ctx.roundRect === 'function') ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h);
}

/** Símbolo da marca (o mesmo desenho de Logo.tsx, viewBox 0 -2 70 49). */
function mark(ctx: Ctx, x: number, y: number, s: number, p: Palette) {
 ctx.save();
 ctx.translate(x, y + 2 * s);
 ctx.scale(s, s);
 ctx.fillStyle = p.primary;
 ctx.beginPath();
 for (const [rx, ry, rw, rh, rr] of [[1, 17, 6, 21, 3], [9, 9, 9, 37, 4], [52, 9, 9, 37, 4], [63, 17, 6, 21, 3], [17, 24, 36, 7, 3.5]] as const) rounded(ctx, rx, ry, rw, rh, rr);
 ctx.fill();
 if (typeof Path2D !== 'undefined') {
  ctx.fillStyle = p.leaf;
  (ctx as CanvasRenderingContext2D).fill(new Path2D('M32 22c-2-10 3-18 15-21 2 11-3 19-15 21Z'));
  ctx.strokeStyle = p.card; ctx.lineWidth = 1.8; ctx.lineCap = 'round';
  (ctx as CanvasRenderingContext2D).stroke(new Path2D('M34.5 19.5c3.5-5.5 7.5-10 12-14'));
 }
 ctx.restore();
}

/** Desenha o cartão inteiro. Devolve os textos desenhados, na ordem (usado no teste e para conferência). */
export function drawCard(ctx: Ctx, c: CardContent, p: Palette = LIGHT): string[] {
 const drawn: string[] = [];
 const W = CARD_W - 2 * M;
 const text = (t: string, x: number, y: number, weight: number, px: number, color: string, align: CanvasTextAlign = 'left') => {
  ctx.font = font(weight, px); ctx.fillStyle = color; ctx.textAlign = align;
  ctx.fillText(t, x, y); drawn.push(t);
  return ctx.measureText(t).width;
 };
 ctx.textBaseline = 'alphabetic';
 if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
 ctx.fillStyle = p.background;
 ctx.fillRect(0, 0, CARD_W, CARD_H);

 // Marca discreta: símbolo pequeno + palavra em peso 700, cinza.
 mark(ctx, M, 92, 0.9, p);
 text('Fitnez', M + 76, 132, 700, 36, p.muted);

 // Título: semana do plano e o período.
 let y = 262;
 const tw = text(c.title, M, y, 800, 120, p.foreground);
 text(c.of, M + tw + 24, y, 600, 56, p.muted);
 y += 56;
 ctx.font = font(500, 36);
 text(fit(ctx, c.sub, W), M, y, 500, 36, p.muted);

 // Destaque: treinos do plano (único azul do cartão). Peso e cintura, só com a opção, ficam à direita.
 const BX = M + Math.round(W * 0.6);
 y = 530;
 const dw = text(c.workouts.done, M, y, 800, 200, p.primary);
 if (c.workouts.planned) text(c.workouts.planned, M + dw + 24, y, 700, 76, p.foreground);
 if (c.body) {
  c.body.forEach((s, i) => {
   const by = 392 + i * 120;
   text(s.label, BX, by, 500, 30, p.muted);
   ctx.font = font(800, 52);
   text(fit(ctx, s.value, CARD_W - M - BX), BX, by + 56, 800, 52, p.foreground);
  });
 }
 y += 60;
 ctx.font = font(500, 36);
 text(fit(ctx, c.workouts.label, c.body ? BX - M - 24 : W), M, y, 500, 36, p.muted);

 y += 50; hairline(ctx, y, p);

 // Séries e total levantado.
 const col = W / c.stats.length;
 c.stats.forEach((s, i) => {
  const x = M + i * col;
  text(s.label, x, y + 62, 500, 32, p.muted);
  ctx.font = font(800, 72);
  text(fit(ctx, s.value, col - 24), x, y + 140, 800, 72, p.foreground);
 });
 y += 172;
 hairline(ctx, y, p);

 // Rodapé de baixo para cima: linha da dieta e nota.
 const bottom = CARD_H - M + 10;
 const foot: Array<{ t: string; weight: number; px: number; color: string; lh: number }> = [];
 if (c.diet) {
  ctx.font = font(600, 34);
  for (const l of wrap(ctx, c.diet.line, W)) foot.push({ t: l, weight: 600, px: 34, color: p.foreground, lh: 46 });
  ctx.font = font(400, 27);
  wrap(ctx, c.diet.footnote, W).forEach((l, i) => foot.push({ t: l, weight: 400, px: 27, color: p.muted, lh: i === 0 ? 48 : 36 }));
 }
 const footH = foot.reduce((a, f) => a + f.lh, 0);

 // Recordes: quantos couberem entre a linha e o rodapé.
 y += 68;
 text('Recordes da semana', M, y, 700, 36, p.foreground);
 y += 56;
 const LH = 50;
 const limit = bottom - footH - (c.diet ? 30 : 0);
 const room = Math.max(1, Math.floor((limit - y) / LH) + 1);
 const line = (t: string, color: string) => { ctx.font = font(500, 34); text(fit(ctx, t, W), M, y, 500, 34, color); y += LH; };
 if (!c.records.length) line(c.recordsEmpty, p.muted);
 else if (c.records.length <= room) c.records.forEach(r => line(r, p.foreground));
 else if (room >= 2) {
  c.records.slice(0, room - 1).forEach(r => line(r, p.foreground));
  const rest = c.records.length - (room - 1);
  line(rest === 1 ? 'e mais 1 recorde' : `e mais ${rest} recordes`, p.muted);
 } else line(`${c.records.length} recordes nesta semana`, p.foreground);

 if (foot.length) {
  let fy = bottom - footH;
  for (const f of foot) { fy += f.lh; text(f.t, M, fy - (f.lh - f.px) / 2, f.weight, f.px, f.color); }
 }
 return drawn;
}

/** Paleta atual do app (claro ou escuro), lida dos tokens CSS. */
export function paletteFromDocument(): Palette {
 const cs = getComputedStyle(document.documentElement);
 const v = (name: string, fallback: string) => cs.getPropertyValue(name).trim() || fallback;
 return {
  background: v('--background', LIGHT.background), foreground: v('--foreground', LIGHT.foreground),
  muted: v('--muted-foreground', LIGHT.muted), border: v('--border', LIGHT.border), primary: v('--primary', LIGHT.primary),
  leaf: v('--leaf', LIGHT.leaf), card: v('--background', LIGHT.card),
 };
}

/** Espera a Figtree local nos pesos usados; sem a API, desenha com a fonte que houver. */
export async function fontsReady(): Promise<void> {
 const fonts = typeof document !== 'undefined' ? document.fonts : undefined;
 if (!fonts) return;
 try { await Promise.all([400, 500, 600, 700, 800].map(w => fonts.load(`${w} 40px Figtree`, 'Semana 0123456789 × −'))); } catch { /* segue com o fallback */ }
 await fonts.ready;
}

/** Desenha no canvas da prévia (visível na tela; a CSP não aceita imagens blob:) e gera o PNG, sem metadados. */
export async function renderCardPng(canvas: HTMLCanvasElement, c: CardContent, p: Palette): Promise<Blob> {
 await fontsReady();
 canvas.width = CARD_W; canvas.height = CARD_H;
 const ctx = canvas.getContext('2d');
 if (!ctx) throw new Error('canvas indisponível');
 drawCard(ctx, c, p);
 return new Promise((resolve, reject) => canvas.toBlob(b => (b ? resolve(b) : reject(new Error('png vazio'))), 'image/png'));
}
