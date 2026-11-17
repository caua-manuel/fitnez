import { useId, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { useData } from '../../app/DataProvider';
import { Icon } from '../../ui/icons';
import { ConfirmSheet, Sheet } from '../../ui/Sheet';
import { DAY_TYPES, DAY_TYPE_LABEL, carbsFromRest, isExampleTarget, kcalFromMacros, macroTolerance, resolveDietTargets, effectiveDietTargets, targetsToInput, validateDietTargets } from '../../domain/dietTargets';
import type { DietWarning, WarningCode } from '../../domain/dietTargets';
import type { DayType } from '../../domain/dayActivity';
import { proteinTargetG } from '../../domain/profile';
import { localDayOf } from '../../domain/planStart';
import { DAY_TYPE_LABEL as DAY_TYPE_TODAY, dayTypeFor } from './dietData';
import { useMetasActions } from './metasActions';
import './metas.css';

type Form = ReturnType<typeof targetsToInput>;
const nf = new Intl.NumberFormat('pt-BR');
const intOf = (s: string): number | null => (/^\s*\d+\s*$/.test(s) ? Number(s) : null);
const PROTEIN_CODES: WarningCode[] = ['proteina-baixa', 'proteina-alta'];

const SAUDE_CURTO = 'Estas metas são estimativas e valores de exemplo. O app não substitui nutricionista ou médico. Antes de mudar muito a sua alimentação, converse com um profissional.';
const SAUDE = 'Estas metas são estimativas e valores de exemplo. O app não substitui nutricionista ou médico. Procure um profissional antes de mudar muito a sua alimentação, e também se você tem alguma condição de saúde, usa medicamentos, está grávida ou amamentando, tem menos de 18 anos ou já teve transtorno alimentar. Dor persistente, tontura ou outros sintomas também pedem avaliação profissional.';

/** O que cada tipo de dia significa no app (ver "Tipo de dia" em docs/ESPECIFICACAO.md). */
const DAY_CONTEXT: Record<DayType, string> = {
 perna: 'Dias de treino de perna',
 academia: 'Dias de outros treinos de academia',
 jiujitsu: 'Dias de aula de jiu-jitsu',
 volei: 'Dias de vôlei',
 descanso: 'Dias sem treino',
};

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

function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
 return <div className="mt-stat"><span className="mt-stat-label">{label}</span><strong>{value}</strong>{note ? <span className="mt-stat-note">{note}</span> : null}</div>;
}

