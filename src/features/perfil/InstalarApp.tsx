import { useState } from 'react';
import { Icon } from '../../ui/icons';
import { Sheet } from '../../ui/Sheet';
import { showToast } from '../../ui/UndoToast';
import { useInstall } from '../../pwa/install';
import type { InstallMode } from '../../pwa/install';

function IosSteps({ safari }: { safari: boolean }) {
 return <>
  {safari ? null : <p className="ia-aviso" role="note">Abra este endereço no Safari. Os outros navegadores do iPhone e do iPad não instalam o app.</p>}
  <ol className="ia-steps">
   <li><span className="ia-ico" aria-hidden="true"><Icon name="compartilhar" size={24} look="regular" /></span><span>Toque no botão <strong>Compartilhar</strong> (um quadrado com uma seta para cima), na barra do Safari.</span></li>
   <li><span className="ia-ico" aria-hidden="true"><Icon name="adicionar" size={24} look="regular" /></span><span>Role a lista para baixo até <strong>Adicionar à Tela de Início</strong>.</span></li>
   <li><span className="ia-ico" aria-hidden="true"><Icon name="marca" size={24} look="regular" /></span><span>Toque em <strong>Adicionar</strong>. O Fitnez passa a abrir pelo ícone, como um app.</span></li>
  </ol>
  {safari ? <p className="muted">É preciso estar no Safari.</p> : null}
 </>;
}

function InstallSheet({ mode, onClose }: { mode: InstallMode; onClose: () => void }) {
 const ios = mode === 'ios-safari' || mode === 'ios-other';
 return <Sheet title="Instalar na tela inicial" onClose={onClose} className="ia-sheet">
  {ios ? <IosSteps safari={mode === 'ios-safari'} />
   : <p>Use o menu do navegador e escolha <strong>Instalar app</strong> ou <strong>Adicionar à tela inicial</strong>.</p>}
  <div className="sheet-actions"><button type="button" className="button secondary" onClick={onClose}>Fechar</button></div>
 </Sheet>;
}

/** Botão discreto de instalação. `compact` é o atalho do Início: some quando o app já está instalado. */
export function InstalarApp({ compact = false }: { compact?: boolean }) {
 const { mode, prompt } = useInstall();
 const [open, setOpen] = useState(false);
 if (mode === 'installed') return compact ? null : <p className="ia-ok"><Icon name="marca" size={18} look="bold" />App instalado</p>;
 const click = async () => {
  if (mode !== 'prompt') { setOpen(true); return; }
  const result = await prompt();
  if (result === 'accepted') showToast('Instalando o app');
  else if (result === 'dismissed') showToast('Instalação cancelada. Você pode instalar depois, em Perfil');
  else setOpen(true);
 };
 return <>
  <button type="button" className={compact ? 'ia-link' : 'button secondary ia-btn'} aria-haspopup={mode === 'prompt' ? undefined : 'dialog'} onClick={() => void click()}><Icon name="baixar" size={20} />Instalar na tela inicial</button>
  {open ? <InstallSheet mode={mode} onClose={() => setOpen(false)} /> : null}
 </>;
}
