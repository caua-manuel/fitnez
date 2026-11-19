import type { StateV3 } from '../../application/repository';
import { addDays, phaseOf } from '../../domain/calendar';
import type { MuscleGroup } from '../../domain/muscleGroups';
import { DELOAD_LINE, GROUP_HELP, GROUP_STATUS_TEXT, groupStatus, plannedSetsByGroup, weeklySetsByGroup } from '../../domain/weeklySets';
import { weekStreak } from '../../domain/weekStreak';
import { Icon } from '../../ui/icons';
import { GROUP_LABEL } from '../treino/util';

/** Sequência de semanas: só a partir de 2, sem mensagem ao quebrar. */
export function Sequencia({ state, today }: { state: StateV3; today: string }) {
 const s = weekStreak({ days: state.history.days, sched: state.settings.sched, start: state.settings.start, today });
 return s.show ? <p className="ev-hint num sg-streak">{s.count} semanas seguidas</p> : null;
}

/** Séries de trabalho por grupo muscular na semana atual do plano, em barras. */
export function SeriesGrupo({ state, today }: { state: StateV3; today: string }) {
 const phase = phaseOf(state.settings.start, today);
 if (phase.kind !== 'week') return null;
 const plan = state.catalog.plan;
 const monday = addDays(state.settings.start, phase.week * 7);
 const done = weeklySetsByGroup(state.history.days, plan, monday);
 const planned = plannedSetsByGroup(plan, state.settings.sched, phase.week);
 const exp = state.settings.onboarding?.answers?.experience ?? null;
 const groups = (Object.keys(GROUP_LABEL) as MuscleGroup[]).filter(g => (done[g] ?? 0) > 0 || (planned[g] ?? 0) > 0);
 if (!groups.length) return null;
 const max = Math.max(1, ...groups.map(g => Math.max(done[g] ?? 0, planned[g] ?? 0)));
 return <section className="card ev-card" aria-labelledby="ev-sg-title">
  <div className="ev-head"><Icon name="treino" size={24} weight={1.9} /><h2 id="ev-sg-title">Séries por grupo na semana {phase.week + 1}</h2></div>
  {phase.deload ? <p className="ev-hint">{DELOAD_LINE}</p> : null}
  <ul className="sg-list">{groups.map(g => {
   const n = done[g] ?? 0;
   const st = groupStatus({ group: g, sets: n, experience: exp, inProgress: true, deload: phase.deload, planned: planned[g] ?? null });
   return <li key={g}>
    <span>{GROUP_LABEL[g]}</span><strong className="num">{n}{st ? <span className="muted"> · {GROUP_STATUS_TEXT[st]}</span> : null}</strong>
    <div className="ex-bar" aria-hidden="true"><span style={{ width: `${(n / max) * 100}%` }} /></div>
   </li>;
  })}</ul>
  <p className="ev-hint">{GROUP_HELP}</p>
 </section>;
}