/** Folha "Suas metas diárias": proteína, gordura e água (valem sempre) e calorias e carboidrato por tipo de dia. A validação e os cálculos vêm de src/domain/dietTargets.ts. */
export function MetasSheet({ onClose }: { onClose: () => void }) {
 const { state, busy } = useData();
 const uid = useId().replace(/:/g, '');
 const actions = useMetasActions();
 const settings = state!.settings;
 const today = localDayOf(Date.now());
 const todayType = dayTypeFor(state!, today);
 const current = resolveDietTargets(settings, today);
 const weightKg = settings.profile?.weightKg;
 const hasWeight = typeof weightKg === 'number';
 const autoProtein = proteinTargetG(weightKg);
 const [form, setForm] = useState<Form>(() => targetsToInput(effectiveDietTargets(settings, today)));
 const [attempted, setAttempted] = useState(false);
 const [saving, setSaving] = useState(false);
 const [failed, setFailed] = useState(false);
 const [confirmRestore, setConfirmRestore] = useState(false);
 const [saudeOpen, setSaudeOpen] = useState(false);
 const [open, setOpen] = useState<Record<DayType, boolean>>(() => ({ perna: false, academia: false, jiujitsu: false, volei: false, descanso: false, [todayType]: true }));
 const [calcNote, setCalcNote] = useState<{ day: DayType; text: string; undo?: string } | null>(null);

 const result = validateDietTargets({ days: form.days, proteinG: form.proteinAuto ? 'auto' : form.proteinG, fatG: form.fatG, waterL: form.waterL }, { weightKg });
 const errors: Record<string, string> = result.ok ? {} : result.errors;
 // A conferência de calorias é mostrada em frase própria (abaixo), então o aviso equivalente do domínio não se repete.
 const warnings: DietWarning[] = result.ok ? result.warnings.filter(w => w.code !== 'macros-incoerentes') : [];
 const shown = attempted ? errors : {};
 const hasErrors = Object.keys(shown).length > 0;
 const example = isExampleTarget(settings);
 const effProtein = form.proteinAuto ? autoProtein : intOf(form.proteinG);
 const fatNum = intOf(form.fatG);
 const id = (k: string) => `mt-${uid}-${k}`;

 const setDay = (d: DayType, k: 'kcal' | 'carbs', v: string) => { setForm(f => ({ ...f, days: { ...f.days, [d]: { ...f.days[d], [k]: v } } })); setFailed(false); setCalcNote(n => (n?.day === d ? null : n)); };
 const set = (k: 'proteinG' | 'fatG' | 'waterL', v: string) => { setForm(f => ({ ...f, [k]: v })); setFailed(false); };

 const calc = (d: DayType) => {
  const kcal = intOf(form.days[d].kcal);
  if (kcal === null || fatNum === null || effProtein === null) { setCalcNote({ day: d, text: 'Preencha as calorias do dia, a proteína e a gordura com números inteiros para completar o carboidrato.' }); return; }
  const before = form.days[d].carbs;
  const carbs = carbsFromRest(kcal, effProtein, fatNum);
  setDay(d, 'carbs', String(carbs));
  setCalcNote({ day: d, text: before.trim() === String(carbs) ? `O carboidrato já era ${nf.format(carbs)} g.` : `Carboidrato: de ${before.trim() === '' ? 'vazio' : `${before.trim()} g`} para ${nf.format(carbs)} g.`, undo: before });
 };
 const undoCalc = (d: DayType, before: string) => { setDay(d, 'carbs', before); setCalcNote({ day: d, text: 'Carboidrato voltou ao valor anterior.' }); };

 const toggleAuto = () => setForm(f => f.proteinAuto ? { ...f, proteinAuto: false, proteinG: f.proteinG || String(autoProtein) } : { ...f, proteinAuto: true });

 const submit = async (e: FormEvent) => {
  e.preventDefault();
  setAttempted(true);
  if (!result.ok) {
   // Abre os tipos de dia com erro antes de mover o foco (campo recolhido não recebe foco).
   const bad = DAY_TYPES.filter(d => Object.keys(result.errors).some(k => k.startsWith(`days.${d}.`)));
   if (bad.length) setOpen(o => ({ ...o, ...Object.fromEntries(bad.map(d => [d, true])) }));
   requestAnimationFrame(() => requestAnimationFrame(() => document.querySelector<HTMLElement>('.mt-form [aria-invalid="true"]')?.focus()));
   return;
  }
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

  const todayKcal = current.days[todayType].kcal;
 const todayCarbs = current.days[todayType].carbs;

 return <Sheet title="Suas metas diárias" onClose={onClose} initialFocus="[data-mt-start]" className="mt-sheet">
  <form className="mt-form" noValidate onSubmit={e => void submit(e)} aria-busy={saving || busy}>
   <div className="mt-intro-box">
    <p className="mt-intro" data-mt-start tabIndex={-1}>Aqui você define quanto pretende comer e beber por dia. As calorias e o carboidrato mudam conforme o tipo de dia: treino de perna, jiu-jitsu, descanso e assim por diante. Dias que já passaram mantêm a meta que valia neles.{example ? ' Os valores atuais são um exemplo: ajuste ao seu caso.' : ''}</p>
    {example ? <p className="mt-example"><Icon name="info" size={16} />Valores de exemplo, ainda não confirmados</p> : null}
   </div>

   <section className="mt-resumo-box" aria-labelledby={id('h-resumo')}>
    <h3 id={id('h-resumo')}>Em vigor hoje</h3>
    <p className="mt-sub">{DAY_TYPE_TODAY[todayType]}</p>
    <div className="mt-stats">
     <Stat label="Calorias" value={`${nf.format(todayKcal)} kcal`} note={`${nf.format(todayCarbs)} g de carboidrato`} />
     <Stat label="Proteína" value={`${nf.format(current.protein)} g`} note={current.proteinAuto ? 'pelo seu peso' : 'definida por você'} />
     <Stat label="Gordura" value={`${nf.format(current.fat)} g`} />
     <Stat label="Água" value={`${nf.format(current.waterL)} L`} note={`${Math.round(current.waterL * 2)} copos`} />
    </div>
   </section>

   {hasErrors ? <p className="mt-resumo" role="alert"><Icon name="info" size={18} />Corrija os campos destacados para salvar.</p> : null}

   <section className="mt-sec" aria-labelledby={id('h-todos')}>
    <div className="mt-head"><h3 id={id('h-todos')}>Valem para todos os dias</h3><p className="mt-sub">Estes três não mudam com o tipo de dia.</p></div>
    <div className="mt-prot">
     <div className="mt-switch-row">
      <div className="grow"><strong id={id('auto-rotulo')}>Proteína: calcular pelo peso</strong>
       <p className="mt-help" id={id('auto-ajuda')}>{form.proteinAuto
        ? (hasWeight ? `Proteína calculada pelo seu peso: 2,4 g por kg, ou ${nf.format(autoProtein)} g por dia.` : `Proteína calculada pelo seu peso. Informe o peso em Perfil; até lá, usamos ${nf.format(autoProtein)} g.`)
        : 'Desligado: você define a proteína em gramas.'}</p></div>
      <button type="button" role="switch" className="switch" aria-checked={form.proteinAuto} aria-labelledby={id('auto-rotulo')} aria-describedby={id('auto-ajuda')} onClick={toggleAuto} />
     </div>
     {!form.proteinAuto ? <Field id={id('prot')} label="Proteína (g)" error={shown.proteinG} help="Gramas por dia." describedBy={protWarn.length ? id('prot-avisos') : undefined}>
      {p => <input {...p} type="text" inputMode="numeric" autoComplete="off" value={form.proteinG} onChange={e => set('proteinG', e.target.value)} />}
     </Field> : null}
     {protWarn.length ? <Warnings id={id('prot-avisos')} items={protWarn} /> : null}
    </div>
    <Field id={id('gord')} label="Gordura (g)" error={shown.fatG} help="Gramas por dia. Entra na conta das calorias." describedBy={fatWarn.length ? id('gord-avisos') : undefined}>
     {p => <input {...p} type="text" inputMode="numeric" autoComplete="off" value={form.fatG} onChange={e => set('fatG', e.target.value)} />}
    </Field>
    {fatWarn.length ? <Warnings id={id('gord-avisos')} items={fatWarn} /> : null}
    <Field id={id('agua')} label="Água (L)" error={shown.waterL} help="Litros por dia, de 0,5 em 0,5. Cada copo do registro tem 500 ml." describedBy={waterWarn.length ? id('agua-avisos') : undefined}>
     {p => <input {...p} type="text" inputMode="decimal" autoComplete="off" value={form.waterL} onChange={e => set('waterL', e.target.value)} />}
    </Field>
    {waterWarn.length ? <Warnings id={id('agua-avisos')} items={waterWarn} /> : null}
   </section>

   <section className="mt-sec" aria-labelledby={id('h-dias')}>
    <div className="mt-head"><h3 id={id('h-dias')}>Calorias e carboidratos por tipo de dia</h3>
     <p className="mt-sub">No plano de exemplo, dias de treino mais pesado têm mais carboidrato, uma das fontes de energia do treino. Toque em um tipo de dia para ajustar.</p></div>
    <div className="mt-days">
     {DAY_TYPES.map(d => {
      const kErr = shown[`days.${d}.kcal`], cErr = shown[`days.${d}.carbs`];
      const kcal = intOf(form.days[d].kcal);
      const carbs = intOf(form.days[d].carbs);
      const sum = carbs !== null && fatNum !== null && effProtein !== null ? kcalFromMacros(effProtein, carbs, fatNum) : null;
      const diff = sum !== null && kcal !== null ? sum - kcal : null;
      const matches = diff !== null && kcal !== null && Math.abs(diff) <= macroTolerance(kcal);
      const dw = dayWarnings(d);
      const wId = id(`${d}-avisos`), confId = id(`${d}-conf`), calcId = id(`${d}-calc-ajuda`), bodyId = id(`${d}-corpo`), titleId = id(`${d}-titulo`);
      const isOpen = open[d];
      const preview = kcal !== null && fatNum !== null && effProtein !== null ? carbsFromRest(kcal, effProtein, fatNum) : null;
      const resumoLinha = kcal !== null && carbs !== null ? `${nf.format(kcal)} kcal · ${nf.format(carbs)} g de carboidrato` : 'Confira os valores';
      const describedBy = [sum !== null ? confId : '', dw.length ? wId : ''].filter(Boolean).join(' ') || undefined;
      return <div className={`mt-day${isOpen ? ' open' : ''}`} key={d}>
       <h4 className="mt-day-h">
        <button type="button" className="mt-day-toggle" aria-expanded={isOpen} aria-controls={bodyId} onClick={() => setOpen(o => ({ ...o, [d]: !o[d] }))}>
         <span className="mt-day-text">
          <span className="mt-day-titulo" id={titleId}>{DAY_TYPE_LABEL[d]}{d === todayType ? <span className="mt-hoje">Hoje</span> : null}</span>
          <span className="mt-day-ctx">{DAY_CONTEXT[d]}</span>
          <span className="mt-day-vals">{resumoLinha}{dw.length || kErr || cErr ? ' · com aviso' : ''}</span>
         </span>
         <Icon name="chevron" size={22} className="mt-chev" />
        </button>
       </h4>
       <div className="mt-day-body" id={bodyId} role="group" aria-labelledby={titleId} hidden={!isOpen}>
        <div className="mt-pair">
         <Field id={id(`${d}-kcal`)} label="Calorias do dia" error={kErr} errorBelow help="Quanto você quer comer nesse tipo de dia, em kcal." describedBy={describedBy}>
          {p => <input {...p} type="text" inputMode="numeric" autoComplete="off" value={form.days[d].kcal} onChange={e => setDay(d, 'kcal', e.target.value)} />}
         </Field>
         <Field id={id(`${d}-carbs`)} label="Carboidratos do dia" error={cErr} errorBelow help="Em gramas, nesse tipo de dia." describedBy={describedBy}>
          {p => <input {...p} type="text" inputMode="numeric" autoComplete="off" value={form.days[d].carbs} onChange={e => setDay(d, 'carbs', e.target.value)} />}
         </Field>
        </div>
        {kErr ? <p className="mt-error" id={`${id(`${d}-kcal`)}-erro`}><Icon name="info" size={18} />{kErr}</p> : null}
        {cErr ? <p className="mt-error" id={`${id(`${d}-carbs`)}-erro`}><Icon name="info" size={18} />{cErr}</p> : null}
        {sum !== null && kcal !== null && diff !== null ? <p className={`mt-conf${matches ? ' ok' : ''}`} id={confId}>
         <Icon name={matches ? 'marca' : 'info'} size={18} />
         <span>Proteína, carboidrato e gordura somam cerca de {nf.format(sum)} kcal; as calorias do dia são {nf.format(kcal)} kcal. {matches ? 'A diferença é pequena.' : `A soma está ${nf.format(Math.abs(diff))} kcal ${diff < 0 ? 'abaixo' : 'acima'} das calorias do dia. Você ainda pode salvar.`}</span>
        </p> : null}
        <div className="mt-complete">
         <button type="button" className="mt-calc" aria-describedby={calcId} onClick={() => calc(d)}>Completar o carboidrato</button>
         <div className="mt-note" role="status">{calcNote?.day === d ? <>{calcNote.text}{calcNote.undo !== undefined ? <button type="button" className="mt-undo" onClick={() => undoCalc(d, calcNote.undo as string)}>Desfazer</button> : null}</> : null}</div>

         <p className="mt-help" id={calcId}>Preenche o carboidrato com as calorias que sobram depois da proteína e da gordura.{preview !== null && carbs !== null ? ` Agora: ${nf.format(carbs)} g. Completando: ${nf.format(preview)} g.` : ''}</p>
        </div>
        {dw.length ? <Warnings id={wId} items={dw} /> : null}
       </div>
      </div>;
     })}
    </div>
   </section>

   <section className="mt-saude" aria-label="Aviso de saúde">
    <Icon name="info" size={20} />
    <div>
     <p>{SAUDE_CURTO}</p>
     <button type="button" className="mt-more" aria-expanded={saudeOpen} aria-controls={id('saude-completo')} onClick={() => setSaudeOpen(v => !v)}>{saudeOpen ? 'Mostrar menos' : 'Saiba mais'}</button>
     <p id={id('saude-completo')} hidden={!saudeOpen}>{SAUDE}</p>
    </div>
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
