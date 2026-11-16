import { useData } from '../../app/DataProvider';
import type { Plan } from '../../application/repository';
import { deleteSession, duplicateSession, removeExerciseFromSession } from '../../domain/planEdit';
import { showToast } from '../../ui/UndoToast';

/** Gravações do plano pelo `commit`. O plano editado vale dali em diante; `history` nunca é tocado. */
export function usePlanEditor() {
 const { state, commit } = useData();
 const plan = state?.catalog.plan;
 const apply = (fn: (p: Plan) => Plan): Promise<boolean> => commit(draft => ({ ...draft, catalog: { ...draft.catalog, plan: fn(draft.catalog.plan), revision: (draft.catalog.revision ?? 0) + 1 } }));
 /** Grava o plano e oferece Desfazer, que regrava o plano de antes. */
 const withUndo = (message: string, fn: (p: Plan) => Plan): Promise<boolean> => {
  const before = plan ? structuredClone(plan) : null;
  return apply(fn).then(ok => { if (ok && before) showToast(message, () => { void apply(() => structuredClone(before)); }); return ok; });
 };
 return {
  plan, apply, withUndo,
  duplicate: (id: string) => withUndo('Treino duplicado', p => duplicateSession(p, id).plan),
  remove: (id: string) => withUndo('Treino excluído', p => deleteSession(p, id)),
  removeExercise: (sessionId: string, exId: string) => withUndo('Exercício removido do treino', p => removeExerciseFromSession(p, sessionId, exId)),
 };
}
