import { useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useData } from '../../app/DataProvider';
import { hrefFor } from '../../app/router';
import type { Exercise } from '../../application/repository';
import { addExerciseToSession, moveExercise, updateSession } from '../../domain/planEdit';
import { restLabel, validateSessionFields } from '../../domain/exerciseDraft';
import { muscleGroupOf } from '../../domain/muscleGroups';
import { Icon } from '../../ui/icons';
import { Glyph } from './glyphs';
import { CamposTreino } from './NovoTreino';
import type { SessionFields } from './NovoTreino';
import { Menu } from '../../ui/Menu';
import { ConfirmSheet, Sheet } from '../../ui/Sheet';
import { Topo, VALE_DEPOIS, focusFirstInvalid } from './Topo';
import { usePlanEditor } from './planActions';
import { showToast } from '../../ui/UndoToast';
import { GROUP_LABEL, normalize, plural } from './util';
import './editor.css';

function meta(id: string, ex: Exercise): string {
 const g = muscleGroupOf(id, ex);
 const sets = ex.s.every(n => n === ex.s[0]) ? plural(ex.s[0] ?? 0, 'série', 'séries') : `${ex.s.join(' / ')} séries`;
 const rest = typeof ex.rest === 'number' ? (ex.rest > 0 ? `descanso ${restLabel(ex.rest)}` : 'sem descanso') : 'sem descanso definido';
 return [g ? GROUP_LABEL[g] : null, sets, rest].filter(Boolean).join(' · ');
}

function Picker({ sessionId, onClose }: { sessionId: string; onClose: () => void }) {
 const { plan, apply } = usePlanEditor();
 const [q, setQ] = useState('');
 if (!plan) return null;
 const inSession = new Set(plan.sess[sessionId]?.ex ?? []);
 const query = normalize(q);
 const rows = Object.keys(plan.ex).filter(id => !inSession.has(id) && (!query || normalize(plan.ex[id].n).includes(query)));
 return <Sheet title="Adicionar exercício" onClose={onClose} initialFocus="#ed-pick-q">
  <a className="button block ed-new-ex" href={hrefFor({ tab: 'treino', view: 'exercicio', id: sessionId })}><Icon name="plus" size={22} weight={2.5} />Criar exercício novo</a>
  <p className="ed-help">Ou escolha um exercício que você já tem salvo.</p>
  <div className="tr-search ed-pick-search">
   <label htmlFor="ed-pick-q" className="visually-hidden">Buscar exercício</label>
   <Icon name="busca" size={22} className="tr-search-icon" />
   <input id="ed-pick-q" type="search" placeholder="Buscar exercício…" value={q} onChange={e => setQ(e.target.value)} autoComplete="off" />
  </div>
  {rows.length === 0 ? <p className="muted">{query ? 'Nenhum exercício encontrado.' : 'Todos os seus exercícios já estão neste treino.'}</p> :
   <ul className="ed-pick-list" aria-label="Exercícios salvos">
    {rows.map(id => <li key={id}><button type="button" onClick={() => { void apply(p => addExerciseToSession(p, sessionId, id)).then(ok => { if (ok) showToast(`${plan.ex[id].n} adicionado ao treino.`); }); onClose(); }}>
     <strong>{plan.ex[id].n}</strong><span>{meta(id, plan.ex[id])}</span>
    </button></li>)}
   </ul>}
  <div className="ed-actions"><button type="button" className="button secondary" onClick={onClose}>Fechar</button></div>
 </Sheet>;
}

