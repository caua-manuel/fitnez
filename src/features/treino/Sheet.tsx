import { useEffect, useRef } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';

const FOCUSABLE = 'input,select,textarea,button,a[href]';

/** Folha de rodapé: foco contido, Escape fecha e o foco volta a quem abriu (ou ao elemento marcado com data-focus-fallback). */
export function Sheet({ title, onClose, children, initialFocus, id = 'ed-sheet' }: { title: string; onClose: () => void; children: ReactNode; initialFocus?: string; id?: string }) {
 const ref = useRef<HTMLDivElement>(null);
 useEffect(() => {
  const origin = document.activeElement as HTMLElement | null;
  const root = ref.current;
  (root?.querySelector<HTMLElement>(initialFocus ?? '') ?? root?.querySelector<HTMLElement>(FOCUSABLE))?.focus();
  return () => {
   if (origin?.isConnected) origin.focus();
   else document.querySelector<HTMLElement>('[data-focus-fallback]')?.focus();
  };
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
  <div className="sheet ed-sheet" role="dialog" aria-modal="true" aria-labelledby={`${id}-title`} ref={ref} onKeyDown={onKey}>
   <h2 className="ed-sheet-title" id={`${id}-title`}>{title}</h2>
   {children}
  </div>
 </>;
}

export function ConfirmDialog({ title, children, confirmLabel, cancelLabel = 'Cancelar', tone = 'destructive', onConfirm, onCancel }: { title: string; children: ReactNode; confirmLabel: string; cancelLabel?: string; tone?: 'destructive' | 'neutral'; onConfirm: () => void; onCancel: () => void }) {
 return <Sheet title={title} onClose={onCancel} initialFocus="[data-cancel]" id="ed-confirm">
  <div className="ed-confirm-text">{children}</div>
  <div className="ed-actions">
   <button type="button" className="button secondary" data-cancel onClick={onCancel}>{cancelLabel}</button>
   <button type="button" className={tone === 'destructive' ? 'button destructive' : 'button'} onClick={onConfirm}>{confirmLabel}</button>
  </div>
 </Sheet>;
}
