import { CheckDraw } from '../../ui/motion';
import type { WeekDay, WeekKind } from './semana';

const CAPTION: Record<WeekKind, string> = { treino: 'Treino', aula: 'Aula', jogo: 'Jogo', esporte: 'Esporte', descanso: 'Descanso' };

/** Faixa da semana: sete círculos (segunda a domingo) com a atividade da rotina e o estado de cada dia. Só leitura. */
export function SemanaFaixa({ days }: { days: WeekDay[] }) {
  return <ol className="in-semana" aria-label="Sua semana">
    {days.map(d => <li key={d.day} className={`in-sem in-sem-${d.status}${d.isToday ? ' is-today' : ''}`} aria-label={d.label} aria-current={d.isToday ? 'date' : undefined}>
      <span className="in-sem-dia" aria-hidden="true">{d.short}</span>
      <span className="in-sem-bola" aria-hidden="true">{d.status === 'feito' ? <CheckDraw size={18} /> : Number(d.day.slice(8))}</span>
      <span className="in-sem-tipo" aria-hidden="true">{d.kind === 'esporte' && d.name.length <= 8 ? d.name : CAPTION[d.kind]}</span>
    </li>)}
  </ol>;
}
