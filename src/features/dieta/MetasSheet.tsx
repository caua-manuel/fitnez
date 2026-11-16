import { useId, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { useData } from '../../app/DataProvider';
import { Icon } from '../../ui/icons';
import { ConfirmSheet, Sheet } from '../../ui/Sheet';
import { DAY_TYPES, DAY_TYPE_LABEL, carbsFromRest, effectiveDietTargets, isExampleTarget, kcalFromMacros, targetsToInput, validateDietTargets } from '../../domain/dietTargets';
import type { DietWarning, WarningCode } from '../../domain/dietTargets';
import type { DayType } from '../../domain/dayActivity';
import { proteinTargetG } from '../../domain/profile';
import { localDayOf } from '../../domain/planStart';
import { useMetasActions } from './metasActions';
import './metas.css';

type Form = ReturnType<typeof targetsToInput>;
const nf = new Intl.NumberFormat('pt-BR');
const intOf = (s: string): number | null => (/^\s*\d+\s*$/.test(s) ? Number(s) : null);
const PROTEIN_CODES: WarningCode[] = ['proteina-baixa', 'proteina-alta'];

const SAUDE = 'Estas metas são estimativas e valores de exemplo. O app não substitui nutricionista ou médico. Procure um profissional antes de mudar muito a sua alimentação, e também se você tem alguma condição de saúde, usa medicamentos, está grávida ou amamentando, tem menos de 18 anos ou já teve transtorno alimentar. Dor persistente, tontura ou outros sintomas também pedem avaliação profissional.';

function Warnings({ id, items }: { id: string; items: DietWarning[] }) {
 return <div id={id} className="mt-msgs">{items.map(w => <p className="mt-warn" key={`${w.code}-${w.day ?? ''}`}><Icon name="info" size={18} />{w.message}</p>)}</div>;
}

function Field({ id, label, error, help, describedBy, errorBelow, children }: { id: string; label: string; error?: string; help?: string; describedBy?: string; /** O erro aparece fora do campo (linha inteira), mas continua ligado a ele. */ errorBelow?: boolean; children: (p: { id: string; 'aria-invalid'?: true; 'aria-describedby'?: string }) => ReactNode }) {
 const errId = `${id}-erro`, helpId = `${id}-ajuda`;
 const described = [error ? errId : '', help ? helpId : '', describedBy ?? ''].filter(Boolean).join(' ') || undefined;
 return <div className={`mt-field${error ? ' bad' : ''}`}>
  <label htmlFor={id}>{label}</label>
  {children({ id, 'aria-invalid': error ? true : undefined, 'aria-describedby': described })}
  {error && !errorBelow ? <p className="mt-error" id={errId}><Icon name="info" size={18} />{error}</p> : null}
  {help ? <p className="mt-help" id={helpId}>{help}</p> : null}
 </div>;
}

/** Folha "Metas de dieta": valores por tipo de dia, proteína, gordura e água. A validação e os cálculos vêm de src/domain/dietTargets.ts. */
export function MetasSheet({ onClose }: { onClose: () => void }) {
 const { state, busy } = useData();
 const uid = useId().replace(/:/g, '');
 const actions = useMetasActions();
 const settings = state!.settings;
 const weightKg = settings.profile?.weightKg;
 const hasWeight = typeof weightKg === 'number';
 const autoProtein = proteinTargetG(weightKg);
 const [form, setForm] = useState<Form>(() => targetsToInput(effectiveDietTargets(settings, localDayOf(Date.now()))));
 const [attempted, setAttempted] = useState(false);
 const [saving, setSaving] = useState(false);
 const [failed, setFailed] = useState(false);
 const [confirmRestore, setConfirmRestore] = useState(false);
 const [calcNote, setCalcNote] = useState<{ day: DayType; text: string } | null>(null);

 const result = validateDietTargets({ days: form.days, proteinG: form.proteinAuto ? 'auto' : form.proteinG, fatG: form.fatG, waterL: form.waterL }, { weightKg });
 const errors: Record<string, string> = result.ok ? {} : result.errors;
 const warnings: DietWarning[] = result.ok ? result.warnings : [];
 const shown = attempted ? errors : {};
 const hasErrors = Object.keys(shown).length > 0;
 const example = isExampleTarget(settings);
 const effProtein = form.proteinAuto ? autoProtein : intOf(form.proteinG);
 const fatNum = intOf(form.fatG);
 const id = (k: string) => `mt-${uid}-${k}`;

 const setDay = (d: DayType, k: 'kcal' | 'carbs', v: string) => { setForm(f => ({ ...f, days: { ...f.days, [d]: { ...f.days[d], [k]: v } } })); setFailed(false); };
 const set = (k: 'proteinG' | 'fatG' | 'waterL', v: string) => { setForm(f => ({ ...f, [k]: v })); setFailed(false); };

 const calc = (d: DayType) => {
  const kcal = intOf(form.days[d].kcal);
  if (kcal === null || fatNum === null || effProtein === null) { setCalcNote({ day: d, text: 'Preencha calorias, proteína e gordura com números inteiros para calcular.' }); return; }
  const carbs = carbsFromRest(kcal, effProtein, fatNum);
  setDay(d, 'carbs', String(carbs));
  setCalcNote({ day: d, text: `Carboidrato calculado: ${nf.format(carbs)} g. Confira antes de salvar.` });
 };

 const toggleAuto = () => setForm(f => f.proteinAuto ? { ...f, proteinAuto: false, proteinG: f.proteinG || String(autoProtein) } : { ...f, proteinAuto: true });

 const submit = async (e: FormEvent) => {
  e.preventDefault();
  setAttempted(true);
  if (!result.ok) { requestAnimationFrame(() => document.querySelector<HTMLElement>('.mt-form [aria-invalid="true"]')?.focus()); return; }
  setSaving(true); setFailed(false);
  const ok = await actions.save(result.value);
  setSaving(false);
  if (ok) onClose(); else setFailed(true);
 };
 const restore = async () => {
  setConfirmRestore(false); setSaving(true);
  const ok = await actions.restore();
  setSaving(false);
  if (ok) onClose(); else setFailed(true);
 };

 const dayWarnings = (d: DayType) => warnings.filter(w => w.day === d);
 const globalWarnings = (codes: WarningCode[]) => warnings.filter(w => codes.includes(w.code));
 const protWarn = globalWarnings(PROTEIN_CODES), fatWarn = globalWarnings(['gordura-baixa']), waterWarn = globalWarnings(['agua-alta']);

 return <Sheet title="Metas de dieta" onClose={onClose} initialFocus={`#${id('perna-kcal')}`} className="mt-sheet">
  <form className="mt-form" noValidate onSubmit={e => void submit(e)} aria-busy={saving || busy}>
   <p className="mt-intro">Defina quanto você quer comer e beber por dia. Você pode mudar quando quiser. Dias que já passaram mantêm a meta que valia neles.</p>
   <p className="mt-saude"><Icon name="info" size={20} /><span>{SAUDE}</span></p>
   {hasErrors ? <p className="mt-resumo" role="alert"><Icon name="info" size={18} />Corrija os campos destacados para salvar.</p> : null}

   <section className="mt-sec" aria-labelledby={id('h-dias')}>
    <div className="mt-head"><h3 id={id('h-dias')}>Por tipo de dia</h3><p className="mt-sub">Calorias e carboidrato</p></div>
    <p className="mt-help" id={id('calc-ajuda')}>Preenche o carboidrato com o que resta das calorias depois da proteína e da gordura.</p>
    {DAY_TYPES.map(d => {
     const kErr = shown[`days.${d}.kcal`], cErr = shown[`days.${d}.carbs`];
     const carbs = intOf(form.days[d].carbs);
     const sum = carbs !== null && fatNum !== null && effProtein !== null ? kcalFromMacros(effProtein, carbs, fatNum) : null;
     const dw = dayWarnings(d);
     const wId = id(`${d}-avisos`);
     return <div className="mt-day" role="group" aria-labelledby={id(`${d}-titulo`)} key={d}>
      <p className="mt-day-titulo" id={id(`${d}-titulo`)}>{DAY_TYPE_LABEL[d]}</p>
      <div className="mt-pair">
       <Field id={id(`${d}-kcal`)} label="Calorias (kcal)" error={kErr} errorBelow describedBy={dw.length ? wId : undefined}>
        {p => <input {...p} type="text" inputMode="numeric" autoComplete="off" value={form.days[d].kcal} onChange={e => setDay(d, 'kcal', e.target.value)} />}
       </Field>
       <Field id={id(`${d}-carbs`)} label="Carboidrato (g)" error={cErr} errorBelow describedBy={dw.length ? wId : undefined}>
        {p => <input {...p} type="text" inputMode="numeric" autoComplete="off" value={form.days[d].carbs} onChange={e => setDay(d, 'carbs', e.target.value)} />}
       </Field>
      </div>
      {kErr ? <p className="mt-error" id={`${id(`${d}-kcal`)}-erro`}><Icon name="info" size={18} />{kErr}</p> : null}
      {cErr ? <p className="mt-error" id={`${id(`${d}-carbs`)}-erro`}><Icon name="info" size={18} />{cErr}</p> : null}
      {sum !== null ? <p className="mt-soma">Proteína, carboidrato e gordura somam cerca de {nf.format(sum)} kcal.</p> : null}
      <button type="button" className="mt-calc" aria-label={`Calcular pelo que sobra: carboidrato de ${DAY_TYPE_LABEL[d].toLowerCase()}`} aria-describedby={id('calc-ajuda')} onClick={() => calc(d)}>Calcular pelo que sobra</button>
      <p className="mt-note" role="status">{calcNote?.day === d ? calcNote.text : ''}</p>
      {dw.length ? <Warnings id={wId} items={dw} /> : null}
     </div>;
    })}
   </section>

   <section className="mt-sec" aria-labelledby={id('h-todos')}>
    <h3 id={id('h-todos')}>Todos os dias</h3>
    <div className="mt-switch-row">
     <div className="grow"><strong id={id('auto-rotulo')}>Calcular pelo peso</strong>
      <p className="mt-help" id={id('auto-ajuda')}>{form.proteinAuto
       ? (hasWeight ? `Usa 2,4 g por kg do peso do seu perfil: ${nf.format(autoProtein)} g por dia.` : `Informe seu peso em Perfil para calcular. Enquanto isso, usamos ${nf.format(autoProtein)} g.`)
       : 'Desligado: você define a proteína em gramas.'}</p></div>
     <button type="button" role="switch" className="switch" aria-checked={form.proteinAuto} aria-labelledby={id('auto-rotulo')} aria-describedby={id('auto-ajuda')} onClick={toggleAuto} />
    </div>
    {!form.proteinAuto ? <Field id={id('prot')} label="Proteína (g)" error={shown.proteinG} help="Defina o valor em gramas por dia." describedBy={protWarn.length ? id('prot-avisos') : undefined}>
     {p => <input {...p} type="text" inputMode="numeric" autoComplete="off" value={form.proteinG} onChange={e => set('proteinG', e.target.value)} />}
    </Field> : null}
    {protWarn.length ? <Warnings id={id('prot-avisos')} items={protWarn} /> : null}
    <Field id={id('gord')} label="Gordura (g)" error={shown.fatG} help="Gramas por dia." describedBy={fatWarn.length ? id('gord-avisos') : undefined}>
     {p => <input {...p} type="text" inputMode="numeric" autoComplete="off" value={form.fatG} onChange={e => set('fatG', e.target.value)} />}
    </Field>
    {fatWarn.length ? <Warnings id={id('gord-avisos')} items={fatWarn} /> : null}
    <Field id={id('agua')} label="Água (L)" error={shown.waterL} help="De 0,5 em 0,5 L. Cada copo do registro tem 500 ml." describedBy={waterWarn.length ? id('agua-avisos') : undefined}>
     {p => <input {...p} type="text" inputMode="decimal" autoComplete="off" value={form.waterL} onChange={e => set('waterL', e.target.value)} />}
    </Field>
    {waterWarn.length ? <Warnings id={id('agua-avisos')} items={waterWarn} /> : null}
   </section>

   {!example ? <button type="button" className="mt-restore" disabled={saving || busy} onClick={() => setConfirmRestore(true)}>Restaurar padrão</button> : null}

   <div className="mt-actions">
    {failed ? <p className="mt-error mt-falha" role="alert"><Icon name="info" size={18} />Não foi possível salvar as metas. O que você digitou continua na tela. Tente de novo.</p> : null}
    <div className="mt-actions-row">
     <button type="button" className="button secondary" onClick={onClose}>Cancelar</button>
     <button type="submit" className="button" disabled={saving || busy}>Salvar metas</button>
    </div>
   </div>
  </form>
  {confirmRestore ? <ConfirmSheet title="Restaurar as metas de exemplo?" confirmLabel="Restaurar" destructive={false} onCancel={() => setConfirmRestore(false)} onConfirm={() => void restore()}>
   <p>Suas metas atuais deixam de valer a partir de hoje. Os dias anteriores não mudam.</p>
  </ConfirmSheet> : null}
 </Sheet>;
}