export function EditarTreino({ id }: { id: string }) {
 const { plan, apply, duplicate, remove, removeExercise } = usePlanEditor();
 const s = plan?.sess[id];
 const [f, setF] = useState<SessionFields>(() => ({ name: s?.name ?? '', sub: s?.sub ?? '', min: s?.min ?? '' }));
 const [errors, setErrors] = useState<Partial<Record<'name' | 'sub' | 'min', string>>>({});
 const [picker, setPicker] = useState(false);
 const [confirm, setConfirm] = useState(false);
 const [removing, setRemoving] = useState<string | null>(null);
 const [moved, setMoved] = useState('');
 const [saved, setSaved] = useState(false);
 const addBtn = useRef<HTMLButtonElement>(null);
 if (!plan) return null;
 const detail = hrefFor({ tab: 'treino', view: 'detalhe', id });
 if (!s) return <section className="card"><p>Treino não encontrado.</p><a className="tr-back" href={hrefFor({ tab: 'treino', view: 'lista' })}>← Voltar aos treinos</a></section>;

 const save = (e: FormEvent) => {
  e.preventDefault();
  const r = validateSessionFields(f);
  setErrors(r.errors);
  if (!r.value) { focusFirstInvalid(); return; }
  const value = r.value;
  void apply(p => updateSession(p, id, value)).then(ok => { if (ok) { setF({ name: value.name, sub: value.sub ?? '', min: value.min ?? '' }); showToast('Treino salvo'); setSaved(true); } });
 };
 const move = (i: number, to: number) => {
  const exId = s.ex[i];
  void apply(p => moveExercise(p, id, i, to));
  setMoved(`${plan.ex[exId]?.n ?? 'Exercício'} movido para a posição ${to + 1} de ${s.ex.length}.`);
  requestAnimationFrame(() => {
   const dir = to < i ? 'up' : 'down';
   const el = document.getElementById(`mv-${exId}-${dir}`) as HTMLButtonElement | null;
   (el && !el.disabled ? el : document.getElementById(`mv-${exId}-${dir === 'up' ? 'down' : 'up'}`))?.focus();
  });
 };

 return <div className="ed-page">
  <Topo title="Editar treino" back={detail} backLabel="Voltar ao treino" />
  <p className="ed-note">{VALE_DEPOIS}</p>
  <form onSubmit={save} noValidate className="ed-form">
   <CamposTreino f={f} onChange={v => { setSaved(false); setF(v); }} errors={errors} prefix="et" />
   <button type="submit" className="button block">Salvar dados do treino</button>
   <p className="ed-saved" role="status">{saved ? '✓ Treino salvo.' : ''}</p>
  </form>

  <div className="ed-section-row">
   <h3 className="ed-section">Exercícios ({s.ex.length})</h3>
  </div>
  {s.ex.length === 0 ? <p className="ed-empty">Este treino ainda não tem exercícios. Adicione o primeiro abaixo.</p> :
   <ol className="ed-list" aria-label="Exercícios do treino">
    {s.ex.map((exId, i) => {
     const ex = plan.ex[exId];
     const name = ex?.n ?? 'Exercício removido';
     return <li key={exId} className="ed-ex">
      <div className="ed-move" role="group" aria-label={`Ordem de ${name}`}>
       <button type="button" id={`mv-${exId}-up`} className="icon-button" aria-label={`Subir ${name}`} disabled={i === 0} onClick={() => move(i, i - 1)}><Glyph name="cima" size={22} weight={2.5} /></button>
       <button type="button" id={`mv-${exId}-down`} className="icon-button" aria-label={`Descer ${name}`} disabled={i === s.ex.length - 1} onClick={() => move(i, i + 1)}><Glyph name="baixo" size={22} weight={2.5} /></button>
      </div>
      <div className="ed-ex-body">
       <h4>{name}</h4>
       <span className="ed-ex-meta">{ex ? meta(exId, ex) : 'Este exercício não está mais salvo.'}</span>
      </div>
      <Menu label={`Mais opções de ${name}`} trigger={<Icon name="mais" size={24} weight={2.4} />} items={[
       ...(ex ? [{ label: 'Editar exercício', icon: 'editar' as const, href: hrefFor({ tab: 'treino', view: 'exercicio', id, ex: exId }) }] : []),
       { label: 'Remover do treino', danger: true, onClick: () => setRemoving(exId) },
      ]} />
     </li>;
    })}
   </ol>}
  <p className="visually-hidden" role="status">{moved}</p>
  <button type="button" ref={addBtn} className="button secondary block ed-add" onClick={() => setPicker(true)}><Icon name="plus" size={22} weight={2.5} />Adicionar exercício</button>

  <div className="ed-more">
   <button type="button" className="button secondary block" onClick={() => { void duplicate(id); }}><Icon name="copiar" size={20} />Duplicar treino</button>
   <button type="button" className="button destructive block" onClick={() => setConfirm(true)}><Icon name="lixeira" size={20} />Excluir treino</button>
  </div>

  {picker ? <Picker sessionId={id} onClose={() => setPicker(false)} /> : null}
  {removing ? <ConfirmSheet title={`Remover ${plan.ex[removing]?.n ?? 'exercício'} do treino?`} confirmLabel="Remover do treino" onCancel={() => setRemoving(null)}
   onConfirm={() => { const exId = removing; setRemoving(null); void removeExercise(id, exId); }}>
   <p>O exercício sai só deste treino. O histórico fica guardado e você poderá desfazer por 6 segundos.</p>
  </ConfirmSheet> : null}
  {confirm ? <ConfirmSheet title={`Excluir ${s.name}?`} confirmLabel="Excluir treino" onCancel={() => setConfirm(false)}
   onConfirm={() => { setConfirm(false); void remove(id).then(ok => { if (ok) window.location.hash = hrefFor({ tab: 'treino', view: 'lista' }); }); }}>
   <p>O treino sai do seu plano. O histórico dos treinos já feitos continua salvo, e os exercícios continuam salvos.</p>
   <p>Você poderá desfazer por 6 segundos.</p>
  </ConfirmSheet> : null}
 </div>;
}
