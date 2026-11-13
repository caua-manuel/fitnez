import type { ReactNode } from 'react';
import { Icon } from '../../ui/icons';
import { Glyph } from './glyphs';
import { BLOCKS, MAX_REST, MAX_SETS, REST_STEP, RECORD_TYPES, restLabel, stepText } from '../../domain/exerciseDraft';
import type { DraftErrors, DraftField, ExerciseDraft } from '../../domain/exerciseDraft';
import { MUSCLE_GROUPS } from '../../domain/muscleGroups';
import { GROUP_LABEL } from './util';
import './editor.css';

export function Erro({ id, children }: { id: string; children: ReactNode }) {
 return <p className="ed-error" id={id}><Icon name="info" size={18} />{children}</p>;
}

/** Rótulo visível + controle + ajuda e erro ligados por aria-describedby. */
export function Campo({ id, label, error, help, children }: { id: string; label: string; error?: string; help?: string; children: (p: { id: string; 'aria-invalid'?: true; 'aria-describedby'?: string }) => ReactNode }) {
 const desc = [error ? `${id}-e` : '', help ? `${id}-h` : ''].filter(Boolean).join(' ') || undefined;
 return <div className={`ed-field${error ? ' bad' : ''}`}>
  <label htmlFor={id}>{label}</label>
  {children({ id, 'aria-invalid': error ? true : undefined, 'aria-describedby': desc })}
  {help ? <p className="ed-help" id={`${id}-h`}>{help}</p> : null}
  {error ? <Erro id={`${id}-e`}>{error}</Erro> : null}
 </div>;
}

export function Select({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
 return <div className="ed-select"><select {...props}>{children}</select><Icon name="chevron" size={22} className="ed-select-icon" /></div>;
}

/** Campo numérico com − e + dentro do mesmo contorno (tela-5, nº 10). */
export function Stepper({ id, value, onChange, min, max, step = 1, unit, label, invalid, describedBy }: { id: string; value: string; onChange: (v: string) => void; min: number; max: number; step?: number; unit?: string; label: string; invalid?: boolean; describedBy?: string }) {
 return <div className={`ed-stepper${invalid ? ' bad' : ''}`}>
  <input id={id} type="text" inputMode="numeric" autoComplete="off" value={value} onChange={e => onChange(e.target.value)} aria-invalid={invalid ? true : undefined} aria-describedby={describedBy} />
  {unit ? <span className="ed-unit" aria-hidden="true">{unit}</span> : null}
  <button type="button" aria-label={`Diminuir ${label}`} onClick={() => onChange(stepText(value, -step, min, max))}><Glyph name="menos" size={22} weight={2.6} /></button>
  <button type="button" aria-label={`Aumentar ${label}`} onClick={() => onChange(stepText(value, step, min, max))}><Icon name="plus" size={22} weight={2.6} /></button>
 </div>;
}

/** Campos do exercício: usados na edição e na criação do treino (descanso nos dois). */
export function CamposExercicio({ draft, onChange, errors, prefix = 'ex' }: { draft: ExerciseDraft; onChange: (d: ExerciseDraft) => void; errors: DraftErrors; prefix?: string }) {
 const set = <K extends keyof ExerciseDraft>(k: K, v: ExerciseDraft[K]) => onChange({ ...draft, [k]: v });
 const setAt = (k: 'sets' | 'reps', i: number, v: string) => onChange({ ...draft, [k]: draft[k].map((x, j) => (j === i ? v : x)) });
 const type = RECORD_TYPES.find(t => t.id === draft.m);
 const restSec = /^\d+$/.test(draft.rest.trim()) ? Number(draft.rest.trim()) : null;
 const err = (k: DraftField) => errors[k];
 return <>
  <Campo id={`${prefix}-n`} label="Nome do exercício" error={err('n')}>{p => <input {...p} type="text" autoComplete="off" maxLength={140} value={draft.n} onChange={e => set('n', e.target.value)} />}</Campo>
  <Campo id={`${prefix}-g`} label="Grupo muscular">{p => <Select {...p} value={draft.g} onChange={e => set('g', e.target.value as ExerciseDraft['g'])}>
   <option value="">Sem grupo</option>
   {MUSCLE_GROUPS.map(g => <option key={g} value={g}>{GROUP_LABEL[g]}</option>)}
  </Select>}</Campo>
  <Campo id={`${prefix}-m`} label="Tipo de registro" help={type?.help}>{p => <Select {...p} value={draft.m} onChange={e => set('m', e.target.value)}>
   {RECORD_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
  </Select>}</Campo>
  <fieldset className="ed-blocks">
   <legend>Séries e repetições por bloco</legend>
   <p className="ed-help">O plano tem três blocos de quatro semanas. Cada um pode ter séries e repetições diferentes.</p>
   {BLOCKS.map((b, i) => {
    const se = errors[`sets${i}` as DraftField], re = errors[`reps${i}` as DraftField];
    return <div className="ed-block" key={b.label}>
     <p className="ed-block-title"><strong>{b.label}</strong><span>{b.weeks}</span></p>
     <div className="ed-block-row">
      <div className={`ed-field${se ? ' bad' : ''}`}>
       <label htmlFor={`${prefix}-s${i}`}>Séries</label>
       <Stepper id={`${prefix}-s${i}`} value={draft.sets[i]} onChange={v => setAt('sets', i, v)} min={1} max={MAX_SETS} label={`séries do ${b.label.toLowerCase()}`} invalid={!!se} describedBy={se ? `${prefix}-s${i}-e` : undefined} />
      </div>
      <div className={`ed-field${re ? ' bad' : ''}`}>
       <label htmlFor={`${prefix}-r${i}`}>{draft.m === 's' ? 'Tempo' : 'Repetições'}</label>
       <input id={`${prefix}-r${i}`} type="text" autoComplete="off" maxLength={30} placeholder="5–8" value={draft.reps[i]} onChange={e => setAt('reps', i, e.target.value)} aria-invalid={re ? true : undefined} aria-describedby={re ? `${prefix}-r${i}-e` : undefined} />
      </div>
     </div>
     {se ? <Erro id={`${prefix}-s${i}-e`}>{se}</Erro> : null}
     {re ? <Erro id={`${prefix}-r${i}-e`}>{re}</Erro> : null}
    </div>;
   })}
  </fieldset>
  <div className={`ed-field${errors.rest ? ' bad' : ''}`}>
   <label htmlFor={`${prefix}-rest`}>Descanso entre séries (segundos)</label>
   <Stepper id={`${prefix}-rest`} value={draft.rest} onChange={v => set('rest', v)} min={0} max={MAX_REST} step={REST_STEP} unit="s" label="descanso" invalid={!!errors.rest} describedBy={`${prefix}-rest-h${errors.rest ? ` ${prefix}-rest-e` : ''}`} />
   <p className="ed-help" id={`${prefix}-rest-h`}>{restSec === null ? 'Tempo do cronômetro depois de cada série.' : restSec === 0 ? 'Sem cronômetro de descanso.' : `${restLabel(restSec)} de cronômetro depois de cada série.`} Passo de {REST_STEP} s.</p>
   {errors.rest ? <Erro id={`${prefix}-rest-e`}>{errors.rest}</Erro> : null}
  </div>
  <Campo id={`${prefix}-t`} label="Observação (opcional)">{p => <textarea {...p} rows={3} maxLength={300} value={draft.t} onChange={e => set('t', e.target.value)} />}</Campo>
 </>;
}
