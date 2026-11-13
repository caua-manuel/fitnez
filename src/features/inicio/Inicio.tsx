import { useEffect, useState } from 'react';
import { Folha } from './Folha';
import type { ReactNode } from 'react';
import { useData } from '../../app/DataProvider';
import { hrefFor } from '../../app/router';
import { BackupReminder } from '../../ui/components';
import { Icon } from '../../ui/icons';
import { minutesLabel, plural } from '../treino/util';
import { ProgressRing } from '../treino/ProgressRing';
import { Glyph } from '../treino/glyphs';
import { Thumb } from '../../ui/Thumb';
import './inicio.css';
import { shouldShowBackupReminder } from '../../domain/userData';
import { activityFor } from '../../domain/dayActivity';
import { phaseOf, weekLabel } from '../../domain/calendar';
import type { DayIso } from '../../domain/calendar';
import type { DayRecord, StateV3 } from '../../application/repository';

// O "hoje" vem de um relógio injetável; o padrão usa o dia local do aparelho.
// Ids de treino que já têm foto em public/img/hero/<id>.jpg. Só liste ids com arquivo existente: tentar um arquivo ausente gera erro de rede no console (principalmente offline).
const HERO_PHOTOS: readonly string[] = ['UA', 'UB'];

export type Clock = () => number;
export function localDay(ms: number): DayIso {
 const d = new Date(ms);
 return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function formatDay(day: DayIso): string {
 const [y, m, d] = day.split('-').map(Number);
 return new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(y, m - 1, d));
}

