import { useState } from 'react';
import { useData } from '../../app/DataProvider';
import { muscleGroupOf } from '../../domain/muscleGroups';
import { E1RM_FOOTNOTE, exerciseHistory, personalRecords, roundHalf } from '../../domain/records';
import { BARBELL_EXERCISES, BAR_OPTIONS, DEFAULT_PLATES, DEFAULT_PLATE_SETTINGS, platesPerSide } from '../../domain/plates';
import type { PlateSettings } from '../../domain/plates';
import { EXERCISE_NOTE_MAX, GUIDE_SAFETY, guideFor, setExerciseNote } from '../../domain/exerciseNotes';
import { parseNumber } from '../../domain/workout';
import { Sheet } from '../../ui/Sheet';
import { LineChart } from '../evolucao/Charts';
import { GROUP_LABEL, formatKg } from './util';
import '../evolucao/evolucao.css';

const kgText = (n: number | null | undefined) => (n === null || n === undefined ? '' : `${formatKg(n)} kg`);
const short = (d: string) => d.split('-').reverse().slice(0, 2).join('/');

function readPlates(v: unknown): PlateSettings {
 const p = v as Partial<PlateSettings> | undefined;
 return { bar: typeof p?.bar === 'number' ? p.bar : DEFAULT_PLATE_SETTINGS.bar, available: Array.isArray(p?.available) ? p.available : [...DEFAULT_PLATES] };
}

/** Folha da calculadora de anilhas: barra e anilhas ficam salvas em settings.plates. */
export function AnilhasSheet({ initial, onClose }: { initial?: string; onClose: () => void }) {
 const { state, commit } = useData();
 const [total, setTotal] = useState(initial ?? '');
 if (!state) return null;
 const cfg = readPlates(state.settings.plates);
 const save = (next: PlateSettings) => void commit(d => { d.settings.plates = next; return d; });
 const n = parseNumber(total);
 const r = n === null ? null : platesPerSide(n, cfg.bar, cfg.available);
 const barText = cfg.bar ? `barra ${formatKg(cfg.bar)} kg` : 'sem barra';
 const out = !r ? 'Digite a carga total.' : !r.ok ? (r.error === 'abaixo-da-barra' ? 'Carga menor que a barra' : 'Digite a carga total.')
  : r.perSide.length === 0 ? 'Só a barra'
  : `${r.exact ? '' : `Não fecha com essas anilhas. Mais perto: ${kgText(r.achieved)}. `}Cada lado: ${r.perSide.map(formatKg).join(' + ')} (${barText})`;
 return <Sheet title="Anilhas" onClose={onClose} initialFocus="#anilha-total">
  <div className="sheet-body">
   <div><label htmlFor="anilha-total">Carga total (kg)</label>
    <input id="anilha-total" className="ex-input num" inputMode="decimal" autoComplete="off" value={total} onChange={e => setTotal(e.target.value)} /></div>
   <p className="pl-out num" role="status">{out}</p>
   <fieldset><legend>Barra</legend><div className="segmented">
    {BAR_OPTIONS.map(b => <button key={b} type="button" aria-pressed={cfg.bar === b} onClick={() => save({ ...cfg, bar: b })}>{b ? `${b} kg` : 'Sem barra'}</button>)}
   </div></fieldset>
   <fieldset><legend>Anilhas disponíveis (kg)</legend><div className="segmented pl-seg">
    {DEFAULT_PLATES.map(p => { const on = cfg.available.includes(p); return <button key={p} type="button" aria-pressed={on} aria-label={`${formatKg(p)} kg`}
     onClick={() => save({ ...cfg, available: on ? cfg.available.filter(x => x !== p) : DEFAULT_PLATES.filter(x => x === p || cfg.available.includes(x)) })}>{formatKg(p)}</button>; })}
   </div></fieldset>
  </div>
  <div className="sheet-actions"><button type="button" className="button secondary block" onClick={onClose}>Fechar</button></div>
 </Sheet>;
}

