import { useData } from '../../app/DataProvider';
import { hrefFor } from '../../app/router';
import { getWorkout } from '../../domain/workoutRecord';
import { Icon } from '../../ui/icons';
import type { IconName } from '../../ui/icons';
import { Glyph } from './glyphs';
import { todayIso } from './util';
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
 const exercises = (plan.sess[id]?.ex ?? []).filter(e => (rec?.log?.[e] ?? []).some(r => r.done === true)).length;
 const stats: { label: string; value: string; icon: IconName | 'camadas' | 'barras' }[] = [
  { label: 'Duração', value: durationText((w.finishedAt ?? w.startedAt) - w.startedAt), icon: 'relogio' },
  { label: 'Exercícios', value: String(exercises), icon: 'treino' },
  { label: 'Séries', value: String(w.sets), icon: 'camadas' },
 ];
 return <section className="ok-wrap">
  <div className="ok-mark" aria-hidden="true"><Glyph name="check-grande" size={52} weight={3} /></div>
  <h2 className="ok-title">Treino concluído!</h2>
  <p className="muted ok-sub">{plan.sess[id]?.name ?? 'Treino'} · salvo neste aparelho</p>
  <ul className="ok-stats" aria-label="Resumo do treino">
   {stats.map(s => <li key={s.label}>
    <span className="ok-ico">{s.icon === 'camadas' ? <Glyph name="camadas" size={26} /> : <Icon name={s.icon as IconName} size={26} />}</span>
    <strong className="num">{s.value}</strong><span className="ok-label">{s.label}</span>
   </li>)}
  </ul>
  <p className="ok-volume"><span className="muted">Volume</span> <strong className="num">{w.volume.toLocaleString('pt-BR')} kg</strong></p>
  <div className="ok-actions">
   <a className="button block" href={hrefFor({ tab: 'inicio' })}>Voltar ao início</a>
   <a className="button secondary block" href={hrefFor({ tab: 'treino', view: 'detalhe', id })}>Ver treino</a>
  </div>
 </section>;
}
