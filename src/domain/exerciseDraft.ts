import type { Exercise } from '../application/repository';
import { muscleGroupOf } from './muscleGroups';
import type { MuscleGroup } from './muscleGroups';

export const RECORD_TYPES: readonly { id: string; label: string; help: string }[] = [
 { id: 'kg', label: 'Carga e repetições', help: 'Você registra o peso e quantas repetições fez.' },
 { id: 'bw', label: 'Peso do corpo + carga extra', help: 'Você registra a carga extra, se houver (0 é só o peso do corpo).' },
 { id: 'rep', label: 'Só repetições', help: 'Você registra apenas as repetições.' },
 { id: 's', label: 'Só tempo', help: 'Você registra o tempo de cada série, em segundos.' },
 { id: 'kgs', label: 'Carga e tempo', help: 'Você registra o peso e o tempo de cada série.' },
];
export const BLOCKS = [
 { label: 'Bloco 1', weeks: 'semanas 1 a 4' },
 { label: 'Bloco 2', weeks: 'semanas 5 a 8' },
 { label: 'Bloco 3', weeks: 'semanas 9 a 12' },
] as const;
export const DEFAULT_REST = 90;
export const REST_STEP = 15;
export const MAX_REST = 1800;
export const MAX_SETS = 12;
export const NAME_MAX = 120;

export interface ExerciseDraft { n: string; g: MuscleGroup | ''; m: string; sets: string[]; reps: string[]; rest: string; t: string }
export type DraftField = 'n' | 'rest' | 'sets0' | 'sets1' | 'sets2' | 'reps0' | 'reps1' | 'reps2';
export type DraftErrors = Partial<Record<DraftField, string>>;

export function emptyDraft(): ExerciseDraft {
 return { n: '', g: '', m: 'kg', sets: ['3', '3', '3'], reps: ['8–12', '8–12', '8–12'], rest: String(DEFAULT_REST), t: '' };
}

export function draftFrom(exId: string, ex: Exercise): ExerciseDraft {
 const pick = <T,>(list: T[] | undefined, i: number, fallback: T): T => list?.[i] ?? list?.[0] ?? fallback;
 return {
  n: ex.n, g: muscleGroupOf(exId, ex) ?? '', m: ex.m,
  sets: [0, 1, 2].map(i => String(pick(ex.s, i, 3))),
  reps: [0, 1, 2].map(i => pick(ex.r, i, '')),
  rest: String(typeof ex.rest === 'number' ? ex.rest : DEFAULT_REST), t: ex.t ?? '',
 };
}

/** Soma ou subtrai um passo de um campo numérico de texto, respeitando limites. Texto inválido parte do mínimo. */
export function stepText(text: string, delta: number, min: number, max: number): string {
 const n = /^\d+$/.test(text.trim()) ? Number(text.trim()) : min;
 return String(Math.min(max, Math.max(min, n + delta)));
}

/** "1 min 30 s", "45 s", "2 min". */
export function restLabel(sec: number): string {
 if (!Number.isFinite(sec) || sec < 0) return '';
 if (sec < 60) return `${sec} s`;
 const m = Math.floor(sec / 60), s = sec % 60;
 return s ? `${m} min ${s} s` : `${m} min`;
}

const DASH_RANGE = /(\d)\s*-\s*(\d)/g;

export function validateDraft(d: ExerciseDraft, base?: Exercise): { errors: DraftErrors; value?: Exercise } {
 const errors: DraftErrors = {};
 const n = d.n.trim();
 if (!n) errors.n = 'Informe o nome do exercício.';
 else if (n.length > NAME_MAX) errors.n = `Use no máximo ${NAME_MAX} caracteres.`;
 const sets = d.sets.map((s, i) => {
  const t = s.trim();
  if (!/^\d+$/.test(t)) { errors[`sets${i}` as DraftField] = 'Use um número inteiro de séries, por exemplo 3.'; return 0; }
  const v = Number(t);
  if (v < 1 || v > MAX_SETS) errors[`sets${i}` as DraftField] = `Use de 1 a ${MAX_SETS} séries.`;
  return v;
 });
 const reps = d.reps.map((r, i) => {
  const t = r.trim().replace(DASH_RANGE, '$1–$2');
  if (!t) errors[`reps${i}` as DraftField] = 'Informe as repetições, por exemplo 8–12.';
  else if (t.length > 24) errors[`reps${i}` as DraftField] = 'Use no máximo 24 caracteres.';
  return t;
 });
 const restText = d.rest.trim();
 let rest = 0;
 if (!restText) errors.rest = 'Informe o descanso em segundos. Use 0 para não ter descanso.';
 else if (!/^\d+$/.test(restText)) errors.rest = 'Use só números inteiros, em segundos, por exemplo 90.';
 else { rest = Number(restText); if (rest > MAX_REST) errors.rest = `O descanso vai até ${MAX_REST} segundos (${restLabel(MAX_REST)}).`; }
 if (!RECORD_TYPES.some(t => t.id === d.m)) return { errors };
 if (Object.keys(errors).length) return { errors };
 const value: Exercise = { ...(base ?? {}), n, s: sets, r: reps, m: d.m, rest, g: d.g };
 const note = d.t.trim();
 if (note) value.t = note; else delete value.t;
 return { errors, value };
}

/** Duração opcional: número ("55") ou faixa ("70 a 80"), com "min" opcional. */
export function validateSessionFields(f: { name: string; sub: string; min: string }): { errors: Partial<Record<'name' | 'sub' | 'min', string>>; value?: { name: string; sub?: string; min?: string } } {
 const errors: Partial<Record<'name' | 'sub' | 'min', string>> = {};
 const name = f.name.trim(), sub = f.sub.trim(), min = f.min.trim().replace(/(\d)\s*-\s*(\d)/g, '$1 a $2');
 if (!name) errors.name = 'Informe o nome do treino.';
 else if (name.length > NAME_MAX) errors.name = `Use no máximo ${NAME_MAX} caracteres.`;
 if (sub.length > 160) errors.sub = 'Use no máximo 160 caracteres.';
 if (min && !/^\d{1,3}(\s*(a|–)\s*\d{1,3})?(\s*min)?$/i.test(min)) errors.min = 'Use minutos, por exemplo 55 ou 70 a 80.';
 if (Object.keys(errors).length) return { errors };
 const value: { name: string; sub?: string; min?: string } = { name };
 if (sub) value.sub = sub;
 if (min) value.min = min;
 return { errors, value };
}
