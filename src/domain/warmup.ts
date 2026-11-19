import type { Exercise } from '../application/repository';
import { muscleGroupOf } from './muscleGroups';

// Aquecimento sugerido (conteudo-aval-ondas-hevy.md, seção 5). Percentuais a verificar.

export const WARMUP_COMPOUNDS: readonly string[] = ['agach', 'leg', 'hip_b', 'hip_l', 'stiff', 'supino', 'inclinado', 'supino_chao', 'press_a', 'press_b', 'remada_a', 'remada_b', 'puxada', 'goblet'];
export const WARMUP_TEXT = 'Aquecimento sugerido: séries leves para preparar o movimento. Não contam no volume.';
export const GENERAL_WARMUP_TEXT = 'Comece com 5 min de aquecimento leve, como bicicleta ou caminhada.';

const round25 = (n: number) => Math.round(n / 2.5) * 2.5;

/**
 * Séries de aquecimento sugeridas. `baseKg` = kg do placeholder da 1ª série (null na primeira vez: nada).
 * `earlier` = exercícios que vêm antes neste treino; se algum tem o mesmo grupo, o grupo já está aquecido.
 */
export function warmupSets(input: { exId: string; ex: Exercise; baseKg: number | null; earlier?: ReadonlyArray<{ id: string; ex: Exercise }> }): Array<{ kg: number; reps: number }> {
 const { exId, ex, baseKg } = input;
 if (ex.m !== 'kg' || !WARMUP_COMPOUNDS.includes(exId) || baseKg === null || !Number.isFinite(baseKg) || baseKg < 20) return [];
 const g = muscleGroupOf(exId, ex);
 if (g && (input.earlier ?? []).some(e => muscleGroupOf(e.id, e.ex) === g)) return [];
 const plan: Array<[number, number]> = baseKg >= 40 ? [[0.5, 8], [0.7, 4]] : [[0.5, 8]];
 return plan.map(([p, reps]) => ({ kg: round25(baseKg * p), reps })).filter(s => s.kg >= 2.5 && s.kg < baseKg);
}
export const warmupSuggestion = warmupSets;
