import { useId, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useRovingList } from './Menu';

export interface SelectOption<T extends string | number> { value: T; label: string }

/**
 * Seletor de uma opção (botão + role=listbox). Abre com clique, Enter, Espaço ou setas; o foco vai à opção selecionada.
 * Setas, Home e End movem; Enter ou Espaço escolhem; Escape e Tab fecham e devolvem o foco ao botão.
 * `trigger` recebe a opção atual e devolve o conteúdo visível do botão.
 */
export function Select<T extends string | number>({ label, value, options, onChange, trigger, className = '', buttonClassName = 'button secondary ui-select-btn' }: {
 label: string; value: T; options: ReadonlyArray<SelectOption<T>>; onChange: (v: T) => void;
 trigger?: (current: SelectOption<T> | undefined) => ReactNode; className?: string; buttonClassName?: string;
}) {
 const [open, setOpen] = useState(false);
 const id = useId();
 const box = useRef<HTMLDivElement>(null);
 const button = useRef<HTMLButtonElement>(null);
 const close = (restore: boolean) => { setOpen(false); if (restore) button.current?.focus(); };
 const { list, onKeyDown } = useRovingList(open, close, box, () => Math.max(0, options.findIndex(o => o.value === value)));
 const current = options.find(o => o.value === value);
 return <div className={`ui-menu-wrap ui-select ${className}`.trim()} ref={box}>
  <button type="button" ref={button} className={buttonClassName} aria-label={`${label}: ${current?.label ?? ''}`} aria-haspopup="listbox" aria-expanded={open} aria-controls={open ? id : undefined}
   onClick={() => setOpen(o => !o)} onKeyDown={e => { if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && !open) { e.preventDefault(); setOpen(true); } }}>
   {trigger ? trigger(current) : <span>{current?.label}</span>}
  </button>
  {open ? <div id={id} role="listbox" aria-label={label} ref={list} className="ui-menu" onKeyDown={onKeyDown}>
   {options.map(o => <div key={o.value} role="option" tabIndex={-1} aria-selected={o.value === value}
    onClick={() => { onChange(o.value); close(true); }}
    onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onChange(o.value); close(true); } }}>
    <span>{o.label}</span>{o.value === value ? <span aria-hidden="true">✓</span> : null}
   </div>)}
  </div> : null}
 </div>;
}
