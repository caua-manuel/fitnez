import { useEffect, useRef, useState } from 'react';
import { useData } from '../../app/DataProvider';
import { eraseAllData } from '../../application/eraseAll';
import { Icon } from '../../ui/icons';
import { Sheet } from '../../ui/Sheet';

type Step = 'fechado' | 'explicar' | 'confirmar' | 'avisos';

/** Recarrega do zero: o estado só de React (cronômetro, rascunhos, tela atual) não passa pelo repositório. */
function reiniciar() { window.location.hash = ''; window.location.reload(); }

/**
 * Área de risco do Perfil: apagar tudo em duas etapas. Etapa 1 explica o que sai e oferece o backup;
 * etapa 2 pede a confirmação final. A regra de apagar mora em src/application/eraseAll.ts.
 */
export function ApagarDados({ onDownloadBackup }: { onDownloadBackup: () => Promise<boolean> }) {
 const { state, busy, run, error } = useData();
 const [step, setStep] = useState<Step>('fechado');
 const [backupDone, setBackupDone] = useState(false);
 const [warnings, setWarnings] = useState<string[]>([]);
 const actions = useRef<HTMLDivElement>(null);
 useEffect(() => {
  if (step === 'confirmar') actions.current?.querySelector<HTMLElement>('[data-cancel]')?.focus({ preventScroll: true });
 }, [step]);
 if (!state) return null;

 const close = () => { if (!busy) setStep('fechado'); };
 const backup = async () => { if (await onDownloadBackup()) setBackupDone(true); };
 const erase = async () => {
  const result = await run(() => eraseAllData({ expectedRevision: state.revision }), 'Todos os dados foram apagados');
  if (!result) return;
  if (result.storageWarnings.length) { setWarnings(result.storageWarnings); setStep('avisos'); return; }
  reiniciar();
 };

 return <section className="perfil-risco" aria-labelledby="perfil-risco-t">
  <h2 id="perfil-risco-t">Zona de risco</h2>
  <p>Apague tudo o que está salvo neste aparelho e comece do zero.</p>
  <button type="button" className="perfil-apagar" aria-haspopup="dialog" disabled={busy} onClick={() => { setBackupDone(false); setStep('explicar'); }}><Icon name="lixeira" size={20} />Apagar todos os meus dados</button>

  {step !== 'fechado' ? <Sheet title={step === 'explicar' ? 'Apagar todos os meus dados?' : step === 'confirmar' ? 'Apagar tudo agora?' : 'Dados apagados'} onClose={step === 'avisos' ? reiniciar : close} initialFocus={step === 'explicar' ? '[data-primeiro]' : undefined}>
   <div className="sheet-body perfil-apagar-corpo">
    {step === 'explicar' ? <>
     <p>Isto apaga, neste aparelho:</p>
     <ul className="perfil-apagar-lista">
      <li>treinos e registros</li>
      <li>dieta e refeições</li>
      <li>medidas</li>
      <li>perfil</li>
      <li>configurações</li>
     </ul>
     <p>O cache do app não é afetado, então ele continua abrindo offline.</p>
     <p><strong>Não há como desfazer.</strong> Se quiser guardar seus dados, baixe um backup antes.</p>
     {backupDone ? <p className="muted" role="status">Backup baixado. Guarde o arquivo fora deste aparelho.</p> : null}
    </> : null}
    {step === 'confirmar' ? <>
     <p>Tudo será apagado agora e o app volta ao estado de primeira abertura. Esta ação não tem volta.</p>
     {error ? <p className="in-error" role="alert">{error}</p> : null}
    </> : null}
    {step === 'avisos' ? <>
     <p>Seus dados foram apagados, mas algo não pôde ser limpo por completo:</p>
     <ul className="perfil-apagar-lista">{warnings.map(w => <li key={w}>{w}</li>)}</ul>
     <p className="muted">Recarregue o app para começar do zero.</p>
    </> : null}
   </div>
   <div className="sheet-actions stack" ref={actions}>
    {step === 'explicar' ? <>
     <button type="button" className="button secondary" data-primeiro disabled={busy} onClick={() => void backup()}><Icon name="salvar" size={20} />Baixar backup antes</button>
     <button type="button" className="button secondary" disabled={busy} onClick={() => setStep('confirmar')}>Continuar</button>
     <button type="button" className="button secondary" onClick={close}>Cancelar</button>
    </> : null}
    {step === 'confirmar' ? <>
     <button type="button" className="button secondary" data-cancel disabled={busy} onClick={close}>Cancelar</button>
     <button type="button" className="button destructive" data-destructive="" disabled={busy} onClick={() => void erase()}><Icon name="lixeira" size={20} />Apagar tudo</button>
    </> : null}
    {step === 'avisos' ? <button type="button" className="button" onClick={reiniciar}>Recarregar o app</button> : null}
   </div>
  </Sheet> : null}
 </section>;
}
