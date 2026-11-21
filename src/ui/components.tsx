import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useData } from '../app/DataProvider';
import { showToast } from './UndoToast';
import { downloadText } from './download';
export function Card({ title, children, className = '' }: { title: string; children: ReactNode; className?: string }) {
 return <section className={`card ${className}`}><h2>{title}</h2>{children}</section>;
}
export function Foundation({ children }: { children: ReactNode }) { return <p className="foundation">{children}</p>; }
/**
 * Lembrete de backup (ADR 011, 1.2; textos em docs/handoffs/ux-primeira-abertura.md). Rotina, não alerta:
 * "Fazer backup agora" gera e oferece o arquivo e pergunta se ele foi guardado; só "Sim, guardei" confirma.
 * "Agora não" adia até amanhã. As três ações gravam pelo repositório e o estado é relido em seguida (run).
 */
export function BackupReminder({ compact = false }: { compact?: boolean }) {
 const { repository, state, busy, run } = useData();
 const [step, setStep] = useState<'ask' | 'saving' | 'confirm'>('ask');
 const [failed, setFailed] = useState(false);
 const title = useRef<HTMLHeadingElement>(null);
 useEffect(() => { if (step === 'confirm') title.current?.focus(); }, [step]);
 if (!state) return null;
 const generate = async () => {
  setFailed(false); setStep('saving');
  const file = await run(() => repository.export());
  if (!file) { setFailed(true); setStep('ask'); return; }
  downloadText(file.text, file.filename, 'application/json');
  setStep('confirm');
 };
 const confirm = async () => {
  const ok = await run(async () => repository.confirmBackup({ expectedRevision: (await repository.read()).revision }));
  if (ok) showToast('Backup confirmado.');
 };
 const snooze = async () => {
  const ok = await run(async () => repository.snoozeBackup({ expectedRevision: (await repository.read()).revision }));
  if (ok) showToast('Lembramos de novo amanhã.');
 };
 const confirming = step === 'confirm';
 const acts = <div className="backup-card-acts">{confirming ? <>
   <button type="button" className={compact ? 'backup-link' : 'button secondary'} disabled={busy} onClick={() => void confirm()}>Sim, guardei</button>
   <button type="button" className={compact ? 'backup-link' : 'button secondary'} disabled={busy} onClick={() => setStep('ask')}>Ainda não</button>
  </> : <>
   <button type="button" className={compact ? 'backup-link' : 'button secondary'} disabled={busy || step === 'saving'} onClick={() => void generate()}>Fazer backup agora</button>
   <button type="button" className={compact ? 'backup-link' : 'button secondary'} disabled={busy || step === 'saving'} onClick={() => void snooze()}>Agora não</button>
  </>}</div>;
 // Início: uma linha discreta (o treino de hoje é o que importa na tela); Perfil: o cartão completo.
 if (compact) return <aside className="backup-line" aria-labelledby="backup-card-t">
  <p className="backup-line-t"><span className="backup-dot" aria-hidden="true" /><strong id="backup-card-t" ref={title as unknown as React.Ref<HTMLElement>} tabIndex={-1}>{confirming ? 'Guardou o arquivo?' : 'Backup pendente'}</strong>
   <span className="muted" role="status">{confirming ? 'Confirme só depois de guardar fora deste aparelho.' : step === 'saving' ? 'Preparando o arquivo…' : 'Seus dados estão só neste aparelho.'}</span></p>
  {failed ? <p className="in-error" role="alert">Não foi possível gerar o arquivo. Tente de novo ou use Perfil &gt; Backup.</p> : null}
  {acts}
 </aside>;
 return <aside className="card backup-card" aria-labelledby="backup-card-t">
  <h2 id="backup-card-t" ref={title} tabIndex={-1}>{confirming ? 'Guardou o arquivo?' : 'Guarde uma cópia dos seus dados'}</h2>
  <p role="status">{confirming ? 'Envie para seu e-mail, Drive ou WhatsApp. Confirme só depois de guardar fora deste aparelho.' : step === 'saving' ? 'Preparando o arquivo…' : 'Seus registros ficam só neste aparelho. Com uma cópia em arquivo, você não perde nada se o navegador limpar os dados.'}</p>
  {failed ? <p className="in-error" role="alert">Não foi possível gerar o arquivo. Tente de novo ou use Perfil &gt; Backup.</p> : null}
  {acts}
 </aside>;
}
export function Icon({ name }: { name: string }) {
 const paths: Record<string, ReactNode> = {
  hoje: <><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z"/><path d="M9 21v-8h6v8"/></>,
  calendario: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 11h18m-13 4h2m4 0h2m-8 3h2"/></>,
  treinos: <><path d="M3 8v8m4-11v14m10-14v14m4-11v8M7 12h10M3 12h4m10 0h4"/></>,
  dieta: <><path d="M5 3v7a3 3 0 0 0 6 0V3M8 3v18m11 0V3c-4 2-4 8 0 9"/></>,
  progresso: <><path d="M4 3v18h17M7 16l4-5 4 2 5-7"/></>,
  mais: <><path d="M4 6h16M4 12h16M4 18h16"/><circle cx="8" cy="6" r="2"/><circle cx="16" cy="12" r="2"/><circle cx="9" cy="18" r="2"/></>,
 };
 return <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name] ?? paths.mais}</svg>;
}
export function formatInstant(value: number | null | undefined) { return value == null ? 'Ainda não registrada' : new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(value); }
