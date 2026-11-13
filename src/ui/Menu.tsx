import { useEffect, useId, useRef, useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';

export interface MenuItem { label: string; href?: string; onClick?: () => void; danger?: boolean }

/** Gestão de foco compartilhada entre Menu e Select: itens com tabindex -1 (foco por script). */
export function useRovingList(open: boolean, onClose: (restore: boolean) => void, boxRef: React.RefObject<HTMLElement | null>, startAt: () => number) {
 const list = useRef<HTMLDivElement>(null);
 const items = () => Array.from(list.current?.querySelectorAll<HTMLElement>('[role=menuitem],[role=option]') ?? []);
 useEffect(() => { if (open) items()[startAt()]?.focus(); // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [open]);
 useEffect(() => {
  if (!open) return;
  const away = (e: PointerEvent) => { if (boxRef.current && !boxRef.current.contains(e.target as Node)) onClose(false); };
  document.addEventListener('pointerdown', away);
  return () => document.removeEventListener('pointerdown', away);
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [open]);
 const onKeyDown = (e: KeyboardEvent) => {
  const all = items(); const at = all.indexOf(document.activeElement as HTMLElement);
  const go = (i: number) => { e.preventDefault(); all[(i + all.length) % all.length]?.focus(); };
  if (e.key === 'ArrowDown') go(at + 1);
  else if (e.key === 'ArrowUp') go(at < 0 ? all.length - 1 : at - 1);
  else if (e.key === 'Home') go(0);
  else if (e.key === 'End') go(all.length - 1);
  else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); onClose(true); }
  else if (e.key === 'Tab') onClose(true);
 };
 return { list, onKeyDown };
}

/**
 * Menu de ações (botão + role=menu). Abre com clique, Enter, Espaço ou seta para baixo; o foco vai ao primeiro item.
 * `trigger` é o conteúdo visível do botão (ícone ou texto); `label` é o nome acessível.
 */
export function Menu({ label, trigger, items, className = '', buttonClassName = 'icon-button', align = 'right' }: { label: string; trigger: ReactNode; items: MenuItem[]; className?: string; buttonClassName?: string; align?: 'left' | 'right' }) {
 const [open, setOpen] = useState(false);
 const id = useId();
 const box = useRef<HTMLDivElement>(null);
 const button = useRef<HTMLButtonElement>(null);
 const close = (restore: boolean) => { setOpen(false); if (restore) button.current?.focus(); };
 const { list, onKeyDown } = useRovingList(open, close, box, () => 0);
 return <div className={`ui-menu-wrap ${className}`.trim()} ref={box}>
  <button type="button" ref={button} className={buttonClassName} aria-label={label} aria-haspopup="menu" aria-expanded={open} aria-controls={open ? id : undefined}
   onClick={() => setOpen(o => !o)} onKeyDown={e => { if (e.key === 'ArrowDown' && !open) { e.preventDefault(); setOpen(true); } }}>{trigger}</button>
  {open ? <div id={id} role="menu" aria-label={label} ref={list} className={`ui-menu${align === 'left' ? ' ui-menu-left' : ''}`} onKeyDown={onKeyDown}>
   {items.map(it => it.href
    ? <a key={it.label} role="menuitem" tabIndex={-1} href={it.href} className={it.danger ? 'is-danger' : undefined} onClick={() => setOpen(false)}>{it.label}</a>
    : <button key={it.label} type="button" role="menuitem" tabIndex={-1} className={it.danger ? 'is-danger' : undefined} onClick={() => { close(true); it.onClick?.(); }}>{it.label}</button>)}
  </div> : null}
 </div>;
}
