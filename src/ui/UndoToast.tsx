import { useEffect, useRef, useSyncExternalStore } from 'react';

/** Padrão único de aviso temporário: 6 s, pausa com foco ou ponteiro, anúncio único em região persistente. */
export const TOAST_MS = 6000;
interface Item { id: number; message: string; undo?: () => void }
let current: Item | null = null;
let seq = 0;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach(l => l());
const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };

/** Mostra o aviso; com `undo`, aparece o botão "Desfazer". Um novo aviso substitui o anterior. */
export function showToast(message: string, undo?: () => void) { current = { id: ++seq, message, undo }; emit(); }
export function dismissToast() { if (current) { current = null; emit(); } }

function Toast({ item }: { item: Item }) {
 const left = useRef(TOAST_MS);
 const started = useRef(0);
 const timer = useRef<number | undefined>(undefined);
 const holds = useRef(0);
 const arm = () => { window.clearTimeout(timer.current); started.current = Date.now(); timer.current = window.setTimeout(dismissToast, left.current); };
 const hold = () => { if (holds.current++ > 0) return; window.clearTimeout(timer.current); left.current = Math.max(2000, left.current - (Date.now() - started.current)); };
 const release = () => { holds.current = Math.max(0, holds.current - 1); if (holds.current === 0) arm(); };
 useEffect(() => { arm(); return () => window.clearTimeout(timer.current); // eslint-disable-next-line react-hooks/exhaustive-deps
 }, []);
 return <div className="ui-toast" onMouseEnter={hold} onMouseLeave={release} onFocus={hold} onBlur={release}
  onKeyDown={e => { if (e.key === 'Escape') { e.stopPropagation(); dismissToast(); } }}>
  <p className="ui-toast-text" aria-hidden="true">{item.message}</p>
  {item.undo ? <button type="button" onClick={() => { const run = item.undo!; dismissToast(); run(); }}>Desfazer</button> : null}
 </div>;
}

/**
 * Monte UMA vez (em App). A região role=status existe sempre, com só o texto, para o leitor anunciar o aviso uma vez;
 * o botão Desfazer fica fora da região, alcançável por Tab.
 */
export function ToastHost() {
 const item = useSyncExternalStore(subscribe, () => current, () => null);
 return <div className="ui-toast-wrap">
  <div role="status" aria-live="polite" aria-atomic="true" className="visually-hidden">{item?.message ?? ''}</div>
  {item ? <Toast key={item.id} item={item} /> : null}
 </div>;
}
