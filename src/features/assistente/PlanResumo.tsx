import { activityFor, activityLabel } from '../../domain/dayActivity';
import type { Payload, Plan } from '../../application/repository';

// Resumo de plano comum ao assistente e à revisão de um plano compartilhado (ADR 011, 1.3).

const WD = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
const WD_LONG = ['segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado', 'domingo'];

/** Semana tipo: o que cada dia da rotina tem (treino pelo nome, atividade ou descanso). */
export function SemanaTipo({ sched, plan }: { sched: Payload[]; plan: Pick<Plan, 'sess'> }) {
 return <dl className="as-week">{WD.map((w, d) => {
  const act = activityFor({ sched, weekday: d });
  const sess = act.kind === 'gym' ? plan.sess[act.sessionId] : undefined;
  return <div key={d}><dt><abbr title={WD_LONG[d]}>{w}</abbr></dt><dd className={act.kind === 'rest' ? 'muted' : undefined}>{sess ? sess.name : activityLabel(act)}</dd></div>;
 })}</dl>;
}

/** Lista curta dos treinos do plano, na ordem, com quantos exercícios cada um tem. */
export function TreinosDoPlano({ plan }: { plan: Pick<Plan, 'sess' | 'order'> }) {
 const ids = plan.order.filter(id => plan.sess[id]);
 return <ul className="as-sess">{ids.map(id => { const s = plan.sess[id]!; return <li key={id}><strong>{s.name}</strong><span className="muted">{s.ex.length} {s.ex.length === 1 ? 'exercício' : 'exercícios'}</span></li>; })}</ul>;
}
