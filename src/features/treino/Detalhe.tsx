import { useState } from 'react';
import { useData } from '../../app/DataProvider';
import { hrefFor } from '../../app/router';
import { storageKey } from '../../app/mode';
import { addDays, phaseOf, rirSequence, weekLabel } from '../../domain/calendar';
import { isLower, muscleGroupOf } from '../../domain/muscleGroups';
import { suggestNext } from '../../domain/progression';
import { lastPerformance, setsForWeek } from '../../domain/workout';
import type { SetEntry } from '../../domain/workout';
import type { Exercise, StateV3 } from '../../application/repository';
import { Thumb } from '../../ui/Thumb';
import { Icon } from '../../ui/icons';
import type { IconName } from '../../ui/icons';
import { Glyph } from './glyphs';
import { usePlanEditor } from './planActions';
import { ProgressRing } from './ProgressRing';
import { StatusBadge } from './Cartao';
import { Menu } from '../../ui/Menu';
import { ConfirmSheet } from '../../ui/Sheet';
import { getWorkout, isDone, listWorkouts } from '../../domain/workoutRecord';
import { useStagger } from './stagger';
import type { StaggerProps } from './stagger';
import { GROUP_LABEL, dayBelongsTo, formatDay, formatKg, minutesLabel, plural, planWeek, repsText, sessionLetter, statusOf, todayIso } from './util';
import { ComoFazerSheet, ExercicioSheet } from './lazy';
import './treino.css';

const AVISO_SAUDE = 'Calorias, cargas e metas são estimativas e não substituem nutricionista, médico ou educador físico.';
export const NEW_KEY = storageKey('treino-novo');
type Tab ='exercicios' | 'detalhes' | 'historico';

function performanceText(ex: Exercise, sets: SetEntry[]): string {
 const done = sets.filter(s => s.done);
 const parts = done.map(s => ex.m === 'kg' || ex.m === 'kgs' ? `${s.kg} kg × ${s.reps}` : s.reps || s.kg || '—');
 return `${done.length} ${done.length === 1 ? 'série' : 'séries'}: ${parts.join(', ')}`;
}

function ExerciseCard({ state, id, ex, week, today, onHistory, treinoId, first, reveal }: { state: StateV3; id: string; ex: Exercise; week: number; today: string; onHistory: () => void; treinoId: string; first: boolean; reveal: StaggerProps }) {
 const [expanded, setExpanded] = useState(first);
 const [confirmRemove, setConfirmRemove] = useState(false);
 const [page, setPage] = useState(false);
 const [guide, setGuide] = useState(false);
 const { removeExercise } = usePlanEditor();
 const days = state.history.days;
 const group = muscleGroupOf(id, ex);
 const plan = setsForWeek(ex, week);
 const last = lastPerformance(days, id, addDays(today, 1));
 const history: SetEntry[][] = Object.keys(days).sort().map(d => (days[d]?.log?.[id] ?? []).map(r => ({ kg: String(r.kg ?? ''), reps: String(r.reps ?? ''), done: r.done === true })));
 const sug = last ? suggestNext({ ex, week, history, lower: isLower(group) }) : null;
 const weighted = ex.m === 'kg' || ex.m === 'kgs';
 const sugText = !sug || sug.reason === 'sem-historico' ? null
  : sug.reason === 'reduzir' ? `reduzir a carga${weighted && sug.kg !== null ? ` (${formatKg(sug.kg)} kg)` : ''} e manter ${sug.reps}`
  : weighted && sug.kg !== null ? `${formatKg(sug.kg)} kg · ${sug.reps}${sug.reason === 'manter' ? ' (manter a carga)' : ''}` : sug.reps;
 const todayDone = (days[today]?.log?.[id] ?? []).filter(r => r.done === true).length;
 const bodyId = `corpo-${id}`;
 return <li className={`tr-ex ${expanded ? 'is-open' : 'is-closed'}${reveal.className ? ` ${reveal.className}` : ''}`} style={reveal.style}>
  <div className="tr-ex-top">
   <div className="tr-ex-head">
    <span className="tr-thumb"><Thumb kind="exercise" id={id} group={group ?? undefined} size={56} label={ex.n} /></span>
    <div className="grow">
     <h3 className="tr-exname"><button type="button" className="tr-ex-action" aria-haspopup="dialog" onClick={() => setGuide(true)}>{ex.n}<Icon name="info" size={16} /></button></h3>
     {group ? <span className="tr-meta">{GROUP_LABEL[group]}</span> : null}
     <button type="button" className="tr-plan tr-ex-action" aria-expanded={expanded} aria-controls={bodyId} onClick={() => setExpanded(e => !e)}>
      <span><strong className="num">{plural(plan.sets, 'série', 'séries')}</strong> · <span className="num">{repsText(ex, plan.reps)}</span></span><Icon name="chevron" size={16} />
     </button>
    </div>
   </div>
   <Menu className="tr-more-ex" label={`Mais opções de ${ex.n}`} trigger={<Icon name="mais" size={22} weight={2} />} items={[
    { label: 'Ver exercício', icon: 'info', onClick: () => setPage(true) },
    { label: "Editar exercício", icon: 'editar', href: hrefFor({ tab: "treino", view: "exercicio", id: treinoId, ex: id }) },
    { label: "Ver histórico do treino", icon: 'historico', onClick: onHistory },
    { label: "Remover do treino", danger: true, onClick: () => setConfirmRemove(true) },
   ]} />
  </div>
  {page ? <ExercicioSheet exId={id} onClose={() => setPage(false)} /> : null}
  {guide ? <ComoFazerSheet exId={id} name={ex.n} group={group ?? undefined} onClose={() => setGuide(false)} /> : null}
  {confirmRemove ? <ConfirmSheet title={`Remover ${ex.n} do treino?`} confirmLabel="Remover do treino" onCancel={() => setConfirmRemove(false)} onConfirm={() => { setConfirmRemove(false); void removeExercise(treinoId, id); }}>
   <p>O exercício sai só deste treino. O histórico fica guardado e você poderá desfazer por 6 segundos.</p>
  </ConfirmSheet> : null}
  <div id={bodyId} hidden={!expanded}>
  <p className="tr-goal num">Meta: {plural(plan.sets, 'série', 'séries')} · {repsText(ex, plan.reps)}</p>
  {todayDone > 0 ? <p className="muted tr-last">Hoje: {todayDone} de {plan.sets} {plan.sets === 1 ? 'série feita' : 'séries feitas'}.</p> : null}
  <p className="muted tr-last">{last ? <>Último desempenho ({formatDay(last.day)}): {performanceText(ex, last.sets)}</> : 'Sem registro anterior'}</p>
  {sugText ? <p className="tr-sug"><span className="tr-sug-k">Sugestão:</span> {sugText} <span className="muted tr-sug-note">(só uma sugestão; você define a carga)</span></p> : null}
  </div>
 </li>;
}

