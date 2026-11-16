import { useData } from '../../app/DataProvider';
import type { StateV3 } from '../../application/repository';
import type { DayIso } from '../../domain/calendar';
import { dayTotals, progress, markEaten, unmarkEaten } from '../../domain/diet';
import { dayTargetFor } from '../../domain/dietTargets';
import type { DietDay, DietOption, MealKey } from '../../domain/diet';
import { catalogOf, dayTypeFor, readDay } from './dietData';

export interface MealSnapshot { pick: string | undefined; eaten: boolean; consumed: NonNullable<DietDay['consumed']>[MealKey] }

/** Leitura do dia e gravação por commit. A regra (marcar, desmarcar, totais) vem de src/domain/diet.ts. */
export function useDietDay(day: DayIso) {
 const { state, commit } = useData();
 const s = state as StateV3;
 const catalog = catalogOf(s);
 const dd = readDay(s.history.days[day]?.diet);
 const type = dayTypeFor(s, day);
 const target = dayTargetFor(type, day, s.settings);
 const totals = dayTotals(dd, catalog);
 const prog = progress(totals, target);

 const update = (fn: (d: DietDay) => DietDay) => void commit(draft => {
  const rec = draft.history.days[day] ?? (draft.history.days[day] = {});
  rec.diet = fn(readDay(rec.diet)) as unknown as Record<string, unknown>;
  return draft;
 });
 const optionOf = (meal: MealKey, key: string | undefined): DietOption | undefined => catalog[meal].find(o => o.key === key);

 return {
  state: s, catalog, dd, type, target, totals, prog, update, optionOf,
  /** Marca ou desmarca; sem opção escolhida devolve false para a tela abrir a refeição. */
  toggleEaten(meal: MealKey): 'unmarked' | 'marked' | 'needs-pick' {
   if (dd.eaten[meal]) { update(d => unmarkEaten(d, meal)); return 'unmarked'; }
   const opt = optionOf(meal, dd.pick[meal]);
   if (!opt) return 'needs-pick';
   update(d => markEaten(d, meal, opt));
   return 'marked';
  },
  /** Escolhe a opção; se a refeição já estava consumida, a cópia consumida acompanha a nova opção. */
  choose(meal: MealKey, opt: DietOption) {
   update(d => { const next = { ...d, pick: { ...d.pick, [meal]: opt.key } }; return d.eaten[meal] ? markEaten(next, meal, opt) : next; });
  },
  mark(meal: MealKey, opt: DietOption) { update(d => markEaten({ ...d, pick: { ...d.pick, [meal]: opt.key } }, meal, opt)); },
  unmark(meal: MealKey) { update(d => unmarkEaten(d, meal)); },
  /** Foto de uma refeição (opção escolhida, consumo e cópia consumida) para desfazer sem tocar nas outras refeições. */
  snapshotMeal(meal: MealKey): MealSnapshot {
   return { pick: dd.pick[meal], eaten: Boolean(dd.eaten[meal]), consumed: dd.consumed?.[meal] ? { ...dd.consumed[meal]! } : undefined };
  },
  restoreMeal(meal: MealKey, snap: MealSnapshot) {
   update(d => {
    const pick = { ...d.pick }; if (snap.pick === undefined) delete pick[meal]; else pick[meal] = snap.pick;
    const eaten = { ...d.eaten }; if (snap.eaten) eaten[meal] = true; else delete eaten[meal];
    const consumed = { ...d.consumed }; if (snap.consumed) consumed[meal] = snap.consumed; else delete consumed[meal];
    return { ...d, pick, eaten, consumed };
   });
  },
 };
}
