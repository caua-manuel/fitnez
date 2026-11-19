import type { DayRecord, Exercise } from '../application/repository';
import type { DayIso } from './calendar';
import { repRange, type Suggestion } from './progression';
import { isWarm, parseNumber, setsForWeek, type SetEntry } from './workout';

// Campo vazio da série: placeholder (texto cinza) e valor confirmado pelo ✓ (conteudo-aval-ondas-hevy.md, seção 1).
// Funções puras; nada aqui grava. Aquecimento nunca entra como "Antes" nem como série anterior de hoje.

const toEntry = (r: any): SetEntry => {
 const e: SetEntry = { kg: String(r?.kg ?? ''), reps: String(r?.reps ?? ''), done: r?.done === true };
 if (isWarm(r)) e.kind = 'warm';
 return e;
};

/** Só as séries de trabalho (sem aquecimento), na ordem. */
export function workingSets(rows: readonly unknown[] | null | undefined): SetEntry[] {
 return (Array.isArray(rows) ? rows : []).filter(r => r && typeof r === 'object' && !isWarm(r as SetEntry)).map(toEntry);
}

/** Última sessão concluída do exercício antes de `before`: só as séries de trabalho concluídas. */
export function lastWorkingSession(days: Record<string, DayRecord>, exId: string, before: DayIso): { day: DayIso; sets: SetEntry[] } | null {
 for (const day of Object.keys(days).filter(d => d < before).sort().reverse()) {
  const sets = workingSets(days[day]?.log?.[exId]).filter(s => s.done);
  if (sets.length) return { day, sets };
 }
 return null;
}

/** "Antes": a série de trabalho de mesmo índice (0 = primeira) na última sessão concluída, ou null. */
export function previousSetAt(days: Record<string, DayRecord>, exId: string, day: DayIso, index: number): SetEntry | null {
 return lastWorkingSession(days, exId, day)?.sets[index] ?? null;
}

/** Histórico para `suggestNext`: séries de trabalho de cada dia antes de `before`, do mais antigo ao mais recente. */
export function workingHistory(days: Record<string, DayRecord>, exId: string, before: DayIso): SetEntry[][] {
 return Object.keys(days).filter(d => d < before).sort().map(d => workingSets(days[d]?.log?.[exId])).filter(s => s.some(x => x.done));
}

export interface PlaceholderInput {
 ex: Exercise;
 week: number;
 /** Resultado de suggestNext para o exercício (com o histórico de trabalho). */
 suggestion: Suggestion;
 /** Séries de trabalho concluídas da última sessão (lastWorkingSession(...)?.sets ?? []). */
 previous: readonly SetEntry[];
 /** Linhas de hoje do exercício, como estão no registro (podem incluir aquecimento). */
 today: readonly SetEntry[];
 /** Índice da série entre as séries de TRABALHO de hoje (0 = primeira). */
 index: number;
}
export interface Placeholder {
 kg: string | null;
 reps: string | null;
 podeConfirmar: boolean;
 /** O que falta digitar quando podeConfirmar é false. */
 falta: 'kg' | 'reps' | null;
 /** Texto do placeholder quando o valor é null: `kg` e a faixa da semana (ex.: `8–12`). */
 dica: { kg: string; reps: string };
}

const fmt = (n: number): string => String(Math.round(n * 100) / 100);

export function placeholderFor(input: PlaceholderInput): Placeholder {
 const { ex, week, suggestion, previous, index } = input;
 const plan = setsForWeek(ex, week);
 const faixa = repRange(plan.reps);
 const leve = week % 4 === 3;
 const today = workingSets(input.today);
 // Série de trabalho anterior já concluída hoje (a mais próxima antes do índice).
 let prevIdx = -1;
 for (let i = Math.min(index, today.length) - 1; i >= 0; i--) if (today[i]!.done) { prevIdx = i; break; }
 const anteriorHoje = prevIdx >= 0 ? today[prevIdx]! : null;
 // Carga planejada: a sugestão (na semana leve não sobe). null na primeira vez.
 let kgPlano: string | null = null;
 if (suggestion.kg != null) {
  if (leve && suggestion.reason === 'subir') {
   const kgs = previous.map(s => parseNumber(s.kg)).filter((n): n is number => n !== null);
   kgPlano = fmt(kgs.length ? Math.max(...kgs) : suggestion.kg);
  } else kgPlano = fmt(suggestion.kg);
 }
 // Se a última carga concluída hoje difere da planejada (a pessoa mudou, ou não havia sugestão), ela vale
 // para todas as séries seguintes, não só para a próxima (exemplo 7).
 const kgHoje = anteriorHoje ? parseNumber(anteriorHoje.kg) : null;
 const kg: string | null = kgHoje !== null && fmt(kgHoje) !== kgPlano ? fmt(kgHoje) : kgPlano;

 const antes = previous[index] ?? null;
 const ultimaAntes = previous.length ? previous[previous.length - 1]! : null;
 const num = (s: SetEntry | null) => (s ? parseNumber(s.reps) : null);
 let base: number | null = num(antes) ?? num(anteriorHoje) ?? num(ultimaAntes);
 if (suggestion.reason === 'subir' && !leve && faixa) base = faixa.min;
 let reps: string | null = null;
 if (base !== null) reps = fmt(faixa ? Math.min(faixa.max, Math.max(faixa.min, base)) : base);

 const needKg = ex.m === 'kg' && kg === null;
 const podeConfirmar = reps !== null && !needKg;
 return { kg, reps, podeConfirmar, falta: reps === null ? 'reps' : needKg ? 'kg' : null, dica: { kg: 'kg', reps: plan.reps } };
}

export type Confirmed = { ok: true; set: SetEntry } | { ok: false; falta: 'kg' | 'reps'; mensagem: string };

/**
 * Valor gravado pelo ✓: campo digitado vale o digitado; campo vazio vale o placeholder. `bw` sem carga grava kg ''.
 * `kind: 'warm'` só exige as repetições (aquecimento não precisa de carga para ser marcado).
 */
export function confirmSet(typed: { kg?: string; reps?: string }, ph: Pick<Placeholder, 'kg' | 'reps'>, ex: Pick<Exercise, 'm'>, kind?: 'warm'): Confirmed {
 const kg = (typed.kg ?? '').trim() || ph.kg || '';
 const reps = (typed.reps ?? '').trim() || ph.reps || '';
 if (!reps) return { ok: false, falta: 'reps', mensagem: 'Digite as repetições' };
 if (ex.m === 'kg' && !kg && kind !== 'warm') return { ok: false, falta: 'kg', mensagem: 'Digite a carga' };
 const set: SetEntry = { kg, reps, done: true };
 if (kind === 'warm') set.kind = 'warm';
 return { ok: true, set };
}
