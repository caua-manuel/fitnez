import { useState } from 'react';
import { useData } from '../../app/DataProvider';
import { Icon } from '../../ui/icons';
import { isExampleTarget } from '../../domain/dietTargets';
import { MetasSheet } from './MetasSheet';
import { useMetasActions } from './metasActions';
import './metas.css';

/** Selo "Meta de exemplo" com as ações, ou só o atalho "Ajustar metas" depois que a meta foi confirmada ou editada. */
export function MetaDieta() {
 const { state, busy } = useData();
 const actions = useMetasActions();
 const [open, setOpen] = useState(false);
 if (!state) return null;
 const disabled = state.settings.onboarding?.dietTargetsDisabled === true;
 const example = disabled || isExampleTarget(state.settings);
 return <>
  {example ? <section className="dt-meta" aria-label="Metas de dieta">
   <div className="dt-meta-head">
    <span className="dt-meta-selo"><Icon name="info" size={16} />Meta de exemplo</span>
    <span className="visually-hidden">Ainda não foi confirmada.</span>
   </div>
   <p className="dt-meta-nota">{disabled ? 'Pelas respostas do seu plano, o app não calcula metas para você. Estes são valores de exemplo; procure um nutricionista para definir as suas.' : 'Valores de exemplo do plano. Ajuste para o seu caso.'}</p>
   <div className="dt-meta-acoes">
    <button type="button" className="dt-meta-link" aria-haspopup="dialog" onClick={() => setOpen(true)}>Ajustar metas</button>
    {disabled ? null : <button type="button" className="dt-meta-link" disabled={busy} onClick={() => void actions.confirmExample()}>Usar esta meta</button>}
   </div>
  </section> : <div className="dt-meta-solo"><button type="button" className="dt-meta-link" aria-haspopup="dialog" onClick={() => setOpen(true)}>Ajustar metas</button></div>}
  {open ? <MetasSheet onClose={() => setOpen(false)} /> : null}
 </>;
}