const TABS: { id: Tab; label: string; icon: IconName }[] = [
 { id: 'exercicios', label: 'Exercícios', icon: 'treino' }, { id: 'detalhes', label: 'Detalhes', icon: 'info' }, { id: 'historico', label: 'Histórico', icon: 'historico' },
];

export function Detalhe({ id }: { id: string }) {
 const { state } = useData();
 const [tab, setTab] = useState<Tab>('exercicios');
 const [fresh, setFresh] = useState(() => { try { return sessionStorage.getItem(NEW_KEY) === id; } catch { return false; } });
 const rv = useStagger('treino-detalhe');
 if (!state) return null;
 const plan = state.catalog.plan, s = plan.sess[id];
 const back = <a className="tr-back" href={hrefFor({ tab: 'treino', view: 'lista' })}>← Voltar aos treinos</a>;
 if (!s) return <section className="card"><p>Treino não encontrado.</p>{back}</section>;
 const today = todayIso(), week = planWeek(state, today);
 const phase = phaseOf(state.settings.start, today, rirSequence(state.catalog.plan));
 const dur = minutesLabel(s.min);
 const letter = sessionLetter(plan, id);
 const todayRec = state.history.days[today];
 const finishedToday = isDone(todayRec, id);
 const resuming = getWorkout(todayRec, id)?.status === 'partial';
 const planPct = phase.kind === 'week' ? Math.round(phase.progress * 100) : 0;
 const logged = Object.keys(state.history.days).filter(d => dayBelongsTo(plan, state.history.days[d], id)).sort().reverse();
 return <div className="tr-detail tone-treino">
  <a className="icon-button tr-backbtn" href={hrefFor({ tab: 'treino', view: 'lista' })} aria-label="Voltar aos treinos"><Icon name="voltar" size={24} /></a>
  <div className="tr-hero">
   <div className="tr-hero-text">
    {letter ? <p className="tr-kicker">Treino {letter}</p> : null}
    <h2>{s.name}</h2>
    <p className="in-meta tr-hero-meta"><span><Icon name="relogio" size={20} />{dur ?? 'Duração não definida'}</span><span><Glyph name="barras" size={20} />{plural(s.ex.length, 'exercício', 'exercícios')}</span></p>
   </div>
   {phase.kind === 'week' ? <div className="tr-ring-box">
    <ProgressRing animate percent={phase.progress * 100} size={96} stroke={11} label={`${weekLabel(phase.week)}: ${planPct}% do plano`} />
    <p className="tr-ring-cap" aria-hidden="true">{weekLabel(phase.week)}<br />{planPct}% do plano</p>
   </div> : null}
  </div>
  {fresh ? <div className="ed-banner" role="status">
   <p><strong>Treino criado.</strong> Para usá-lo num dia da semana, toque em Trocar treino, no Início.</p>
   <div className="ed-banner-actions">
    <a className="button" href={hrefFor({ tab: 'treino', view: 'executar', id, day: today })}>Começar agora</a>
    <button type="button" className="button secondary" onClick={() => { try { sessionStorage.removeItem(NEW_KEY); } catch { /* sem armazenamento */ } setFresh(false); }}>Entendi</button>
   </div>
  </div> : null}
  {s.ex.length === 0
   ? <span className="button block tr-start" role="link" aria-disabled="true"><Icon name="play" size={22} />Começar treino</span>
   : finishedToday ? <>
    <a className="button block tr-start" href={hrefFor({ tab: 'treino', view: 'concluido', id, day: today })}><Icon name="marca" size={22} weight={2.6} />Ver resultado</a>
    <a className="button secondary block tr-redo" href={hrefFor({ tab: 'treino', view: 'executar', id, day: today })}>Refazer hoje</a>
   </>
   : <a className="button block tr-start" href={hrefFor({ tab: 'treino', view: 'executar', id, day: today })}><Icon name="play" size={22} />{resuming ? 'Continuar treino' : 'Começar treino'}</a>}
  <div className="tr-tabs" role="tablist" aria-label="Seções do treino">
   {TABS.map(t => <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}><Icon name={t.icon} size={20} />{t.id === 'exercicios' ? <>Exercícios<span className="tr-tab-n num">{s.ex.length}</span></> : t.label}</button>)}
  </div>
  {tab === 'exercicios' ? <>{s.ex.length === 0 ? <div className="tr-empty-card"><strong>Este treino ainda não tem exercícios.</strong><p className="muted">Adicione exercícios para poder começar o treino.</p></div> : null}<ul className="tr-stack" aria-label="Exercícios do treino">
   {s.ex.map((exId, i) => {
    const ex = plan.ex[exId];
    if (!ex) return <li key={exId} className="tr-ex"><h3>Exercício removido</h3></li>;
    return <ExerciseCard key={exId} state={state} id={exId} ex={ex} week={week} today={today} treinoId={id} first={i === 0} reveal={rv(i)} onHistory={() => setTab('historico')} />;
   })}
  </ul>
  <a className="button secondary block tr-edit" href={hrefFor({ tab: 'treino', view: 'editar', id })}>Editar treino</a></> : tab === 'detalhes' ? <section className="card tr-panel">
   {s.sub ? <p style={{ marginTop: 0 }}>{s.sub}</p> : null}
   <dl className="facts">
    <div><dt>Duração</dt><dd>{dur ?? 'Não definida'}</dd></div>
    <div><dt>Exercícios</dt><dd>{s.ex.length}</dd></div>
    <div><dt>Séries e repetições</dt><dd>Meta da semana {week + 1} de 12{phase.kind === 'week' && phase.deload ? ' (semana leve)' : ''}</dd></div>
    {phase.kind === 'week' ? <div><dt>Esforço (RIR)</dt><dd>{phase.rir} · pare com {phase.rir} {phase.rir === '1' ? 'repetição' : 'repetições'} ainda sobrando</dd></div> : null}
   </dl>
  </section> : <div>
   {logged.length === 0 ? <p className="tr-empty">Sem registro anterior.</p> : <ul className="tr-stack" aria-label="Histórico do treino">
    {logged.map(d => {
     const rec = state.history.days[d]!;
     const status = statusOf(rec, id);
     const wk = getWorkout(rec, id);
     const several = listWorkouts(rec).length > 1;
     const keys = Object.keys(rec.log ?? {}).filter(k => (rec.log?.[k] ?? []).some(r => r.done === true) && (!several || s.ex.includes(k)));
     return <li key={d} className="tr-ex">
      <div className="tr-hist-top"><h3>{formatDay(d)}</h3><StatusBadge status={status} /></div>
      {wk ? <p className="muted num">{wk.sets} {wk.sets === 1 ? 'série' : 'séries'} · {wk.volume.toLocaleString('pt-BR')} kg de volume</p> : null}
      <ul className="exercise-list">
       {keys.map(k => <li key={k}><strong>{plan.ex[k]?.n ?? 'Exercício removido'}</strong><span>{plural((rec.log![k] ?? []).filter(r => r.done === true).length, 'série feita', 'séries feitas')}</span></li>)}
      </ul>
     </li>;
    })}
   </ul>}
  </div>}
  <p className="tr-aviso">{AVISO_SAUDE}</p>
 </div>;
}
