import { useState } from 'react';
import type { FormEvent } from 'react';
import { useData } from '../../app/DataProvider';
import { hrefFor } from '../../app/router';
import { addExerciseToSession, sessionsUsing, upsertExercise } from '../../domain/planEdit';
import { draftFrom, emptyDraft, validateDraft } from '../../domain/exerciseDraft';
import type { DraftErrors, ExerciseDraft } from '../../domain/exerciseDraft';
import { CamposExercicio } from './Campos';
import { Topo, VALE_DEPOIS, focusFirstInvalid } from './Topo';
import { usePlanEditor } from './planActions';
import { showToast } from '../../ui/UndoToast';
import './editor.css';

/** Tela de criar/editar exercício (tela-5, nº 10). Sem `ex`, cria um exercício novo e o coloca no treino. */
export function EditarExercicio({ id, ex }: { id: string; ex?: string }) {
 const { state } = useData();
 const { apply } = usePlanEditor();
 const plan = state?.catalog.plan;
 const base = ex ? plan?.ex[ex] : undefined;
 const [draft, setDraft] = useState<ExerciseDraft>(() => (ex && base ? draftFrom(ex, base) : emptyDraft()));
 const [errors, setErrors] = useState<DraftErrors>({});
 const [saving, setSaving] = useState(false);
 if (!plan) return null;
 const back = hrefFor({ tab: 'treino', view: 'editar', id });
 if (!plan.sess[id]) return <section className="card"><p>Treino não encontrado.</p><a className="tr-back" href={hrefFor({ tab: 'treino', view: 'lista' })}>← Voltar aos treinos</a></section>;
 if (ex && !base) return <section className="card"><p>Exercício não encontrado.</p><a className="tr-back" href={back}>← Voltar ao treino</a></section>;
 const others = ex ? sessionsUsing(plan, ex).filter(s => s !== id) : [];

 const submit = async (e: FormEvent) => {
  e.preventDefault();
  const r = validateDraft(draft, base);
  setErrors(r.errors);
  if (!r.value) { focusFirstInvalid(); return; }
  const value = r.value;
  setSaving(true);
  const ok = await apply(p => {
   if (ex) return upsertExercise(p, ex, value).plan;
   const saved = upsertExercise(p, null, value);
   return addExerciseToSession(saved.plan, id, saved.id);
  });
  setSaving(false);
  if (ok) { showToast(ex ? 'Exercício salvo.' : 'Exercício adicionado ao treino.'); window.location.hash = back; }
 };

 return <form className="ed-page" onSubmit={submit} noValidate>
  <Topo title={ex ? 'Editar exercício' : 'Novo exercício'} back={back} backLabel="Voltar a Editar treino" />
  <p className="ed-note">{ex ? VALE_DEPOIS : 'O exercício entra no fim do treino. Treinos que você já fez não mudam.'}</p>
  {others.length ? <p className="ed-note">Este exercício também está em {others.length === 1 ? 'outro treino' : `outros ${others.length} treinos`}: {others.map(o => plan.sess[o]?.name).filter(Boolean).join(', ')}. A mudança vale para todos.</p> : null}
  <CamposExercicio draft={draft} onChange={setDraft} errors={errors} />
  <div className="ed-actions stack">
   <button type="submit" className="button block" disabled={saving}>{ex ? 'Salvar' : 'Adicionar ao treino'}</button>
   <a className="button secondary block" href={back}>Cancelar</a>
  </div>
 </form>;
}
