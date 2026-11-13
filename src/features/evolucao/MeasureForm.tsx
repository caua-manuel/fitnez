import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useData } from '../../app/DataProvider';
import { Icon } from '../../ui/icons';
import { Folha } from '../inicio/Folha';
import { validateMeasurement, MEASURE_LIMITS } from '../../domain/measurements';
import type { MeasureField } from '../../domain/measurements';

const FIELDS: Array<{ key: MeasureField; id: string }> = [
 { key: 'p', id: 'peso' }, { key: 'c', id: 'cintura' }, { key: 't', id: 'coxa' }, { key: 'b', id: 'braco' },
];
const br = (iso: string) => iso.split('-').reverse().join('/');

/** Linha "Registrar medidas" (o cartão inteiro é um botão) que abre o formulário numa folha. Regras de validação: src/domain/measurements.ts. */
export function MeasureForm({ today }: { today: string }) {
 const { commit, saving } = useData();
 const [open, setOpen] = useState(false);
 const [date, setDate] = useState(today);
 const [values, setValues] = useState<Record<string, string>>({});
 const [errors, setErrors] = useState<Record<string, string>>({});
 const [done, setDone] = useState('');
 const alertRef = useRef<HTMLDivElement>(null);
 useEffect(() => { if (!done) return; const t = window.setTimeout(() => setDone(''), 8000); return () => window.clearTimeout(t); }, [done]);
 const errorList = Object.entries(errors);
 useEffect(() => { if (errorList.length) alertRef.current?.scrollIntoView({ block: 'nearest' }); }, [errors]); // eslint-disable-line react-hooks/exhaustive-deps

 const submit = async (e: FormEvent) => {
  e.preventDefault(); setDone('');
  const r = validateMeasurement({ date, today, values });
  if (!r.ok) { setErrors(r.errors); return; } // a entrada digitada é preservada
  setErrors({});
  const ok = await commit(s => {
   s.history.measurements[r.value.date] = { ...(s.history.measurements[r.value.date] ?? {}), ...r.value.values };
   return s;
  });
  if (ok) { setValues({}); setOpen(false); setDone(r.value.date === today ? 'Medidas de hoje salvas neste aparelho.' : `Medidas de ${br(r.value.date)} salvas neste aparelho.`); setDate(today); }
 };
 const close = () => { setOpen(false); setErrors({}); };

 return <section className="card ev-card ev-measure" aria-labelledby="ev-form-title">
  <button type="button" className="ev-row-btn" aria-haspopup="dialog" aria-expanded={open} onClick={() => { setDone(''); setOpen(true); }}>
   <Icon name="editar" size={24} weight={1.9} />
   <span className="ev-row-text"><strong id="ev-form-title">Registrar medidas</strong><small>Peso, cintura, coxa e braço</small></span>
   <Icon name="chevron" size={22} />
  </button>
  <p className="ev-done" role="status">{done ? <><Icon name="marca" size={18} />{done}</> : null}</p>
  {open ? <Folha title="Registrar medidas" onClose={close} initialFocus="#ev-peso">
   <form onSubmit={e => void submit(e)} noValidate>
    <div className="ev-field ev-date">
     <label htmlFor="ev-data">Data</label>
     <input id="ev-data" type="date" max={today} value={date} aria-invalid={errors.date ? true : undefined} aria-describedby={errors.date ? 'ev-err-date' : undefined} onChange={ev => setDate(ev.target.value)} />
    </div>
    <p className="ev-hint">Preencha só o que mediu. Use vírgula ou ponto: 78,2.</p>
    <div className="ev-fields">{FIELDS.map(f => { const lim = MEASURE_LIMITS[f.key]; return <div className="ev-field" key={f.key}>
     <label htmlFor={`ev-${f.id}`}>{lim.label}</label>
     <div className="ev-input"><input id={`ev-${f.id}`} inputMode="decimal" autoComplete="off" enterKeyHint="next" placeholder="0,0" value={values[f.key] ?? ''} aria-invalid={errors[f.key] ? true : undefined} aria-describedby={errors[f.key] ? `ev-err-${f.key}` : undefined} onChange={ev => setValues(v => ({ ...v, [f.key]: ev.target.value }))} /><span aria-hidden="true">{lim.unit}</span></div>
    </div>; })}</div>
    <div ref={alertRef} role="alert" className="ev-errors">{errorList.map(([k, msg]) => <p key={k} id={`ev-err-${k}`} className="ev-error"><Icon name="info" size={18} />{msg}</p>)}</div>
    <button type="submit" className="button block" disabled={saving}>Salvar medidas</button>
    <button type="button" className="button secondary block gap-top" onClick={close}>Cancelar</button>
   </form>
  </Folha> : null}
 </section>;
}
