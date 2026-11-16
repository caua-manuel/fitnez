import { useState } from 'react';
import type { ReactNode } from 'react';
import { useData } from '../../app/DataProvider';
import { hrefFor } from '../../app/router';
import { BackupReminder } from '../../ui/components';
import { Icon } from '../../ui/icons';
import { Sheet } from '../../ui/Sheet';
import { showToast } from '../../ui/UndoToast';
import { minutesLabel } from '../treino/util';
import { AnimatedRing, CheckDraw, CountUp, Reveal, useTilt } from '../../ui/motion';
import { SemanaFaixa } from './SemanaFaixa';
import { weekStrip } from './semana';
import { Glyph } from '../treino/glyphs';
import { Thumb } from '../../ui/Thumb';
import { DietaResumo } from './DietaResumo';
import { TerceiraAula } from './TerceiraAula';
import './inicio.css';
import { shouldShowBackupReminder } from '../../domain/userData';
import { activityFor } from '../../domain/dayActivity';
import { mondayOf, phaseOf, weekLabel } from '../../domain/calendar';
import { DataInicioSheet, useSetPlanStart } from '../perfil/DataInicioSheet';
import type { DayIso } from '../../domain/calendar';
import { getWorkout, isDone, listWorkouts } from '../../domain/workoutRecord';
import type { DayRecord, StateV3 } from '../../application/repository';

/** Número que conta até o valor, seguido da palavra no singular ou no plural ("10 exercícios"). */
function Count({ n, one, many }: { n: number; one: string; many: string }) { return <><CountUp value={n} /> {n === 1 ? one : many}</>; }

// O "hoje" vem de um relógio injetável; o padrão usa o dia local do aparelho.
// Ids de treino que já têm foto em public/img/hero/<id>.jpg. Só liste ids com arquivo existente: tentar um arquivo ausente gera erro de rede no console (principalmente offline).
const HERO_PHOTOS: readonly string[] = ['UA', 'UB'];

