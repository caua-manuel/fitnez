import type { CSSProperties } from 'react';
import { CountUp } from '../../ui/motion';
import './progress-ring.css';

// Anel de progresso em SVG: trilho + arco com ponta arredondada, começando no topo, sentido horário.
// `animate` preenche o arco de 0 até o valor e conta o número em 350 ms (uma vez, ao montar); o valor final fica sempre no DOM.
export function ProgressRing({ percent, label, size = 104, stroke = 11, animate = false }: { percent: number; label: string; size?: number; stroke?: number; animate?: boolean }) {
 const value = Math.min(100, Math.max(0, Math.round(percent)));
 const r = (size - stroke) / 2, c = 2 * Math.PI * r;
 return <div className={animate ? 'pr-ring pr-anim' : 'pr-ring'} style={{ width: size, height: size, '--pr-c': c } as CSSProperties} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={value} aria-label={label}>
  <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} aria-hidden="true" focusable="false">
   <circle className="ring-svg-track" cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} />
   {value > 0 ? <circle className="ring-svg-fill pr-fill" cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - value / 100)} transform={`rotate(-90 ${size / 2} ${size / 2})`} /> : null}
  </svg>
  <span className="pr-value num">{animate ? <CountUp value={value} suffix="%" duration={350} /> : `${value}%`}</span>
 </div>;
}
