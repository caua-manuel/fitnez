import guideData from '../../data/exercise-guide.json';

// Nota fixa por exercício (settings.exerciseNotes[exId], ex.: "Banco na posição 4") e instruções da biblioteca
// (data/exercise-guide.json, gerado de docs/handoffs/conteudo-instrucoes-exercicios.md).

import { EXERCISE_ID_MAX, EXERCISE_NOTE_MAX } from './exerciseNotesCheck';
// Limites e validação moram em exerciseNotesCheck.ts (sem o guia); reexportados aqui sem mudar a API.
export { EXERCISE_ID_MAX, EXERCISE_NOTE_MAX, EXERCISE_NOTES_MAX_COUNT, checkStoredExerciseNotes } from './exerciseNotesCheck';

export type NoteResult = { ok: true; value: Record<string, string> } | { ok: false; error: string };
/** Grava (texto aparado) ou apaga (texto vazio) a nota de `exId`. Não muta a entrada. */
export function setExerciseNote(notes: Readonly<Record<string, string>> | null | undefined, exId: string, text: string): NoteResult {
 const t = String(text ?? '').trim();
 if (!exId || exId.length > EXERCISE_ID_MAX) return { ok: false, error: 'Exercício inválido.' };
 if (t.length > EXERCISE_NOTE_MAX) return { ok: false, error: `Use no máximo ${EXERCISE_NOTE_MAX} caracteres.` };
 const value = { ...(notes ?? {}) };
 if (t) value[exId] = t; else delete value[exId];
 return { ok: true, value };
}

export interface GuideItem { passos: string; erro: string }
export interface ExerciseGuide { versao: 1; seguranca: string[]; itens: Record<string, GuideItem> }
export const EXERCISE_GUIDE = guideData as ExerciseGuide;
/** Duas frases fixas de segurança, no rodapé da biblioteca. */
export const GUIDE_SAFETY: readonly string[] = EXERCISE_GUIDE.seguranca;

/** Instrução do exercício: passos quebrados por frase e o erro comum. ID sem texto: null (não mostra a seção). */
export function guideFor(exId: string, guide: ExerciseGuide = EXERCISE_GUIDE): { passos: string[]; erro: string } | null {
 const it = Object.prototype.hasOwnProperty.call(guide.itens, exId) ? guide.itens[exId] : undefined;
 if (!it) return null;
 return { passos: it.passos.split(/(?<=\.)\s+/).map(s => s.trim()).filter(Boolean), erro: it.erro };
}
