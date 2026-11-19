import type { DayRecord, Exercise, Payload, Plan } from '../application/repository';
import { addDays, type DayIso } from './calendar';
import { muscleGroupOf, type MuscleGroup } from './muscleGroups';
import type { Experience } from './onboarding';
import { workingSets } from './setPlaceholder';
import { setsForWeek } from './workout';

// Séries semanais por grupo muscular (conteudo-aval-ondas-hevy.md, seção 3). Faixas a verificar.

export const BIG_GROUPS: readonly MuscleGroup[] = ['peito', 'costas', 'quadriceps', 'posterior-gluteos'];
export const SMALL_GROUPS: readonly MuscleGroup[] = ['press', 'ombro-lateral', 'ombro-posterior', 'biceps', 'triceps', 'panturrilha'];
export const GROUP_RANGES: Readonly<Record<Experience, { big: [number, number]; small: [number, number] }>> = {
 nunca: { big: [4, 8], small: [2, 6] },
 iniciante: { big: [6, 10], small: [3, 8] },
 intermediario: { big: [8, 16], small: [4, 10] },
};
export const GROUP_STATUS_TEXT = { abaixo: 'abaixo da faixa', dentro: 'dentro da faixa', acima: 'acima da faixa' } as const;
export const GROUP_HELP = 'Faixa de referência para sua experiência. Não é regra: dor, cansaço e sono também contam.';
export const DELOAD_LINE = 'Semana leve: menos séries é o esperado';

/** Séries de trabalho concluídas por grupo nos 7 dias a partir de `monday` (segunda a domingo). Aquecimento e exercícios sem grupo ficam fora. */
export function weeklySetsByGroup(days: Record<string, DayRecord>, plan: Pick<Plan, 'ex'>, monday: DayIso): Partial<Record<MuscleGroup, number>> {
 const out: Partial<Record<MuscleGroup, number>> = {};
 for (let i = 0; i < 7; i++) {
  const log = days[addDays(monday, i)]?.log ?? {};
  for (const [exId, rows] of Object.entries(log)) {
   const g = muscleGroupOf(exId, plan.ex[exId] ?? ({} as Exercise));
   if (!g) continue;
   const n = workingSets(rows).filter(s => s.done).length;
   if (n) out[g] = (out[g] ?? 0) + n;
  }
 }
 return out;
}

/** Faixa do grupo para a experiência (sem experiência: intermediário). `core` e sem grupo: null (sem rótulo). */
export function groupRange(group: MuscleGroup | null, experience?: Experience | null): { min: number; max: number } | null {
 const r = GROUP_RANGES[experience ?? 'intermediario'] ?? GROUP_RANGES.intermediario;
 const pair = group && BIG_GROUPS.includes(group) ? r.big : group && SMALL_GROUPS.includes(group) ? r.small : null;
 return pair ? { min: pair[0], max: pair[1] } : null;
}

/** Séries previstas por grupo na semana `week` (0 a 11): soma, nos dias `gym` da rotina, de setsForWeek de cada exercício do treino. */
export function plannedSetsByGroup(plan: Pick<Plan, 'ex' | 'sess'>, sched: readonly Payload[], week: number): Partial<Record<MuscleGroup, number>> {
 const out: Partial<Record<MuscleGroup, number>> = {};
 for (const d of sched) {
  if (d?.k !== 'gym' || typeof d.s !== 'string') continue;
  for (const id of plan.sess[d.s]?.ex ?? []) {
   const ex = plan.ex[id];
   if (!ex) continue;
   const g = muscleGroupOf(id, ex);
   if (g) out[g] = (out[g] ?? 0) + setsForWeek(ex, week).sets;
  }
 }
 return out;
}

export type GroupStatus = 'abaixo' | 'dentro' | 'acima';
/**
 * Rótulo do grupo; null = sem rótulo (semana leve, core/sem grupo, ou "abaixo" com a semana em andamento).
 * `planned` (opcional, de plannedSetsByGroup): o piso passa a ser min(mínimo da faixa, planned).
 */
export function groupStatus(input: { group: MuscleGroup | null; sets: number; experience?: Experience | null; inProgress: boolean; deload: boolean; planned?: number | null }): GroupStatus | null {
 if (input.deload) return null;
 const r = groupRange(input.group, input.experience);
 if (!r) return null;
 const floor = typeof input.planned === 'number' && Number.isFinite(input.planned) ? Math.min(r.min, input.planned) : r.min;
 if (input.sets < floor) return input.inProgress ? null : 'abaixo';
 return input.sets > r.max ? 'acima' : 'dentro';
}
