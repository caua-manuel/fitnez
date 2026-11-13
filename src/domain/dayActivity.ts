import type { Payload } from '../application/repository';

export type Activity = { kind: 'gym'; sessionId: string } | { kind: 'bjj'; gi: boolean } | { kind: 'volei'; altSessionId?: string } | { kind: 'rest' };
export type DayType = 'perna' | 'academia' | 'jiujitsu' | 'volei' | 'descanso';

export function activityFor(input: { sched: Payload[]; weekday: number; override?: string; alt?: string }): Activity {
 if (input.override) return { kind: 'gym', sessionId: input.override };
 const s = input.sched[input.weekday];
 if (!s) return { kind: 'rest' };
 if (s.k === 'gym' && typeof s.s === 'string') return { kind: 'gym', sessionId: s.s };
 if (s.k === 'bjj') return { kind: 'bjj', gi: s.gi === true };
 if (s.k === 'volei') return input.alt ? { kind: 'volei', altSessionId: input.alt } : { kind: 'volei' };
 return { kind: 'rest' };
}

export function dayTypeOf(activity: Activity, sessionName?: string): DayType {
 if (activity.kind === 'bjj') return 'jiujitsu';
 if (activity.kind === 'volei') return 'volei';
 if (activity.kind === 'rest') return 'descanso';
 return sessionName && /lower|perna/i.test(sessionName) ? 'perna' : 'academia';
}
