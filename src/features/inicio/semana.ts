import { activityFor } from '../../domain/dayActivity';
import { addDays, mondayOf } from '../../domain/calendar';
import type { DayIso } from '../../domain/calendar';
import { hasAnyDone } from '../../domain/workoutRecord';
import type { DayRecord, Plan, Payload } from '../../application/repository';

export type WeekKind = 'treino' | 'aula' | 'jogo' | 'descanso';
export type WeekStatus = 'feito' | 'pendente' | 'hoje' | 'previsto' | 'livre';
export interface WeekDay { weekday: number; day: DayIso; short: string; long: string; kind: WeekKind; name: string; status: WeekStatus; isToday: boolean; label: string }

const SHORT = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
const LONG = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
const STATUS_TEXT: Record<WeekStatus, string> = { feito: ', feito', pendente: ', pendente', hoje: ', hoje', previsto: ', previsto', livre: '' };

/**
 * Os 7 dias (segunda a domingo) da semana de `today`, com a atividade da rotina e o estado de cada um.
 * Feito vem dos registros reais; sem registro, passado = pendente, hoje = hoje, futuro = previsto.
 * Antes do plano (`preplan`), dias sem registro ficam como previstos. Descanso não tem pendência.
 * Função pura, sem dados fictícios.
 */
export function weekStrip(input: { sched: Payload[]; plan: Plan; days: Record<string, DayRecord>; today: DayIso; preplan?: boolean }): WeekDay[] {
  const monday = mondayOf(input.today);
  return Array.from({ length: 7 }, (_, weekday) => {
    const day = addDays(monday, weekday);
    const record: DayRecord | undefined = input.days[day];
    const act = activityFor({ sched: input.sched, weekday, override: record?.over, alt: input.plan.alt });
    let kind: WeekKind; let name: string; let done: boolean;
    if (act.kind === 'gym') { kind = 'treino'; name = input.plan.sess[act.sessionId]?.name ?? 'Treino'; done = hasAnyDone(record); }
    else if (act.kind === 'bjj') { kind = 'aula'; name = 'Jiu-jitsu'; done = record?.acts?.bjj === true; }
    else if (act.kind === 'volei') { kind = 'jogo'; name = 'Vôlei'; done = record?.acts?.volei === true || hasAnyDone(record); }
    else { kind = 'descanso'; name = 'Descanso'; done = false; }
    const isToday = day === input.today;
    const status: WeekStatus = done ? 'feito' : isToday ? 'hoje' : kind === 'descanso' ? 'livre' : input.preplan || day > input.today ? 'previsto' : 'pendente';
    return { weekday, day, short: SHORT[weekday], long: LONG[weekday], kind, name, status, isToday, label: `${LONG[weekday]}: ${name}${STATUS_TEXT[status]}` };
  });
}
