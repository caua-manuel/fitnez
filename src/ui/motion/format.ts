/** Funções puras do movimento: formatação pt-BR, curva de suavização e consulta de movimento reduzido. */

export const MOTION_EASE = 'cubic-bezier(.2,.8,.2,1)';

const formatters = new Map<number, Intl.NumberFormat>();
/** Formata um número em pt-BR (vírgula decimal, ponto de milhar). */
export function formatNumber(value: number, decimals = 0): string {
  let f = formatters.get(decimals);
  if (!f) { f = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }); formatters.set(decimals, f); }
  return f.format(value);
}

/** Curva de saída suave (começa rápido, assenta devagar). t entre 0 e 1. */
export function easeOut(t: number): number {
  const x = Math.min(1, Math.max(0, t));
  return 1 - Math.pow(1 - x, 3);
}

/** Valor exibido no instante `elapsed` (ms) de uma contagem de `from` até `to` em `duration` ms. No fim devolve exatamente `to`. */
export function valueAt(from: number, to: number, elapsed: number, duration: number): number {
  if (duration <= 0 || elapsed >= duration) return to;
  return from + (to - from) * easeOut(elapsed / duration);
}

/** Texto completo mostrado por CountUp para um valor. */
export function countText(value: number, decimals = 0, prefix = '', suffix = ''): string {
  return `${prefix}${formatNumber(value, decimals)}${suffix}`;
}

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Ponteiro de mouse ou caneta com hover real; nunca verdadeiro em toque. */
export function hasFinePointer(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
}
