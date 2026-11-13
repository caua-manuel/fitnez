import { parseNumber } from './workout';
import type { DayIso } from './calendar';

// Validação pura do registro de medidas (Evolução). Sem relógio nem acesso a dados: a data de "hoje" entra como argumento.
// Chaves legadas de history.measurements[data]: p peso (kg), c cintura, t coxa, b braço (cm).
export type MeasureField = 'p' | 'c' | 't' | 'b';
export interface MeasureLimit { label: string; unit: 'kg' | 'cm'; min: number; max: number }

export const MEASURE_LIMITS: Record<MeasureField, MeasureLimit> = {
 p: { label: 'Peso', unit: 'kg', min: 30, max: 300 },
 c: { label: 'Cintura', unit: 'cm', min: 10, max: 250 },
 t: { label: 'Coxa', unit: 'cm', min: 10, max: 250 },
 b: { label: 'Braço', unit: 'cm', min: 10, max: 250 },
};
const ORDER: MeasureField[] = ['p', 'c', 't', 'b'];

export interface MeasurementInput { date: string; today: DayIso; values: Partial<Record<MeasureField, string>> }
export interface MeasurementValue { date: DayIso; values: Partial<Record<MeasureField, string>> }
export type MeasurementResult = { ok: true; value: MeasurementValue } | { ok: false; errors: Record<string, string> };

const range = (n: number) => String(n).replace('.', ',');
const isRealDate = (iso: string) => {
 if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;
 const [y, m, d] = iso.split('-').map(Number);
 const dt = new Date(Date.UTC(y, m - 1, d));
 return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
};

/**
 * Valida data (não pode ser futura) e medidas preenchidas (vírgula ou ponto decimal, dentro de limites plausíveis).
 * Campos vazios são ignorados; sem nenhum preenchido, o erro fica na chave "form". Os valores válidos saem como texto aparado
 * (ex.: "78,2"), o formato que o histórico já guarda. Erros por campo usam as chaves p, c, t, b e date.
 */
export function validateMeasurement(input: MeasurementInput): MeasurementResult {
 const errors: Record<string, string> = {};
 if (!isRealDate(input.date)) errors.date = 'Informe uma data válida.';
 else if (input.date > input.today) errors.date = 'A data não pode ser futura. Escolha hoje ou um dia anterior.';
 const values: Partial<Record<MeasureField, string>> = {};
 let filled = 0;
 for (const key of ORDER) {
  const raw = (input.values[key] ?? '').trim();
  if (raw === '') continue;
  filled++;
  const { label, unit, min, max } = MEASURE_LIMITS[key];
  const n = parseNumber(raw);
  if (n === null) errors[key] = `${label}: use só números, com vírgula ou ponto. Exemplo: 78,2.`;
  else if (n < min || n > max) errors[key] = `${label}: informe um valor entre ${range(min)} e ${range(max)} ${unit}.`;
  else values[key] = raw;
 }
 if (filled === 0) errors.form = 'Preencha pelo menos uma medida.';
 if (Object.keys(errors).length) return { ok: false, errors };
 return { ok: true, value: { date: input.date, values } };
}
