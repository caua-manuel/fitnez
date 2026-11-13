import { hrefFor } from '../../app/router';
import type { DayIso } from '../../domain/calendar';
import { DAY_TYPE_LABEL, fmt } from '../dieta/dietData';
import { useDietDay } from '../dieta/useDietDay';

const MACROS = [{ key: 'p', label: 'Proteínas', t: 'protein' }, { key: 'c', label: 'Carboidratos', t: 'carbs' }, { key: 'g', label: 'Gorduras', t: 'fat' }] as const;

/** Resumo da dieta do dia no cartão principal do Início: só leitura, com os números reais da aba Dieta. */
export function DietaResumo({ day, isToday }: { day: DayIso; isToday: boolean }) {
 const { type, target, totals } = useDietDay(day);
 return <>
  <p className="eyebrow">{isToday ? 'Dieta de hoje' : 'Dieta do dia'}</p>
  <h2>{DAY_TYPE_LABEL[type]}</h2>
  <p className="in-meta"><span>{fmt(totals.kcal)} de {fmt(target.kcal)} kcal</span><span>{totals.eatenCount} de 5 refeições</span></p>
  <div className="in-macros">
   {MACROS.map(({ key, label, t }) => {
    const value = totals[key], goal = target[t], pct = goal > 0 ? Math.min(100, Math.round((value / goal) * 100)) : 0;
    return <div className="in-macro" key={key}>
     <div className="in-macro-top"><span>{label}</span><span>{fmt(value)} g de {fmt(goal)} g</span></div>
     <div className="bar" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}><span style={{ width: `${pct}%` }} /></div>
    </div>;
   })}
  </div>
  <a className="button block in-start" href={hrefFor({ tab: 'dieta', day: isToday ? undefined : day })}>Abrir dieta</a>
 </>;
}
