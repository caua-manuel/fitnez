import { parseNumber } from './workout';

// Perfil físico (todos os campos físicos são opcionais). Funções puras; sem acesso a dados.
export interface Profile { name: string; goal: string; age?: number; weightKg?: number; heightCm?: number }
export interface ProfileInput { name?: string | null; goal?: string | null; age?: string | number | null; weightKg?: string | number | null; heightCm?: string | number | null }
export type ProfileResult = { ok: true; value: Profile } | { ok: false; errors: Record<string, string> };

export const DEFAULT_PROTEIN_G = 185;
export const DEFAULT_FAT_G = 55;
export const DEFAULT_PROTEIN_G_PER_KG = 2.4;
const WEIGHT = { min: 30, max: 300 };
const empty = (v: unknown) => v === undefined || v === null || (typeof v === 'string' && v.trim() === '');
const validWeight = (w: unknown): w is number => typeof w === 'number' && Number.isFinite(w) && w >= WEIGHT.min && w <= WEIGHT.max;

export function validateProfile(input: ProfileInput): ProfileResult {
 const errors: Record<string, string> = {};
 const value: Profile = { name: (input.name ?? '').trim(), goal: (input.goal ?? '').trim() };
 if (value.name.length > 60) errors.name = 'Nome: use no máximo 60 caracteres.';
 if (value.goal.length > 140) errors.goal = 'Objetivo: use no máximo 140 caracteres.';
 const int = (key: 'age' | 'heightCm', label: string, min: number, max: number, unit: string) => {
  const raw = input[key];
  if (empty(raw)) return;
  const n = parseNumber(typeof raw === 'string' ? raw.trim() : raw);
  const suffix = unit ? ` ${unit}` : '';
  if (n === null || !Number.isInteger(n)) errors[key] = `${label}: use um número inteiro, sem vírgula. Exemplo: ${min === 10 ? '30' : '175'}.`;
  else if (n < min || n > max) errors[key] = `${label}: informe um valor entre ${min} e ${max}${suffix}.`;
  else value[key] = n;
 };
 int('age', 'Idade', 10, 100, 'anos');
 int('heightCm', 'Altura', 100, 250, 'cm');
 if (!empty(input.weightKg)) {
  const n = parseNumber(typeof input.weightKg === 'string' ? input.weightKg.trim() : input.weightKg);
  if (n === null) errors.weightKg = 'Peso: use só números, com vírgula ou ponto. Exemplo: 78,2.';
  else if (n < WEIGHT.min || n > WEIGHT.max) errors.weightKg = `Peso: informe um valor entre ${WEIGHT.min} e ${WEIGHT.max} kg.`;
  else value.weightKg = n;
 }
 return Object.keys(errors).length ? { ok: false, errors } : { ok: true, value };
}

/** Meta de proteína (g): peso x g/kg arredondado; 185 g quando o peso é ausente ou inválido (30 a 300 kg). */
export function proteinTargetG(weightKg?: number | null, gPerKg = DEFAULT_PROTEIN_G_PER_KG): number {
 return validWeight(weightKg) ? Math.round(weightKg * gPerKg) : DEFAULT_PROTEIN_G;
}

export function dietTargetsFromProfile(profile?: { weightKg?: number } | null): { protein: number; fat: number } {
 return { protein: proteinTargetG(profile?.weightKg), fat: DEFAULT_FAT_G };
}
