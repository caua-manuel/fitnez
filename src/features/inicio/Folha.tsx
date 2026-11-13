import { useEffect, useId, useRef } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';

const FOCUSABLE = 'input,select,textarea,button,a[href],[tabindex]:not([tabindex="-1"])';

/**
 * Folha de rodapé (bottom sheet) de Início e Evolução: role=dialog, foco inicial, foco preso, Escape e toque no fundo fecham,
 * o foco volta a quem abriu. Usa as classes .sheet e .sheet-backdrop do design system (ficam acima da barra inferior e rolam).
 */
export function Folha({ title, onClose, children, initialFocus }: { title: string; onClose: () => void; children: ReactNode; initialFocus?: string }) {
 const ref = useRef<HTMLDivElement>(null);
 const titleId = useId();
 useEffect(() => {
  const origin = document.activeElement as HTMLElement | null;
  const root = ref.current;
  (root?.querySelector<HTMLElement>(initialFocus ?? ':not(*)') ?? root?.querySelector<HTMLElement>(FOCUSABLE))?.focus();
  return () => { if (origin?.isConnected) origin.focus(); };
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, []);
 const onKey = (e: KeyboardEvent) => {
  if (e.key === 'Escape') { e.stopPropagation(); onClose(); return; }
  if (e.key !== 'Tab') return;
  const items = Array.from(ref.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []).filter(el => !el.hasAttribute('disabled'));
  if (!items.length) return;
  const first = items[0], last = items[items.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
 };
 return <>
  <div className="sheet-backdrop" onClick={onClose} />
  <div className="sheet folha" role="dialog" aria-modal="true" aria-labelledby={titleId} ref={ref} onKeyDown={onKey}>
   <h2 className="folha-title" id={titleId}>{title}</h2>
   {children}
  </div>
 </>;
}
