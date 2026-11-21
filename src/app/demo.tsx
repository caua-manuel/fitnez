import { useState } from 'react';
import { appMode, clearDemoMark, modeKey, setDemoMark } from './mode';
import { createDemoRepository, deleteDemoDatabase } from '../data/demo';
import { localDayOf } from '../domain/planStart';
import type { Repository, StateV3 } from '../application/repository';
import { Icon } from '../ui/icons';
import { ConfirmSheet } from '../ui/Sheet';

// Modo demonstração (ADR 011, 1.1): entrar, sair e a faixa fixa. Textos: docs/handoffs/ux-primeira-abertura.md.
// O gerador (src/demo/) só entra por import() daqui, para ficar fora da carga inicial.

export const isDemo = (): boolean => appMode() === 'demo';

/** Recarrega na tela inicial (sem rota de execução nem folha aberta). */
function reloadHome() { window.location.hash = '#inicio'; window.location.reload(); }

/**
 * Entrar: gera a demo, grava no banco da demo e só então grava a marca e recarrega.
 * Se qualquer passo falhar, a marca não é gravada e o app segue no modo real (o erro sobe para a tela).
 */
export async function enterDemo(now: number = Date.now()): Promise<void> {
 const { demoState } = await import('../demo/generate');
 await deleteDemoDatabase(); // começa limpa, mesmo depois de uma saída interrompida
 const repo = createDemoRepository();
 try {
  const init = await repo.initialize();
  await repo.save({ state: demoState(localDayOf(now), init.state), expectedRevision: init.state.revision });
 } finally { repo.close(); }
 setDemoMark();
 reloadHome();
}

/** Sair: apaga a marca primeiro (uma saída interrompida cai no real), fecha o repositório, apaga o banco da demo e recarrega. */
export async function exitDemo(repository?: Repository): Promise<void> {
 clearDemoMark();
 repository?.close();
 try { await deleteDemoDatabase(); } catch { /* o modo real apaga de novo na próxima abertura */ }
 reloadHome();
}

/**
 * A demo aberta é válida? Só com a assinatura `meta.demo === true` gravada pelo gerador (achado M1 de seguranca-adr-011.md).
 * Sem ela (marca adulterada, saída interrompida, banco despejado), a abertura volta ao modo real.
 */
export function isValidDemoState(state: StateV3): boolean {
 return state.meta?.demo === true;
}

/** Outra aba entrou ou saiu da demo: esta recarrega para não misturar os modos. */
export function listenModeChanges(): void {
 window.addEventListener('storage', e => { if (e.key === modeKey()) window.location.reload(); });
}

/** Botão "Ver com dados de exemplo" com a linha de apoio, o carregando e o erro (assistente e Início vazio). */
export function DemoEntry({ question = false, className = '' }: { question?: boolean; className?: string }) {
 const [state, setState] = useState<'idle' | 'busy' | 'error'>('idle');
 const go = async () => {
  setState('busy');
  try { await enterDemo(); } catch { setState('error'); }
 };
 return <div className={`demo-entry ${className}`.trim()}>
  {question ? <p className="demo-entry-q"><strong>Só quer conhecer o app?</strong></p> : null}
  {state === 'busy' ? <p className="demo-entry-busy" role="status">Preparando os dados de exemplo…</p>
   : <button type="button" className="demo-entry-btn" aria-describedby="demo-entry-apoio" onClick={() => void go()}><Icon name="play" size={20} />Ver com dados de exemplo</button>}
  <p id="demo-entry-apoio" className="muted demo-entry-apoio">Mostra o app depois de 4 semanas de uso, com dados inventados. Seus dados não mudam.</p>
  {state === 'error' ? <p className="in-error" role="alert">Não foi possível abrir a demonstração. Seus dados não mudaram. Tente de novo.</p> : null}
 </div>;
}

/** Folha de confirmação de "Sair da demonstração". */
export function ExitDemoSheet({ repository, onCancel }: { repository?: Repository; onCancel: () => void }) {
 return <ConfirmSheet title="Sair da demonstração?" destructive={false} icon="voltar" confirmLabel="Sair" cancelLabel="Continuar vendo" onCancel={onCancel} onConfirm={() => void exitDemo(repository)}>
  <p>Os dados de exemplo somem. Seus dados reais continuam como estavam.</p>
 </ConfirmSheet>;
}

/** Faixa fixa no topo de todas as telas da demo. */
export function DemoBanner({ repository }: { repository?: Repository }) {
 const [open, setOpen] = useState(false);
 return <div className="demo-bar" role="region" aria-label="Modo demonstração">
  <p className="demo-bar-t"><Icon name="info" size={20} />Dados de exemplo</p>
  <button type="button" className="demo-bar-btn" aria-haspopup="dialog" onClick={() => setOpen(true)}>Sair da demonstração</button>
  {open ? <ExitDemoSheet repository={repository} onCancel={() => setOpen(false)} /> : null}
 </div>;
}
