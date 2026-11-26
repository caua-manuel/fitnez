import { useRef, useState } from 'react';
import { useData } from '../../app/DataProvider';
import { hrefFor } from '../../app/router';
import { Icon } from '../../ui/icons';
import { ConfirmSheet } from '../../ui/Sheet';
import type { DayIso } from '../../domain/calendar';
import { applyAdjustments } from '../../domain/diet';
import type { DietOption, MealKey } from '../../domain/diet';
import { showToast } from '../../ui/UndoToast';
import { DayNav, MealThumb } from './parts';
import { LABEL_NOTE, MENU_NOTE, MEAL_LOWER, MEAL_NAME, catalogOf, fmt, hasAllergy, optionNumber } from './dietData';
import { useDietDay } from './useDietDay';
import { CheckDraw } from '../../ui/motion';
import { useJustTurnedOn } from '../treino/stagger';

interface Props { meal: MealKey; day: DayIso; today: DayIso; setDay: (d: DayIso) => void }

export function MealTop({ meal, day, today, manage, info }: { meal: MealKey; day: DayIso; today: DayIso; manage: boolean; info?: { open: boolean; toggle: () => void } }) {
 const dayQ = day === today ? undefined : day;
 return <>
  <div className="dt-topbar">
   <a className="icon-button" href={hrefFor({ tab: 'dieta', day: dayQ })} aria-label="Voltar para a Dieta"><Icon name="voltar" size={26} /></a>
   <p className="dt-topbar-title" aria-hidden="true">{MEAL_NAME[meal]}</p>
   {info ? <button type="button" className="icon-button" aria-label="Sobre esta refeição" aria-expanded={info.open} onClick={info.toggle}><Icon name="info" size={26} /></button> : <span className="dt-topbar-spacer" />}
  </div>
  <nav className="dt-tabs" aria-label={`Seções de ${MEAL_LOWER[meal]}`}>
   <a href={hrefFor({ tab: 'dieta', meal, day: dayQ })} aria-current={manage ? undefined : 'page'}>Opções do dia</a>
   <a href={hrefFor({ tab: 'dieta', meal, manage: true, day: dayQ })} aria-current={manage ? 'page' : undefined}>Gerenciar opções</a>
  </nav>
 </>;
}

function Recipe({ id }: { id: string }) {
 const { state } = useData();
 if (!state) return null;
 const r = state.catalog.recipes.find(x => x.id === id);
 if (!r) return null;
 return <details className="dt-recipe">
  <summary><span>Ver receita</span><Icon name="chevron" size={20} /></summary>
  <div className="dt-recipe-body">
   <h3>{String(r.n)}</h3>
   {r.t ? <p className="muted">Preparo: {String(r.t)}</p> : null}
   <h4>Ingredientes</h4>
   <ul>{(r.ing as string[]).map((x, i) => <li key={i}>{x}</li>)}</ul>
   <h4>Modo de preparo</h4>
   <ol>{(r.pas as string[]).map((x, i) => <li key={i}>{x}</li>)}</ol>
   {r.dica ? <p className="dt-tip"><strong>Dica:</strong> {String(r.dica)}</p> : null}
  </div>
 </details>;
}

type GenOption = DietOption & { foods?: { id: string; qty: number }[] };

/** "Trocar este alimento" (ADR 013): a troca e a regra vêm de application/generatedDiet, carregado só no toque. */
function FoodList({ meal, option, today }: { meal: MealKey; option: GenOption; today: DayIso }) {
 const { state, repository, run, commit, busy } = useData();
 const [pendingSwap, setPendingSwap] = useState<{ index: number; revision: number } | null>(null);
 // Ids já mostrados em cada posição, para a sequência de trocas não voltar ao anterior.
 const seen = useRef(new Map<number, string[]>());
 const foods = option.foods ?? [];
 const swap = async (j: number, expectedRevision: number) => {
  if (!state) return;
  const id = foods[j]?.id;
  if (!id) return;
  const prev = structuredClone(catalogOf(state)[meal]);
  const exclude = [...new Set([...(seen.current.get(j) ?? []), id])];
  const r = await run(async () => {
   const gd = await import('../../application/generatedDiet');
   return gd.swapDietFood(repository, { meal, optionKey: option.key, foodId: id, expectedRevision, today, exclude });
  });
  if (r === undefined) return;
  if (r === null) { showToast('Não há troca parecida para este alimento.'); return; }
  const now = (r.catalog.diet as Record<string, GenOption[] | undefined>)[meal]?.find(o => o.key === option.key)?.foods?.[j]?.id;
  seen.current.set(j, now ? [...exclude, now] : exclude);
  showToast('Alimento trocado', () => void commit(s => { s.catalog.diet = { ...s.catalog.diet, [meal]: prev }; return s; }));
 };
 return <>
  <ul className="dt-foods" aria-label={`Alimentos de ${option.name}`}>
   {option.items.map((t, j) => <li key={j}>
    <span className="dt-food-t">{t.replace(" (a verificar)", "")}</span>
    {foods[j] ? <button type="button" className="dt-swap" aria-disabled={busy} aria-label={`Trocar este alimento: ${t.replace(" (a verificar)", "")}`} onClick={e => {
     if (busy || !state) return;
     if (option.edited) {
      e.currentTarget.focus({ preventScroll: true });
      setPendingSwap({ index: j, revision: state.revision });
     } else void swap(j, state.revision);
    }}>Trocar</button> : null}
   </li>)}
  </ul>
  {pendingSwap ? <ConfirmSheet title="Trocar alimento?" confirmLabel="Trocar mesmo" icon="troca" onCancel={() => setPendingSwap(null)} onConfirm={() => {
   setPendingSwap(null);
   void swap(pendingSwap.index, pendingSwap.revision);
  }}>
   <p className="dt-confirm-text">Trocar vai refazer a lista desta opção e descartar a sua edição. Você pode desfazer logo depois.</p>
  </ConfirmSheet> : null}
 </>;
}

