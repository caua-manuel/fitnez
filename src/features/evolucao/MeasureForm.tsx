import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useData } from '../../app/DataProvider';
import { Icon } from '../../ui/icons';
import { Sheet } from '../../ui/Sheet';
import { showToast } from '../../ui/UndoToast';
import { parseNumber } from '../../domain/workout';
import { validateMeasurement, MEASURE_LIMITS } from '../../domain/measurements';
import type { MeasureField } from '../../domain/measurements';

const FIELDS: Array<{ key: MeasureField; id: string }> = [
 { key: 'p', id: 'peso' }, { key: 'c', id: 'cintura' }, { key: 'q', id: 'quadril' }, { key: 't', id: 'coxa' }, { key: 'b', id: 'braco' },
];
const fmtW = (n: number) => n.toLocaleString('pt-BR', { maximumFractionDigits: 1 });
const br = (iso: string) => iso.split('-').reverse().join('/');

/** Linha "Registrar medidas" (o cartão inteiro é um botão) que abre o formulário numa folha. Regras de validação: src/domain/measurements.ts. */
export function MeasureForm({ today }: { today: string }) {
 const { state, commit, saving } = useData();
 const [updateProfile, setUpdateProfile] = useState(true);
 const [open, setOpen] = useState(false);
 const [date, setDate] = useState(today);
 const [values, setValues] = useState<Record<string, string>>({});
 const [errors, setErrors] = useState<Record<string, string>>({});
 const alertRef = useRef<HTMLDivElement>(null);
 const errorList = Object.entries(errors);
 useEffect(() => { if (errorList.length) alertRef.current?.scrollIntoView({ block: 'nearest' }); }, [errors]); // eslint-disable-line react-hooks/exhaustive-deps

 const submit = async (e: FormEvent) => {
  e.preventDefault();
  const r = validateMeasurement({ date, today, values });
  if (!r.ok) { setErrors(r.errors); return; } // a entrada digitada é preservada
  setErrors({});
  const newWeight = offer && r.value.values.p !== undefined ? parseNumber(r.value.values.p) : null;
  const syncProfile = updateProfile && newWeight !== null;
  const ok = await commit(s => {
   s.history.measurements[r.value.date] = { ...(s.history.measurements[r.value.date] ?? {}), ...r.value.values };
   if (syncProfile) s.settings.profile = { name: '', goal: '', ...(s.settings.profile ?? {}), weightKg: newWeight! };
   return s;
  });
  if (ok) {
   setValues({}); setOpen(false); setDate(today); setUpdateProfile(true);
   showToast(`${r.value.date === today ? 'Medidas de hoje salvas neste aparelho.' : `Medidas de ${br(r.value.date)} salvas neste aparelho.`}${syncProfile ? ` Peso do perfil atualizado para ${fmtW(newWeight!)} kg.` : ''}`);
  }
 };
 const typedWeight = parseNumber((values.p ?? '').trim());
 const wl = MEASURE_LIMITS.p;
 const validWeight = typedWeight !== null && typedWeight >= wl.min && typedWeight <= wl.max;
 const offer = validWeight && date === today && state?.settings.profile?.weightKg !== typedWeight;
 const close = () => { setOpen(false); setErrors({}); };

 return <section className="card ev-card ev-measure" aria-labelledby="ev-form-title">
  <button type="button" className="ev-row-btn" aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(true)}>
   <Icon name="editar" size={24} weight={1.9} />
   <span className="ev-row-text"><strong id="ev-form-title">Registrar medidas</strong><small>Peso, cintura, quadril, coxa e braço</small></span>
   <Icon name="chevron" size={22} />
  </button>
  {open ? <Sheet title="Registrar medidas" onClose={close} initialFocus="#ev-peso">
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
    {offer ? <label className="ev-check"><input type="checkbox" checked={updateProfile} onChange={e => setUpdateProfile(e.target.checked)} /><span>Atualizar o peso do perfil para {fmtW(typedWeight!)} kg<small>A meta de proteína da Dieta acompanha o peso do perfil.</small></span></label> : null}
    <div ref={alertRef} role="alert" className="ev-errors">{errorList.map(([k, msg]) => <p key={k} id={`ev-err-${k}`} className="ev-error"><Icon name="info" size={18} />{msg}</p>)}</div>
    <button type="submit" className="button block" disabled={saving}>Salvar medidas</button>
    <button type="button" className="button secondary block gap-top" onClick={close}>Cancelar</button>
   </form>
  </Sheet> : null}
 </section>;
}
