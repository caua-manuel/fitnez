import { useLayoutEffect, useRef } from 'react';
import { countText, prefersReducedMotion, valueAt } from './format';

type Props = { value: number; decimals?: number; prefix?: string; suffix?: string; duration?: number; className?: string };

/**
 * Número que conta de 0 (ou do valor anterior) até `value`, formatado em pt-BR.
 * O texto final está sempre no DOM: o React renderiza o valor final e a animação só reescreve o nó de texto
 * durante a contagem, terminando no mesmo texto. Sem aria-live; movimento reduzido mostra o valor final direto.
 */
export function CountUp({ value, decimals = 0, prefix = '', suffix = '', duration = 350, className }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const previous = useRef<number | null>(null);
  const final = countText(value, decimals, prefix, suffix);
  useLayoutEffect(() => {
    const node = ref.current?.firstChild;
    const from = previous.current ?? 0;
    previous.current = value;
    if (!node) return;
    node.nodeValue = final;
    if (from === value || prefersReducedMotion()) return;
    const start = performance.now();
    let frame = 0;
    const paint = (t: number) => {
      const elapsed = t - start;
      node.nodeValue = elapsed >= duration ? final : countText(valueAt(from, value, elapsed, duration), decimals, prefix, suffix);
      if (elapsed < duration) frame = requestAnimationFrame(paint);
    };
    node.nodeValue = countText(from, decimals, prefix, suffix);
    frame = requestAnimationFrame(paint);
    // Em aba em segundo plano o quadro pode não vir: garante o texto final.
    const safety = window.setTimeout(() => { node.nodeValue = final; }, duration + 120);
    return () => { cancelAnimationFrame(frame); window.clearTimeout(safety); };
  }, [value, decimals, prefix, suffix, duration, final]);
  return <span ref={ref} className={className ? `num ${className}` : 'num'}>{final}</span>;
}
