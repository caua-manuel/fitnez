import { useEffect, useRef, useSyncExternalStore } from 'react';

/** Aviso fixo acima da barra inferior. Com `undo`, mostra "Desfazer" por 8 s; sem, só informa por 4 s. */
interface Item { id: number; message: string; undo?: () => void }
let current: Item | null = null;
let seq = 0;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach(l => l());
export const UNDO_MS = 8000;

export function announce(message: string, undo?: () => void) { current = { id: ++seq, message, undo }; emit(); }
export function dismissToast() { if (current) { current = null; emit(); } }
const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };

function Toast({ item }: { item: Item }) {
 const left = useRef(item.undo ? UNDO_MS : 4000);
 const started = useRef(Date.now());
 const timer = useRef<number | undefined>(undefined);
 const arm = () => { window.clearTimeout(timer.current); started.current = Date.now(); timer.current = window.setTimeout(dismissToast, left.current); };
 const pause = () => { if (timer.current === undefined) return; window.clearTimeout(timer.current); timer.current = undefined; left.current = Math.max(1000, left.current - (Date.now() - started.current)); };
 useEffect(() => { arm(); return () => window.clearTimeout(timer.current); // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [item.id]);
 return <div className="ed-toast" onMouseEnter={pause} onMouseLeave={arm} onFocus={pause} onBlur={arm} onTouchStart={pause} onTouchEnd={arm}>
  <span className="ed-toast-text">{item.message}</span>
  {item.undo ? <button type="button" className="ed-toast-undo" onClick={() => { const run = item.undo!; dismissToast(); run(); }}>Desfazer</button> : null}
 </div>;
}

/** Fica montado na aba Treino; a região de status existe sempre, para o leitor de tela anunciar o texto novo. */
export function UndoHost() {
 const item = useSyncExternalStore(subscribe, () => current, () => null);
 useEffect(() => () => dismissToast(), []);
 return <div className="ed-toast-wrap" role="status" aria-live="polite">{item ? <Toast key={item.id} item={item} /> : null}</div>;
}
