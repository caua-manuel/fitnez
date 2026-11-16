import { useCallback } from 'react';
import { hasFinePointer, prefersReducedMotion } from './format';

export const TILT_MAX_DEG = 4;
export const PARALLAX_MAX_PX = 6;
const INTERACTIVE = 'button,a,input,select,textarea,label,summary,[role=button],[role=switch]';

export type Tilt = { rotateX: number; rotateY: number; nx: number; ny: number };

/** Inclinação para um ponteiro em (x, y) sobre `rect`. nx e ny vão de -1 a 1; o ângulo máximo é `max` graus. Pura. */
export function tiltFor(x: number, y: number, rect: { left: number; top: number; width: number; height: number }, max = TILT_MAX_DEG): Tilt {
  const clamp = (n: number) => Math.min(1, Math.max(-1, n));
  const nx = rect.width > 0 ? clamp(((x - rect.left) / rect.width) * 2 - 1) : 0;
  const ny = rect.height > 0 ? clamp(((y - rect.top) / rect.height) * 2 - 1) : 0;
  return { rotateX: -ny * max || 0, rotateY: nx * max || 0, nx, ny };
}

/**
 * Inclinação 3D leve por ponteiro (perspective 800 px, até 4 graus) e variáveis de paralaxe (--par-x, --par-y, de -1 a 1).
 * Só com mouse ou caneta e (hover: hover) and (pointer: fine); nunca em toque nem com movimento reduzido.
 * Não inclina sobre controles (botões, links, campos), para o clique ficar estável. Restaura ao sair.
 * Uso: <section ref={useTilt()} className="mv-tilt">; elementos filhos com .mv-par acompanham a paralaxe.
 */
export function useTilt<T extends HTMLElement>() {
  return useCallback((el: T | null) => {
    if (!el) return;
    let frame = 0;
    let last: PointerEvent | null = null;
    const reset = () => {
      cancelAnimationFrame(frame); frame = 0; last = null;
      el.removeAttribute('data-tilting');
      el.style.setProperty('--tilt-x', '0deg'); el.style.setProperty('--tilt-y', '0deg');
      el.style.setProperty('--par-x', '0'); el.style.setProperty('--par-y', '0');
    };
    const apply = () => {
      frame = 0;
      const e = last; if (!e) return;
      const t = tiltFor(e.clientX, e.clientY, el.getBoundingClientRect());
      el.setAttribute('data-tilting', '');
      el.style.setProperty('--tilt-x', `${t.rotateX.toFixed(2)}deg`); el.style.setProperty('--tilt-y', `${t.rotateY.toFixed(2)}deg`);
      el.style.setProperty('--par-x', t.nx.toFixed(3)); el.style.setProperty('--par-y', t.ny.toFixed(3));
    };
    const move = (e: PointerEvent) => {
      if ((e.pointerType !== 'mouse' && e.pointerType !== 'pen') || !hasFinePointer() || prefersReducedMotion()) { if (el.hasAttribute('data-tilting')) reset(); return; }
      if (e.target instanceof Element && e.target.closest(INTERACTIVE)) { if (el.hasAttribute('data-tilting')) reset(); return; }
      last = e; if (!frame) frame = requestAnimationFrame(apply);
    };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerleave', reset);
    el.addEventListener('pointercancel', reset);
    return () => { el.removeEventListener('pointermove', move); el.removeEventListener('pointerleave', reset); el.removeEventListener('pointercancel', reset); cancelAnimationFrame(frame); };
  }, []);
}
