import { useData } from '../../app/DataProvider';
import type { DayIso } from '../../domain/calendar';
import { exerciseHistory } from '../../domain/records';
import type { HistorySet } from '../../domain/records';
import type { Exercise } from '../../application/repository';
import { Sheet } from '../../ui/Sheet';
import { formatKg } from './util';

/** Quantas sessões a folha mostra (ADR 011, 2.3). */
export const QUICK_HISTORY_LIMIT = 5;

const WEEKDAYS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const utc = (d: DayIso) => { const [y, m, n] = d.split('-').map(Number); return Date.UTC(y!, m! - 1, n!); };

function dateText(day: DayIso): string {
 const [, m, d] = day.split('-').map(Number);
 return `${WEEKDAYS[new Date(utc(day)).getUTCDay()]}, ${d} ${MONTHS[m! - 1]}`;
}
function agoText(day: DayIso, today: DayIso): string {
 const n = Math.round((utc(today) - utc(day)) / 86_400_000);
 return n <= 0 ? 'hoje' : n === 1 ? 'ontem' : `há ${n} dias`;
}

/** Texto curto de uma série conforme a medida do exercício (visível) e por extenso (leitor de tela). */
function setText(ex: Pick<Exercise, 'm'>, s: HistorySet): { short: string; spoken: string } {
 const reps = s.reps ?? 0, kg = s.kg;
 if (ex.m === 's') return { short: `${reps} s`, spoken: `${reps} segundos` };
 if (ex.m === 'rep') return { short: String(reps), spoken: `${reps} repetições` };
 if (ex.m === 'kgs') return kg ? { short: `${formatKg(kg)} × ${reps} s`, spoken: `${formatKg(kg)} quilos por ${reps} segundos` } : { short: `${reps} s`, spoken: `${reps} segundos` };
 if (ex.m === 'bw') return kg ? { short: `+${formatKg(kg)} × ${reps}`, spoken: `${formatKg(kg)} quilos extras, ${reps} repetições` } : { short: String(reps), spoken: `${reps} repetições` };
 return kg !== null ? { short: `${formatKg(kg)} × ${reps}`, spoken: `${formatKg(kg)} quilos, ${reps} repetições` } : { short: String(reps), spoken: `${reps} repetições` };
}
const unitHint = (ex: Pick<Exercise, 'm'>) => ex.m === 'kg' ? 'Carga em kg × repetições' : ex.m === 'bw' ? 'Carga extra em kg × repetições' : ex.m === 'kgs' ? 'Carga em kg × segundos' : ex.m === 's' ? 'Tempo em segundos' : 'Repetições';

/**
 * Folha "histórico rápido" do exercício na execução: as últimas sessões antes de hoje, só séries de trabalho.
 * É uma folha por cima da execução: não navega, então séries digitadas e o descanso continuam como estavam.
 */
export function HistoricoRapido({ exId, day, onClose, onMore }: { exId: string; day: DayIso; onClose: () => void; onMore?: () => void }) {
 const { state } = useData();
 if (!state) return null;
 const ex = state.catalog.plan.ex[exId];
 if (!ex) return null;
 // exerciseHistory já vem do mais recente ao mais antigo e sem aquecimento; hoje fica fora (está na tela).
 const sessions = exerciseHistory(state.history.days, exId, ex).filter(h => h.day < day).slice(0, QUICK_HISTORY_LIMIT);
 return <Sheet title={ex.n} onClose={onClose} className="ex-tap hr-sheet">
  <div className="sheet-body">
   {sessions.length === 0 ? <div className="hr-empty">
    <p><strong>Sem registro anterior.</strong></p>
    <p className="muted">As séries que você concluir hoje aparecem aqui no próximo treino.</p>
   </div> : <>
    <p className="muted hr-hint">{sessions.length === 1 ? 'Última sessão' : `Últimas ${sessions.length} sessões`}, sem aquecimento. {unitHint(ex)}.</p>
    <ol className="hr-list" aria-label={`Últimas sessões de ${ex.n}`}>
     {sessions.map(h => {
      const sets = h.sets.map(s => setText(ex, s));
      return <li key={h.day} className="hr-item">
       <p className="hr-when"><strong>{dateText(h.day)}</strong><span className="muted">{agoText(h.day, day)}</span></p>
       <p className="hr-sets num" aria-label={`${h.sets.length} ${h.sets.length === 1 ? 'série' : 'séries'}: ${sets.map(s => s.spoken).join('; ')}`}>
        {sets.map((s, i) => <span key={i}>{s.short}</span>)}
       </p>
      </li>;
     })}
    </ol>
   </>}
  </div>
  <div className="sheet-actions">
   {onMore ? <button type="button" className="button secondary" onClick={onMore}>Ver exercício</button> : null}
   <button type="button" className="button secondary" data-autofocus onClick={onClose}>Fechar</button>
  </div>
 </Sheet>;
}
