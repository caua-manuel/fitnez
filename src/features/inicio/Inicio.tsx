import { useState } from 'react';
import type { ReactNode } from 'react';
import { useData } from '../../app/DataProvider';
import { hrefFor } from '../../app/router';
import { BackupReminder } from '../../ui/components';
import { Icon } from '../../ui/icons';
import { Menu } from '../../ui/Menu';
import type { MenuItem } from '../../ui/Menu';
import { Sheet } from '../../ui/Sheet';
import { showToast } from '../../ui/UndoToast';
import { freeExercises, minutesLabel, planWeek } from '../treino/util';
import { CheckDraw, CountUp, Reveal } from '../../ui/motion';
import { SemanaFaixa } from './SemanaFaixa';
import { weekStrip } from './semana';
import { DietaResumo } from './DietaResumo';
import { TerceiraAula } from './TerceiraAula';
import { ObservacaoAula } from './ObservacaoAula';
import { InstalarApp } from '../perfil/InstalarApp';
import './inicio.css';
import { shouldShowBackupReminder } from '../../domain/userData';
import { activityFor, activityLabel } from '../../domain/dayActivity';
import { addDays, mondayOf, phaseOf, rirSequence, weekLabel } from '../../domain/calendar';
import type { DayIso, Phase } from '../../domain/calendar';
import { DataInicioSheet, useSetPlanStart } from '../perfil/DataInicioSheet';
import { getWorkout, isDone, listWorkouts } from '../../domain/workoutRecord';
import { isLower, muscleGroupOf } from '../../domain/muscleGroups';
import { suggestNext } from '../../domain/progression';
import { lastWorkingSession, placeholderFor, workingHistory } from '../../domain/setPlaceholder';
import { setsForWeek } from '../../domain/workout';
import type { SetEntry } from '../../domain/workout';
import { exercisesWithSwaps } from '../../domain/swap';
import { FREE_SESSION_ID, weekStreak } from '../../domain/weekStreak';
import type { DayRecord, StateV3 } from '../../application/repository';

/** Número que conta até o valor, seguido da palavra no singular ou no plural ("10 exercícios"). */
function Count({ n, one, many }: { n: number; one: string; many: string }) { return <><CountUp value={n} /> {n === 1 ? one : many}</>; }

// O "hoje" vem de um relógio injetável; o padrão usa o dia local do aparelho.
export type Clock = () => number;
export function localDay(ms: number): DayIso {
 const d = new Date(ms);
 return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
// A observação da aula de jiu-jitsu fica em notes (campo opcional já previsto no esquema v3), com esta chave.
const BJJ_NOTE = 'aula-bjj';
const ddmm = (day: DayIso) => `${day.slice(8, 10)}/${day.slice(5, 7)}`;
const dateOf = (day: DayIso) => new Date(Number(day.slice(0, 4)), Number(day.slice(5, 7)) - 1, Number(day.slice(8, 10)));
const weekdayOf = (day: DayIso) => (dateOf(day).getDay() + 6) % 7;
function formatDay(day: DayIso): string {
 return new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).format(dateOf(day));
}
/** "Qua, 19 nov": dia curto do topo. */
function shortDate(day: DayIso): string {
 const d = dateOf(day);
 const wd = new Intl.DateTimeFormat('pt-BR', { weekday: 'short' }).format(d).replace('.', '');
 const mo = new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(d).replace('.', '');
 return `${wd.charAt(0).toUpperCase()}${wd.slice(1)}, ${d.getDate()} ${mo}`;
}

/** Faixa de 12 semanas: concluídas cheias, a atual contornada. Só leitura. */
function Plano12({ phase }: { phase: Phase }) {
 const at = phase.kind === 'week' ? phase.week : phase.kind === 'done' ? 12 : -1;
 const label = phase.kind === 'week' ? `Semana ${phase.week + 1} de 12 do plano` : phase.kind === 'done' ? 'Plano de 12 semanas concluído' : 'Plano de 12 semanas ainda não começou';
 return <div className="in-12" role="img" aria-label={label}>
  {Array.from({ length: 12 }, (_, i) => <span key={i} className={i < at ? 'is-past' : i === at ? 'is-now' : undefined} />)}
 </div>;
}

