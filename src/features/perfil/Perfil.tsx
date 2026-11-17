import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent, ReactNode } from 'react';
import type { ImportPreview } from '../../application/repository';
import { useData } from '../../app/DataProvider';
import { hrefFor } from '../../app/router';
import { Card, formatInstant } from '../../ui/components';
import { Icon } from '../../ui/icons';
import { showToast } from '../../ui/UndoToast';
import type { IconName } from '../../ui/icons';
import { shouldShowBackupReminder } from '../../domain/userData';
import { phaseOf, weekLabel } from '../../domain/calendar';
import { enableNotifications, notifySupport } from '../../pwa/notifications';
import type { NotifySupport } from '../../pwa/notifications';

import { planConsistency } from '../../domain/evolution';
import { validateProfile } from '../../domain/profile';
import { isExampleTarget, resolveDietTargets } from '../../domain/dietTargets';
import { MetasSheet } from '../dieta/MetasSheet';
import { diaLocal, refeicoesRegistradas, treinosConcluidos } from './metricas';
import { DataInicioSheet } from './DataInicioSheet';
import { ApagarDados } from './ApagarDados';
import { InstalarApp } from './InstalarApp';
import { CountUp } from '../../ui/motion';
import { catalogOf } from '../dieta/dietData';
import { csvFilename, exportDietCsv, exportLoadsCsv, exportMeasuresCsv } from '../../domain/csv';
import type { CsvKind } from '../../domain/csv';
import './perfil.css';

const persistenceLabels = { granted:'Concedido', denied:'Não concedido pelo navegador', unavailable:'Não disponível neste navegador', error:'Não foi possível consultar', 'not-requested':'Ainda não concedido' };
const themes = [['auto', 'Automático', 'Auto'], ['light', 'Claro', 'Claro'], ['dark', 'Escuro', 'Escuro']] as const;
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

/** Aviso curto sob as metas numéricas: os valores do plano são exemplos, não uma prescrição. */
const META_EXEMPLO = 'Metas de exemplo, para ajustar ao seu perfil.';

