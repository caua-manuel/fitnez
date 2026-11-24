import { useEffect, useState } from 'react';
import { useData } from '../../app/DataProvider';
import { hrefFor } from '../../app/router';
import type { Route } from '../../app/router';
import { Icon } from '../../ui/icons';
import { mondayOf } from '../../domain/calendar';
import type { DayIso } from '../../domain/calendar';
import { applyAdjustments, weeklyReview } from '../../domain/diet';
import type { MealKey } from '../../domain/diet';
import { showToast } from '../../ui/UndoToast';
import { todayIso } from '../treino/util';
import { Cup, CheckButton, DayNav, KcalRing, MealThumb } from './parts';
import { DAY_TYPE_LABEL, LABEL_NOTE, MEALS, MEAL_NAME, dayLabel, fmt, hasAllergy, isGeneratedDiet, nf1, optionNumber, visibleMeals, weeklyAverages } from './dietData';
import { useDietDay } from './useDietDay';
import { useStagger } from '../treino/stagger';
import { MetaDieta } from './MetaDieta';
import { Refeicao } from './Refeicao';
import { GerenciarOpcoes } from './GerenciarOpcoes';
import './dieta.css';

type DietRoute = Extract<Route, { tab: 'dieta' }>;
const MACROS = [{ key: 'p', label: 'Proteínas', t: 'protein' }, { key: 'c', label: 'Carboidratos', t: 'carbs' }, { key: 'g', label: 'Gorduras', t: 'fat' }] as const;

export function Dieta({ route }: { route: DietRoute }) {
 const { state } = useData();
 const today = todayIso();
 const [day, setDayState] = useState<DayIso>(route.day ?? today);
 useEffect(() => { setDayState(route.day ?? todayIso()); }, [route.day, route.meal, route.manage]);
 // Trocar de dia não muda de rota para o foco permanecer nos botões; só o endereço é atualizado.
 const setDay = (d: DayIso) => {
  setDayState(d);
  window.history.replaceState(null, '', hrefFor({ ...route, day: d === today ? undefined : d }));
 };
 if (!state) return null;
 if (route.meal && route.manage) return <GerenciarOpcoes meal={route.meal} day={day} today={today} setDay={setDay} />;
 if (route.meal) return <Refeicao meal={route.meal} day={day} today={today} setDay={setDay} />;
 return <Resumo day={day} today={today} setDay={setDay} />;
}

