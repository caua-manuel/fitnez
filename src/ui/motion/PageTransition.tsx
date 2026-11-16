import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { MOTION_EASE, prefersReducedMotion } from './format';

/**
 * Troca de tela: fade de 140 ms com deslocamento de 6 px, via Web Animations (sem remontar os filhos,
 * sem estilo residual, sem bloquear cliques nem o foco). Não anima na primeira montagem nem com movimento reduzido.
 */
export function PageTransition({ routeKey, children }: { routeKey: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    const el = ref.current;
    if (!el || typeof el.animate !== 'function' || prefersReducedMotion()) return;
    const animation = el.animate([{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 140, easing: MOTION_EASE });
    return () => animation.cancel();
  }, [routeKey]);
  return <div ref={ref}>{children}</div>;
}
