import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent, ReactNode } from 'react';
import type { ImportPreview } from '../../application/repository';
import { useData } from '../../app/DataProvider';
import { hrefFor } from '../../app/router';
import { Card, formatInstant } from '../../ui/components';
import { Icon } from '../../ui/icons';
import type { IconName } from '../../ui/icons';
import { shouldShowBackupReminder } from '../../domain/userData';
import { phaseOf, weekLabel } from '../../domain/calendar';
import { enableNotifications, notifySupport } from '../../pwa/notifications';
import type { NotifySupport } from '../../pwa/notifications';

import { planConsistency } from '../../domain/evolution';
import { diaLocal, refeicoesRegistradas, treinosConcluidos } from './metricas';
import './perfil.css';

const persistenceLabels = { granted:'Concedido', denied:'Não concedido pelo navegador', unavailable:'Não disponível neste navegador', error:'Não foi possível consultar', 'not-requested':'Ainda não concedido' };
const themes = [['auto', 'Automático'], ['light', 'Claro'], ['dark', 'Escuro']] as const;
const NO_FILE = 'Nenhum arquivo selecionado';
const NUMBER = new Intl.NumberFormat('pt-BR');

function initials(name: string): string {
 const parts = name.split(/\s+/).filter(Boolean);
 if (!parts.length) return '';
 const first = parts[0].charAt(0); const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : '';
 return (first + last).toLocaleUpperCase('pt-BR');
}

function Disclosure({ id, icon, title, subtitle, open, onToggle, children }: { id: string; icon: IconName; title: string; subtitle: string; open: boolean; onToggle: () => void; children: ReactNode }) {
 return <section className="card perfil-sec">
  <button type="button" className="perfil-sec-head" aria-expanded={open} aria-controls={`${id}-corpo`} id={`${id}-cabeca`} onClick={onToggle}>
   <span className="icon-tile soft sm"><Icon name={icon} size={22} /></span>
   <span className="grow"><strong>{title}</strong><small>{subtitle}</small></span>
   <Icon name="seta" size={22} className={open ? 'perfil-turn open' : 'perfil-turn'} />
  </button>
  {open ? <div className="perfil-sec-body" id={`${id}-corpo`} role="region" aria-labelledby={`${id}-cabeca`}>{children}</div> : null}
 </section>;
}

