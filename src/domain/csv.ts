import type { DayRecord, Payload, Plan } from '../application/repository';
import { dayTotals, type Consumed, type DietDay, type DietOption, type MealKey } from './diet';
import { listWorkouts } from './workoutRecord';

// Exportação CSV (funções puras). Sem relógio, sem DOM e sem acesso a dados: a interface entrega o estado e a data de hoje.
// Formato pensado para planilhas em pt-BR: separador ";", quebra CRLF, vírgula decimal e BOM opcional (acentos no Excel).
// Segurança: texto que começa com = + - @ TAB ou CR recebe apóstrofo, para a planilha não o interpretar como fórmula.
// Números (tipo number) nunca recebem apóstrofo, inclusive negativos.

export type CsvCell = string | number | boolean | null | undefined;
export interface CsvOptions { separator?: string; bom?: boolean }
export type CsvKind = 'cargas' | 'medidas' | 'dieta';

const BOM = '﻿';
const FORMULA_START = /^[=+\-@\t\r]/;
const MEALS: MealKey[] = ['cafe', 'almoco', 'lanche', 'pos', 'jantar'];
const MEAL_NAME: Record<MealKey, string> = { cafe: 'Café da manhã', almoco: 'Almoço', lanche: 'Pré-treino ou lanche', pos: 'Pós-treino', jantar: 'Jantar' };
const YES = 'sim';
const NO = 'não';

function cellText(value: CsvCell): string {
 if (value === null || value === undefined) return '';
 if (typeof value === 'number') return Number.isFinite(value) ? String(value).replace('.', ',') : '';
 if (typeof value === 'boolean') return value ? YES : NO;
 const text = String(value);
 return FORMULA_START.test(text) ? `'${text}` : text;
}

/** Monta o CSV. Padrão: separador ";", linhas com CRLF, sem BOM. Valores nulos e números não finitos viram célula vazia. */
export function toCsv(rows: ReadonlyArray<ReadonlyArray<CsvCell>>, options: CsvOptions = {}): string {
 const separator = options.separator || ';';
 const body = rows.map(row => row.map(value => {
  const text = cellText(value);
  return text.includes('"') || text.includes(separator) || text.includes('\n') || text.includes('\r') ? `"${text.replace(/"/g, '""')}"` : text;
 }).join(separator)).join('\r\n');
 return options.bom ? BOM + body : body;
}

/** Nome do arquivo: fitnez-<tipo>-<data>.csv. A data (AAAA-MM-DD) vem de quem chama. */
export function csvFilename(kind: CsvKind, date: string): string {
 return `fitnez-${kind}-${String(date).replace(/[^0-9-]/g, '')}.csv`;
}

const isObject = (v: unknown): v is Record<string, any> => !!v && typeof v === 'object' && !Array.isArray(v);
const finite = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const text = (v: unknown): string => (typeof v === 'string' ? v : typeof v === 'number' && Number.isFinite(v) ? String(v) : '');
const round2 = (n: number) => Math.round(n * 100) / 100;
const sortedDates = (record: unknown): string[] => (isObject(record) ? Object.keys(record).sort() : []);

/** Valor digitado: número simples ("22,5" ou "22.5") vira número com vírgula decimal; qualquer outro texto é mantido como está. */
function typed(value: unknown): CsvCell {
 if (typeof value === 'number') return finite(value);
 if (typeof value !== 'string') return null;
 const t = value.trim();
 if (/^\d{1,12}([.,]\d{1,6})?$/.test(t)) return Number(t.replace(',', '.'));
 return t;
}

/**
 * Cargas: uma linha por série registrada, por data crescente; dentro do dia, na ordem em que os exercícios foram gravados.
 * Séries sem carga, sem repetições e não concluídas são omitidas (a numeração das demais é preservada).
 * Exercício que não existe mais no plano sai como "Exercício removido", sem treino nem grupo muscular.
 */
