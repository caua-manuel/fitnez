import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from './icons';
import type { IconName } from './icons';

export const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]):not([type=hidden]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
const RISKY = '.destructive,.danger,[data-destructive]';

const stack: symbol[] = [];
let lockCount = 0;
let previousOverflow = '';

function visible(el: HTMLElement) { return !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length); }
export function focusables(root: HTMLElement | null): HTMLElement[] {
 return root ? Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(visible) : [];
}

function lockScroll() {
 if (lockCount++ === 0) { previousOverflow = document.documentElement.style.overflow; document.documentElement.style.overflow = 'hidden'; }
 return () => { if (--lockCount === 0) document.documentElement.style.overflow = previousOverflow; };
}

/** Deixa inertes (inert + aria-hidden) todos os irmãos do portal no body; devolve a função que restaura. */
function isolate(host: HTMLElement) {
 const touched: Array<{ el: Element; inert: boolean; hidden: string | null }> = [];
 for (const el of Array.from(document.body.children)) {
  if (el === host || el.tagName === 'SCRIPT') continue;
  touched.push({ el, inert: el.hasAttribute('inert'), hidden: el.getAttribute('aria-hidden') });
  el.setAttribute('inert', ''); el.setAttribute('aria-hidden', 'true');
 }
 return () => touched.forEach(({ el, inert, hidden }) => {
  if (!inert) el.removeAttribute('inert');
  if (hidden === null) el.removeAttribute('aria-hidden'); else el.setAttribute('aria-hidden', hidden);
 });
}

export interface SheetProps {
 title: string;
 onClose: () => void;
 children: ReactNode;
 /** Seletor CSS (dentro da folha) do elemento que recebe o foco ao abrir. Padrão: primeiro foco seguro (não destrutivo). */
 initialFocus?: string;
 className?: string;
}

/**
 * Folha de rodapé modal. Renderizada em portal no body: o restante do app fica inert, a rolagem do corpo é travada,
 * o foco é preso, Escape e o fundo escurecido fecham, e o foco volta ao elemento de origem.
 */
export function Sheet({ title, onClose, children, initialFocus, className = '' }: SheetProps) {
 const id = useId();
 const ref = useRef<HTMLDivElement>(null);
 const closeRef = useRef(onClose);
 closeRef.current = onClose;
 const [host] = useState(() => document.createElement('div'));
 const [origin] = useState(() => document.activeElement as HTMLElement | null);
 useLayoutEffect(() => {
  document.body.appendChild(host);
  const restore = isolate(host);
  const unlock = lockScroll();
  const me = Symbol('sheet'); stack.push(me);
  const root = ref.current;
  const target = (initialFocus ? root?.querySelector<HTMLElement>(initialFocus) : null)
   ?? focusables(root).find(el => !el.matches(RISKY)) ?? root;
  target?.focus({ preventScroll: true });
  const key = (e: KeyboardEvent) => {
   if (stack[stack.length - 1] !== me) return;
   if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); closeRef.current(); return; }
   if (e.key !== 'Tab') return;
   const items = focusables(ref.current);
   if (!items.length) { e.preventDefault(); ref.current?.focus(); return; }
   const first = items[0]!, last = items[items.length - 1]!, active = document.activeElement;
   if (!ref.current?.contains(active)) { e.preventDefault(); first.focus(); }
   else if (e.shiftKey && (active === first || active === ref.current)) { e.preventDefault(); last.focus(); }
   else if (!e.shiftKey && active === last) { e.preventDefault(); first.focus(); }
  };
  const focusin = (e: FocusEvent) => { if (stack[stack.length - 1] === me && !host.contains(e.target as Node)) (focusables(ref.current)[0] ?? ref.current)?.focus(); };
  document.addEventListener('keydown', key, true); document.addEventListener('focusin', focusin);
  return () => {
   document.removeEventListener('keydown', key, true); document.removeEventListener('focusin', focusin);
   stack.splice(stack.indexOf(me), 1);
   restore(); unlock(); host.remove();
   if (origin?.isConnected) origin.focus();
   else (document.querySelector<HTMLElement>('[data-focus-fallback]') ?? document.getElementById('conteudo'))?.focus();
  };
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, []);
 useEffect(() => { ref.current?.scrollTo?.(0, 0); }, []);
 return createPortal(<>
  <div className="sheet-backdrop" onClick={() => closeRef.current()} />
  <div className={`sheet ${className}`.trim()} role="dialog" aria-modal="true" aria-labelledby={`${id}-title`} tabIndex={-1} ref={ref}>
   <h2 className="sheet-title" id={`${id}-title`}>{title}</h2>
   {children}
  </div>
 </>, host);
}

/** Confirmação: foco inicial em "Cancelar", ação destrutiva marcada. */
export function ConfirmSheet({ title, children, confirmLabel, cancelLabel = 'Cancelar', destructive = true, icon, onConfirm, onCancel }: { icon?: IconName; title: string; children: ReactNode; confirmLabel: string; cancelLabel?: string; destructive?: boolean; onConfirm: () => void; onCancel: () => void }) {
 return <Sheet title={title} onClose={onCancel} initialFocus="[data-cancel]">
  <div className="sheet-body">{children}</div>
  <div className="sheet-actions">
   <button type="button" className="button secondary" data-cancel onClick={onCancel}>{cancelLabel}</button>
   <button type="button" className={destructive ? 'button destructive' : 'button'} data-destructive={destructive ? '' : undefined} onClick={onConfirm}>{icon || destructive ? <Icon name={icon ?? 'lixeira'} size={20} /> : null}{confirmLabel}</button>
  </div>
 </Sheet>;
}
