import { useState } from 'react';
import { useData } from '../../app/DataProvider';
import { hrefFor } from '../../app/router';
import type { Route } from '../../app/router';
import { activityFor } from '../../domain/dayActivity';
import { phaseOf, weekLabel } from '../../domain/calendar';
import { Biblioteca } from './Biblioteca';
import { Detalhe } from './Detalhe';
import { Executar } from './Executar';
import { Concluido } from './Concluido';
import { CartaoTreino } from './Cartao';
import { EditarTreino } from './EditarTreino';
import { EditarExercicio } from './EditarExercicio';
import { NovoTreino } from './NovoTreino';
import { Icon } from '../../ui/icons';
import { WEEKDAYS, minutesLabel, plural, shortDay, statusOf, todayIso, weekDays } from './util';
import './treino.css';

const AVISO_SAUDE = 'Calorias, cargas e metas são estimativas e não substituem nutricionista, médico ou educador físico.';
type Tab = 'plano' | 'biblioteca';
let lastTab: Tab = 'plano';

function MeuPlano() {
 const { state } = useData();
 if (!state) return null;
 const today = todayIso(), plan = state.catalog.plan;
 const phase = phaseOf(state.settings.start, today);
 const week = phase.kind === 'week' ? phase.week : phase.kind === 'done' ? 11 : 0;
 const days = weekDays(state, week);
 return <div>
  <div className="section-title tr-section">
   <h3>Plano (12 semanas)</h3>
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
     if (!s) return <li key={day}><CartaoTreino name="Treino removido" date={date} /></li>;
     return <li key={day}><CartaoTreino id={act.sessionId} name={s.name} href={hrefFor({ tab: 'treino', view: 'detalhe', id: act.sessionId })} date={date} exercises={plural(s.ex.length, 'exercício', 'exercícios')} minutes={minutesLabel(s.min)} status={phase.kind === 'week' ? status : null} /></li>;
    }
    const label = act.kind === 'bjj' ? 'Jiu-jitsu' : act.kind === 'volei' ? 'Vôlei' : 'Descanso';
    const icon = act.kind === 'bjj' ? 'alvo' : act.kind === 'volei' ? 'fogo' : 'lua';
    return <li key={day}><CartaoTreino name={label} icon={icon} date={date} menu={false} /></li>;
   })}
  </ul>
 </div>;
}

export function Treino({ route }: { route: Extract<Route, { tab: 'treino' }> }) {
 const [tab, setTab] = useState<Tab>(lastTab);
 const choose = (t: Tab) => { lastTab = t; setTab(t); };
 const id = route.id;
 const content = route.view === 'executar' && id ? <Executar key={`${id}|${route.day ?? ''}`} id={id} day={route.day} />
  : route.view === 'detalhe' && id ? <Detalhe id={id} />
  : route.view === 'concluido' && id ? <Concluido id={id} day={route.day} />
  : route.view === 'editar' && id ? <EditarTreino key={id} id={id} />
  : route.view === 'exercicio' && id ? <EditarExercicio key={`${id}|${route.ex ?? ''}`} id={id} ex={route.ex} />
  : route.view === 'novo' ? <NovoTreino />
  : <div className="tr-page">
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
   {tab === 'plano' ? <MeuPlano /> : <Biblioteca />}
   <p className="tr-aviso">{AVISO_SAUDE}</p>
  </div>;
 return content;
}
