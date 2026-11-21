import { useData } from '../../app/DataProvider';
import type { DayIso } from '../../domain/calendar';
import { upsertExercise } from '../../domain/planEdit';
import { exerciseHistory } from '../../domain/records';
import { STAGNATION_BUTTON, planWeekIndex, stagnation } from '../../domain/stagnation';
import { Icon } from '../../ui/icons';
import { usePlanEditor } from './planActions';

// Aviso de estagnação (ADR 011, 2.6). Regra e textos no domínio (src/domain/stagnation.ts, conteudo-adr-011.md parte C).
// Linha discreta, sem cor de alerta: é orientação, não erro. Semana leve (deload) é só texto.

/**
 * `onSwap`: abre a troca só de hoje (na execução, enquanto nenhuma série do exercício foi feita).
 * Sem `onSwap`, a ação "trocar" fica só no texto.
 */
export function AvisoEstagnacao({ exId, day, onSwap }: { exId: string; day: DayIso; onSwap?: () => void }) {
 const { state } = useData();
 const { withUndo } = usePlanEditor();
 if (!state) return null;
 const plan = state.catalog.plan, ex = plan.ex[exId];
 if (!ex) return null;
 const start = state.settings.start;
 const week = planWeekIndex(start, day);
 const s = stagnation({ ex, sessions: exerciseHistory(state.history.days, exId, ex), start, today: day, week, beginner: Array.isArray(plan.rir) });
 if (!s) return null;
 const adjust = () => {
  if (!s.novaFaixa) return;
  // A faixa nova vale no bloco atual e nos seguintes; os anteriores ficam como estavam (histórico intacto).
  const block = Math.min(2, Math.max(0, Math.floor(week / 4)));
  void withUndo(`Repetições ajustadas para ${s.novaFaixa}`, p => upsertExercise(p, exId, { ...p.ex[exId]!, r: (p.ex[exId]!.r ?? []).map((r, i) => i >= block ? s.novaFaixa! : r) }).plan);
 };
 const action = s.acao === 'repeticoes' && s.novaFaixa ? <button type="button" className="ex-stag-btn" onClick={adjust}>{STAGNATION_BUTTON.repeticoes}</button>
  : s.acao === 'trocar' && onSwap ? <button type="button" className="ex-stag-btn" aria-haspopup="dialog" onClick={onSwap}>{STAGNATION_BUTTON.trocar}</button>
  : null;
 return <div className="ex-stag" role="note" aria-label="Aviso sobre este exercício">
  <Icon name="info" size={18} />
  <p>{s.texto}</p>
  {action}
 </div>;
}
