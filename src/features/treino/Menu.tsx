import { useEffect, useRef, useState } from 'react';
import { Icon } from '../../ui/icons';
import './editor.css';

export interface MenuItem { label: string; href?: string; onClick?: () => void; danger?: boolean }

/** Menu ⋮ (tela-4 e tela-6): abre abaixo do botão, fecha com Escape ou toque fora e devolve o foco ao botão. */
export function MenuMais({ label, items, className = '' }: { label: string; items: MenuItem[]; className?: string }) {
 const [open, setOpen] = useState(false);
 const box = useRef<HTMLDivElement>(null);
 const button = useRef<HTMLButtonElement>(null);
 useEffect(() => {
  if (!open) return;
  const away = (e: PointerEvent) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false); };
  document.addEventListener('pointerdown', away);
  return () => document.removeEventListener('pointerdown', away);
 }, [open]);
 const menuId = `menu-${label.replace(/\W+/g, '-')}`;
 return <div className={`ed-menu-wrap ${className}`} ref={box} onKeyDown={e => { if (e.key === 'Escape' && open) { setOpen(false); button.current?.focus(); } }}>
  <button type="button" ref={button} className="icon-button" aria-label={label} aria-expanded={open} aria-haspopup="true" aria-controls={open ? menuId : undefined} onClick={() => setOpen(o => !o)}><Icon name="mais" size={24} weight={2.4} /></button>
  {open ? <div className="tr-menu tr-pop ed-pop" id={menuId}>
   {items.map(it => it.href
    ? <a key={it.label} href={it.href}>{it.label}</a>
    : <button key={it.label} type="button" className={it.danger ? 'danger' : undefined} onClick={() => { setOpen(false); button.current?.focus(); it.onClick?.(); }}>{it.label}</button>)}
  </div> : null}
 </div>;
}
