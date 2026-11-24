import { useState } from 'react';
import { Icon } from '../../ui/icons';
import { showToast } from '../../ui/UndoToast';
import { useInstall } from '../../pwa/install';

// InstalarApp já está na carga inicial (Perfil e Concluído o importam); reaproveitar a folha não acrescenta peso.
import { InstallSheet } from '../perfil/InstalarApp';

/** Botão secundário no fim do Início; some quando o app já está instalado (standalone). */
export function InstalarInicio() {
 const { mode, prompt } = useInstall();
 const [open, setOpen] = useState(false);
 if (mode === 'installed') return null;
 const click = async () => {
  if (mode !== 'prompt') { setOpen(true); return; }
  const result = await prompt();
  if (result === 'accepted') showToast('Instalando o app');
  else if (result === 'dismissed') showToast('Instalação cancelada. Você pode instalar depois, em Perfil');
  else setOpen(true);
 };
 return <>
  <button type="button" className="in-instalar" aria-haspopup={mode === 'prompt' ? undefined : 'dialog'} onClick={() => void click()}><Icon name="baixar" size={20} />Adicionar à tela de início</button>
  {open ? <InstallSheet mode={mode} onClose={() => setOpen(false)} /> : null}
 </>;
}
