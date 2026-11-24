import type { SetEntry } from '../../domain/workout';
import { storageKey } from '../../app/mode';

// Rascunho dos campos digitados e ainda não concluídos da execução (carga e repetições).
// Fica no localStorage, fora do estado do app: não cria treino "em andamento", não conta para
// recorde nem para séries, e nunca marca série como feita. Só guarda números digitados.

/** Mapa exercício -> índice da linha -> campos digitados. */
export type Draft = Record<string, Record<string, { kg: string; reps: string }>>;

const FIELD = /^[0-9.,]{0,8}$/;

export function draftKey(base: string, day: string, id: string, mode: (nome: string) => string = storageKey): string {
 return mode(`rascunho:${base}:${day}:${id}`);
}

/** Extrai só as linhas não concluídas com algo digitado. */
export function pickDraft(rows: Record<string, SetEntry[]>): Draft {
 const out: Draft = {};
 for (const [ex, list] of Object.entries(rows)) {
  list.forEach((s, i) => {
   if (s.done || (s.kg === '' && s.reps === '')) return;
   (out[ex] ??= {})[String(i)] = { kg: s.kg, reps: s.reps };
  });
 }
 return out;
}

/** Valida o texto guardado; qualquer coisa estranha vira rascunho vazio. */
export function parseDraft(raw: string | null): Draft {
 if (!raw) return {};
 try {
  const v: unknown = JSON.parse(raw);
  if (!v || typeof v !== 'object' || Array.isArray(v)) return {};
  const out: Draft = {};
  for (const [ex, m] of Object.entries(v as Record<string, unknown>)) {
   if (!m || typeof m !== 'object' || Array.isArray(m)) continue;
   for (const [i, f] of Object.entries(m as Record<string, unknown>)) {
    if (!/^\d{1,3}$/.test(i) || !f || typeof f !== 'object') continue;
    const { kg, reps } = f as { kg?: unknown; reps?: unknown };
    if (typeof kg !== 'string' || typeof reps !== 'string' || !FIELD.test(kg) || !FIELD.test(reps)) continue;
    (out[ex] ??= {})[i] = { kg, reps };
   }
  }
  return out;
 } catch { return {}; }
}

/** Aplica o rascunho sobre as linhas abertas: só em linhas existentes e não concluídas; done nunca muda. */
export function applyDraft(rows: Record<string, SetEntry[]>, draft: Draft): Record<string, SetEntry[]> {
 const out: Record<string, SetEntry[]> = {};
 for (const [ex, list] of Object.entries(rows)) {
  const d = draft[ex];
  out[ex] = d ? list.map((s, i) => { const f = d[String(i)]; return f && !s.done ? { ...s, kg: f.kg, reps: f.reps } : s; }) : list;
 }
 return out;
}

export function readDraft(key: string): Draft {
 try { return parseDraft(localStorage.getItem(key)); } catch { return {}; }
}
export function writeDraft(key: string, rows: Record<string, SetEntry[]> | null): void {
 try {
  const d = rows ? pickDraft(rows) : {};
  if (Object.keys(d).length) localStorage.setItem(key, JSON.stringify(d)); else localStorage.removeItem(key);
 } catch { /* rascunho é só proteção; sem armazenamento, segue */ }
}