export function Perfil({ now = Date.now, offlineStatus = '' }: { now?: () => number; offlineStatus?: string }) {
 const { repository, state, initialization, protection, busy, run, requestPersistence, commit } = useData();
 const [preview, setPreview] = useState<ImportPreview | null>(null);
 const [source, setSource] = useState('');
 const [filename, setFilename] = useState(NO_FILE);
 const [editing, setEditing] = useState<null | 'name' | 'goal' | 'body'>(null);
 const [nameDraft, setNameDraft] = useState('');
 const [goalDraft, setGoalDraft] = useState('');
 const [ageDraft, setAgeDraft] = useState('');
 const [weightDraft, setWeightDraft] = useState('');
 const [heightDraft, setHeightDraft] = useState('');
 const [errors, setErrors] = useState<Record<string, string>>({});
 const [dataOpen, setDataOpen] = useState(false);
 const [startOpen, setStartOpen] = useState(false);
 const [metasOpen, setMetasOpen] = useState(false);
 const [backupOpen, setBackupOpen] = useState(false);
 const [notify, setNotify] = useState<NotifySupport>(() => notifySupport());
 const [notifyNote, setNotifyNote] = useState('');
 const [notifyBusy, setNotifyBusy] = useState(false);
 const [importError, setImportError] = useState('');
 const importErrorRef = useRef<HTMLDivElement>(null);
 const previewHeading = useRef<HTMLHeadingElement>(null);
 const fileInput = useRef<HTMLInputElement>(null);
 const nameInput = useRef<HTMLInputElement>(null);
 const goalInput = useRef<HTMLInputElement>(null);
 const ageInput = useRef<HTMLInputElement>(null);
 const conflict = initialization?.status === 'migration-conflict';
 useEffect(() => { if (preview) previewHeading.current?.focus(); }, [preview]);
 useEffect(() => { if (importError) { importErrorRef.current?.scrollIntoView({ block: 'center' }); importErrorRef.current?.focus({ preventScroll: true }); } }, [importError]);
 useEffect(() => { if (editing === 'name') nameInput.current?.focus(); if (editing === 'goal') goalInput.current?.focus(); if (editing === 'body') ageInput.current?.focus(); }, [editing]);
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
 const consist = planConsistency(days, state.settings.sched, state.settings.start, today);
 // Sem nenhum registro concluído mostra '—' (como Treinos e Refeições), em vez de 0%.
 const taxa = consist.pct !== null && (consist.done > 0 || feitos > 0 || refeicoes > 0) ? consist.pct : null;
 const hasWeight = typeof profile?.weightKg === 'number';
 const bodyParts = [profile?.age !== undefined ? `${profile.age} anos` : '', hasWeight ? `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(profile!.weightKg!)} kg` : '', profile?.heightCm !== undefined ? `${profile.heightCm} cm` : ''].filter(Boolean);
 const lastMeasure = (() => {
  let best: { date: string; kg: number } | null = null;
  for (const [date, m] of Object.entries(state.history.measurements ?? {})) {
   const raw = String((m as { p?: unknown } | null)?.p ?? '').trim().replace(',', '.');
   const kg = Number(raw);
   if (!raw || !Number.isFinite(kg) || kg < 30 || kg > 300) continue;
   if (!best || date > best.date) best = { date, kg };
  }
  return best;
 })();
 const kgFmt = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });
 const useMeasured = async () => {
  if (!lastMeasure) return;
  const previous = profile?.weightKg;
  const kg = lastMeasure.kg;
  const ok = await commit(s => { s.settings.profile = { ...(s.settings.profile ?? { name: '', goal: '' }), weightKg: kg }; return s; });
  if (ok) showToast(`Peso do perfil: ${kgFmt.format(kg)} kg`, () => void commit(s => {
   const p = { ...(s.settings.profile ?? { name: '', goal: '' }) };
   if (previous === undefined) delete p.weightKg; else p.weightKg = previous;
   s.settings.profile = p; return s;
  }));
 };
 const metas = resolveDietTargets(state.settings, today);
 const exampleTargets = isExampleTarget(state.settings);
 // Sem metas salvas o texto é o de sempre: só aparece com peso. Manual aparece sempre.
 const proteinText = !metas.proteinAuto ? `Meta de proteína: ${NUMBER.format(metas.protein)} g por dia (definida por você)`
  : hasWeight ? `Meta de proteína: ${NUMBER.format(metas.protein)} g por dia, 2,4 g por kg` : '';
 const pct = phase.kind === 'week' ? Math.round(phase.progress * 100) : phase.kind === 'done' ? 100 : 0;
 const planText = phase.kind === 'week' ? weekLabel(phase.week) : phase.kind === 'done' ? 'Plano concluído' : `Começa em ${phase.daysUntil} ${phase.daysUntil === 1 ? 'dia' : 'dias'}`;
 const enabled = state.settings.notifications?.enabled === true && notify === 'granted';
 const notifyState = notify === 'unsupported' ? 'Indisponível neste aparelho' : notify === 'denied' ? 'Bloqueadas no navegador' : enabled ? 'Ativadas' : 'Desativadas';

 function openEditor(target: 'name' | 'goal' | 'body') {
  setNameDraft(name); setGoalDraft(goal); setErrors({});
  setAgeDraft(profile?.age !== undefined ? String(profile.age) : '');
  setWeightDraft(profile?.weightKg !== undefined ? String(profile.weightKg).replace('.', ',') : '');
  setHeightDraft(profile?.heightCm !== undefined ? String(profile.heightCm) : '');
  setEditing(target);
 }
 async function saveProfile(event: FormEvent) {
  event.preventDefault();
  const result = validateProfile({ name: nameDraft, goal: goalDraft, age: ageDraft, weightKg: weightDraft, heightCm: heightDraft });
  if (!result.ok) { setErrors(result.errors); window.setTimeout(() => (document.querySelector('.perfil-edit [aria-invalid="true"]') as HTMLElement | null)?.focus(), 0); return; }
  setErrors({});
  const value = result.value;
  const ok = await commit(s => {
   const next: NonNullable<typeof s.settings.profile> = { name: value.name, goal: value.goal };
   if (value.age !== undefined) next.age = value.age;
   if (value.weightKg !== undefined) next.weightKg = value.weightKg;
   if (value.heightCm !== undefined) next.heightCm = value.heightCm;
   s.settings.profile = next; return s;
  });
  if (ok) { setEditing(null); showToast('Perfil salvo'); }
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
  const ok = await run(async () => {
   if (copy && !navigator.clipboard?.writeText) throw new Error('A cópia não está disponível neste endereço. Use Baixar backup.');
   const backup = await repository.export();
   if (copy) {
    try { await navigator.clipboard.writeText(backup.text); } catch { throw new Error('Não foi possível copiar. Use Baixar backup para guardar o arquivo.'); }
   } else {
    const url = URL.createObjectURL(new Blob([backup.text], { type: 'application/json;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = backup.filename; document.body.append(link); link.click(); link.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 30000);
   }
   return true;
  }, copy ? 'Backup copiado. Guarde a cópia fora deste aparelho e confirme abaixo.' : 'Arquivo de backup gerado. Confira se você o guardou e confirme abaixo.');
  return ok === true;
 }
 async function selectFile(event: ChangeEvent<HTMLInputElement>) {
  const file = event.target.files?.[0]; setPreview(null); setImportError(''); setFilename(file?.name ?? NO_FILE); if (!file) return;
  // O erro de arquivo inválido aparece junto ao campo (não no aviso global do topo da página).
  const prepared = await run(async () => {
   if (file.size > 10 * 1024 * 1024) { setImportError('Este arquivo tem mais de 10 MB. Escolha um backup menor. Seus dados atuais continuam intactos.'); return undefined; }
   try { return await repository.prepareImport(await file.text()); }
   catch { setImportError('Este arquivo não é um backup do Fitnez ou está corrompido. Seus dados atuais continuam intactos.'); return undefined; }
  });
  if (prepared) setPreview(prepared);
 }
 /** Gera o CSV no aparelho e baixa com BOM (o Excel abre os acentos). Nada sai do aparelho além do arquivo que a pessoa guarda. */
 function exportCsv(kind: CsvKind) {
  const text = kind === 'cargas' ? exportLoadsCsv(state!.history.days, state!.catalog.plan)
   : kind === 'medidas' ? exportMeasuresCsv(state!.history.measurements)
   : exportDietCsv(state!.history.days, catalogOf(state!));
  const name = csvFilename(kind, today);
  const url = URL.createObjectURL(new Blob(['﻿', text], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a'); link.href = url; link.download = name; document.body.append(link); link.click(); link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 30000);
  showToast(`Planilha gerada: ${name}`);
 }
 function clearFile(focus: boolean) { setPreview(null); setImportError(''); setFilename(NO_FILE); if (fileInput.current) { fileInput.current.value = ''; if (focus) fileInput.current.focus(); } }

 return <div className="perfil">
  {shouldShowBackupReminder(state, protection?.backupDue) ? <aside className="reminder perfil-lembrete"><strong>Faça um backup dos seus dados</strong><p>Seu backup semanal está pendente. Guarde o arquivo fora deste aparelho e confirme o backup.</p><button type="button" className="link-button" onClick={() => { setBackupOpen(true); window.setTimeout(() => document.getElementById('backup-cabeca')?.scrollIntoView({ block: 'start' }), 0); }}>Fazer backup</button></aside> : null}
  {conflict ? <Card title="Escolher origem dos dados"><p>Encontramos duas fontes diferentes do protótipo. Escolha qual histórico será usado. As duas fontes originais serão preservadas para recuperação.</p><fieldset disabled={busy}><legend>Histórico a usar</legend>{initialization.sources.map(s => <label className="source-choice" key={s.id}><input type="radio" name="migration-source" value={s.id} checked={source === s.id} onChange={() => setSource(s.id)} /><span><strong>Protótipo (versão {s.version})</strong><small>{s.days} dias · {s.measurements} datas com medidas</small></span></label>)}</fieldset><button disabled={busy || !source} onClick={() => void run(() => repository.selectMigration({ sourceId: source, expectedRevision: state.revision }), 'Origem escolhida. Seus dados foram migrados e os originais preservados.')}>Confirmar origem escolhida</button><p className="muted">Tema, importação e confirmação de backup ficam bloqueados até essa escolha.</p></Card> : null}

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

  {editing ? <form className="card perfil-edit" noValidate aria-labelledby="perfil-edit-titulo" onSubmit={e => void saveProfile(e)}>
   <h2 id="perfil-edit-titulo" className="perfil-edit-titulo">Editar perfil</h2>
   <label htmlFor="perfil-nome">Seu nome</label>
   <input id="perfil-nome" ref={nameInput} type="text" maxLength={60} autoComplete="given-name" placeholder="Seu nome" value={nameDraft} aria-invalid={errors.name ? true : undefined} aria-describedby={errors.name ? 'perfil-nome-erro' : undefined} onChange={e => setNameDraft(e.target.value)} />
   {errors.name ? <p id="perfil-nome-erro" className="perfil-erro">{errors.name}</p> : null}
   <label htmlFor="perfil-objetivo">Seu objetivo</label>
   <input id="perfil-objetivo" ref={goalInput} type="text" maxLength={140} placeholder="Defina seu objetivo" value={goalDraft} aria-invalid={errors.goal ? true : undefined} aria-describedby={errors.goal ? 'perfil-objetivo-erro' : undefined} onChange={e => setGoalDraft(e.target.value)} />
   {errors.goal ? <p id="perfil-objetivo-erro" className="perfil-erro">{errors.goal}</p> : null}
   <div className="perfil-fisico">
    <div><label htmlFor="perfil-idade">Idade (anos)</label>
     <input id="perfil-idade" ref={ageInput} type="text" inputMode="numeric" autoComplete="off" value={ageDraft} aria-invalid={errors.age ? true : undefined} aria-describedby={errors.age ? 'perfil-idade-erro' : undefined} onChange={e => setAgeDraft(e.target.value)} /></div>
    <div><label htmlFor="perfil-peso">Peso (kg)</label>
     <input id="perfil-peso" type="text" inputMode="decimal" autoComplete="off" value={weightDraft} aria-invalid={errors.weightKg ? true : undefined} aria-describedby={errors.weightKg ? 'perfil-peso-erro' : undefined} onChange={e => setWeightDraft(e.target.value)} /></div>
    <div><label htmlFor="perfil-altura">Altura (cm)</label>
     <input id="perfil-altura" type="text" inputMode="numeric" autoComplete="off" value={heightDraft} aria-invalid={errors.heightCm ? true : undefined} aria-describedby={errors.heightCm ? 'perfil-altura-erro' : undefined} onChange={e => setHeightDraft(e.target.value)} /></div>
   </div>
   {errors.age ? <p id="perfil-idade-erro" className="perfil-erro">{errors.age}</p> : null}
   {errors.weightKg ? <p id="perfil-peso-erro" className="perfil-erro">{errors.weightKg}</p> : null}
   {errors.heightCm ? <p id="perfil-altura-erro" className="perfil-erro">{errors.heightCm}</p> : null}
   {proteinText ? <><p className="perfil-meta">{proteinText}</p>{exampleTargets ? <p className="perfil-meta-nota">{META_EXEMPLO}</p> : null}</> : null}
   <div className="actions"><button type="submit" className="button" disabled={busy}>Salvar</button><button type="button" className="button secondary" onClick={() => setEditing(null)}>Cancelar</button></div>
  </form> : null}

  <dl className="card perfil-stats" aria-label="Seus números">
   <div className="perfil-stat tone-treino"><Icon name="treino" size={30} /><div><dd className="stat">{feitos ? <CountUp value={feitos} duration={350} /> : '—'}</dd><dt>Treinos<span className="visually-hidden"> concluídos</span></dt></div></div>
   <div className="perfil-stat tone-dieta"><Icon name="garfo" size={30} /><div><dd className="stat">{refeicoes ? <CountUp value={refeicoes} duration={350} /> : '—'}</dd><dt>Refeições<span className="visually-hidden"> registradas</span></dt></div></div>
   <div className="perfil-stat tone-evolucao"><Icon name="evolucao" size={30} /><div><dd className="stat">{taxa === null ? '—' : <CountUp value={taxa} suffix="%" duration={350} />}</dd><dt>Constância</dt></div></div>
  </dl>

  <ul className="list perfil-list">
   <li className="tone-brasa"><button type="button" className="list-row perfil-link" onClick={() => openEditor('goal')}>
    <span className="icon-tile soft"><Icon name="alvo" size={26} /></span>
    <span className="grow"><strong>Meu objetivo</strong><small className={goal ? undefined : 'perfil-vazio'}>{goal || 'Defina seu objetivo'}</small></span>
    <Icon name="seta" size={22} />
   </button></li>
   <li><button type="button" className="list-row perfil-link" onClick={() => openEditor('body')}>
    <span className="icon-tile soft"><Icon name="perfil" size={26} /></span>
    <span className="grow"><strong>Dados físicos</strong><small className={bodyParts.length ? undefined : 'perfil-vazio'}>{bodyParts.length ? bodyParts.join(' · ') : 'Idade, peso e altura'}</small>{proteinText ? <><small>{proteinText}</small>{exampleTargets ? <small className="perfil-meta-nota">{META_EXEMPLO}</small> : null}</> : null}</span>
    <Icon name="seta" size={22} />
   </button></li>
   <li className="tone-dieta"><button type="button" className="list-row perfil-link" aria-haspopup="dialog" onClick={() => setMetasOpen(true)}>
    <span className="icon-tile soft"><Icon name="garfo" size={26} /></span>
    <span className="grow"><strong>Metas de dieta</strong><small>{exampleTargets ? 'Meta de exemplo' : 'Metas personalizadas'}</small></span>
    <Icon name="seta" size={22} />
   </button></li>
   {lastMeasure ? <li className="perfil-medida"><p>Última medida de peso: {kgFmt.format(lastMeasure.kg)} kg em {lastMeasure.date.slice(8, 10)}/{lastMeasure.date.slice(5, 7)}. O peso do perfil e o peso medido na Evolução são independentes.</p>{profile?.weightKg !== lastMeasure.kg ? <button type="button" className="button secondary" disabled={busy} onClick={() => void useMeasured()}>Usar como peso do perfil</button> : null}</li> : null}
   <li className="tone-treino"><button type="button" className="list-row perfil-link perfil-plano" aria-haspopup="dialog" onClick={() => setStartOpen(true)}>
    <span className="icon-tile soft"><Icon name="calendario" size={26} /></span>
    <span className="grow"><strong>Meu plano</strong><small>{planText}</small>
     <span className="perfil-progress"><span className="bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label={`Progresso do plano: ${pct}%`}><span style={{ width: `${pct}%` }} /></span><span className="perfil-pct">{pct}%</span></span>
    </span>
    <Icon name="seta" size={22} />
   </button></li>
  </ul>
  {metasOpen ? <MetasSheet onClose={() => setMetasOpen(false)} /> : null}
  {startOpen ? <DataInicioSheet today={today} onClose={() => setStartOpen(false)} /> : null}

  <h2 className="perfil-h2">Preferências</h2>
  <div className="list perfil-list">
   <fieldset className="list-row perfil-theme" disabled={locked}>
    <legend className="visually-hidden">Tema do aplicativo</legend>
    <span className="icon-tile soft sm"><Icon name={state.settings.theme === 'light' ? 'sol' : 'lua'} size={22} /></span>
    <span className="grow"><strong>Tema do aplicativo</strong><small>Escolha o formato de exibição</small></span>
    <div className="segmented perfil-seg">{themes.map(([value, label, short]) => <button type="button" key={value} aria-label={label} aria-pressed={state.settings.theme === value} onClick={() => setTheme(value)}>{value === 'light' ? <Icon name="sol" size={18} /> : value === 'dark' ? <Icon name="lua" size={18} /> : null}<span aria-hidden="true" className="perfil-lbl-long">{label}</span><span aria-hidden="true" className="perfil-lbl-short">{short}</span></button>)}</div>
   </fieldset>

   <div className="list-row perfil-notify">
    <span className="icon-tile soft sm"><Icon name="sino" size={22} /></span>
    <span className="grow"><strong id="notif-rotulo">Notificações</strong><small>{notifyState}</small></span>
    <button type="button" role="switch" className="switch" aria-checked={enabled} aria-labelledby="notif-rotulo" disabled={notifyBusy || notify === 'unsupported' || notify === 'denied'} onClick={() => void toggleNotifications()} />
    <p className="perfil-help">Avisos de fim de descanso. No iPhone, instale o app na tela inicial. Lembretes com o app fechado exigem um serviço de envio, que ainda não está ativo.</p>
    {notifyNote ? <p className="perfil-help perfil-aviso" role="status">{notifyNote}</p> : null}
   </div>

   <Disclosure id="dados" icon="info" title="Dados neste aparelho" subtitle={offlineStatus || 'Armazenamento, instalação e uso offline'} open={dataOpen} onToggle={() => setDataOpen(o => !o)}>
    <dl className="facts"><div><dt>Armazenamento persistente</dt><dd>{protection ? persistenceLabels[protection.persistence] : 'Consultando…'}</dd></div>{protection?.usage !== undefined ? <div><dt>Espaço estimado em uso</dt><dd>{new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(protection.usage / 1048576)} MB{protection.quota !== undefined ? ` de ${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(protection.quota / 1048576)} MB` : ''}</dd></div> : null}</dl>
    <button className="button secondary" disabled={busy} onClick={() => void requestPersistence()}>Pedir armazenamento persistente</button>
    {protection?.message ? <p className="warning">{protection.message}</p> : null}
    <p className="muted">A limpeza do navegador ou a perda do aparelho pode apagar seus dados. A persistência não substitui um backup externo.</p>
    <h3>Instalar e usar offline</h3>
    <p>Instale o app para abri-lo pelo ícone, como qualquer outro. O uso offline estará pronto quando aparecer “Disponível offline” aqui, em Dados neste aparelho.</p>
    <InstalarApp />
    <p className="muted">Cada navegador e aparelho guarda seus próprios dados. Para mudar de endereço ou aparelho, baixe e importe o backup. Não há login nem sincronização.</p>
   </Disclosure>

   <Disclosure id="backup" icon="nuvem" title="Backup e restauração" subtitle="Salve e restaure seus dados" open={backupOpen} onToggle={() => setBackupOpen(o => !o)}>
    <h3>Backup dos seus dados</h3>
    <p>Baixe ou copie o backup completo, incluindo o histórico e os originais preservados. O backup é um arquivo de texto com todos os seus dados de saúde. Guarde em lugar seguro.</p>
    <div className="actions"><button className="button" disabled={busy} onClick={() => void exportBackup(false)}>Baixar backup</button><button className="button secondary" disabled={busy} onClick={() => void exportBackup(true)}>Copiar backup</button></div>
    <dl className="facts backup-dates"><div><dt>Último backup gerado</dt><dd>{formatInstant(protection?.lastBackupGeneratedAt)}</dd></div><div><dt>Último backup confirmado</dt><dd>{formatInstant(protection?.lastBackupConfirmedAt)}</dd></div></dl>
    <p className="muted">Gerar ou copiar o arquivo não confirma que ele foi guardado. Confirme somente depois de conferir sua cópia.</p>
    <button className="button secondary" disabled={locked || !protection?.lastBackupGeneratedAt} onClick={() => void run(() => repository.confirmBackup({ expectedRevision: state.revision }), 'Backup confirmado. O lembrete volta em 7 dias.')}>Já guardei o backup</button>

    <h3 className="perfil-sub">Exportar planilhas (CSV)</h3>
    <p>Baixe suas cargas, medidas ou dieta em CSV para abrir numa planilha. O arquivo é gerado neste aparelho e só sai dele se você o enviar. Não substitui o backup, e não dá para importá-lo de volta.</p>
    <div className="perfil-csv">
     <button type="button" className="button secondary" disabled={busy} onClick={() => exportCsv('cargas')}><Icon name="salvar" size={20} />Exportar cargas</button>
     <button type="button" className="button secondary" disabled={busy} onClick={() => exportCsv('medidas')}><Icon name="salvar" size={20} />Exportar medidas</button>
     <button type="button" className="button secondary" disabled={busy} onClick={() => exportCsv('dieta')}><Icon name="salvar" size={20} />Exportar dieta</button>
    </div>

    <h3 className="perfil-sub">Importar backup</h3>
    <p>Escolha um backup JSON do protótipo ou desta versão. Você verá um resumo antes de substituir qualquer dado.</p>
    <p id="file-help">Arquivo de backup JSON (até 10 MB)</p>
    <div className="file-picker"><label className="button secondary" htmlFor="backup-file">Escolher arquivo JSON</label><input className="visually-hidden" ref={fileInput} id="backup-file" type="file" aria-describedby="file-help file-name" accept=".json,application/json" disabled={locked} onChange={e => void selectFile(e)} /><span id="file-name" className="muted">{filename}</span></div>
    {importError ? <div ref={importErrorRef} className="perfil-import-erro" role="alert" tabIndex={-1}><p>{importError}</p><button type="button" className="button secondary" onClick={() => { clearFile(false); fileInput.current?.click(); }}>Escolher outro arquivo</button></div> : null}
    {preview ? <section className="import-preview" aria-labelledby="preview-title"><h3 ref={previewHeading} id="preview-title" tabIndex={-1}>Prévia da importação</h3><p>Backup versão {preview.sourceVersion}</p><dl className="facts"><div><dt>Dias com dados</dt><dd>{preview.summary.days}</dd></div><div><dt>Datas com medidas</dt><dd>{preview.summary.measurements}</dd></div><div><dt>Exercícios</dt><dd>{preview.summary.exercises}</dd></div><div><dt>Treinos</dt><dd>{preview.summary.sessions}</dd></div></dl>{preview.warnings.map((w, i) => <p className="muted" key={i}>{w}</p>)}<p className="warning"><strong>Os dados atuais serão substituídos.</strong> Uma cópia de recuperação será preservada neste aparelho na mesma operação.</p><div className="actions"><button className="danger" disabled={locked} onClick={async () => { const result = await run(() => repository.confirmImport({ token: preview.token, expectedRevision: preview.expectedRevision }), 'Backup importado. Os dados anteriores estão preservados para recuperação.'); if (result) clearFile(false); }}>Confirmar importação</button><button className="button secondary" disabled={busy} onClick={() => clearFile(true)}>Cancelar</button></div></section> : null}
   </Disclosure>
  </div>
  <ApagarDados onDownloadBackup={() => exportBackup(false)} />
  <p className="perfil-aviso-saude">Calorias, cargas e metas são estimativas e não substituem nutricionista, médico ou educador físico.</p>
 </div>;
}
