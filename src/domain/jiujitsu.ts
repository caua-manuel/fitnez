import type { DayRecord, Plan } from '../application/repository';
import { addDays, mondayOf, type DayIso } from './calendar';
import { parseNumber } from './workout';
import { listWorkouts } from './workoutRecord';

export type Criterion = { key: 'aulas' | 'sono' | 'cargas' | 'semana'; ok: boolean | null; text: string };
export type Eligibility = { status: 'indisponivel' | 'ainda-nao' | 'elegivel'; criteria: Criterion[]; summary: string };

const MIN_WEEK = 5; // índice 0-based: a partir da 6ª semana
const ISO = /^\d{4}-\d{2}-\d{2}$/;
const isMain = (id: string, name: unknown) => id === 'UA' || id === 'LW' || /upper a|lower/i.test(String(name ?? ''));

function mainIds(plan?: Plan): Set<string> {
 const ids = new Set<string>(['UA', 'LW']);
 for (const [id, s] of Object.entries(plan?.sess ?? {})) if (isMain(id, s?.name)) ids.add(id);
 return ids;
}

// Carga máxima (kg, séries feitas) por exercício nos treinos principais da semana.
function weekMax(days: Record<string, DayRecord>, monday: DayIso, w: number, ids: Set<string>, plan?: Plan): Map<string, number> {
 const out = new Map<string, number>();
 for (let i = 0; i < 7; i++) {
  const d = days[addDays(monday, w * 7 + i)];
  for (const wk of listWorkouts(d)) {
   if (!ids.has(wk.sessionId)) continue;
   // Séries são do dia: com plano, só os exercícios do treino contam para ele; sem plano, todos (comportamento antigo).
   const own = plan?.sess?.[wk.sessionId]?.ex;
   for (const [ex, sets] of Object.entries(d?.log ?? {})) {
    if (own && !own.includes(ex)) continue;
    for (const s of Array.isArray(sets) ? sets : []) {
     const kg = s?.done === true ? parseNumber(s.kg) : null;
     if (kg !== null && kg > 0) out.set(`${wk.sessionId}:${ex}`, Math.max(out.get(`${wk.sessionId}:${ex}`) ?? 0, kg));
    }
   }
  }
 }
 return out;
}

// Indicador apenas informativo: é SUGESTÃO, nunca bloqueia nem decide pelo dono.
// Sono: autodeclarado por semana em settings.sleepOk (chave = índice da semana, "true" = sono de 7 h ou mais).
export function thirdClassEligibility(input: { start: DayIso; today: DayIso; days: Record<string, DayRecord>; sleepOkByWeek?: Record<number, boolean>; plan?: Plan }): Eligibility {
 const days = input.days ?? {};
 const valid = ISO.test(String(input.start)) && ISO.test(String(input.today));
 const idx = valid ? Math.round((Date.parse(input.today) - Date.parse(mondayOf(input.start))) / 86400000) : -1;
 const cur = Math.min(Math.floor(idx / 7), 12);
 const semanaOk = valid && idx >= 0 && cur >= MIN_WEEK;
 const semana: Criterion = { key: 'semana', ok: semanaOk, text: semanaOk ? 'Já passou da semana 5.' : 'Só depois da semana 5 (a partir da 6ª semana).' };
 if (!semanaOk) return { status: 'indisponivel', criteria: [semana], summary: 'Indicador disponível só a partir da 6ª semana do plano.' };

 const weeks = [cur - 3, cur - 2, cur - 1]; // as 3 últimas semanas completas
 const monday = mondayOf(input.start);

 // (1) aulas
 let aulasOk = true; const bad: string[] = [];
 for (const w of weeks) {
  let n = 0, destroyed = false;
  for (let i = 0; i < 7; i++) {
   const d = days[addDays(monday, w * 7 + i)];
   if (d?.acts?.bjj === true) { n++; if (d.feel === 5) destroyed = true; }
  }
  if (n < 2) { aulasOk = false; bad.push(`semana ${w + 1} com ${n} aula${n === 1 ? '' : 's'}`); }
  else if (destroyed) { aulasOk = false; bad.push(`semana ${w + 1} com aula "destruído"`); }
 }
 const aulas: Criterion = { key: 'aulas', ok: aulasOk, text: aulasOk ? '3 semanas seguidas com 2 aulas sem "destruído".' : `3 semanas seguidas com 2 aulas sem "destruído" (${bad.join('; ')}).` };

 // (2) sono autodeclarado
 const sl = weeks.map(w => input.sleepOkByWeek?.[w]);
 const sonoOk = sl.some(v => v === false) ? false : sl.every(v => v === true) ? true : null;
 const sono: Criterion = { key: 'sono', ok: sonoOk, text: sonoOk === true ? 'Sono de 7 h ou mais nas 3 semanas.' : sonoOk === false ? 'Sono abaixo de 7 h em alguma das 3 semanas.' : 'Sem declaração de sono (7 h ou mais) nas 3 semanas.' };

 // (3) cargas do Upper A e do Lower: sem queda de uma semana para a seguinte (semanas de deload ficam de fora).
 const ids = mainIds(input.plan);
 const series = weeks.filter(w => w % 4 !== 3).map(w => weekMax(days, monday, w, ids, input.plan));
 let pairs = 0, dropped = false;
 for (let i = 1; i < series.length; i++) {
  for (const [k, kg] of series[i]!) {
   const prev = series[i - 1]!.get(k);
   if (prev === undefined) continue;
   pairs++; if (kg < prev) dropped = true;
  }
 }
 const cargasOk = dropped ? false : pairs === 0 ? null : true;
 const cargas: Criterion = { key: 'cargas', ok: cargasOk, text: cargasOk === true ? 'Cargas do Upper A e do Lower estáveis ou subindo.' : cargasOk === false ? 'Carga caiu no Upper A ou no Lower.' : 'Poucos registros de carga do Upper A e do Lower para comparar.' };

 const criteria = [semana, aulas, sono, cargas];
 if (criteria.every(c => c.ok === true)) return { status: 'elegivel', criteria, summary: 'Você pode considerar uma 3ª aula. É só uma sugestão: decida pelo seu corpo.' };
 const falta = criteria.filter(c => c.ok !== true).map(c => ({ aulas: 'aulas', sono: 'sono', cargas: 'cargas', semana: 'semana' })[c.key] + (c.ok === null ? ' (sem dados)' : ''));
 return { status: 'ainda-nao', criteria, summary: `Ainda não: falta ${falta.join(', ')}.` };
}