export function Inicio({ now = Date.now }: { now?: Clock }) {
 const { state, commit, protection } = useData();
 const today = localDay(now());
 const [picked, setPicked] = useState<DayIso | null>(null);
 const [pickerOpen, setPickerOpen] = useState(false);
 const [swapOpen, setSwapOpen] = useState(false);
 const [confirm, setConfirm] = useState('');
 const [dateError, setDateError] = useState('');
 useEffect(() => { if (!confirm) return; const t = window.setTimeout(() => setConfirm(''), 6000); return () => window.clearTimeout(t); }, [confirm]);
 if (!state) return null;
 const day = picked ?? today;
 const isToday = day === today;
 const record: DayRecord = state.history.days[day] ?? {};
 const phase = phaseOf(state.settings.start, day);
 const plan = state.catalog.plan;
 const name = state.settings.profile?.name?.trim();

 const edit = (fn: (r: DayRecord) => void) => void commit((s: StateV3) => {
  const r = s.history.days[day] ?? (s.history.days[day] = {});
  fn(r); return s;
 });
 const setAct = (key: 'bjj' | 'volei' | 'cond', on: boolean) => edit(r => { r.acts = { ...r.acts, [key]: on }; if (key === 'bjj' && !on) delete r.feel; });
 const toggleCond = (i: number) => edit(r => {
  const cond = { ...(r.cond ?? {}) }; if (cond[String(i)]) delete cond[String(i)]; else cond[String(i)] = true;
  r.cond = cond; r.acts = { ...r.acts, cond: Object.keys(cond).length > 0 };
 });
 const setOver = (id: string | null) => {
  edit(r => { if (id) r.over = id; else delete r.over; });
  setSwapOpen(false);
  setConfirm(id ? `${isToday ? 'Treino de hoje' : 'Treino do dia'}: ${plan.sess[id]?.name ?? ''}` : 'Treino de volta à rotina.');
 };
 let currentId: string | null = null;

 const gymCard = (sessionId: string) => {
  const sess = plan.sess[sessionId];
  if (!sess) return <p className="muted">Este treino não existe mais no seu plano. Use Trocar treino de hoje.</p>;
  const w = record.workout;
  const same = w?.sessionId === sessionId;
  const done = same && w?.status === 'done';
  const mins = minutesLabel(sess.min);
  return <>
   <div className="in-hoje-top">
    <div className="in-hoje-text">
     <p className="eyebrow">{isToday ? 'Treino de hoje' : 'Treino do dia'}</p>
     <h2>{sess.name}</h2>
     <p className="in-meta">{mins ? <span><Icon name="relogio" size={20} />{mins}</span> : null}<span><Glyph name="barras" size={20} />{plural(sess.ex.length, 'exercício', 'exercícios')}</span></p>
     {done ? <p className="in-done" role="status"><Icon name="marca" size={18} />Treino concluído.</p> : null}
    </div>
    <div className="in-hoje-art" aria-hidden="true"><Thumb kind="hero" id={HERO_PHOTOS.includes(sessionId) ? sessionId : undefined} size={128} /></div>
   </div>
  </>;
 };
 const gymAction = (sessionId: string) => {
  const w = record.workout, same = w?.sessionId === sessionId;
  if (!plan.sess[sessionId]) return null;
  if (same && w?.status === 'done') return <a className="button secondary block in-start" href={hrefFor({ tab: 'treino', view: 'concluido', id: sessionId, day })}>Ver resumo do treino</a>;
  return <a className="button block in-start" href={hrefFor({ tab: 'treino', view: 'executar', id: sessionId, day })}><Icon name="play" size={22} />{same && w?.status === 'partial' ? 'Continuar treino' : 'Começar treino'}</a>;
 };

 let card: ReactNode;
 let action: ReactNode = null;
 let hasArt = false;
 if (phase.kind === 'pre') {
  card = <><p className="eyebrow">Plano de 12 semanas</p><h2>Seu plano começa em {plural(phase.daysUntil, 'dia', 'dias')}</h2><p className="muted">Você ainda pode registrar um dia anterior ou ver os treinos.</p><a className="button secondary block" href={hrefFor({ tab: 'treino', view: 'lista' })}>Ver treinos</a></>;
 } else if (phase.kind === 'done') {
  card = <><p className="eyebrow">Plano de 12 semanas</p><h2>Plano concluído</h2><p className="muted">Você completou as 12 semanas. Veja sua evolução.</p><a className="button block" href={hrefFor({ tab: 'evolucao' })}>Ver evolução</a></>;
 } else {
  const act = activityFor({ sched: state.settings.sched, weekday: phase.weekday, override: record.over, alt: plan.alt });
  if (act.kind === 'gym') { currentId = act.sessionId; card = gymCard(act.sessionId); action = gymAction(act.sessionId); hasArt = !!plan.sess[act.sessionId]; }
  else if (act.kind === 'bjj') {
   const on = record.acts?.bjj === true;
   card = <>
    <p className="eyebrow">{isToday ? 'Treino de hoje' : 'Treino do dia'}</p>
    <h2>Aula de jiu-jitsu</h2>
    <p className="muted">{act.gi ? 'Com kimono.' : 'Sem kimono.'}</p>
    {on ? <>
     <p className="success" role="status">Aula registrada.</p>
     <div role="group" aria-label="Como terminou">
      <p><strong>Como terminou</strong> <span className="muted">(1 = exausto, 5 = ótimo)</span></p>
      <div className="segmented soft">{[1, 2, 3, 4, 5].map(n => <button key={n} type="button" aria-label={`Nota ${n} de 5`} aria-pressed={record.feel === n} onClick={() => edit(r => { r.feel = n; })}>{n}</button>)}</div>
     </div>
     <button type="button" className="button secondary block gap-top" onClick={() => setAct('bjj', false)}>Desmarcar aula</button>
    </> : <button type="button" className="button block" onClick={() => setAct('bjj', true)}>Marcar aula como feita</button>}
   </>;
  } else if (act.kind === 'volei') {
   const on = record.acts?.volei === true;
   const alt = act.altSessionId ? plan.sess[act.altSessionId] : undefined;
   card = <>
    <p className="eyebrow">{isToday ? 'Treino de hoje' : 'Treino do dia'}</p>
    <h2>Vôlei</h2>
    {on ? <><p className="success" role="status">Jogo registrado.</p><button type="button" className="button secondary block" onClick={() => setAct('volei', false)}>Desmarcar jogo</button></>
     : <button type="button" className="button block" onClick={() => setAct('volei', true)}>Marcar jogo</button>}
    {alt && act.altSessionId ? <a className="button secondary block gap-top" href={hrefFor({ tab: 'treino', view: 'executar', id: act.altSessionId, day })}>Sem jogo? Fazer {alt.name}</a> : null}
   </>;
  } else {
   const items: string[] = plan.cond ?? [];
   card = <>
    <p className="eyebrow">{isToday ? 'Hoje' : 'Neste dia'}</p>
    <h2>Descanso</h2>
    <p className="muted">Se quiser, faça o treino do condomínio (opcional).</p>
    <ul className="checklist">{items.map((t, i) => { const on = record.cond?.[String(i)] === true; return <li key={i}><button type="button" className="check-item" aria-pressed={on} onClick={() => toggleCond(i)}><span className="check-box" aria-hidden="true">{on ? '✓' : ''}</span><span>{t}</span></button></li>; })}</ul>
   </>;
  }
 }


 const pct = phase.kind === 'week' ? Math.round(phase.progress * 100) : 0;
 return <div className="inicio in-page">
  <section className="in-head" aria-label="Resumo da semana">
   <div className="in-head-text">
    <p className="in-hello">{name ? `Olá, ${name}!` : 'Olá!'}</p>
    {phase.kind === 'week'
     ? <><h2 className="in-week">{weekLabel(phase.week)}</h2>
       <p className="in-sub">{`Bloco ${phase.block} · RIR ${phase.rir}`}{phase.deload ? ' · Semana de deload' : ''}</p>
       {phase.note ? <p className="in-sub">{phase.note}</p> : null}</>
     : <h2 className="in-week">{phase.kind === 'pre' ? 'Antes do plano' : 'Plano concluído'}</h2>}
   </div>
   {phase.kind === 'week' ? <ProgressRing percent={pct} size={88} stroke={5} label={`Semana ${phase.week + 1} de 12, ${pct}%`} /> : null}
  </section>

  <nav className="segmented in-seg" aria-label="Seção">
   <a href={hrefFor({ tab: 'inicio' })} aria-current="page"><Icon name="treino" size={22} />Treino</a>
   <a href={hrefFor({ tab: 'dieta' })}><Icon name="dieta" size={22} />Dieta</a>
  </nav>

  {!isToday ? <p className="notice-day" role="status">Registrando: {formatDay(day)}. <button type="button" className="link-button" onClick={() => { setPicked(null); setPickerOpen(false); }}>Voltar para hoje</button></p> : null}

  <div className="in-confirm-wrap" role="status" aria-live="polite">{confirm ? <p className="in-confirm"><Icon name="marca" size={18} />{confirm}</p> : null}</div>

  <section className={`card in-hoje${hasArt ? ' has-art' : ''}`} aria-label={isToday ? 'Treino de hoje' : 'Treino do dia'}>{card}</section>
  {action}

  <div className={`in-pair${phase.kind === 'week' ? '' : ' single'}`}>
   <button type="button" className="in-ghost" aria-expanded={pickerOpen} onClick={() => setPickerOpen(o => !o)}><Icon name="editar" size={20} />Registrar outro dia</button>
   {phase.kind === 'week' ? <button type="button" className="in-ghost" aria-expanded={swapOpen} onClick={() => setSwapOpen(o => !o)}><Glyph name="trocar" size={20} />Trocar treino</button> : null}
  </div>
  {swapOpen && phase.kind === 'week' ? <Folha title="Escolha o treino do dia" onClose={() => setSwapOpen(false)}>
   <div role="group" aria-label="Treinos disponíveis" className="folha-list">
    {plan.order.filter(id => plan.sess[id]).map(id => {
     const current = id === currentId;
     return <button key={id} type="button" className="folha-opt" aria-pressed={current} onClick={() => setOver(id)}>
      <span className="folha-opt-name">{plan.sess[id].name}</span>
      {current ? <span className="selected-tag"><Icon name="marca" size={18} />Atual</span> : null}
     </button>;
    })}
   </div>
   {record.over ? <button type="button" className="button secondary block gap-top" onClick={() => setOver(null)}>Voltar à rotina</button> : null}
   <button type="button" className="button secondary block gap-top" onClick={() => setSwapOpen(false)}>Fechar</button>
  </Folha> : null}
  {pickerOpen ? <Folha title="Registrar outro dia" onClose={() => setPickerOpen(false)} initialFocus="#data-registro">
   <label htmlFor="data-registro">Dia do registro</label>
   <input id="data-registro" type="date" max={today} value={day} aria-describedby="data-registro-ajuda" aria-invalid={dateError ? true : undefined} onChange={e => {
    const v = e.target.value;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return;
    if (v > today) { setDateError('Escolha hoje ou um dia anterior. Dias futuros não podem ser registrados.'); return; }
    setDateError(''); setPicked(v === today ? null : v);
   }} />
   <p id="data-registro-ajuda" className="muted">Hoje é o último dia possível.</p>
   {dateError ? <p className="in-error" role="alert">{dateError}</p> : null}
   <button type="button" className="button block gap-top" onClick={() => { setDateError(''); setPickerOpen(false); setConfirm(day === today ? 'Registrando hoje.' : `Registrando: ${formatDay(day)}.`); }}>Usar este dia</button>
  </Folha> : null}

  <div className="in-atalhos">
   <a className="in-atalho" href={hrefFor({ tab: 'dieta' })}><span className="icon-tile soft"><Icon name="dieta" size={28} /></span><span className="in-atalho-row"><strong>Dieta</strong><Icon name="seta" size={20} /></span><span className="muted">Seu plano alimentar</span></a>
   <a className="in-atalho" href={hrefFor({ tab: 'evolucao' })}><span className="icon-tile soft"><Icon name="evolucao" size={28} /></span><span className="in-atalho-row"><strong>Evolução</strong><Icon name="seta" size={20} /></span><span className="muted">Acompanhe seus resultados</span></a>
  </div>

  {shouldShowBackupReminder(state, protection?.backupDue) ? <BackupReminder /> : null}
 </div>;
}
