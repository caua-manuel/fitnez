import { useData } from '../../app/DataProvider';
import type { DayIso } from '../../domain/calendar';
import { phaseOf, rirSequence } from '../../domain/calendar';
import { thirdClassEligibility } from '../../domain/jiujitsu';
import { Icon } from '../../ui/icons';

const LABEL = { aulas: 'Aulas', sono: 'Sono', cargas: 'Cargas', semana: 'Semana' } as const;

/**
 * Indicador (só sugestão) da 3ª aula de jiu-jitsu. A regra vive em src/domain/jiujitsu.ts; aqui só se lê e se grava a
 * declaração de sono da semana atual em settings.sleepOk[índice da semana].
 */
export function TerceiraAula({ today }: { today: DayIso }) {
 const { state, commit } = useData();
 if (!state) return null;
 const sleepOk = state.settings.sleepOk;
 const el = thirdClassEligibility({ start: state.settings.start, today, days: state.history.days, sleepOkByWeek: sleepOk, plan: state.catalog.plan });
 if (el.status === 'indisponivel') return null;
 const phase = phaseOf(state.settings.start, today, rirSequence(state.catalog.plan));
 const key = phase.kind === 'week' ? String(phase.week) : null;
 const on = key !== null && sleepOk?.[key] === true;
 const toggle = () => { if (key === null) return; void commit(s => {
  const next = { ...(s.settings.sleepOk ?? {}) };
  if (next[key] === true) delete next[key]; else next[key] = true;
  s.settings.sleepOk = next; return s;
 }); };
 return <section className="card in-terceira" aria-labelledby="in-terceira-t">
  <details>
  <summary><span className="in-terceira-s"><h2 id="in-terceira-t">3ª aula de jiu-jitsu</h2><span className="in-sum">{el.summary}</span></span><Icon name="chevron" size={20} /></summary>
  <ul className="in-crit">
   {el.criteria.filter(c => c.key !== 'semana').map(c => {
    const verdict = c.ok === true ? 'atende' : c.ok === false ? 'não atende' : 'sem dados';
    return <li key={c.key}>
     <span className={`in-crit-mark ${c.ok === true ? 'ok' : c.ok === false ? 'no' : 'na'}`} aria-hidden="true">{c.ok === true ? '✓' : c.ok === false ? '✗' : '—'}</span>
     <span><strong>{LABEL[c.key]}: {verdict}</strong><span className="muted">{c.text}</span></span>
    </li>;
   })}
  </ul>
  {el.status === 'ainda-nao' ? <p className="muted in-sug">É só uma sugestão: decida pelo seu corpo.</p> : null}
  {key !== null ? <div className="in-sleep">
   <span id="in-sleep-l">Dormi 7 h ou mais nesta semana</span>
   <span className="in-sleep-state">{on ? 'Ligado' : 'Desligado'}</span>
   <button type="button" role="switch" className="switch" aria-checked={on} aria-labelledby="in-sleep-l" onClick={toggle} />
   <p className="muted in-sleep-help">Conta na avaliação a partir da próxima semana.</p>
  </div> : null}
  </details>
 </section>;
}