/** Primeiro exercício pendente do treino, com a carga sugerida (placeholderFor + suggestNext do domínio). */
function PrimeiroExercicio({ state, sessionId, day }: { state: StateV3; sessionId: string; day: DayIso }) {
 const plan = state.catalog.plan, rec = state.history.days[day], days = state.history.days;
 const ids = sessionId === FREE_SESSION_ID ? freeExercises(state, day) : exercisesWithSwaps(plan.sess[sessionId]?.ex ?? [], rec).filter(e => plan.ex[e]);
 const rowsOf = (e: string): SetEntry[] => (rec?.log?.[e] ?? []).map(r => ({ kg: String(r.kg ?? ''), reps: String(r.reps ?? ''), done: r.done === true, ...(r.kind === 'warm' ? { kind: 'warm' as const } : {}) }));
 const i = ids.findIndex(e => !rowsOf(e).some(r => r.done && r.kind !== 'warm'));
 if (i < 0) return null;
 const exId = ids[i]!, ex = plan.ex[exId]!, week = planWeek(state, day);
 const suggestion = suggestNext({ ex, week, history: workingHistory(days, exId, day), lower: isLower(muscleGroupOf(exId, ex)) });
 const previous = lastWorkingSession(days, exId, day)?.sets ?? [];
 const ph = placeholderFor({ ex, week, suggestion, previous, today: rowsOf(exId), index: 0 });
 const presc = setsForWeek(ex, week);
 const weighted = ex.m === 'kg' || ex.m === 'kgs';
 const kg = weighted && ph.kg ? ph.kg.replace('.', ',') : null;
 // Seta só quando a carga mostrada é maior que a melhor da última vez (na semana leve o placeholder não sobe).
 const lastTop = Math.max(0, ...previous.map(x => Number(String(x.kg).replace(',', '.')) || 0));
 const up = kg !== null && lastTop > 0 && Number(ph.kg) > lastTop;
 return <div className="in-first">
  <div className="in-first-text">
   <span className="in-first-k">{i === 0 ? '1º exercício' : 'Próximo exercício'}</span>
   <strong className="in-first-name">{ex.n}</strong>
   <span className="in-first-presc num">{presc.sets} × {presc.reps}</span>
  </div>
  {kg ? <p className="in-hero num"><span className="visually-hidden">Carga sugerida{up ? ', acima da última vez' : ''}: </span>
   {up ? <span className="in-up" aria-hidden="true">↑</span> : null}<strong>{kg}</strong><span className="in-kg">kg</span>
  </p> : weighted ? <p className="in-first-hint">Escolha a carga na 1ª série</p> : null}
 </div>;
}

