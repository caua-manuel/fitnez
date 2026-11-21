// Nota fixa por exercício (settings.exerciseNotes[exId]): limites e validação do formato salvo.
// Arquivo sem o guia de exercícios (data/exercise-guide.json) para que a validação do estado (src/data/validation.ts)
// não prenda o guia na carga inicial. O guia fica em exerciseNotes.ts, importado só pela página do exercício.

export const EXERCISE_NOTE_MAX = 140;
export const EXERCISE_NOTES_MAX_COUNT = 1000;
export const EXERCISE_ID_MAX = 200;

/** Validação de `settings.exerciseNotes` no backup e no estado. Retorna o motivo ou null. */
export function checkStoredExerciseNotes(v: unknown): string | null {
 if (!v || typeof v !== 'object' || Array.isArray(v)) return 'esperado objeto.';
 const entries = Object.entries(v);
 if (entries.length > EXERCISE_NOTES_MAX_COUNT) return `no máximo ${EXERCISE_NOTES_MAX_COUNT} notas.`;
 for (const [k, t] of entries) {
  if (!k || k.length > EXERCISE_ID_MAX) return 'ID de exercício inválida.';
  if (typeof t !== 'string') return 'nota deve ser texto.';
  if (t.length > EXERCISE_NOTE_MAX) return `nota com mais de ${EXERCISE_NOTE_MAX} caracteres.`;
 }
 return null;
}
