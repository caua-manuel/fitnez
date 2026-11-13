import type { DayIso } from '../../domain/calendar';
import type { DayRecord } from '../../application/repository';

/** Dias com treino de academia concluído (workout.status 'done'). */
export function treinosConcluidos(days: Record<string, DayRecord>): number {
 return Object.values(days).filter(d => d?.workout?.status === 'done').length;
}

/** Soma das refeições marcadas como comidas em todos os dias. */
export function refeicoesRegistradas(days: Record<string, DayRecord>): number {
 let total = 0;
 for (const d of Object.values(days)) {
  const eaten = d?.diet?.eaten as Record<string, unknown> | undefined;
  if (eaten) total += Object.values(eaten).filter(v => v === true).length;
 }
 return total;
}

// A constância não é calculada aqui: Perfil e Evolução usam planConsistency/consistency de src/domain/evolution.ts.

/** Dia local do aparelho (AAAA-MM-DD). */
export function diaLocal(ms: number): DayIso {
 const d = new Date(ms);
 return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