export function Perfil({ now = Date.now }: { now?: () => number }) {
 const { repository, state, initialization, protection, busy, run, requestPersistence, commit } = useData();
 const [preview, setPreview] = useState<ImportPreview | null>(null);
 const [source, setSource] = useState('');
 const [filename, setFilename] = useState(NO_FILE);
 const [editing, setEditing] = useState<null | 'name' | 'goal'>(null);
 const [nameDraft, setNameDraft] = useState('');
 const [goalDraft, setGoalDraft] = useState('');
 const [dataOpen, setDataOpen] = useState(false);
 const [backupOpen, setBackupOpen] = useState(false);
 const [notify, setNotify] = useState<NotifySupport>(() => notifySupport());
 const [notifyNote, setNotifyNote] = useState('');
 const [notifyBusy, setNotifyBusy] = useState(false);
 const [importError, setImportError] = useState('');
 const [saved, setSaved] = useState(false);
 const importErrorRef = useRef<HTMLDivElement>(null);
 const previewHeading = useRef<HTMLHeadingElement>(null);
 const fileInput = useRef<HTMLInputElement>(null);
 const nameInput = useRef<HTMLInputElement>(null);
 const goalInput = useRef<HTMLInputElement>(null);
 const conflict = initialization?.status === 'migration-conflict';
 useEffect(() => { if (preview) previewHeading.current?.focus(); }, [preview]);
 useEffect(() => { if (importError) { importErrorRef.current?.scrollIntoView({ block: 'center' }); importErrorRef.current?.focus({ preventScroll: true }); } }, [importError]);
 useEffect(() => { if (!saved) return; const t = window.setTimeout(() => setSaved(false), 4000); return () => window.clearTimeout(t); }, [saved]);
 useEffect(() => { if (editing === 'name') nameInput.current?.focus(); if (editing === 'goal') goalInput.current?.focus(); }, [editing]);
 useEffect(() => { if (conflict) setBackupOpen(true); }, [conflict]);
 if (!state) return null;
 const locked = busy || conflict;
 const profile = state.settings.profile;
 const name = (profile?.name ?? '').trim();
 const goal = (profile?.goal ?? '').trim();
 const today = diaLocal(now());
 const phase = phaseOf(state.settings.start, today);
 const days = state.history.days;
 const feitos = treinosConcluidos(days);
 const refeicoes = refeicoesRegistradas(days);
 // Mesma fonte da Evolução (src/domain/evolution.ts): previsto = atividades da rotina até hoje; hoje só conta se já feito.
 const taxa = planConsistency(days, state.settings.sched, state.settings.start, today).pct;
 const pct = phase.kind === 'week' ? Math.round(phase.progress * 100) : phase.kind === 'done' ? 100 : 0;
 const planText = phase.kind === 'week' ? weekLabel(phase.week) : phase.kind === 'done' ? 'Plano concluído' : `Começa em ${phase.daysUntil} ${phase.daysUntil === 1 ? 'dia' : 'dias'}`;
 const enabled = state.settings.notifications?.enabled === true && notify === 'granted';
 const notifyState = notify === 'unsupported' ? 'Indisponível neste aparelho' : notify === 'denied' ? 'Bloqueadas no navegador' : enabled ? 'Ativadas' : 'Desativadas';

 function openEditor(target: 'name' | 'goal') { setNameDraft(name); setGoalDraft(goal); setEditing(target); }
 async function saveProfile(event: FormEvent) {
  event.preventDefault();
  const nextName = nameDraft.trim(); const nextGoal = goalDraft.trim();
  const ok = await commit(s => { s.settings.profile = { ...s.settings.profile, name: nextName, goal: nextGoal }; return s; });
  if (ok) { setEditing(null); setSaved(true); }
 }
 function setTheme(value: 'auto' | 'light' | 'dark') { void commit(s => { s.settings.theme = value; return s; }); }
 async function toggleNotifications() {
  if (notifyBusy) return;
  setNotifyBusy(true); setNotifyNote('');
  try {
   if (enabled) { await commit(s => { s.settings.notifications = { restEnd: s.settings.notifications?.restEnd ?? true, enabled: false }; return s; }); return; }
   const result = await enableNotifications();
   setNotify(result);
   if (result === 'granted') { await commit(s => { s.settings.notifications = { restEnd: true, enabled: true }; return s; }); return; }
   setNotifyNote(result === 'denied' ? 'As notificações estão bloqueadas neste navegador. Libere nas configurações do site e tente de novo.'
    : result === 'unsupported' ? 'Este navegador não oferece notificações aqui. No iPhone, instale o app na tela inicial para ativá-las.'
    : 'A permissão não foi concedida. Toque no interruptor para tentar de novo.');
  } finally { setNotifyBusy(false); }
 }
 async function exportBackup(copy: boolean) {
  await run(async () => {
   if (copy && !navigator.clipboard?.writeText) throw new Error('A cópia não está disponível neste endereço. Use Baixar backup.');
   const backup = await repository.export();
   if (copy) {
    try { await navigator.clipboard.writeText(backup.text); } catch { throw new Error('Não foi possível copiar. Use Baixar backup para guardar o arquivo.'); }
   } else {
    const url = URL.createObjectURL(new Blob([backup.text], { type: 'application/json;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = backup.filename; document.body.append(link); link.click(); link.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 30000);
   }
  }, copy ? 'Backup copiado. Guarde a cópia fora deste aparelho e confirme abaixo.' : 'Arquivo de backup gerado. Confira se você o guardou e confirme abaixo.');
 }
 async function selectFile(event: ChangeEvent<HTMLInputElement>) {
  const file = event.target.files?.[0]; setPreview(null); setImportError(''); setFilename(file?.name ?? NO_FILE); if (!file) return;
  // O erro de arquivo inválido aparece junto ao campo (não no aviso global do topo da página).
  const prepared = await run(async () => {
   if (file.size > 10 * 1024 * 1024) { setImportError('Este arquivo tem mais de 10 MiB. Escolha um backup menor. Seus dados atuais continuam intactos.'); return undefined; }
   try { return await repository.prepareImport(await file.text()); }
   catch { setImportError('Este arquivo não é um backup do Fitnez ou está corrompido. Seus dados atuais continuam intactos.'); return undefined; }
  });
  if (prepared) setPreview(prepared);
 }
 function clearFile(focus: boolean) { setPreview(null); setImportError(''); setFilename(NO_FILE); if (fileInput.current) { fileInput.current.value = ''; if (focus) fileInput.current.focus(); } }

 return <div className="perfil">
  {shouldShowBackupReminder(state, protection?.backupDue) ? <aside className="reminder perfil-lembrete"><strong>Guarde uma cópia dos seus dados</strong><p>Seu backup semanal está pendente. Guarde o arquivo fora deste aparelho e confirme a cópia.</p><button type="button" className="link-button" onClick={() => { setBackupOpen(true); window.setTimeout(() => document.getElementById('backup-cabeca')?.scrollIntoView({ block: 'start' }), 0); }}>Fazer backup</button></aside> : null}
  {conflict ? <Card title="Escolher origem dos dados"><p>Encontramos duas fontes diferentes do protótipo. Escolha qual histórico será usado. As duas fontes originais serão preservadas para recuperação.</p><fieldset disabled={busy}><legend>Histórico a usar</legend>{initialization.sources.map(s => <label className="source-choice" key={s.id}><input type="radio" name="migration-source" value={s.id} checked={source === s.id} onChange={() => setSource(s.id)} /><span><strong>{s.label}</strong><small>Versão {s.version} · {s.days} dias · {s.measurements} datas com medidas</small></span></label>)}</fieldset><button disabled={busy || !source} onClick={() => void run(() => repository.selectMigration({ sourceId: source, expectedRevision: state.revision }), 'Origem escolhida. Seus dados foram migrados e os originais preservados.')}>Confirmar origem escolhida</button><p className="muted">Tema, importação e confirmação de backup ficam bloqueados até essa escolha.</p></Card> : null}

  <header className="perfil-head">
   <div className="perfil-avatar-wrap">
    <div className="perfil-avatar" aria-hidden="true">{name ? initials(name) : <Icon name="perfil" size={44} weight={1.8} />}</div>
    <button type="button" className="perfil-avatar-edit" aria-label="Editar nome" onClick={() => openEditor('name')}><Icon name="editar" size={16} weight={2.2} /></button>
   </div>
   <div className="perfil-id">
    <p className={name ? 'perfil-name' : 'perfil-name vazio'}>{name || 'Seu nome'}</p>
    <p className="perfil-plan">Plano de 12 semanas</p>
    <button type="button" className="perfil-pill" aria-expanded={editing !== null} onClick={() => openEditor('name')}><Icon name="editar" size={18} />Editar perfil</button>
   </div>
  </header>
  <p className="perfil-salvo" role="status">{saved ? <><Icon name="marca" size={16} />Salvo</> : null}</p>

  {editing ? <form className="card perfil-edit" onSubmit={e => void saveProfile(e)}>
   <label htmlFor="perfil-nome">Seu nome</label>
   <input id="perfil-nome" ref={nameInput} type="text" maxLength={40} autoComplete="given-name" placeholder="Seu nome" value={nameDraft} onChange={e => setNameDraft(e.target.value)} />
   <label htmlFor="perfil-objetivo">Seu objetivo</label>
   <input id="perfil-objetivo" ref={goalInput} type="text" maxLength={80} placeholder="Defina seu objetivo" value={goalDraft} onChange={e => setGoalDraft(e.target.value)} />
   <div className="actions"><button type="submit" className="button">Salvar</button><button type="button" className="button secondary" onClick={() => setEditing(null)}>Cancelar</button></div>
  </form> : null}

  <dl className="card perfil-stats" aria-label="Seus números">
   <div className="perfil-stat"><Icon name="treino" size={30} /><div><dd className="stat">{feitos ? NUMBER.format(feitos) : '—'}</dd><dt>Treinos<span className="visually-hidden"> concluídos</span></dt></div></div>
   <div className="perfil-stat"><Icon name="garfo" size={30} /><div><dd className="stat">{refeicoes ? NUMBER.format(refeicoes) : '—'}</dd><dt>Refeições<span className="visually-hidden"> registradas</span></dt></div></div>
   <div className="perfil-stat"><Icon name="evolucao" size={30} /><div><dd className="stat">{taxa === null ? '—' : `${taxa}%`}</dd><dt>Constância</dt></div></div>
  </dl>

  <ul className="list perfil-list">
   <li><button type="button" className="list-row perfil-link" onClick={() => openEditor('goal')}>
    <span className="icon-tile soft"><Icon name="alvo" size={26} /></span>
    <span className="grow"><strong>Meu objetivo</strong><small className={goal ? undefined : 'perfil-vazio'}>{goal || 'Defina seu objetivo'}</small></span>
    <Icon name="seta" size={22} />
   </button></li>
   <li><a className="list-row perfil-link perfil-plano" href={hrefFor({ tab: 'treino', view: 'lista' })}>
    <span className="icon-tile soft"><Icon name="calendario" size={26} /></span>
    <span className="grow"><strong>Meu plano</strong><small>{planText}</small>
     <span className="perfil-progress"><span className="bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label={`Progresso do plano: ${pct}%`}><span style={{ width: `${pct}%` }} /></span><span className="perfil-pct">{pct}%</span></span>
    </span>
    <Icon name="seta" size={22} />
   </a></li>
  </ul>

  <h2 className="perfil-h2">Preferências</h2>
  <div className="list perfil-list">
   <fieldset className="list-row perfil-theme" disabled={locked}>
    <legend className="visually-hidden">Tema do aplicativo</legend>
    <span className="icon-tile soft sm"><Icon name={state.settings.theme === 'light' ? 'sol' : 'lua'} size={22} /></span>
    <span className="grow"><strong>Tema do aplicativo</strong><small>Escolha o formato de exibição</small></span>
    <div className="segmented perfil-seg">{themes.map(([value, label]) => <button type="button" key={value} aria-pressed={state.settings.theme === value} onClick={() => setTheme(value)}>{value === 'light' ? <Icon name="sol" size={18} /> : value === 'dark' ? <Icon name="lua" size={18} /> : null}{label}</button>)}</div>
   </fieldset>

   <div className="list-row perfil-notify">
    <span className="icon-tile soft sm"><Icon name="sino" size={22} /></span>
    <span className="grow"><strong id="notif-rotulo">Notificações</strong><small>{notifyState}</small></span>
    <button type="button" role="switch" className="switch" aria-checked={enabled} aria-labelledby="notif-rotulo" disabled={notifyBusy || notify === 'unsupported' || notify === 'denied'} onClick={() => void toggleNotifications()} />
    <p className="perfil-help">Avisos de fim de descanso. No iPhone, instale o app na tela inicial. Lembretes com o app fechado exigem um serviço de envio, que ainda não está ativo.</p>
    {notifyNote ? <p className="perfil-help perfil-aviso" role="status">{notifyNote}</p> : null}
   </div>

   <Disclosure id="dados" icon="info" title="Dados neste aparelho" subtitle="Armazenamento, instalação e uso offline" open={dataOpen} onToggle={() => setDataOpen(o => !o)}>
    <dl className="facts"><div><dt>Armazenamento persistente</dt><dd>{protection ? persistenceLabels[protection.persistence] : 'Consultando…'}</dd></div>{protection?.usage !== undefined ? <div><dt>Espaço estimado em uso</dt><dd>{new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(protection.usage / 1048576)} MB{protection.quota !== undefined ? ` de ${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(protection.quota / 1048576)} MB` : ''}</dd></div> : null}</dl>
    <button className="button secondary" disabled={busy} onClick={() => void requestPersistence()}>Pedir armazenamento persistente</button>
    {protection?.message ? <p className="warning">{protection.message}</p> : null}
    <p className="muted">A limpeza do navegador ou a perda do aparelho pode apagar seus dados. A persistência não substitui um backup externo.</p>
    <h3>Instalar e usar offline</h3>
    <p>Para acesso rápido, use “Adicionar à Tela de Início” no menu do navegador. O acesso offline estará pronto quando o aviso no topo indicar “Disponível offline”.</p>
    <p className="muted">Cada navegador e aparelho guarda seus próprios dados. Para mudar de endereço ou aparelho, exporte e importe o backup. Não há login nem sincronização.</p>
   </Disclosure>

   <Disclosure id="backup" icon="nuvem" title="Backup e restauração" subtitle="Salve e restaure seus dados" open={backupOpen} onToggle={() => setBackupOpen(o => !o)}>
    <h3>Backup dos seus dados</h3>
    <p>Baixe ou copie o backup completo, incluindo o histórico e os originais preservados. Ele contém dados pessoais de saúde: guarde em um local de sua confiança.</p>
    <div className="actions"><button className="button" disabled={busy} onClick={() => void exportBackup(false)}>Baixar backup</button><button className="button secondary" disabled={busy} onClick={() => void exportBackup(true)}>Copiar backup</button></div>
    <dl className="facts backup-dates"><div><dt>Última geração</dt><dd>{formatInstant(protection?.lastBackupGeneratedAt)}</dd></div><div><dt>Cópia confirmada</dt><dd>{formatInstant(protection?.lastBackupConfirmedAt)}</dd></div></dl>
    <p className="muted">Gerar ou copiar o arquivo não confirma que ele foi guardado. Confirme somente depois de conferir sua cópia.</p>
    <button className="button secondary" disabled={locked || !protection?.lastBackupGeneratedAt} onClick={() => void run(() => repository.confirmBackup({ expectedRevision: state.revision }), 'Cópia confirmada. O lembrete reaparecerá em sete dias.')}>Já guardei a cópia</button>

    <h3 className="perfil-sub">Importar backup</h3>
    <p>Escolha um backup JSON do protótipo ou desta versão. Você verá um resumo antes de substituir qualquer dado.</p>
    <p id="file-help">Arquivo de backup JSON (até 10 MiB)</p>
    <div className="file-picker"><label className="button secondary" htmlFor="backup-file">Escolher arquivo JSON</label><input className="visually-hidden" ref={fileInput} id="backup-file" type="file" aria-describedby="file-help file-name" accept=".json,application/json" disabled={locked} onChange={e => void selectFile(e)} /><span id="file-name" className="muted">{filename}</span></div>
    {importError ? <div ref={importErrorRef} className="perfil-import-erro" role="alert" tabIndex={-1}><p>{importError}</p><button type="button" className="button secondary" onClick={() => { clearFile(false); fileInput.current?.click(); }}>Escolher outro arquivo</button></div> : null}
    {preview ? <section className="import-preview" aria-labelledby="preview-title"><h3 ref={previewHeading} id="preview-title" tabIndex={-1}>Prévia da importação</h3><p>Backup versão {preview.sourceVersion}</p><dl className="facts"><div><dt>Dias com dados</dt><dd>{preview.summary.days}</dd></div><div><dt>Datas com medidas</dt><dd>{preview.summary.measurements}</dd></div><div><dt>Exercícios</dt><dd>{preview.summary.exercises}</dd></div><div><dt>Treinos</dt><dd>{preview.summary.sessions}</dd></div></dl>{preview.warnings.map((w, i) => <p className="muted" key={i}>{w}</p>)}<p className="warning"><strong>Os dados atuais serão substituídos.</strong> Uma cópia de recuperação será preservada neste aparelho na mesma operação.</p><div className="actions"><button className="danger" disabled={locked} onClick={async () => { const result = await run(() => repository.confirmImport({ token: preview.token, expectedRevision: preview.expectedRevision }), 'Backup importado. Os dados anteriores estão preservados para recuperação.'); if (result) clearFile(false); }}>Confirmar importação</button><button className="button secondary" disabled={busy} onClick={() => clearFile(true)}>Cancelar</button></div></section> : null}
   </Disclosure>
  </div>
 </div>;
}
