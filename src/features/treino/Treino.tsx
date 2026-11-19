import { useEffect, useState } from 'react';
import { useData } from '../../app/DataProvider';
import { hrefFor } from '../../app/router';
import type { Route } from '../../app/router';
import { activityFor, activityLabel } from '../../domain/dayActivity';
import { phaseOf, rirSequence, weekLabel } from '../../domain/calendar';
import { Biblioteca } from './Biblioteca';
import { Detalhe } from './Detalhe';
import { Executar } from './Executar';
import { Concluido } from './Concluido';
import { CartaoTreino } from './Cartao';
import { EditarTreino } from './EditarTreino';
import { EditarExercicio } from './EditarExercicio';
import { NovoTreino } from './NovoTreino';
import { Livre } from './Livre';
import { FREE_SESSION_ID } from '../../domain/weekStreak';
import { getWorkout } from '../../domain/workoutRecord';
import { Icon } from '../../ui/icons';
import { WEEKDAYS, minutesLabel, plural, shortDay, statusOf, todayIso, weekDays } from './util';
import { useStagger } from './stagger';
import './treino.css';

const AVISO_SAUDE = 'Calorias, cargas e metas são estimativas e não substituem nutricionista, médico ou educador físico.';
type Tab = 'plano' | 'biblioteca';
let lastTab: Tab = 'plano';

function MeuPlano() {
 const { state } = useData();
 const rv = useStagger('treino-plano');
 if (!state) return null;
 const today = todayIso(), plan = state.catalog.plan;
 const phase = phaseOf(state.settings.start, today, rirSequence(state.catalog.plan));
 const week = phase.kind === 'week' ? phase.week : phase.kind === 'done' ? 11 : 0;
 const days = weekDays(state, week);
 return <div>
  <div className="section-title tr-section">
   <h3>Plano de 12 semanas</h3>
   <p className="muted tr-section-sub">{phase.kind === 'pre' ? `Seu plano começa em ${plural(phase.daysUntil, 'dia', 'dias')}` : phase.kind === 'done' ? 'Plano concluído' : weekLabel(week)}</p>
  </div>
  <ul className="tr-stack" aria-label="Rotina da semana">
   {days.map((day, i) => {
    const rec = state.history.days[day];
    const act = activityFor({ sched: state.settings.sched, weekday: i, override: rec?.over, alt: plan.alt });
    const weekday = WEEKDAYS[i];
    const date = `${weekday} · ${shortDay(day)}`;
    if (act.kind === 'gym') {
     const s = plan.sess[act.sessionId];
     const status = phase.kind === 'week' ? statusOf(rec, act.sessionId) : 'pending';
     if (!s) return <li key={day} {...rv(i)}><CartaoTreino name="Treino removido" date={date} /></li>;
     return <li key={day} {...rv(i)}><CartaoTreino id={act.sessionId} name={s.name} href={hrefFor({ tab: 'treino', view: 'detalhe', id: act.sessionId })} date={date} exercises={plural(s.ex.length, 'exercício', 'exercícios')} minutes={minutesLabel(s.min)} status={phase.kind === 'week' ? status : null} /></li>;
    }
    const label = activityLabel(act);
    const icon = act.kind === 'bjj' ? 'alvo' : act.kind === 'volei' || act.kind === 'esporte' ? 'fogo' : 'lua';
    return <li key={day} {...rv(i)}><CartaoTreino name={label} icon={icon} date={date} menu={false} quiet /></li>;
   })}
  </ul>
 </div>;
}

/** Atalho "Treino de hoje": abre a execução do treino do dia; sem treino de academia hoje, o Início explica o dia. */
function TreinoHoje() {
 const { state } = useData();
 useEffect(() => {
  if (!state) return;
  const day = todayIso(), plan = state.catalog.plan, rec = state.history.days[day];
  const phase = phaseOf(state.settings.start, day, rirSequence(plan));
  const act = phase.kind === 'week' ? activityFor({ sched: state.settings.sched, weekday: phase.weekday, override: rec?.over, alt: plan.alt }) : null;
  const id = act?.kind === 'gym' && plan.sess[act.sessionId] ? act.sessionId : null;
  const view = id && getWorkout(rec, id)?.status === 'done' ? 'concluido' : 'executar';
  // replace: o voltar do celular não cai de novo neste redirecionamento.
  window.location.replace(id ? hrefFor({ tab: 'treino', view, id, day }) : hrefFor({ tab: 'inicio' }));
 }, [state]);
 return <p className="loading" role="status">Abrindo o treino de hoje…</p>;
}

export function Treino({ route }: { route: Extract<Route, { tab: 'treino' }> }) {
 const [tab, setTab] = useState<Tab>(lastTab);
 const choose = (t: Tab) => { lastTab = t; setTab(t); };
 const id = route.id;
 const content = route.view === 'hoje' ? <TreinoHoje />
  : route.view === 'executar' && id ? <Executar key={`${id}|${route.day ?? ''}|${route.ex ?? ''}`} id={id} day={route.day} picked={id === FREE_SESSION_ID ? route.ex : undefined} />
  : route.view === 'detalhe' && id === FREE_SESSION_ID ? <Livre />
  : route.view === 'detalhe' && id ? <Detalhe id={id} />
  : route.view === 'concluido' && id ? <Concluido id={id} day={route.day} />
  : route.view === 'editar' && id ? <EditarTreino key={id} id={id} />
  : route.view === 'exercicio' && id ? <EditarExercicio key={`${id}|${route.ex ?? ''}`} id={id} ex={route.ex} />
  : route.view === 'novo' ? <NovoTreino />
  : <div className="tr-page tone-treino">
   <div className="tr-title tr-title-row">
    <div className="tr-title-text">
     <h2>Meus treinos</h2>
     <p>{tab === 'plano' ? 'Sua rotina semanal do plano' : 'Biblioteca de treinos salvos'}</p>
    </div>
    <a id="treino-novo" data-focus-fallback className="button tr-new" href={hrefFor({ tab: 'treino', view: 'novo' })} aria-label="Novo treino"><Icon name="plus" size={22} weight={2.6} />Novo</a>
   </div>
   <div className="segmented" role="group" aria-label="Seção de treinos">
    <button type="button" aria-pressed={tab === 'plano'} onClick={() => choose('plano')}>Meu plano</button>
    <button type="button" aria-pressed={tab === 'biblioteca'} onClick={() => choose('biblioteca')}>Biblioteca</button>
   </div>
   <a className="tr-livre" href={hrefFor({ tab: 'treino', view: 'detalhe', id: FREE_SESSION_ID })}><Icon name="play" size={20} /><span><strong>Treino livre</strong><span className="muted">Escolha os exercícios na hora</span></span><Icon name="seta" size={20} /></a>
   {tab === 'plano' ? <MeuPlano /> : <Biblioteca />}
   <p className="tr-aviso">{AVISO_SAUDE}</p>
  </div>;
 return content;
}
