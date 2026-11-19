import { hrefFor } from '../../app/router';
import { useData } from '../../app/DataProvider';
import type { DayIso } from '../../domain/calendar';
import { Icon } from '../../ui/icons';
import { MEALS, MEAL_NAME, fmt } from '../dieta/dietData';
import { useDietDay } from '../dieta/useDietDay';

/** Uma linha da dieta no Início: a próxima refeição e as kcal restantes (ou só as refeições, com hideDietNumbers). */
export function DietaResumo({ day, isToday }: { day: DayIso; isToday: boolean }) {
 const { dd, target, totals, prog } = useDietDay(day);
 const { state } = useData();
 const hide = state?.settings.onboarding?.hideDietNumbers === true;
 const next = MEALS.find(m => !dd.eaten[m]);
 const dayQ = isToday ? undefined : day;
 const over = totals.kcal > target.kcal;
 const detail = hide || target.kcal <= 0 ? `${totals.eatenCount} de 5 refeições` : over ? `${fmt(totals.kcal - target.kcal)} kcal acima da meta` : `${fmt(prog.remaining)} kcal restantes`;
 return <a className="in-dieta" href={hrefFor(next ? { tab: 'dieta', meal: next, day: dayQ } : { tab: 'dieta', day: dayQ })}>
  <Icon name="dieta" size={22} />
  <span className="in-dieta-text">
   <span className="in-dieta-k">{next ? 'Próxima refeição' : 'Dieta de hoje'}</span>
   <strong>{next ? MEAL_NAME[next] : 'Todas as refeições marcadas'}</strong>
  </span>
  <span className="in-dieta-v num">{detail}</span>
  <Icon name="seta" size={20} />
 </a>;
}
