import { useData } from '../../app/DataProvider';
import { hrefFor } from '../../app/router';
import { getWorkout } from '../../domain/workoutRecord';
import { Icon } from '../../ui/icons';
import type { IconName } from '../../ui/icons';
import { Glyph } from './glyphs';
import { freeExercises, todayIso } from './util';
import { FREE_SESSION_ID } from '../../domain/weekStreak';
import { CheckDraw } from '../../ui/motion';
import { previousSessionVolume, recordsOfDay, volumeComparison } from '../../domain/records';
import { exercisesWithSwaps } from '../../domain/swap';
import { recordShort } from './recordText';
import './treino.css';


function durationText(ms: number): string {
 const min = Math.round(ms / 60000);
 if (min < 1) return '< 1 min';
 if (min < 60) return `${min} min`;
 return `${Math.floor(min / 60)} h ${String(min % 60).padStart(2, '0')} min`;
}

export function Concluido({ id, day: dayParam }: { id: string; day?: string }) {
 const { state } = useData();
 if (!state) return null;
 const day = dayParam ?? todayIso();
 const rec = state.history.days[day], w = getWorkout(rec, id);
 const plan = state.catalog.plan;
 if (!w || w.status !== 'done') {
  return <section className="card"><p>Não há treino concluído para este dia.</p><a className="tr-back" href={hrefFor({ tab: 'treino', view: 'detalhe', id })}>← Voltar ao treino</a></section>;
 }
 const free = id === FREE_SESSION_ID;
 const ids = free ? freeExercises(state, day) : exercisesWithSwaps(plan.sess[id]?.ex ?? [], rec);
 const exercises = ids.filter(e => (rec?.log?.[e] ?? []).some(r => r.done === true)).length;
 const stats: { label: string; value: string | number; icon: IconName | 'camadas' | 'barras' }[] = [
  { label: 'Duração', value: durationText((w.finishedAt ?? w.startedAt) - w.startedAt), icon: 'relogio' },
  { label: 'Exercícios', value: exercises, icon: 'treino' },
  { label: 'Séries', value: w.sets, icon: 'camadas' },
 ];
 const recs = recordsOfDay(state.history.days, plan, day, ids);
 const cmp = volumeComparison(w.volume, free ? null : previousSessionVolume(state.history.days, id, day));
 const recText = recs.slice(0, 3).map(r => recordShort(plan.ex[r.exId]?.n ?? 'Exercício', r)).join(' · ') + (recs.length > 3 ? ` e mais ${recs.length - 3}` : '');
 return <section className="ok-wrap tone-treino">
  <div className="ok-mark" aria-hidden="true"><CheckDraw play size={52} /></div>
  <h2 className="ok-title">Treino concluído!</h2>
  <p className="muted ok-sub">{free ? 'Treino livre' : plan.sess[id]?.name ?? 'Treino'} · salvo neste aparelho</p>
  <ul className="ok-stats" aria-label="Resumo do treino">
   {stats.map(s => <li key={s.label}>
    <span className="ok-ico">{s.icon === 'camadas' ? <Glyph name="camadas" size={26} /> : <Icon name={s.icon as IconName} size={26} />}</span>
    <strong className="num">{s.value}</strong><span className="ok-label">{s.label}</span>
   </li>)}
  </ul>
  <p className="ok-volume"><span className="muted">Volume</span> <strong className="num">{w.volume.toLocaleString('pt-BR')} kg</strong>{cmp.pct !== null ? <span className="muted num">{cmp.pct > 0 ? '+' : cmp.pct < 0 ? '−' : ''}{Math.abs(cmp.pct)}% em relação à última vez</span> : null}</p>
  {recs.length ? <p className="ex-pr ok-pr"><Glyph name="trofeu" size={18} /><span><strong>Recordes de hoje:</strong> {recText}</span></p> : null}
  <div className="ok-actions">
   <a className="button block" href={hrefFor({ tab: 'inicio' })}>Voltar ao início</a>
   {free ? null : <a className="button secondary block" href={hrefFor({ tab: 'treino', view: 'detalhe', id })}>Ver treino</a>}
  </div>
 </section>;
}
