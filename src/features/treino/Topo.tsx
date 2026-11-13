import type { ReactNode } from 'react';
import { Icon } from '../../ui/icons';
import './editor.css';

/** Barra de topo das telas de edição: voltar à esquerda e título centralizado (tela-5, nº 10). */
export function Topo({ title, back, backLabel, children }: { title: string; back: string; backLabel: string; children?: ReactNode }) {
 return <div className="ed-top">
  <a className="icon-button ed-back" href={back} aria-label={backLabel}><Icon name="voltar" size={24} /></a>
  <h2 className="ed-title">{title}</h2>
  {children ?? <span aria-hidden="true" />}
 </div>;
}

export const VALE_DEPOIS = 'As mudanças valem a partir do próximo treino. Treinos que você já fez não mudam.';

export function focusFirstInvalid() {
 requestAnimationFrame(() => document.querySelector<HTMLElement>('main [aria-invalid=true]')?.focus());
}