export function Refeicao({ meal, day, today, setDay }: Props) {
 const st = useData().state;
 const hide = st?.settings.onboarding?.hideDietNumbers === true;
 const { dd, catalog, type, choose, mark, unmark, snapshotMeal, restoreMeal } = useDietDay(day);
 const [info, setInfo] = useState(false);
 const options = catalog[meal];
 const generated = options.some(o => Array.isArray((o as GenOption).foods));
 const pickedKey = dd.pick[meal];
 const picked = options.find(o => o.key === pickedKey);
 const eaten = Boolean(dd.eaten[meal]);
  const isToday = day === today;
 // Trocar a opção de uma refeição já consumida muda o consumo na hora: avisa e permite desfazer (a cópia consumida volta como estava).
 const pickOption = (o: DietOption) => {
  if (o.key === pickedKey) return;
  const snap = snapshotMeal(meal);
  choose(meal, o);
  if (eaten) showToast(`Opção trocada: ${MEAL_NAME[meal]} opção ${optionNumber(options, o.key)}`, () => restoreMeal(meal, snap));
 };
 const unmarkWithUndo = () => { const snap = snapshotMeal(meal); unmark(meal); showToast(`${MEAL_NAME[meal]} desmarcado`, () => restoreMeal(meal, snap)); };
 const freshEaten = useJustTurnedOn(eaten);
 const note = picked ? applyAdjustments(picked, type, meal).note : options[0] ? applyAdjustments(options[0], type, meal).note : undefined;

 return <div className="dt dt-meal-screen tone-dieta">
  <MealTop meal={meal} day={day} today={today} manage={false} info={{ open: info, toggle: () => setInfo(v => !v) }} />
  <DayNav day={day} today={today} onChange={setDay} />
  {info ? <p className="dt-note" role="note">Escolha a opção que você consumiu e toque em Marcar como consumido. O que você marca fica guardado neste dia; mudar o cardápio depois não altera dias já registrados.</p> : null}

  <div className="dt-intro">
   <h2>Escolha uma opção</h2>
   <p>Selecione a refeição que você consumiu {isToday ? 'hoje' : 'neste dia'}.</p>
  </div>
  {note ? <p className="dt-note dt-adjust-note">{note}</p> : null}
  {!picked && !eaten && options.length ? <p className="help" id="dt-pick-help">Escolha uma opção abaixo para poder marcar como consumido.</p> : null}

  {options.length === 0 ? <div className="card"><p>Esta refeição não tem opções. Cadastre uma em Gerenciar opções.</p><a className="button secondary" href={hrefFor({ tab: 'dieta', meal, manage: true, day: isToday ? undefined : day })}>Gerenciar opções</a></div> : <div className="dt-options" role="radiogroup" aria-label={`Opções de ${MEAL_LOWER[meal]}`}>
   {options.map((o: DietOption, i) => {
    const on = o.key === pickedKey;
    return <div key={o.key} className={`dt-opt${on ? ' on' : ''}`}>
     <label className="dt-opt-main">
      <input type="radio" name={`opcao-${meal}`} value={o.key} checked={on} onChange={() => pickOption(o)} />
      <MealThumb meal={meal} option={o.key} size={72} />
      <span className="dt-opt-text">
       <span className="dt-tag">Opção {i + 1}</span>
       <strong className="dt-opt-name">{o.name}</strong>
       {hide ? null : <><span className="dt-opt-kcal">{fmt(o.kcal)} kcal</span>
       <span className="dt-opt-macros"><span>P {fmt(o.p)} g</span><span>C {fmt(o.c)} g</span><span>G {fmt(o.g)} g</span></span></>}
      </span>
      <span className="dt-radio" aria-hidden="true" />
      {generated ? null : <span className="dt-opt-items">{o.items.join(' · ')}</span>}
     </label>
     {generated ? <FoodList meal={meal} option={o} today={today} /> : null}
     {o.rec ? <Recipe id={o.rec} /> : null}
    </div>;
   })}
  </div>}

  {generated ? <>
   {st && hasAllergy(st) ? <p className="dt-note dt-label-note" role="note">{LABEL_NOTE}</p> : null}
   <p className="dt-disclaimer">{MENU_NOTE}</p>
  </> : null}

  <div className="dt-sticky">
   {eaten ? <>
    <p className="dt-eaten-msg"><CheckDraw play={freshEaten} size={18} />Consumido neste dia</p>
    <button type="button" className="button secondary dt-bar-btn" onClick={unmarkWithUndo}>Desmarcar consumo</button>
   </> : <button type="button" className="button block dt-bar-btn" disabled={!picked} aria-describedby={picked ? undefined : 'dt-pick-help'} onClick={() => picked && mark(meal, picked)}><Icon name="marca" size={20} weight={2.2} />Marcar como consumido</button>}
  </div>
 </div>;
}
