import { Component, useEffect, useRef, useState } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { eraseAllData } from '../application/eraseAll';
import './recovery.css';
import { asError, open, request } from '../data/idb';

/**
 * Rede de proteção da raiz: nenhum erro de renderização deixa a tela em branco.
 * Independe do contexto de dados e de qualquer componente do app: lê o IndexedDB direto
 * e traz o próprio CSS (funciona mesmo que styles.css não tenha carregado o tema).
 * O erro vai só para o console; nada é enviado a lugar algum.
 */

export interface RawBackup { text: string; filename: string; revision: unknown }

const dbName = () => `treino12:${encodeURIComponent(import.meta.env.BASE_URL)}`;

/** Lê o estado e as cópias de recuperação sem validar nada (o estado pode estar malformado). */
export async function readRawState(factory: IDBFactory | null | undefined = globalThis.indexedDB, name = dbName()): Promise<{ state: Record<string, unknown> | undefined; recovery: Record<string, unknown> }> {
 const connection = await open(factory, name);
 try {
  const tx = connection.transaction(['state', 'recovery'], 'readonly');
  const [state, keys, values] = await Promise.all([request<Record<string, unknown> | undefined>(tx.objectStore('state').get('active')), request(tx.objectStore('recovery').getAllKeys()), request(tx.objectStore('recovery').getAll())]);
  const recovery: Record<string, unknown> = {};
  keys.forEach((k, i) => { recovery[String(k)] = values[i]; });
  return { state, recovery };
 } finally { connection.close(); }
}

/** Monta o arquivo de backup cru. Mesmo envelope do backup normal; o estado vai como está guardado. */
export async function buildRawBackup(now = Date.now(), factory?: IDBFactory | null, name?: string): Promise<RawBackup> {
 const { state, recovery } = await readRawState(factory, name);
 if (!state) throw new Error('vazio');
 const full = { ...state, recovery: { ...(typeof state.recovery === 'object' && state.recovery ? state.recovery as Record<string, unknown> : {}), ...recovery } };
 const text = JSON.stringify({ v: 3, app: 'treino12', exportedAt: now, state: full });
 return { text, filename: `treino12-backup-recuperacao-${new Date(now).toISOString().slice(0, 10)}.json`, revision: state.revision };
}

function download(file: RawBackup) {
 const url = URL.createObjectURL(new Blob([file.text], { type: 'application/json;charset=utf-8' }));
 const link = document.createElement('a'); link.href = url; link.download = file.filename; document.body.append(link); link.click(); link.remove();
 window.setTimeout(() => URL.revokeObjectURL(url), 30000);
}


function Recovery({ onRetry }: { onRetry: () => void }) {
 const title = useRef<HTMLHeadingElement>(null);
 const [confirm, setConfirm] = useState(false);
 const [busy, setBusy] = useState(false);
 const [note, setNote] = useState<{ kind: 'status' | 'alert'; text: string } | null>(null);
 useEffect(() => { title.current?.focus(); }, []);

 async function backup() {
  setBusy(true); setNote(null);
  try { download(await buildRawBackup()); setNote({ kind: 'status', text: 'Backup baixado. Guarde o arquivo em um lugar seguro.' }); }
  catch (e) {
   console.error('Fitnez: não foi possível ler os dados para o backup.', e instanceof Error ? e.name : '');
   setNote({ kind: 'alert', text: 'Não foi possível ler seus dados para gerar o backup. Eles não foram apagados. Tente de novo ou feche outras abas do Fitnez.' });
  } finally { setBusy(false); }
 }
 async function erase() {
  setBusy(true); setNote(null);
  try {
   const { state } = await readRawState();
   await eraseAllData({ expectedRevision: state?.revision as number });
   window.location.hash = ''; window.location.reload();
  } catch (e) {
   console.error('Fitnez: não foi possível apagar os dados.', e instanceof Error ? e.name : '');
   setNote({ kind: 'alert', text: `${asError(e).message} Nada foi apagado por completo.` }); setBusy(false);
  }
 }

 return <div className="rec" role="alert" aria-live="assertive"><div className="rec-in">
  <h1 ref={title} tabIndex={-1}>O Fitnez encontrou um problema ao abrir seus dados</h1>
  <p className="rec-lead">Seus dados continuam guardados neste aparelho. Nada foi apagado.</p>
  <p>Tente abrir de novo. Se o problema continuar, baixe um backup antes de qualquer outra coisa.</p>
  <div className="rec-acts">
   <button type="button" className="rec-main" disabled={busy} onClick={onRetry}>Tentar de novo</button>
   <button type="button" disabled={busy} onClick={() => void backup()}>Baixar backup dos meus dados</button>
  </div>
  {note ? <p role={note.kind} style={{ marginTop: 16 }}>{note.text}</p> : null}
  {!confirm ? <div className="rec-acts" style={{ marginTop: 10 }}><button type="button" className="rec-danger" disabled={busy} onClick={() => setConfirm(true)}>Apagar tudo e recomeçar</button></div> : <div className="rec-conf">
   <p className="rec-lead"><strong>Isto apaga todos os seus dados deste aparelho e não tem volta.</strong> Se ainda não baixou o backup, faça isso antes.</p>
   <div className="rec-acts" style={{ marginTop: 12 }}>
    <button type="button" disabled={busy} onClick={() => setConfirm(false)}>Cancelar</button>
    <button type="button" className="rec-danger" disabled={busy} onClick={() => void erase()}>Sim, apagar tudo</button>
   </div>
  </div>}
 </div></div>;
}

export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
 state = { failed: false };
 static getDerivedStateFromError() { return { failed: true }; }
 componentDidCatch(error: unknown, info: ErrorInfo) {
  // Só console, sem dados pessoais: nome do erro e pilha de componentes.
  console.error('Fitnez: erro de renderização.', error instanceof Error ? error.name : typeof error, info.componentStack);
 }
 render() { return this.state.failed ? <Recovery onRetry={() => window.location.reload()} /> : this.props.children; }
}
