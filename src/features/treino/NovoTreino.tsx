import { useState } from 'react';
import type { FormEvent } from 'react';
import { useData } from '../../app/DataProvider';
import { hrefFor } from '../../app/router';
import { NEW_KEY } from './Detalhe';
import { createSessionWithExercise } from '../../domain/planEdit';
import { NAME_MAX, emptyDraft, validateDraft, validateSessionFields } from '../../domain/exerciseDraft';
import type { DraftErrors, ExerciseDraft } from '../../domain/exerciseDraft';
import { Campo, CamposExercicio } from './Campos';
import { Topo, focusFirstInvalid } from './Topo';
import { usePlanEditor } from './planActions';
import { showToast } from '../../ui/UndoToast';
import './editor.css';

export interface SessionFields { name: string; sub: string; min: string }
type SessionErrors = Partial<Record<'name' | 'sub' | 'min', string>>;

export function CamposTreino({ f, onChange, errors, prefix = 'tr' }: { f: SessionFields; onChange: (f: SessionFields) => void; errors: SessionErrors; prefix?: string }) {
 return <>
  <Campo id={`${prefix}-name`} label="Nome do treino" error={errors.name}>{p => <input {...p} type="text" autoComplete="off" maxLength={NAME_MAX} value={f.name} onChange={e => onChange({ ...f, name: e.target.value })} />}</Campo>
  <Campo id={`${prefix}-sub`} label="Descrição (opcional)" error={errors.sub}>{p => <textarea {...p} rows={2} maxLength={160} value={f.sub} onChange={e => onChange({ ...f, sub: e.target.value })} />}</Campo>
  <Campo id={`${prefix}-min`} label="Duração em minutos (opcional)" error={errors.min} help="Por exemplo 55 ou 70 a 80.">{p => <input {...p} type="text" inputMode="numeric" autoComplete="off" maxLength={20} value={f.min} onChange={e => onChange({ ...f, min: e.target.value })} />}</Campo>
 </>;
}

/** Novo treino: dados do treino + o primeiro exercício (com descanso), para nascer já executável. */
export function NovoTreino() {
 const { state } = useData();
 const { apply } = usePlanEditor();
 const [f, setF] = useState<SessionFields>({ name: '', sub: '', min: '' });
 const [draft, setDraft] = useState<ExerciseDraft>(emptyDraft);
 const [fe, setFe] = useState<SessionErrors>({});
 const [de, setDe] = useState<DraftErrors>({});
 const [saving, setSaving] = useState(false);
 const plan = state?.catalog.plan;
 if (!plan) return null;
 const back = hrefFor({ tab: 'treino', view: 'lista' });

 const submit = async (e: FormEvent) => {
  e.preventDefault();
  const s = validateSessionFields(f), x = validateDraft(draft);
  setFe(s.errors); setDe(x.errors);
  if (!s.value || !x.value) { focusFirstInvalid(); return; }
  const input = s.value, ex = x.value;
  const created = createSessionWithExercise(plan, input, ex); // só para saber o id; a gravação recalcula sobre o plano mais recente
  setSaving(true);
  const ok = await apply(p => createSessionWithExercise(p, input, ex).plan);
  setSaving(false);
  if (ok) { try { sessionStorage.setItem(NEW_KEY, created.id); } catch { /* sem armazenamento: só o aviso */ } showToast('Treino criado');window.location.hash = hrefFor({ tab: 'treino', view: 'detalhe', id: created.id }); }
 };

 return <form className="ed-page" onSubmit={submit} noValidate>
  <Topo title="Novo treino" back={back} backLabel="Voltar aos treinos" />
  <p className="ed-note">Dê um nome ao treino e cadastre o primeiro exercício. Depois você adiciona os outros.</p>
  <CamposTreino f={f} onChange={setF} errors={fe} />
  <h3 className="ed-section">Primeiro exercício</h3>
  <CamposExercicio draft={draft} onChange={setDraft} errors={de} />
  <div className="ed-actions stack">
   <button type="submit" className="button block" disabled={saving}>Criar treino</button>
   <a className="button secondary block" href={back}>Cancelar</a>
  </div>
 </form>;
}
