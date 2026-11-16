import { mondayOf } from './calendar';
import type { DayIso } from './calendar';

const pad = (n: number) => String(n).padStart(2, '0');

/** Data civil local (do aparelho) de um instante em milissegundos. */
export function localDayOf(ms: number): DayIso {
 const d = new Date(ms);
 return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Início padrão do plano de um usuário novo: a segunda-feira da semana de hoje. */
export function defaultPlanStart(nowMs: number): DayIso {
 return mondayOf(localDayOf(nowMs));
}

/**
 * A data de início foi escolhida (ou veio de dados já existentes)?
 * Só `startConfirmed === false` significa "padrão, ainda não escolhida".
 * Estado sem o campo (versões anteriores, backups) conta como confirmado.
 */
export function isStartConfirmed(settings: { startConfirmed?: unknown } | null | undefined): boolean {
 return settings?.startConfirmed !== false;
}