export function exportLoadsCsv(days: Record<string, DayRecord> | null | undefined, plan: Plan | null | undefined): string {
 const rows: CsvCell[][] = [['data', 'treino', 'exercício', 'grupo muscular', 'série', 'carga (kg)', 'repetições', 'concluída']];
 const sessions = isObject(plan?.sess) ? plan!.sess : {};
 const has = (sessionId: string, exId: string) => Array.isArray(sessions[sessionId]?.ex) && sessions[sessionId].ex.includes(exId);
 for (const date of sortedDates(days)) {
  const day = days![date];
  if (!isObject(day) || !isObject(day.log)) continue;
  const dayIds = listWorkouts(day).map(w => w.sessionId);
  for (const [exId, sets] of Object.entries(day.log)) {
   if (!Array.isArray(sets)) continue;
   const ex = isObject(plan?.ex) ? plan!.ex[exId] : undefined;
   let sessionName = '';
   if (ex) {
    // Treino: os treinos do dia que contêm o exercício; sem registro de treino no dia, só quando o plano tem um único candidato.
    let ids = dayIds.filter(id => has(id, exId));
    if (!ids.length) { const all = Object.keys(sessions).filter(id => has(id, exId)); if (all.length === 1) ids = all; }
    sessionName = ids.map(id => text(sessions[id]?.name)).filter(Boolean).join(' + ');
   }
   sets.forEach((set, index) => {
    if (!isObject(set)) return;
    const kg = typed(set.kg), reps = typed(set.reps), done = set.done === true;
    if (!done && (kg === null || kg === '') && (reps === null || reps === '')) return;
    rows.push([date, sessionName, ex ? text(ex.n) : 'Exercício removido', ex ? text(ex.g) : '', index + 1, kg, reps, done ? YES : NO]);
   });
  }
 }
 return toCsv(rows);
}

/** Medidas: uma linha por data crescente. Chaves do histórico: p peso, c cintura, q quadril, t coxa, b braço. */
export function exportMeasuresCsv(measures: Record<string, Payload> | null | undefined): string {
 const rows: CsvCell[][] = [['data', 'peso (kg)', 'cintura (cm)', 'quadril (cm)', 'coxa (cm)', 'braço (cm)']];
 for (const date of sortedDates(measures)) {
  const m = measures![date];
  if (!isObject(m)) continue;
  rows.push([date, typed(m.p), typed(m.c), typed(m.q), typed(m.t), typed(m.b)]);
 }
 return toCsv(rows);
}

/**
 * Dieta: por data crescente, uma linha por refeição com opção escolhida ou marcada, e uma linha "Total do dia"
 * (soma só do que foi consumido, mais água e creatina). Refeição consumida usa a cópia gravada em `consumed`,
 * que prevalece sobre o cardápio atual; refeição não consumida mostra os valores do cardápio.
 */
export function exportDietCsv(days: Record<string, DayRecord> | null | undefined, catalog: Record<MealKey, DietOption[]> | null | undefined): string {
 const rows: CsvCell[][] = [['data', 'refeição', 'opção', 'nome', 'kcal', 'proteína (g)', 'carboidrato (g)', 'gordura (g)', 'consumida', 'água (copos de 500 ml)', 'creatina']];
 const cat = (isObject(catalog) ? catalog : {}) as Record<MealKey, DietOption[]>;
 for (const date of sortedDates(days)) {
  const raw = days![date]?.diet;
  if (!isObject(raw)) continue;
  const diet: DietDay = {
   pick: isObject(raw.pick) ? raw.pick : {}, eaten: isObject(raw.eaten) ? raw.eaten : {}, skip: isObject(raw.skip) ? raw.skip : {},
   water: Math.max(0, finite(raw.water) ?? 0), crea: raw.crea === true,
   ...(isObject(raw.consumed) ? { consumed: raw.consumed } : {}),
  };
  const mealRows: CsvCell[][] = [];
  for (const meal of MEALS) {
   const pick = text(diet.pick[meal]);
   const marked = diet.eaten[meal] === true;
   const eaten = marked && diet.skip[meal] !== true;
   const copy = isObject(diet.consumed?.[meal]) ? diet.consumed![meal] as Consumed : undefined;
   if (!pick && !marked && !copy) continue;
   const fromCatalog = Array.isArray(cat[meal]) ? cat[meal].find(o => isObject(o) && o.key === pick) : undefined;
   const src: Partial<Consumed> | undefined = eaten ? copy ?? fromCatalog : fromCatalog ?? copy;
   mealRows.push([date, MEAL_NAME[meal], text(src?.key) || pick, text(src?.name), finite(src?.kcal), finite(src?.p), finite(src?.c), finite(src?.g), eaten ? YES : NO, null, null]);
  }
  if (!mealRows.length && diet.water <= 0 && !diet.crea) continue;
  const total = dayTotals(diet, cat);
  rows.push(...mealRows, [date, 'Total do dia', null, null, round2(total.kcal), round2(total.p), round2(total.c), round2(total.g), null, diet.water, diet.crea ? YES : NO]);
 }
 return toCsv(rows);
}