export function Inicio({ now = Date.now }: { now?: Clock }) {
 const { state, commit, protection } = useData();
 const today = localDay(now());
 const [picked, setPicked] = useState<DayIso | null>(null);
 const [pickerOpen, setPickerOpen] = useState(false);
 const [swapOpen, setSwapOpen] = useState(false);
 const [otherOpen, setOtherOpen] = useState(false);
 const [dateError, setDateError] = useState('');
 const [startOpen, setStartOpen] = useState(false);
 const [startConfirm, setStartConfirm] = useState(false);
 const [fresh, setFresh] = useState<string | null>(null);
 const setStart = useSetPlanStart();
 if (!state) return null;
 const day = picked ?? today;
 const isToday = day === today;
 const record: DayRecord = state.history.days[day] ?? {};
 const rir = rirSequence(state.catalog.plan);
 const phase = phaseOf(state.settings.start, day, rir);
 const plan = state.catalog.plan;
 const workouts = listWorkouts(record);

 const edit = (fn: (r: DayRecord) => void) => void commit((s: StateV3) => {
  const r = s.history.days[day] ?? (s.history.days[day] = {});
  fn(r); return s;
 });
 const setAct = (key: 'bjj' | 'volei' | 'esporte' | 'cond', on: boolean) => { setFresh(on ? `${day}:${key}` : null); edit(r => { r.acts = { ...r.acts, [key]: on }; if (key === 'bjj' && !on) { delete r.feel; if (r.notes) { const { [BJJ_NOTE]: _drop, ...rest } = r.notes; if (Object.keys(rest).length) r.notes = rest; else delete r.notes; } } }); };
 const setBjjNote = (text: string) => edit(r => {
  const rest = { ...(r.notes ?? {}) }; if (text) rest[BJJ_NOTE] = text; else delete rest[BJJ_NOTE];
  if (Object.keys(rest).length) r.notes = rest; else delete r.notes;
 });
 const unmark = (key: 'bjj' | 'volei' | 'esporte', message: string) => {
  const feel = record.feel; const note = record.notes?.[BJJ_NOTE];
  setAct(key, false);
  showToast(message, () => edit(r => { r.acts = { ...r.acts, [key]: true }; if (key === 'bjj') { if (feel !== undefined) r.feel = feel; if (note) r.notes = { ...(r.notes ?? {}), [BJJ_NOTE]: note }; } }));
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

 const nameOf = (id: string) => id === FREE_SESSION_ID ? 'Treino livre' : plan.sess[id]?.name;
 const wLink = (id: string, status: 'partial' | 'done') => status === 'done' ? hrefFor({ tab: 'treino', view: 'concluido', id, day }) : hrefFor({ tab: 'treino', view: 'executar', id, day });
 // Treinos já registrados no dia, além do previsto: cada um com seu estado e atalho.
 const othersList = (exceptId: string | null): ReactNode => {
  const others = workouts.filter(w => w.sessionId !== exceptId);
  if (!others.length) return null;
  return <div className="in-others">
   <p className="eyebrow">{isToday ? 'Outros treinos de hoje' : 'Outros treinos neste dia'}</p>
   <ul>{others.map(w => <li key={w.sessionId}>
    <span className="in-others-name">{nameOf(w.sessionId) ?? 'Treino removido do plano'}<span className={`in-others-state${w.status === 'done' ? ' done' : ''}`}>{w.status === 'done' ? 'Concluído' : 'Em andamento'}</span></span>
    {nameOf(w.sessionId) ? <a className="button secondary in-others-go" href={wLink(w.sessionId, w.status)}>{w.status === 'done' ? 'Ver resultado' : 'Continuar treino'}</a> : null}
   </li>)}</ul>
  </div>;
 };

 const meta = (sessionId: string) => {
  const sess = plan.sess[sessionId]!, mins = minutesLabel(sess.min);
  return <p className="in-meta">{mins ? <span>{mins}</span> : null}<span><Count n={sess.ex.length} one="exercício" many="exercícios" /></span></p>;
 };
 const gymCard = (sessionId: string) => {
  const sess = plan.sess[sessionId];
  if (!sess) return <p className="muted">Este treino não existe mais no seu plano. Use Trocar treino.</p>;
  const done = isDone(record, sessionId);
  return <>
   {done ? <p className="eyebrow in-done"><Icon name="marca" size={18} />{isToday ? 'Concluído hoje' : 'Concluído neste dia'}</p> : <p className="eyebrow">{isToday ? 'Treino de hoje' : 'Treino do dia'}</p>}
   <h2>{sess.name}</h2>
   {meta(sessionId)}
   {done ? null : <PrimeiroExercicio state={state} sessionId={sessionId} day={day} />}
  </>;
 };
 // Treinos que ainda dá para fazer hoje: existentes no plano, diferentes do previsto e ainda não concluídos.
 const candidates = (sessionId: string | null) => plan.order.filter(id => plan.sess[id] && id !== sessionId && !isDone(record, id));
 const gymAction = (sessionId: string) => {
  const w = getWorkout(record, sessionId);
  if (!plan.sess[sessionId]) return null;
  if (w?.status === 'done') return <>
   <a className="button block in-start" href={wLink(sessionId, 'done')}>Ver resultado</a>
   {candidates(sessionId).length ? <button type="button" className="button secondary block" aria-expanded={otherOpen} onClick={() => setOtherOpen(true)}>Fazer outro treino</button> : null}
  </>;
  return <a className="button block in-start" href={hrefFor({ tab: 'treino', view: 'executar', id: sessionId, day })}><Icon name="play" size={22} />{w?.status === 'partial' ? 'Continuar treino' : 'Começar treino'}</a>;
 };
 // O que vem amanhã (dias sem academia): treino com duração, ou a atividade da rotina.
 const tomorrowLine = (): ReactNode => {
  const t = addDays(day, 1);
  if (phaseOf(state.settings.start, t, rir).kind !== 'week') return null;
  const a = activityFor({ sched: state.settings.sched, weekday: weekdayOf(t), override: state.history.days[t]?.over, alt: plan.alt });
  const s = a.kind === 'gym' ? plan.sess[a.sessionId] : undefined;
  const mins = s ? minutesLabel(s.min) : null;
  return <p className="in-next">Amanhã: <strong>{s ? s.name : activityLabel(a)}</strong>{mins ? ` · ${mins}` : ''}</p>;
 };

 let card: ReactNode;
 let action: ReactNode = null;
 let gymDay = false;
 if (phase.kind === 'pre') {
  // Treino previsto: o de hoje na rotina, se for de academia; senão o primeiro treino de academia da semana.
  const weekdayNow = weekdayOf(day);
  const gymAt = (i: number) => { const a = activityFor({ sched: state.settings.sched, weekday: i, alt: plan.alt }); return a.kind === 'gym' && plan.sess[a.sessionId] ? a.sessionId : null; };
  const todayId = gymAt(weekdayNow);
  const firstId = todayId ?? Array.from({ length: 7 }, (_, i) => gymAt(i)).find(Boolean) ?? plan.order.find(id => plan.sess[id]) ?? null;
  const first = firstId ? plan.sess[firstId] : null;
  const wdName = new Intl.DateTimeFormat('pt-BR', { weekday: 'long' }).format(dateOf(day));
  const todayAct = activityFor({ sched: state.settings.sched, weekday: weekdayNow, alt: plan.alt });
  const otherTitle = todayAct.kind === 'bjj' ? 'Aula de jiu-jitsu' : activityLabel(todayAct);
  card = <>
   {!todayId ? <><p className="eyebrow">Treino de hoje · {wdName}</p><h2>{otherTitle}</h2></> : null}
   {first && firstId ? <div className={todayId ? undefined : 'in-others'}>
    <p className="eyebrow">{todayId ? `Treino de hoje · ${wdName}` : 'Primeiro treino do plano'}</p>
    {todayId ? <h2>{first.name}</h2> : <p className="in-first-name">{first.name}</p>}
    {meta(firstId)}
   </div> : <p className="muted">Você ainda pode registrar um dia anterior ou ver os treinos.</p>}
  </>;
  action = isToday ? <>
   <button type="button" className="button block in-start" onClick={() => setStartConfirm(true)}><Icon name="play" size={22} />Começar o plano hoje</button>
   {firstId ? <a className="button secondary block" href={hrefFor({ tab: 'treino', view: 'executar', id: firstId, day })}>Treinar sem mudar a data</a> : <a className="button secondary block" href={hrefFor({ tab: 'treino', view: 'lista' })}>Ver treinos</a>}
  </> : <a className="button secondary block" href={hrefFor({ tab: 'treino', view: 'lista' })}>Ver treinos</a>;
 } else if (phase.kind === 'done') {
  card = <><p className="eyebrow">Plano de 12 semanas</p><h2>Plano concluído</h2><p className="muted">Você completou as 12 semanas. Veja sua evolução ou comece um novo ciclo; seus registros continuam guardados.</p></>;
  action = <>
   <button type="button" className="button block in-start" onClick={() => setStartOpen(true)}>Reiniciar o plano</button>
   <a className="button secondary block" href={hrefFor({ tab: 'evolucao' })}>Ver evolução</a>
  </>;
 } else {
  const act = activityFor({ sched: state.settings.sched, weekday: phase.weekday, override: record.over, alt: plan.alt });
  const eyebrow = <p className="eyebrow">{isToday ? 'Hoje' : 'Neste dia'}</p>;
  if (act.kind === 'gym') { gymDay = true; currentId = act.sessionId; card = <>{gymCard(act.sessionId)}{othersList(act.sessionId)}</>; action = gymAction(act.sessionId); }
  else if (act.kind === 'bjj') {
   const on = record.acts?.bjj === true;
   card = <>
    {eyebrow}
    <h2>Aula de jiu-jitsu</h2>
    <p className="in-meta"><span>{act.gi ? 'Com kimono' : 'Sem kimono'}</span></p>
    {on ? <>
     <p className="success" role="status"><CheckDraw play={fresh === `${day}:bjj`} />Aula registrada.</p>
     <div role="group" aria-label="Como terminou">
      <p><strong>Como terminou</strong> <span className="muted">(1 = leve, 5 = destruído)</span></p>
      <div className="segmented soft">{[1, 2, 3, 4, 5].map(n => <button key={n} type="button" aria-label={`Nota ${n} de 5${n === 1 ? ', leve' : n === 5 ? ', destruído' : ''}`} aria-pressed={record.feel === n} onClick={() => edit(r => { r.feel = n; })}>{n}</button>)}</div>
     </div>
     <ObservacaoAula key={day} value={record.notes?.[BJJ_NOTE] ?? ''} onSave={setBjjNote} />
     <button type="button" className="button secondary block gap-top" onClick={() => unmark('bjj', 'Aula desmarcada')}>Desmarcar aula</button>
    </> : <button type="button" className="button block in-start" onClick={() => setAct('bjj', true)}>Fiz a aula</button>}
    {tomorrowLine()}
    {othersList(null)}
   </>;
  } else if (act.kind === 'volei') {
   const on = record.acts?.volei === true;
   const alt = act.altSessionId ? plan.sess[act.altSessionId] : undefined;
   card = <>
    {eyebrow}
    <h2>Vôlei</h2>
    {on ? <><p className="success" role="status"><CheckDraw play={fresh === `${day}:volei`} />Jogo registrado.</p><button type="button" className="button secondary block" onClick={() => unmark('volei', 'Jogo desmarcado')}>Desmarcar jogo</button></>
     : <button type="button" className="button block in-start" onClick={() => setAct('volei', true)}>Joguei hoje</button>}
    {alt && act.altSessionId && !getWorkout(record, act.altSessionId) ? <a className="button secondary block gap-top" href={hrefFor({ tab: 'treino', view: 'executar', id: act.altSessionId, day })}>Sem jogo? Fazer {alt.name}</a> : null}
    {tomorrowLine()}
    {othersList(null)}
   </>;
  } else if (act.kind === 'esporte') {
   const on = record.acts?.esporte === true;
   card = <>
    {eyebrow}
    <h2>{act.label}</h2>
    {on ? <><p className="success" role="status"><CheckDraw play={fresh === `${day}:esporte`} />Atividade registrada.</p><button type="button" className="button secondary block" onClick={() => unmark('esporte', 'Atividade desmarcada')}>Desmarcar atividade</button></>
     : <button type="button" className="button block in-start" onClick={() => setAct('esporte', true)}>Marcar como feito</button>}
    {tomorrowLine()}
    {othersList(null)}
   </>;
  } else {
   const items: string[] = plan.cond ?? [];
   const marked = items.some((_, i) => record.cond?.[String(i)] === true);
   card = <>
    {eyebrow}
    <h2>Descanso</h2>
    <p className="muted in-rest">Recuperar também faz parte do plano.</p>
    {tomorrowLine()}
    {items.length ? <details className="in-cond" open={marked || undefined}>
     <summary>Opcional: treino do condomínio<Icon name="chevron" size={20} /></summary>
     <ul className="checklist">{items.map((t, i) => { const on = record.cond?.[String(i)] === true; return <li key={i}><button type="button" className="check-item" aria-pressed={on} onClick={() => toggleCond(i)}><span className="check-box" aria-hidden="true">{on ? '✓' : ''}</span><span>{t}</span></button></li>; })}</ul>
    </details> : null}
    {othersList(null)}
   </>;
  }
 }

 const streak = phase.kind === 'week' ? weekStreak({ days: state.history.days, sched: state.settings.sched, start: state.settings.start, today }) : null;
 const menu: MenuItem[] = [
  { label: 'Registrar outro dia', icon: 'editar', onClick: () => setPickerOpen(true) },
  ...(phase.kind === 'week' ? [{ label: 'Trocar treino', icon: 'troca' as const, onClick: () => setSwapOpen(true) }] : [{ label: 'Data de início', icon: 'calendario' as const, onClick: () => setStartOpen(true) }]),
  { label: 'Treino livre', icon: 'plus', href: hrefFor({ tab: 'treino', view: 'detalhe', id: FREE_SESSION_ID }) },
 ];
 return <div className="inicio in-page">
  <Reveal screen="inicio" i={0}><section className="in-head" aria-label="Resumo do plano">
   <p className="in-date"><span>{shortDate(today)}</span>{phase.kind === 'week' ? <> · <span>{weekLabel(phase.week)}</span></> : null}</p>
   {phase.kind === 'pre' ? <p className="in-week">Seu plano começa em <Count n={phase.daysUntil} one="dia" many="dias" /> <span className="muted">· segunda, {ddmm(mondayOf(state.settings.start))}</span></p> : null}
   <Plano12 phase={phase} />
   {phase.kind === 'week' ? <p className="in-sub">
    {phase.deload ? 'Semana leve · ' : ''}Pare {phase.rir} repetições antes da falha{phase.note ? ` · ${phase.note}` : ''}
    {streak?.show ? <span className="in-streak"><Icon name="fogo" size={16} />{streak.count} semanas seguidas</span> : null}
   </p> : null}
  </section></Reveal>

  {!isToday ? <p className="notice-day" role="status">Registrando: {formatDay(day)}. <button type="button" className="link-button" onClick={() => { setPicked(null); setPickerOpen(false); }}>Voltar para hoje</button></p> : null}

  <Reveal screen="inicio" i={1}><section className="card in-hoje" aria-label={isToday ? 'Hoje' : 'Dia escolhido'}>
   <Menu className="in-more" label="Mais opções do dia" trigger={<Icon name="mais" size={22} />} items={menu} />
   {card}
   {action ? <div className="in-stack">{action}</div> : null}
  </section></Reveal>

  <Reveal screen="inicio" i={2}><DietaResumo day={day} isToday={isToday} /></Reveal>

  {gymDay ? null : <Reveal screen="inicio" i={3}><SemanaFaixa days={weekStrip({ sched: state.settings.sched, plan, days: state.history.days, today, preplan: phase.kind === 'pre' })} /></Reveal>}

  {startOpen ? <DataInicioSheet today={today} onClose={() => setStartOpen(false)} /> : null}
  {startConfirm ? <Sheet title="Começar o plano nesta semana?" onClose={() => setStartConfirm(false)}>
   <p>O plano passa a começar na segunda-feira, {ddmm(mondayOf(today))}. Hoje passa a ser o dia {weekdayOf(today) + 1} da semana 1, e o Início passa a mostrar o treino de hoje.</p>
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

  <TerceiraAula today={today} />

  <div className="in-foot">
   <InstalarApp compact />
   {shouldShowBackupReminder(state, protection?.backupDue) ? <BackupReminder /> : null}
  </div>
 </div>;
}
