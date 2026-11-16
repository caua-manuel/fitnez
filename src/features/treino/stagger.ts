import { useEffect, useRef } from 'react';
import type { CSSProperties } from 'react';
import { STAGGER_MS } from '../../ui/motion';

/** Telas cuja entrada em sequência já tocou nesta sessão: só a primeira visita anima. */
const seen = new Set<string>();
const MAX_STEPS = 6;
/** Depois deste tempo a entrada já terminou; novas renderizações (filtro, troca de aba interna) não repetem a animação. */
const SETTLE_MS = 900;

export type StaggerProps = { className?: string; style?: CSSProperties };

/**
 * Entrada em sequência aplicada no próprio elemento (li, section, div), sem criar um div a mais:
 * serve para listas, onde o Reveal de src/ui/motion quebraria a relação ul > li.
 * Usa a classe .mv-reveal (320 ms, 60 ms por posição, no máximo 6 passos); movimento reduzido desliga pela regra global.
 * Uso: const rv = useStagger('dieta'); <li {...rv(2, 'dt-meal')}>
 */
export function useStagger(screen: string) {
  const play = useRef(!seen.has(screen));
  useEffect(() => {
    seen.add(screen);
    const timer = window.setTimeout(() => { play.current = false; }, SETTLE_MS);
    return () => window.clearTimeout(timer);
  }, [screen]);
  return (i: number, className?: string): StaggerProps => {
    if (!play.current) return className ? { className } : {};
    const step = Math.min(Math.max(0, i), MAX_STEPS);
    return { className: className ? `${className} mv-reveal` : 'mv-reveal', style: step ? { animationDelay: `${step * STAGGER_MS}ms` } : undefined };
  };
}

/**
 * Diz se um estado acabou de passar a "ligado" enquanto o componente estava montado (para desenhar a marca só no toque,
 * nunca ao abrir a tela com o item já marcado). Fica verdadeiro enquanto o estado continuar ligado, então a classe
 * da animação não some no meio do desenho.
 */
export function useJustTurnedOn(on: boolean): boolean {
  const previous = useRef(on);
  const fresh = useRef(false);
  if (previous.current !== on) { fresh.current = on; previous.current = on; }
  return fresh.current;
}

/** Casas decimais (0 ou 1) com que `formatNumber(n, 1)` mostra o valor: a contagem termina no mesmo texto. */
export const decimals1 = (n: number) => (Math.round(n * 10) % 10 === 0 ? 0 : 1);
