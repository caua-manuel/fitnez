import { useEffect, useId, useRef, useState } from 'react';
import { formatNumber } from '../../domain/evolution';

// Gráficos SVG próprios (sem biblioteca). Cores só por tokens (var(--...)).
export interface ChartPoint { label: string; value: number | null }
interface Pt { x: number; y: number }

function useWidth(fallback: number) {
 const ref = useRef<HTMLDivElement>(null);
 const [width, setWidth] = useState(fallback);
 useEffect(() => {
  const el = ref.current; if (!el) return;
  const read = () => { const w = Math.floor(el.getBoundingClientRect().width); if (w > 0) setWidth(w); };
  read();
  if (typeof ResizeObserver === 'undefined') return;
  const ro = new ResizeObserver(read); ro.observe(el); return () => ro.disconnect();
 }, []);
 return [ref, width] as const;
}

/** Curva monótona (Fritsch–Carlson): suave, sem ultrapassar os valores medidos. */
export function monotonePath(p: Pt[]): string {
 if (p.length === 0) return '';
 if (p.length === 1) return `M${p[0].x},${p[0].y}`;
 const n = p.length, dx: number[] = [], m: number[] = [], t: number[] = new Array(n);
 for (let i = 0; i < n - 1; i++) { dx[i] = p[i + 1].x - p[i].x || 1e-6; m[i] = (p[i + 1].y - p[i].y) / dx[i]; }
 t[0] = m[0]; t[n - 1] = m[n - 2];
 for (let i = 1; i < n - 1; i++) t[i] = m[i - 1] * m[i] <= 0 ? 0 : (m[i - 1] + m[i]) / 2;
 for (let i = 0; i < n - 1; i++) {
  if (m[i] === 0) { t[i] = 0; t[i + 1] = 0; continue; }
  const a = t[i] / m[i], b = t[i + 1] / m[i], s = a * a + b * b;
  if (s > 9) { const k = 3 / Math.sqrt(s); t[i] = k * a * m[i]; t[i + 1] = k * b * m[i]; }
 }
 let d = `M${p[0].x.toFixed(1)},${p[0].y.toFixed(1)}`;
 for (let i = 0; i < n - 1; i++) {
  const h = dx[i] / 3;
  d += `C${(p[i].x + h).toFixed(1)},${(p[i].y + t[i] * h).toFixed(1)} ${(p[i + 1].x - h).toFixed(1)},${(p[i + 1].y - t[i + 1] * h).toFixed(1)} ${p[i + 1].x.toFixed(1)},${p[i + 1].y.toFixed(1)}`;
 }
 return d;
}

