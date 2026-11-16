import { Children, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';

/** Telas cuja entrada já foi animada nesta sessão: a entrada em cascata acontece só na primeira montagem. */
const seen = new Set<string>();
export const STAGGER_MS = 60;
const MAX_STEPS = 6;

function useFirstMount(screen: string | undefined): boolean {
  const play = useRef(screen === undefined ? true : !seen.has(screen));
  useEffect(() => { if (screen !== undefined) seen.add(screen); }, [screen]);
  return play.current;
}

/** Entrada de um bloco: opacidade 0 para 1 e deslocamento de 8 px para 0 (CSS puro; `i` define o atraso de 60 ms por posição). */
export function Reveal({ i = 0, screen, className, children }: { i?: number; screen?: string; className?: string; children: ReactNode }) {
  const play = useFirstMount(screen);
  if (!play) return <div className={className}>{children}</div>;
  const step = Math.min(i, MAX_STEPS);
  return <div className={className ? `mv-reveal ${className}` : 'mv-reveal'} style={step ? { animationDelay: `${step * STAGGER_MS}ms` } : undefined}>{children}</div>;
}

/** Envolve cada filho (ignorando vazios) em um Reveal com atraso crescente. */
export function Stagger({ screen, start = 0, className, children }: { screen?: string; start?: number; className?: string; children: ReactNode }) {
  return <>{Children.toArray(children).map((child, n) => <Reveal key={n} i={start + n} screen={screen} className={className}>{child}</Reveal>)}</>;
}