/** Página do exercício (em folha): nota fixa, como fazer, recordes, gráfico e histórico. */
export function ExercicioSheet({ exId, onClose }: { exId: string; onClose: () => void }) {
 const { state, commit } = useData();
 const [editing, setEditing] = useState(false);
 const [draft, setDraft] = useState('');
 const [plates, setPlates] = useState(false);
 if (!state) return null;
 const ex = state.catalog.plan.ex[exId];
 if (!ex) return null;
 const days = state.history.days;
 const group = muscleGroupOf(exId, ex);
 const notes = (state.settings.exerciseNotes ?? {}) as Record<string, string>;
 const note = notes[exId] ?? '';
 const guide = guideFor(exId);
 const kg = ex.m === 'kg';
 const bests = kg ? personalRecords(days, exId, ex) : null;
 const hist = exerciseHistory(days, exId, ex);
 const pts = hist.slice(0, 12).reverse().map(h => ({ label: short(h.day), value: h.e1rm !== null ? roundHalf(h.e1rm) : h.maxKg }));
 const hasE1 = hist.some(h => h.e1rm !== null);
 const saveNote = async () => {
  const r = setExerciseNote(notes, exId, draft);
  if (!r.ok) return;
  if (await commit(d => { d.settings.exerciseNotes = r.value; return d; })) setEditing(false);
 };
 const setText = (s: { kg: number | null; reps: number | null }) => s.kg ? `${formatKg(s.kg)}×${s.reps ?? '—'}` : String(s.reps ?? '—');
 return <Sheet title={ex.n} onClose={onClose}>
  <div className="sheet-body xp">
   {group ? <p className="muted">{GROUP_LABEL[group]}</p> : null}
   {editing ? <div>
    <label htmlFor="xp-nota">Nota fixa</label>
    <input id="xp-nota" className="ex-input" maxLength={EXERCISE_NOTE_MAX} placeholder="Ex.: banco na posição 4" value={draft} onChange={e => setDraft(e.target.value)} />
    <p className="muted num">{draft.length} de {EXERCISE_NOTE_MAX}</p>
    <div className="sheet-actions"><button type="button" className="button secondary" onClick={() => setEditing(false)}>Cancelar</button><button type="button" className="button" onClick={() => void saveNote()}>Salvar nota</button></div>
   </div> : <p className="xp-note">{note ? <span>{note}</span> : null}<button type="button" className="ed-linkbtn" onClick={() => { setDraft(note); setEditing(true); }}>{note ? 'Editar nota' : 'Adicionar nota'}</button></p>}
   {BARBELL_EXERCISES.includes(exId) ? <button type="button" className="button secondary" onClick={() => setPlates(true)}>Calcular anilhas</button> : null}
   {bests?.hasHistory ? <section><h3>{hist.length > 1 ? 'Recordes' : 'Melhores marcas'}</h3><dl className="facts">
    {bests.maxKg ? <div><dt>Carga máxima</dt><dd className="num">{formatKg(bests.maxKg.kg)} kg × {bests.maxKg.reps}</dd></div> : null}
    {bests.maxE1rm ? <div><dt>1RM estimado</dt><dd className="num">{formatKg(roundHalf(bests.maxE1rm.value))} kg</dd></div> : null}
   </dl><p className="muted ev-hint">{E1RM_FOOTNOTE}</p></section> : null}
   {kg && pts.filter(p => p.value !== null).length >= 2 ? <section><h3>{hasE1 ? '1RM estimado por sessão' : 'Melhor carga por sessão'}</h3>
    <LineChart points={pts} unit="kg" label={`${hasE1 ? '1RM estimado' : 'Melhor carga'}: de ${kgText(pts[0]!.value)} em ${pts[0]!.label} a ${kgText(pts[pts.length - 1]!.value)} em ${pts[pts.length - 1]!.label}.`} />
   </section> : null}
   <section><h3>Histórico</h3>{hist.length === 0 ? <p className="muted">Sem registro anterior.</p> : <ul className="exercise-list xp-hist">
    {hist.slice(0, 20).map(h => <li key={h.day}><strong className="num">{short(h.day)}</strong><span className="num">{h.sets.map(setText).join(', ')}</span></li>)}
   </ul>}</section>
   {guide ? <section><h3>Como fazer</h3><ol className="xp-steps">{guide.passos.map(p => <li key={p}>{p}</li>)}</ol>
    <p><strong>Erro comum:</strong> {guide.erro}</p>{GUIDE_SAFETY.map(s => <p key={s} className="muted ev-hint">{s}</p>)}</section> : null}
  </div>
  <div className="sheet-actions"><button type="button" className="button secondary block" onClick={onClose}>Fechar</button></div>
  {plates ? <AnilhasSheet initial={bests?.maxKg ? String(bests.maxKg.kg).replace('.', ',') : ''} onClose={() => setPlates(false)} /> : null}
 </Sheet>;
}
