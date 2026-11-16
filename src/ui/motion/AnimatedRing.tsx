import type { CSSProperties } from 'react';
import { CountUp } from './CountUp';
import '../../features/treino/progress-ring.css';

/**
 * Anel de progresso em SVG que preenche de 0 até o valor (700 ms, CSS puro), com ponta arredondada.
 * Mesmo markup e papel de acessibilidade do ProgressRing: o valor final está em aria-valuenow e no texto.
 */
export function AnimatedRing({ percent, label, size = 104, stroke = 11 }: { percent: number; label: string; size?: number; stroke?: number }) {
  const value = Math.min(100, Math.max(0, Math.round(percent)));
  const r = (size - stroke) / 2, c = 2 * Math.PI * r;
  return <div className="pr-ring mv-ring" style={{ width: size, height: size }} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={value} aria-label={label}>
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} aria-hidden="true" focusable="false">
      <circle className="ring-svg-track" cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} />
      {value > 0 ? <circle className="ring-svg-fill pr-fill" cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - value / 100)} style={{ '--mv-c': c } as CSSProperties} transform={`rotate(-90 ${size / 2} ${size / 2})`} /> : null}
    </svg>
    <span className="pr-value num"><CountUp value={value} suffix="%" duration={700} /></span>
  </div>;
}
