import type { Exercise } from '../application/repository';

export type MuscleGroup = 'peito' | 'costas' | 'ombro-lateral' | 'ombro-posterior' | 'press' | 'biceps' | 'triceps' | 'quadriceps' | 'posterior-gluteos' | 'panturrilha' | 'core';

export const MUSCLE_GROUPS: readonly MuscleGroup[] = ['peito', 'costas', 'ombro-lateral', 'ombro-posterior', 'press', 'biceps', 'triceps', 'quadriceps', 'posterior-gluteos', 'panturrilha', 'core'];
const LOWER: readonly MuscleGroup[] = ['quadriceps', 'posterior-gluteos', 'panturrilha'];

// salto_l, salto_b, farmer, pescoco, copen_l e copen_b ficam sem grupo (null) de propósito: não entram na soma da tabela-alvo.
// Mapa por id das sementes (data/plan.json). Revisão de conteúdo pendente com conteudo-treino-nutricao.
const SEED: Readonly<Record<string, MuscleGroup>> = {
 supino: 'peito', inclinado: 'peito', cruc: 'peito',
 remada_a: 'costas', barra: 'costas', puxada: 'costas', remada_b: 'costas',
 lat_a: 'ombro-lateral', lat_b: 'ombro-lateral',
 face: 'ombro-posterior', inverso: 'ombro-posterior',
 press_a: 'press', press_b: 'press',
 rosca_a: 'biceps', rosca_b: 'biceps',
 tri_a: 'triceps', tri_b: 'triceps',
 agach: 'quadriceps', bulg: 'quadriceps', leg: 'quadriceps', afundo: 'quadriceps',
 stiff: 'posterior-gluteos', nordic: 'posterior-gluteos', hip_l: 'posterior-gluteos', hip_b: 'posterior-gluteos', mesa: 'posterior-gluteos',
 pant_pe: 'panturrilha', pant_sent: 'panturrilha',
 pallof: 'core', joelhos: 'core', roll: 'core', med: 'core',
};

export function muscleGroupOf(exId: string, ex: Exercise): MuscleGroup | null {
 if (ex.g === '') return null; // "sem grupo" escolhido de propósito: não cai no mapa das sementes
 if (typeof ex.g === 'string' && (MUSCLE_GROUPS as readonly string[]).includes(ex.g)) return ex.g as MuscleGroup;
 return Object.prototype.hasOwnProperty.call(SEED, exId) ? SEED[exId] : null;
}

export function isLower(group: MuscleGroup | null): boolean { return group !== null && LOWER.includes(group); }