export type Clock = () => number;
export function localDay(ms: number): DayIso {
 const d = new Date(ms);
 return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
const ddmm = (day: DayIso) => `${day.slice(8, 10)}/${day.slice(5, 7)}`;
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
 const [otherOpen, setOtherOpen] = useState(false);
 const [view, setView] = useState<'treino' | 'dieta'>('treino');
 const [dateError, setDateError] = useState('');
 const [startOpen, setStartOpen] = useState(false);
 const [startConfirm, setStartConfirm] = useState(false);
 const [fresh, setFresh] = useState<string | null>(null);
 const tiltRef = useTilt<HTMLElement>();
 const setStart = useSetPlanStart();
 if (!state) return null;
 const day = picked ?? today;
 const isToday = day === today;
 const record: DayRecord = state.history.days[day] ?? {};
 const phase = phaseOf(state.settings.start, day);
 const plan = state.catalog.plan;
 const name = state.settings.profile?.name?.trim();
 const workouts = listWorkouts(record);

 const edit = (fn: (r: DayRecord) => void) => void commit((s: StateV3) => {
  const r = s.history.days[day] ?? (s.history.days[day] = {});
  fn(r); return s;
 });
 const setAct = (key: 'bjj' | 'volei' | 'cond', on: boolean) => { setFresh(on ? `${day}:${key}` : null); edit(r => { r.acts = { ...r.acts, [key]: on }; if (key === 'bjj' && !on) delete r.feel; }); };
 const unmark = (key: 'bjj' | 'volei', message: string) => {
  const feel = record.feel;
  setAct(key, false);
  showToast(message, () => edit(r => { r.acts = { ...r.acts, [key]: true }; if (key === 'bjj' && feel !== undefined) r.feel = feel; }));
 };
 const toggleCond = (i: number) => edit(r => {
  const cond = { ...(r.cond ?? {}) }; if (cond[String(i)]) delete cond[String(i)]; else cond[String(i)] = true;
  r.cond = cond; r.acts = { ...r.acts, cond: Object.keys(cond).length > 0 };
 });
 const setOver = (id: string | null) => {
  const before = record.over;
  edit(r => { if (id) r.over = id; else delete r.over; });
  setSwapOpen(false);
  showToast(id ? `${isToday ? 'Treino de hoje' : 'Treino do dia'}: ${plan.sess[id]?.name ?? ''}` : 'Treino de volta à rotina', () => edit(r => { if (before) r.over = before; else delete r.over; }));
 };
 let currentId: string | null = null;

 const wLink = (id: string, status: 'partial' | 'done') => status === 'done' ? hrefFor({ tab: 'treino', view: 'concluido', id, day }) : hrefFor({ tab: 'treino', view: 'executar', id, day });
 // Treinos já registrados no dia, além do previsto: cada um com seu estado e atalho.
 const othersList = (exceptId: string | null): ReactNode => {
  const others = workouts.filter(w => w.sessionId !== exceptId);
  if (!others.length) return null;
  return <div className="in-others">
   <p className="eyebrow">{isToday ? 'Outros treinos de hoje' : 'Outros treinos neste dia'}</p>
   <ul>{others.map(w => <li key={w.sessionId}>
    <span className="in-others-name">{plan.sess[w.sessionId]?.name ?? 'Treino removido do plano'}<span className={`in-others-state${w.status === 'done' ? ' done' : ''}`}>{w.status === 'done' ? 'Concluído' : 'Em andamento'}</span></span>
    {plan.sess[w.sessionId] ? <a className="button secondary in-others-go" href={wLink(w.sessionId, w.status)}>{w.status === 'done' ? 'Ver resultado' : 'Continuar treino'}</a> : null}
   </li>)}</ul>
  </div>;
 };

 const gymCard = (sessionId: string) => {
  const sess = plan.sess[sessionId];
  if (!sess) return <p className="muted">Este treino não existe mais no seu plano. Use Trocar treino.</p>;
  const done = isDone(record, sessionId);
  const mins = minutesLabel(sess.min);
  return <>
   <div className="in-hoje-top">
    <div className="in-hoje-text">
     {done ? <p className="eyebrow in-done"><Icon name="marca" size={18} />{isToday ? 'Concluído hoje' : 'Concluído neste dia'}</p> : <p className="eyebrow">{isToday ? 'Treino de hoje' : 'Treino do dia'}</p>}
     <h2>{sess.name}</h2>
     <p className="in-meta">{mins ? <span><Icon name="relogio" size={20} />{mins}</span> : null}<span><Glyph name="barras" size={20} /><Count n={sess.ex.length} one="exercício" many="exercícios" /></span></p>
    </div>
    <div className="in-hoje-art mv-par" aria-hidden="true"><Thumb kind="hero" id={HERO_PHOTOS.includes(sessionId) ? sessionId : undefined} size={128} /></div>
   </div>
  </>;
 };
 // Treinos que ainda dá para fazer hoje: existentes no plano, diferentes do previsto e ainda não concluídos.
 const candidates = (sessionId: string | null) => plan.order.filter(id => plan.sess[id] && id !== sessionId && !isDone(record, id));
 const gymAction = (sessionId: string) => {
  const w = getWorkout(record, sessionId);
  if (!plan.sess[sessionId]) return null;
  if (w?.status === 'done') return <>
   <a className="button block in-start" href={wLink(sessionId, 'done')}>Ver resultado</a>
   {candidates(sessionId).length ?<button type="button" className="button secondary block" aria-expanded={otherOpen} onClick={() => setOtherOpen(true)}>Fazer outro treino</button> : null}
  </>;
  return <a className="button block in-start" href={hrefFor({ tab: 'treino', view: 'executar', id: sessionId, day })}><Icon name="play" size={22} />{w?.status === 'partial' ? 'Continuar treino' : 'Começar treino'}</a>;
 };

 let card: ReactNode;
 let action: ReactNode = null;
 let hasArt = false;
 if (phase.kind === 'pre') {
  // Treino previsto: o de hoje na rotina, se for de academia; senão o primeiro treino de academia da semana.
  const weekdayNow = (new Date(Number(day.slice(0, 4)), Number(day.slice(5, 7)) - 1, Number(day.slice(8, 10))).getDay() + 6) % 7;
  const gymAt = (i: number) => { const a = activityFor({ sched: state.settings.sched, weekday: i, alt: plan.alt }); return a.kind === 'gym' && plan.sess[a.sessionId] ? a.sessionId : null; };
  const todayId = gymAt(weekdayNow);
  const firstId = todayId ?? Array.from({ length: 7 }, (_, i) => gymAt(i)).find(Boolean) ?? plan.order.find(id => plan.sess[id]) ?? null;
  const first = firstId ? plan.sess[firstId] : null;
  const mins = first ? minutesLabel(first.min) : '';
  const wdName = new Intl.DateTimeFormat('pt-BR', { weekday: 'long' }).format(new Date(Number(day.slice(0, 4)), Number(day.slice(5, 7)) - 1, Number(day.slice(8, 10))));
  const todayAct = activityFor({ sched: state.settings.sched, weekday: weekdayNow, alt: plan.alt });
  const otherTitle = todayAct.kind === 'bjj' ? 'Aula de jiu-jitsu' : todayAct.kind === 'volei' ? 'Vôlei' : 'Descanso';
  card = <>
   {!todayId ? <><p className="eyebrow">Treino de hoje · {wdName}</p><h2>{otherTitle}</h2><p className="muted">O plano ainda não começou, então este dia não é registrado como parte dele.</p></> : null}
   {first && firstId ? <div className="in-hoje-top">
    <div className="in-hoje-text">
     <p className="eyebrow">{todayId ? `Treino de hoje · ${wdName}` : 'Primeiro treino do plano'}</p>
     <h2>{first.name}</h2>
     <p className="in-meta">{mins ? <span><Icon name="relogio" size={20} />{mins}</span> : null}<span><Glyph name="barras" size={20} /><Count n={first.ex.length} one="exercício" many="exercícios" /></span></p>
    </div>
    <div className="in-hoje-art mv-par" aria-hidden="true"><Thumb kind="hero" id={HERO_PHOTOS.includes(firstId) ? firstId : undefined} size={128} /></div>
   </div> : <p className="muted">Você ainda pode registrar um dia anterior ou ver os treinos.</p>}
   <p className="muted in-pre-nota">O plano começa na segunda-feira, {ddmm(mondayOf(state.settings.start))}. Você pode começar agora ou treinar sem mexer na data.</p>
  </>;
  hasArt = !!firstId && HERO_PHOTOS.includes(firstId);
  action = isToday ? <>
   <button type="button" className="button block in-start" onClick={() => setStartConfirm(true)}><Icon name="play" size={22} />Começar o plano hoje</button>
   {firstId ? <a className="button secondary block" href={hrefFor({ tab: 'treino', view: 'executar', id: firstId, day })}>Treinar agora (sem alterar o plano)</a> : <a className="button secondary block" href={hrefFor({ tab: 'treino', view: 'lista' })}>Ver treinos</a>}
  </> : <a className="button secondary block" href={hrefFor({ tab: 'treino', view: 'lista' })}>Ver treinos</a>;
 } else if (phase.kind === 'done') {
  card = <><p className="eyebrow">Plano de 12 semanas</p><h2>Plano concluído</h2><p className="muted">Você completou as 12 semanas. Veja sua evolução ou comece um novo ciclo; seus registros continuam guardados.</p></>;
  action = <>
   <button type="button" className="button block in-start" onClick={() => setStartOpen(true)}>Reiniciar o plano</button>
   <a className="button secondary block" href={hrefFor({ tab: 'evolucao' })}>Ver evolução</a>
  </>;
 } else {
  const act = activityFor({ sched: state.settings.sched, weekday: phase.weekday, override: record.over, alt: plan.alt });
  if (act.kind === 'gym') { currentId = act.sessionId; card = <>{gymCard(act.sessionId)}{othersList(act.sessionId)}</>; action = gymAction(act.sessionId); hasArt = HERO_PHOTOS.includes(act.sessionId); }
  else if (act.kind === 'bjj') {
   const on = record.acts?.bjj === true;
   card = <>
    <p className="eyebrow">{isToday ? 'Treino de hoje' : 'Treino do dia'}</p>
    <h2>Aula de jiu-jitsu</h2>
    <p className="muted">{act.gi ? 'Com kimono.' : 'Sem kimono.'}</p>
    {on ? <>
     <p className="success" role="status"><CheckDraw play={fresh === `${day}:bjj`} />Aula registrada.</p>
     <div role="group" aria-label="Como terminou">
      <p><strong>Como terminou</strong> <span className="muted">(1 = exausto, 5 = ótimo)</span></p>
      <div className="segmented soft">{[1, 2, 3, 4, 5].map(n => <button key={n} type="button" aria-label={`Nota ${n} de 5`} aria-pressed={record.feel === n} onClick={() => edit(r => { r.feel = n; })}>{n}</button>)}</div>
     </div>
     <button type="button" className="button secondary block gap-top" onClick={() => unmark('bjj', 'Aula desmarcada')}>Desmarcar aula</button>
    </> : <button type="button" className="button block" onClick={() => setAct('bjj', true)}>Marcar aula como feita</button>}
    {othersList(null)}
   </>;
  } else if (act.kind === 'volei') {
   const on = record.acts?.volei === true;
   const alt = act.altSessionId ? plan.sess[act.altSessionId] : undefined;
   card = <>
    <p className="eyebrow">{isToday ? 'Treino de hoje' : 'Treino do dia'}</p>
    <h2>Vôlei</h2>
    {on ? <><p className="success" role="status"><CheckDraw play={fresh === `${day}:volei`} />Jogo registrado.</p><button type="button" className="button secondary block" onClick={() => unmark('volei', 'Jogo desmarcado')}>Desmarcar jogo</button></>
     : <button type="button" className="button block" onClick={() => setAct('volei', true)}>Marcar jogo como feito</button>}
    {alt && act.altSessionId && !getWorkout(record, act.altSessionId) ? <a className="button secondary block gap-top" href={hrefFor({ tab: 'treino', view: 'executar', id: act.altSessionId, day })}>Sem jogo? Fazer {alt.name}</a> : null}
    {othersList(null)}
   </>;
  } else {
   const items: string[] = plan.cond ?? [];
   card = <>
    <p className="eyebrow">{isToday ? 'Hoje' : 'Neste dia'}</p>
    <h2>Descanso</h2>
    <p className="muted">Se quiser, faça o treino do condomínio (opcional).</p>
    <ul className="checklist">{items.map((t, i) => { const on = record.cond?.[String(i)] === true; return <li key={i}><button type="button" className="check-item" aria-pressed={on} onClick={() => toggleCond(i)}><span className="check-box" aria-hidden="true">{on ? '✓' : ''}</span><span>{t}</span></button></li>; })}</ul>
    {othersList(null)}
   </>;
  }
 }

 const pct = phase.kind === 'week' ? Math.round(phase.progress * 100) : 0;
 const dieta = view === 'dieta';
 return <div className="inicio in-page">
  <Reveal screen="inicio" i={0}><section className="in-head" aria-label="Resumo da semana">
   <div className="in-head-text">
    <p className="in-hello">{name ? `Olá, ${name}!` : 'Olá!'}</p>
    {phase.kind === 'week'
     ? <><h2 className="in-week">{weekLabel(phase.week)}</h2>
       <p className="in-sub">{`Bloco ${phase.block} · RIR ${phase.rir} (repetições em reserva)`}{phase.deload ? ' · Semana leve (deload)' : ''}</p>
       {phase.note ? <p className="in-sub">{phase.note}</p> : null}</>
     : <><h2 className="in-week">{phase.kind === 'pre' ? <>Seu plano começa em <Count n={phase.daysUntil} one="dia" many="dias" /></> : 'Plano concluído'}</h2>
       {phase.kind === 'pre' ? <p className="in-sub">Segunda-feira, {ddmm(mondayOf(state.settings.start))}</p> : null}</>}
   </div>
   {phase.kind === 'week' ? <AnimatedRing percent={pct} size={88} stroke={5} label={`Semana ${phase.week + 1} de 12: ${pct}% do plano`} /> : null}
  </section></Reveal>

  <Reveal screen="inicio" i={1}><SemanaFaixa days={weekStrip({ sched: state.settings.sched, plan, days: state.history.days, today, preplan: phase.kind === 'pre' })} /></Reveal>

  <Reveal screen="inicio" i={2}><div className="segmented in-seg" role="group" aria-label="O que mostrar no cartão principal">
   <button type="button" aria-pressed={!dieta} onClick={() => setView('treino')}><Icon name="treino" size={22} />Treino</button>
   <button type="button" aria-pressed={dieta} onClick={() => setView('dieta')}><Icon name="dieta" size={22} />Dieta</button>
  </div></Reveal>

  {!isToday ? <p className="notice-day" role="status">Registrando: {formatDay(day)}. <button type="button" className="link-button" onClick={() => { setPicked(null); setPickerOpen(false); }}>Voltar para hoje</button></p> : null}

  <Reveal screen="inicio" i={3}><section ref={tiltRef} className={`card in-hoje depth mv-tilt${hasArt && !dieta ? ' has-art' : ''}`} aria-label={dieta ? (isToday ? 'Dieta de hoje' : 'Dieta do dia') : isToday ? 'Treino de hoje' : 'Treino do dia'}>{dieta ? <DietaResumo day={day} isToday={isToday} /> : card}</section></Reveal>
  {dieta || !action ? null : <Reveal screen="inicio" i={4} className="in-stack">{action}</Reveal>}

  <Reveal screen="inicio" i={5}><div className={`in-pair${dieta ? ' single' : ''}`}>
   <button type="button" className="in-ghost" aria-expanded={pickerOpen} onClick={() => setPickerOpen(o => !o)}><Icon name="editar" size={20} />Registrar outro dia</button>
   {phase.kind === 'week' && !dieta ? <button type="button" className="in-ghost" aria-expanded={swapOpen} onClick={() => setSwapOpen(o => !o)}><Glyph name="trocar" size={20} />Trocar treino</button> : null}
   {phase.kind !== 'week' && !dieta ? <button type="button" className="in-ghost" aria-haspopup="dialog" onClick={() => setStartOpen(true)}><Icon name="calendario" size={20} />Data de início</button> : null}
  </div></Reveal>
  {startOpen ? <DataInicioSheet today={today} onClose={() => setStartOpen(false)} /> : null}
  {startConfirm ? <Sheet title="Começar o plano nesta semana?" onClose={() => setStartConfirm(false)}>
   <p>O plano passa a começar na segunda-feira, {ddmm(mondayOf(today))}. Hoje passa a ser o dia {(new Date(Number(today.slice(0, 4)), Number(today.slice(5, 7)) - 1, Number(today.slice(8, 10))).getDay() + 6) % 7 + 1} da semana 1, e o Início passa a mostrar o treino de hoje.</p>
   <p className="muted">Nenhum registro é apagado. Dá para mudar a data depois, em Perfil.</p>
   <div className="sheet-actions">
    <button type="button" className="button block" onClick={() => void setStart(today).then(ok => { if (ok) setStartConfirm(false); })}>Começar o plano</button>
    <button type="button" className="button secondary block" onClick={() => setStartConfirm(false)}>Cancelar</button>
   </div>
  </Sheet> : null}
  {swapOpen && phase.kind === 'week' ? <Sheet title="Escolha o treino do dia" onClose={() => setSwapOpen(false)}>
   <div role="group" aria-label="Treinos disponíveis" className="in-list">
    {plan.order.filter(id => plan.sess[id]).map(id => {
     const current = id === currentId;
     return <button key={id} type="button" className="in-opt" aria-pressed={current} onClick={() => setOver(id)}>
      <span>{plan.sess[id].name}</span>
      {current ? <span className="selected-tag"><Icon name="marca" size={18} />Atual</span> : null}
     </button>;
    })}
   </div>
   {record.over ? <button type="button" className="button secondary block gap-top" onClick={() => setOver(null)}>Voltar à rotina</button> : null}
   <button type="button" className="button secondary block gap-top" onClick={() => setSwapOpen(false)}>Fechar</button>
  </Sheet> : null}
  {otherOpen ? <Sheet title="Fazer outro treino" onClose={() => setOtherOpen(false)}>
   <p className="muted">O treino concluído continua registrado. Os dois contam no dia.</p>
   <div role="group" aria-label="Treinos para fazer agora" className="in-list">
    {candidates(currentId).map(id => <a key={id} className="in-opt" href={hrefFor({ tab: 'treino', view: 'executar', id, day })} onClick={() => setOtherOpen(false)}><span>{plan.sess[id].name}</span></a>)}
   </div>
   <button type="button" className="button secondary block gap-top" onClick={() => setOtherOpen(false)}>Fechar</button>
  </Sheet> : null}
  {pickerOpen ? <Sheet title="Registrar outro dia" onClose={() => setPickerOpen(false)} initialFocus="#data-registro" className="in-dia">
   <label htmlFor="data-registro">Dia do registro</label>
   <input id="data-registro" type="date" max={today} value={day} aria-describedby="data-registro-ajuda" aria-invalid={dateError ? true : undefined} onChange={e => {
    const v = e.target.value;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return;
    if (v > today) { setDateError('Escolha hoje ou um dia anterior. Dias futuros não podem ser registrados.'); return; }
    setDateError(''); setPicked(v === today ? null : v);
   }} />
   <p id="data-registro-ajuda" className="muted">Hoje é o último dia possível.</p>
   {dateError ? <p className="in-error" role="alert">{dateError}</p> : null}
   <button type="button" className="button block gap-top" onClick={() => { setDateError(''); setPickerOpen(false); showToast(day === today ? 'Registrando hoje' : `Registrando: ${formatDay(day)}.`); }}>Usar este dia</button>
  </Sheet> : null}

  {!dieta ? <TerceiraAula today={today} /> : null}

  <Reveal screen="inicio" i={6}><div className="in-atalhos">
   <a className="in-atalho depth" href={hrefFor({ tab: 'dieta' })}><span className="icon-tile soft"><Icon name="dieta" size={28} /></span><span className="in-atalho-row"><strong>Dieta</strong><Icon name="seta" size={20} /></span><span className="muted">Seu plano alimentar</span></a>
   <a className="in-atalho depth" href={hrefFor({ tab: 'evolucao' })}><span className="icon-tile soft"><Icon name="evolucao" size={28} /></span><span className="in-atalho-row"><strong>Evolução</strong><Icon name="seta" size={20} /></span><span className="muted">Acompanhe seus resultados</span></a>
  </div></Reveal>

  {shouldShowBackupReminder(state, protection?.backupDue) ? <BackupReminder /> : null}
 </div>;
}
