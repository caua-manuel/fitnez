import type { DayRecord, Exercise } from '../application/repository';
import type { MuscleGroup } from './muscleGroups';
import type { Experience, Place } from './onboarding';
import { setsForWeek } from './workout';

// Trocar exercício só no treino do dia (conteudo-aval-ondas-hevy.md, seção 4). O plano nunca muda:
// a troca fica em DayRecord.swaps[idOriginal] = idNovo, e as séries são gravadas em log[idNovo].

export interface SwapGroup { group: MuscleGroup; pattern: string; academia: readonly string[]; casa_equip: readonly string[]; casa_livre: readonly string[] }

export const SWAP_GROUPS: readonly SwapGroup[] = [
 { group: 'peito', pattern: 'empurrar', academia: ['supino', 'inclinado', 'supino_chao', 'flexao', 'cruc'], casa_equip: ['supino_chao', 'flexao'], casa_livre: ['flexao'] },
 { group: 'costas', pattern: 'puxar vertical', academia: ['puxada', 'barra', 'puxada_elastico'], casa_equip: ['puxada_elastico'], casa_livre: ['remada_mochila'] },
 { group: 'costas', pattern: 'puxar horizontal', academia: ['remada_a', 'remada_b', 'remada_mochila'], casa_equip: ['remada_b', 'remada_mochila'], casa_livre: ['remada_mochila'] },
 { group: 'press', pattern: 'press', academia: ['press_a', 'press_b', 'pike'], casa_equip: ['press_b', 'pike'], casa_livre: ['pike'] },
 { group: 'ombro-lateral', pattern: 'ombro lateral', academia: ['lat_a', 'lat_b'], casa_equip: ['lat_a'], casa_livre: [] },
 { group: 'ombro-posterior', pattern: 'ombro posterior', academia: ['face', 'inverso', 'face_elastico', 'ytw'], casa_equip: ['inverso', 'face_elastico', 'ytw'], casa_livre: ['ytw'] },
 { group: 'biceps', pattern: 'biceps', academia: ['rosca_a', 'rosca_b'], casa_equip: ['rosca_a', 'rosca_b'], casa_livre: [] },
 { group: 'triceps', pattern: 'triceps', academia: ['tri_a', 'tri_b', 'flexao_fechada'], casa_equip: ['tri_b', 'flexao_fechada'], casa_livre: ['flexao_fechada'] },
 { group: 'quadriceps', pattern: 'bilateral', academia: ['agach', 'leg', 'goblet', 'agach_livre', 'sentar_levantar'], casa_equip: ['goblet', 'agach_livre', 'sentar_levantar'], casa_livre: ['agach_livre', 'sentar_levantar'] },
 { group: 'quadriceps', pattern: 'unilateral', academia: ['bulg', 'afundo', 'afundo_livre'], casa_equip: ['bulg', 'afundo', 'afundo_livre'], casa_livre: ['afundo_livre'] },
 { group: 'posterior-gluteos', pattern: 'quadril', academia: ['hip_b', 'hip_l', 'ponte_h', 'ponte', 'ponte_uni'], casa_equip: ['ponte_h', 'ponte', 'ponte_uni'], casa_livre: ['ponte', 'ponte_uni'] },
 { group: 'posterior-gluteos', pattern: 'posterior da coxa', academia: ['stiff', 'mesa', 'nordic', 'stiff_uni'], casa_equip: ['stiff', 'stiff_uni'], casa_livre: ['stiff_uni'] },
 { group: 'panturrilha', pattern: 'panturrilha', academia: ['pant_pe', 'pant_sent', 'pant_degrau'], casa_equip: ['pant_degrau'], casa_livre: ['pant_degrau'] },
 { group: 'core', pattern: 'core', academia: ['pallof', 'deadbug', 'prancha', 'joelhos', 'roll', 'med'], casa_equip: ['deadbug', 'prancha'], casa_livre: ['deadbug', 'prancha'] },
];

/** Fora da troca para `nunca` e `iniciante` (mesma lista do assistente). */
export const BEGINNER_SWAP_EXCLUDED: readonly string[] = ['nordic', 'roll', 'med', 'salto_l', 'salto_b', 'copen_l', 'copen_b', 'barra'];
export const NO_SWAP_TEXT = 'Sem troca equivalente aqui. Você pode fazer depois ou pular hoje.';

const allIds = (g: SwapGroup) => [...g.academia, ...g.casa_equip, ...g.casa_livre];

/**
 * Opções de troca: primeiro o mesmo padrão, depois os outros padrões do mesmo grupo; filtradas pelo local
 * (sem local: academia), sem a própria ID, sem as já presentes no treino do dia e sem as de técnica/impacto
 * maiores para nunca e iniciante. Lista vazia = mostrar NO_SWAP_TEXT.
 */
export function swapOptions(exId: string, place: Place | null | undefined = 'academia', experience: Experience | null | undefined = 'intermediario', present: readonly string[] = []): string[] {
 const own = SWAP_GROUPS.find(g => allIds(g).includes(exId));
 if (!own) return [];
 const where: Place = place ?? 'academia';
 const ordered = [own, ...SWAP_GROUPS.filter(g => g !== own && g.group === own.group)];
 const beginner = experience === 'nunca' || experience === 'iniciante';
 const out: string[] = [];
 for (const g of ordered) for (const id of g[where]) {
  if (id === exId || present.includes(id) || out.includes(id)) continue;
  if (beginner && BEGINNER_SWAP_EXCLUDED.includes(id)) continue;
  out.push(id);
 }
 return out;
}

/** Prescrição do exercício trocado: séries do original (mantém o volume), repetições e descanso do novo. */
export function swapPrescription(original: Exercise, replacement: Exercise, week: number): { sets: number; reps: string; rest: number | undefined } {
 return { sets: setsForWeek(original, week).sets, reps: setsForWeek(replacement, week).reps, rest: replacement.rest };
}

/** Grava a troca só no dia; `to === from` ou null desfaz. Não muta a entrada. */
export function setDaySwap(day: DayRecord | null | undefined, from: string, to: string | null): DayRecord {
 const base: DayRecord = day ? { ...day } : {};
 const swaps: Record<string, string> = { ...((base.swaps as Record<string, string> | undefined) ?? {}) };
 if (to === null || to === from) delete swaps[from]; else swaps[from] = to;
 if (Object.keys(swaps).length) base.swaps = swaps; else delete base.swaps;
 return base;
}

/** Lista de exercícios do treino com as trocas do dia aplicadas (mesma ordem). */
export function exercisesWithSwaps(sessionEx: readonly string[], day: DayRecord | null | undefined): string[] {
 const swaps = (day?.swaps ?? {}) as Record<string, unknown>;
 return sessionEx.map(id => (typeof swaps[id] === 'string' && swaps[id] !== '' ? (swaps[id] as string) : id));
}