function Resumo({ day, today, setDay }: { day: DayIso; today: DayIso; setDay: (d: DayIso) => void }) {
 const { state, commit } = useData();
 const { dd, catalog, type, target, totals, prog, update, toggleEaten, snapshotMeal, restoreMeal } = useDietDay(day);
 const rv = useStagger('dieta-resumo');
 const isToday = day === today;
 const link = (meal: MealKey) => hrefFor({ tab: 'dieta', meal, day: isToday ? undefined : day });
 const hide = state?.settings.onboarding?.hideDietNumbers === true;
 const over = totals.kcal > target.kcal;
 const shown = visibleMeals(catalog);
 const generated = isGeneratedDiet(catalog);
 const nextMeal = shown.find(m => !dd.eaten[m]);
 const cups = Math.max(Math.round((target.waterL * 1000) / 500), dd.water);
 const water = (i: number) => update(d => ({ ...d, water: d.water === i ? i - 1 : i }));
 const notes = MEALS.map(m => ({ m, note: applyAdjustments(catalog[m][0] ?? { key: '', name: '', kcal: 0, p: 0, c: 0, g: 0, items: [] }, type, m).note })).filter(x => x.note);

 const avg = weeklyAverages(state!.history.measurements);
 const review = avg.any ? weeklyReview({ weights: avg.weights, waists: avg.waists, strengthDown: false, hungerHigh: false }) : null;
 const week = mondayOf(today);
 const dismissed = state!.settings.dietReviewDismissed === week;
 const dismiss = () => {
  void commit(s => { s.settings.dietReviewDismissed = week; return s; });
  showToast('Revisão dispensada por esta semana', () => void commit(s => { delete s.settings.dietReviewDismissed; return s; }));
 };

 return <div className="dt tone-dieta">
  <DayNav day={day} today={today} onChange={setDay} />

  {hide ? <section className="card dt-summary-plain" aria-label="Resumo do dia">
   <p><strong>{totals.eatenCount} de {shown.length}</strong> refeições marcadas</p>
   <p className="muted">Por escolha do seu plano, a Dieta mostra só as refeições e as marcações, sem números de metas.</p>
  </section> : <><section className="card dt-summary" aria-label="Resumo do dia">
   <div className="dt-ring-box">
    <KcalRing kcal={totals.kcal} target={target.kcal} />
    <p className={`dt-ring-left num${over ? ' warn' : ''}`}>{over ? `${fmt(totals.kcal - target.kcal)} kcal acima da meta` : `${fmt(prog.remaining)} kcal restantes`}</p>
   </div>
   <div className="dt-macros">
    {MACROS.map(({ key, label, t }) => {
     const value = totals[key], goal = target[t], pct = goal > 0 ? value / goal : 0;
     return <div className="dt-macro" key={key}>
      <div className="dt-macro-top"><span className="dt-macro-name">{label}</span><span className="dt-macro-val">{fmt(value)} g de {fmt(goal)} g</span></div>
      <div className="dt-macro-bar"><div className="bar" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.min(100, Math.round(pct * 100))}><span style={{ transform: `scaleX(${Math.min(1, pct)})` }} /></div><span className="dt-pct">{Math.round(pct * 100)}%</span></div>
     </div>;
    })}
   </div>
  </section>


  <MetaDieta /></>}

  <div className="section-title"><h2>{isToday ? 'Refeições de hoje' : `Refeições de ${dayLabel(day, today).toLowerCase()}`}</h2><span className="dt-count">{totals.eatenCount} de {shown.length}</span></div>
  <ul className="list dt-meals" aria-label="Refeições">
   {shown.map(m => {
    const eaten = Boolean(dd.eaten[m]);
    const opt = eaten ? (dd.consumed?.[m] ?? catalog[m].find(o => o.key === dd.pick[m])) : catalog[m].find(o => o.key === dd.pick[m]);
    const picked = Boolean(dd.pick[m]);
    const kcal = opt && !hide ? opt.kcal : null;
    return <li key={m} {...rv(shown.indexOf(m), `dt-meal${eaten ? ' done' : ''}`)}>
     <a className="dt-meal-link" href={link(m)}>
      <MealThumb meal={m} size={56} />
      <span className="dt-meal-text">
       <strong>{MEAL_NAME[m]}</strong>
       <span className={`dt-meal-opt${picked && opt ? '' : ' empty'}`}>{picked && opt ? `Opção ${optionNumber(catalog[m], opt.key)} · ${opt.name}` : 'Não registrado'}</span>
       {kcal !== null ? <span className="dt-meal-kcal-in">{fmt(kcal)} kcal</span> : null}
      </span>
      {kcal !== null ? <span className="dt-meal-kcal">{fmt(kcal)} kcal</span> : null}
     </a>
     <CheckButton on={eaten} choose={!eaten && !picked}
      label={!eaten && !picked ? `Escolher opção de ${MEAL_NAME[m]}` : `${MEAL_NAME[m]} consumido`}
      onClick={() => {
       const snap = snapshotMeal(m);
       const r = toggleEaten(m);
       if (r === 'needs-pick') { window.location.hash = link(m); return; }
       showToast(r === 'marked' ? `${MEAL_NAME[m]} marcado como consumido` : `${MEAL_NAME[m]} desmarcado`, () => restoreMeal(m, snap));
      }} />
    </li>;
   })}
  </ul>

  {nextMeal ? <a className="button block dt-cta" href={link(nextMeal)}><Icon name="plus" size={20} weight={2} />Registrar {nextMeal === 'cafe' ? 'o café da manhã' : nextMeal === 'almoco' ? 'o almoço' : nextMeal === 'jantar' ? 'o jantar' : nextMeal === 'lanche' ? 'o lanche' : 'o pós-treino'}</a> : null}

  <section className="card dt-adjust" aria-labelledby="dt-adjust-h">
   <div className="dt-adjust-head"><h2 id="dt-adjust-h">{isToday ? 'Ajustes de hoje' : 'Ajustes do dia'}</h2><span className="badge done">{DAY_TYPE_LABEL[type]}</span></div>
   <p className="dt-focus">{target.focus}</p>
   {target.adjustments.length ? <ul className="dt-adj-list">{target.adjustments.map(a => <li key={a}>{a}</li>)}</ul> : <p className="muted dt-adj-none">Nenhum ajuste: siga o cardápio base.</p>}
   {notes.length ? <ul className="dt-adj-list dt-adj-notes">{notes.map(n => <li key={n.m}><strong>{MEAL_NAME[n.m]}:</strong> {n.note}</li>)}</ul> : null}
  </section>

  <section className="card dt-water" aria-labelledby="dt-water-h">
   <div className="dt-water-head">
    <span className="icon-tile soft"><Icon name="agua" size={24} weight={1.6} /></span>
    <div className="grow"><h2 id="dt-water-h">Água</h2><p>{nf1.format(dd.water * 0.5)} L de {nf1.format(target.waterL)} L</p></div>
   </div>
   <div className="dt-cups" role="group" aria-label="Copos de 500 ml">
    {Array.from({ length: cups }, (_, k) => k + 1).map(i => <button type="button" key={i} className="dt-cup-btn" aria-pressed={i <= dd.water} aria-label={`Copo ${i} de ${cups}, 500 ml`} onClick={() => water(i)}><Cup filled={i <= dd.water} /></button>)}
   </div>
   <p className="help dt-water-help">Cada copo tem 500 ml. Toque no último copo cheio para tirar.</p>
  </section>

  <div className="list-row dt-crea">
   <div className="grow"><strong>Creatina</strong><small>{dd.crea ? (isToday ? 'Tomada hoje' : 'Tomada neste dia') : 'Ainda não tomada'}</small></div>
   <CheckButton on={dd.crea} label="Creatina tomada" onClick={() => { const was = dd.crea; update(d => ({ ...d, crea: !was })); showToast(was ? 'Creatina desmarcada' : 'Creatina marcada como tomada', () => update(d => ({ ...d, crea: was }))); }} />
  </div>

  {!dismissed ? <section className="card dt-review" aria-labelledby="dt-review-h">
   <h2 id="dt-review-h">Revisão semanal</h2>
   {review ? <>
    <p>{review.text}</p>
    <div className="dt-review-actions"><button type="button" className="button secondary" onClick={dismiss}>Dispensar por esta semana</button></div>
   </> : <>
    <p>Registre seu peso e cintura em Evolução.</p>
    <a className="dt-link" href={hrefFor({ tab: 'evolucao' })}>Abrir Evolução<Icon name="seta" size={18} /></a>
   </>}
  </section> : null}

  {generated && hasAllergy(state!) ? <p className="dt-note dt-label-note" role="note">{LABEL_NOTE}</p> : null}
  <p className="dt-disclaimer">Calorias e proteínas são estimativas e variam com marca, preparo e porção. O app não substitui nutricionista ou médico.</p>
 </div>;
}
