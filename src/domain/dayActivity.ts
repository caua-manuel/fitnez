import type { Payload } from '../application/repository';

export type Activity = { kind: 'gym'; sessionId: string } | { kind: 'bjj'; gi: boolean } | { kind: 'volei'; altSessionId?: string } | { kind: 'esporte'; label: string } | { kind: 'rest' };
/** Os cinco tipos de dia originais (ADR 007). Mantido sem `esporte` para não mudar quem já depende dele. */
export type DayType = 'perna' | 'academia' | 'jiujitsu' | 'volei' | 'descanso';
/** Todos os tipos de dia, incluindo o "Esporte" do assistente de início (ADR 008). */
export type AnyDayType = DayType | 'esporte';

/** Rótulo padrão do dia de esporte e tamanho máximo do rótulo na interface (a validação aceita o dobro). */
export const SPORT_LABEL_DEFAULT = 'Esporte';
export const SPORT_LABEL_MAX = 30;

/** Rótulo do dia de esporte salvo na rotina (texto vazio ou ausente = "Esporte"). */
export function sportLabelOf(entry: Payload | undefined | null): string {
 const l = typeof entry?.label === 'string' ? entry.label.trim() : '';
 return l || SPORT_LABEL_DEFAULT;
}

export function activityFor(input: { sched: Payload[]; weekday: number; override?: string; alt?: string }): Activity {
 if (input.override) return { kind: 'gym', sessionId: input.override };
 const s = input.sched[input.weekday];
 if (!s) return { kind: 'rest' };
 if (s.k === 'gym' && typeof s.s === 'string') return { kind: 'gym', sessionId: s.s };
 if (s.k === 'bjj') return { kind: 'bjj', gi: s.gi === true };
 if (s.k === 'volei') return input.alt ? { kind: 'volei', altSessionId: input.alt } : { kind: 'volei' };
 if (s.k === 'esporte') return { kind: 'esporte', label: sportLabelOf(s) };
 return { kind: 'rest' };
}

/**
 * Tipo de dia com os cinco tipos originais. Compatibilidade: um dia de esporte vira `volei` aqui
 * (mesmas metas padrão). Telas novas devem usar `anyDayTypeOf`.
 */
export function dayTypeOf(activity: Activity, sessionName?: string): DayType {
 const t = anyDayTypeOf(activity, sessionName);
 return t === 'esporte' ? 'volei' : t;
}

/** Tipo de dia completo, com `esporte`. */
export function anyDayTypeOf(activity: Activity, sessionName?: string): AnyDayType {
 if (activity.kind === 'bjj') return 'jiujitsu';
 if (activity.kind === 'volei') return 'volei';
 if (activity.kind === 'esporte') return 'esporte';
 if (activity.kind === 'rest') return 'descanso';
 return sessionName && /lower|perna/i.test(sessionName) ? 'perna' : 'academia';
}

/** Nome curto da atividade do dia para a interface (treino de musculação usa o nome do treino). */
export function activityLabel(activity: Activity, sessionName?: string): string {
 if (activity.kind === 'gym') return sessionName ?? 'Treino';
 if (activity.kind === 'bjj') return 'Jiu-jitsu';
 if (activity.kind === 'volei') return 'Vôlei';
 if (activity.kind === 'esporte') return activity.label;
 return 'Descanso';
}