/** Escala "bonita": 3 a 5 marcas, passo 1, 2, 2,5, 5 ou 10 (× potência de 10). */
export function niceScale(min: number, max: number): { lo: number; hi: number; ticks: number[] } {
 if (!(max > min)) { const c = max || 1; min = c - Math.max(1, Math.abs(c) * 0.05); max = c + Math.max(1, Math.abs(c) * 0.05); }
 const raw = (max - min) / 4, pow = 10 ** Math.floor(Math.log10(raw)), f = raw / pow;
 const step = (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * pow;
 const lo = Math.floor(min / step + 1e-9) * step, hi = Math.ceil(max / step - 1e-9) * step;
 const ticks: number[] = []; for (let v = lo; v <= hi + step / 1e3; v += step) ticks.push(Math.round(v * 1000) / 1000);
 return { lo, hi, ticks };
}

const H = 176, PT = 12, PB = 30, PL = 60, PR = 12;

export function LineChart({ points, unit, domain, label }: { points: ChartPoint[]; unit: string; domain?: [number, number]; label: string }) {
 const [ref, width] = useWidth(300);
 const uid = useId().replace(/:/g, '');
 const vals = points.map(p => p.value).filter((v): v is number => v !== null);
 const scale = domain ? { lo: domain[0], hi: domain[1], ticks: [domain[0], (domain[0] + domain[1]) / 2, domain[1]] } : vals.length ? niceScale(Math.min(...vals), Math.max(...vals)) : niceScale(0, 1);
 const plotW = Math.max(40, width - PL - PR), plotH = H - PT - PB, n = points.length;
 const inset = n > 1 ? 8 : 0;
 const x = (i: number) => PL + (n > 1 ? inset + (i * (plotW - inset * 2)) / (n - 1) : plotW / 2);
 const y = (v: number) => PT + plotH - ((v - scale.lo) / (scale.hi - scale.lo)) * plotH;
 const pts: Pt[] = points.flatMap((p, i) => (p.value === null ? [] : [{ x: x(i), y: y(p.value) }]));
 const line = pts.length >= 3 ? monotonePath(pts) : pts.length === 2 ? `M${pts[0].x},${pts[0].y}L${pts[1].x},${pts[1].y}` : '';
 const area = line && pts.length >= 3 ? `${line}L${pts[pts.length - 1].x},${PT + plotH}L${pts[0].x},${PT + plotH}Z` : '';
 const last = pts[pts.length - 1];
 return <div ref={ref} className="ev-chart" role="img" aria-label={label}>
  <svg width={width} height={H} viewBox={`0 0 ${width} ${H}`} aria-hidden="true" focusable="false">
   <defs><linearGradient id={`g${uid}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="var(--primary)" stopOpacity=".10" /><stop offset="1" stopColor="var(--primary)" stopOpacity=".02" /></linearGradient></defs>
   {scale.ticks.map(t => <g key={t}>
    <line className="ev-grid" x1={PL} x2={width - PR} y1={y(t)} y2={y(t)} />
    <text className="ev-axis" x={PL - 8} y={y(t)} textAnchor="end" dominantBaseline="middle">{`${formatNumber(t, 1)}${unit === '%' ? '%' : ` ${unit}`}`}</text>
   </g>)}
   <line className="ev-grid ev-axis-line" x1={PL} x2={PL} y1={PT} y2={PT + plotH} />
   {area ? <path className="ev-area" d={area} fill={`url(#g${uid})`} /> : null}
   {line ? <path className="ev-line" d={line} pathLength={1} /> : null}
   {points.map((p, i) => p.value === null ? null : <circle key={i} className="ev-dot" cx={x(i)} cy={y(p.value)} r={2.5} />)}
   {last ? <circle className="ev-dot-last" cx={last.x} cy={last.y} r={4} /> : null}
   {points.map((p, i) => <text key={i} className={`ev-axis${n > 9 ? " ev-axis-sm" : ""}`} x={x(i)} y={H - 8} textAnchor="middle">{p.label}</text>)}
  </svg>
 </div>;
}

/** Mini linha com área para o cartão de peso: sem eixos, só a forma da tendência. */
export function MiniLine({ values, label }: { values: Array<number | null>; label: string }) {
 const [ref, width] = useWidth(140);
 const uid = useId().replace(/:/g, '');
 // Só os registros existentes, igualmente espaçados e com margem nas bordas (antes, semanas vazias empurravam a linha para um canto).
 const h = 56, pad = 8;
 const vs = values.filter((v): v is number => v !== null);
 const min = Math.min(...vs), max = Math.max(...vs), span = max - min || 1;
 const n = vs.length;
 const pts: Pt[] = vs.map((v, i) => ({ x: n > 1 ? pad + (i * Math.max(10, width - pad * 2)) / (n - 1) : width / 2, y: max === min ? h / 2 : pad + (h - pad * 2) - ((v - min) / span) * (h - pad * 2) }));
 const line = pts.length >= 3 ? monotonePath(pts) : pts.length === 2 ? `M${pts[0].x},${pts[0].y}L${pts[1].x},${pts[1].y}` : '';
 const area = pts.length >= 3 ? `${line}L${pts[pts.length - 1].x},${h}L${pts[0].x},${h}Z` : '';
 return <div ref={ref} className="ev-mini" role="img" aria-label={label}>
  <svg width={width} height={h} viewBox={`0 0 ${width} ${h}`} aria-hidden="true" focusable="false">
   <defs><linearGradient id={`m${uid}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="var(--primary)" stopOpacity=".10" /><stop offset="1" stopColor="var(--primary)" stopOpacity=".03" /></linearGradient></defs>
   {n === 1 ? <line className="ev-grid" x1={pad} x2={width - pad} y1={h / 2} y2={h / 2} strokeDasharray="3 4" /> : null}
   {area ? <path d={area} fill={`url(#m${uid})`} /> : null}
   {line ? <path className="ev-line thin" d={line} pathLength={1} /> : null}
   {pts.length < 3 ? pts.map((p, i) => <circle key={i} className="ev-dot" cx={p.x} cy={p.y} r={3.5} />) : null}
  </svg>
 </div>;
}

/** Barras de constância: trilho = previsto, preenchimento = feito. */
export function Bars({ weeks, label }: { weeks: Array<{ label: string; done: number; planned: number; future: boolean }>; label: string }) {
 const max = Math.max(1, ...weeks.map(w => w.planned));
 return <div className="ev-bars" role="img" aria-label={label} style={{ ['--cols' as string]: weeks.length }}>
  {weeks.map((w, i) => <div key={i} className="ev-bar-col">
   <div className="ev-bar-slot"><div className={`ev-bar-track${w.future ? ' future' : ''}`} style={{ height: `${w.future || w.planned === 0 ? 14 : Math.max(18, (w.planned / max) * 100)}%` }}>
    {w.done > 0 ? <div className="ev-bar-fill" style={{ height: `${(w.done / w.planned) * 100}%`, animationDelay: `${i * 25}ms` }} /> : null}
   </div></div>
   <span className="ev-axis-label">{w.label}</span>
  </div>)}
 </div>;
}
