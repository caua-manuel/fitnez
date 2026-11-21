import type { DayIso } from '../../domain/calendar';
import { roundHalf } from '../../domain/records';
import { DIET_FOOTNOTE } from '../../domain/weekSummary';
import type { BodyChange, WeekRecord, WeekSummary } from '../../domain/weekSummary';

// Texto do resumo da semana (ADR 011, 2.5). Só apresentação: os números vêm prontos de weekSummary.
// A mesma estrutura alimenta a tela (texto real, acessível) e o desenho do cartão, para os dois dizerem o mesmo.

const MONTHS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const nf = (n: number, digits = 1) => n.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: digits });
const kg = (n: number) => `${nf(n)} kg`;
const signed = (n: number, unit: string) => {
 const r = Math.round(n * 10) / 10;
 return r === 0 ? 'sem mudança' : `${r > 0 ? '+' : '−'}${nf(Math.abs(r))} ${unit}`;
};

/** "17 a 23 de novembro"; "28 de outubro a 3 de novembro"; anos diferentes ganham o ano. */
export function weekRange(from: DayIso, to: DayIso): string {
 const [fy, fm, fd] = from.split('-').map(Number) as [number, number, number];
 const [ty, tm, td] = to.split('-').map(Number) as [number, number, number];
 if (fy !== ty) return `${fd} de ${MONTHS[fm - 1]} de ${fy} a ${td} de ${MONTHS[tm - 1]} de ${ty}`;
 if (fm !== tm) return `${fd} de ${MONTHS[fm - 1]} a ${td} de ${MONTHS[tm - 1]}`;
 return `${fd} a ${td} de ${MONTHS[tm - 1]}`;
}

/** Recorde em uma linha: "Supino reto: 62,5 kg × 8" ou "Remada: máx. estimado 58 kg". */
export function recordText(r: WeekRecord): string {
 if (r.type === 'maxE1rm') return `${r.name}: máx. estimado ${kg(roundHalf(r.e1rm ?? r.kg))}`;
 return `${r.name}: ${kg(r.kg)} × ${r.reps}`;
}

export interface CardStat { label: string; value: string }
export interface CardContent {
 /** "Semana 5" e "de 12". */
 title: string;
 of: string;
 /** "17 a 23 de novembro", com "semana leve" e "até hoje" quando valem. */
 sub: string;
 /** Treinos do plano: número feito (destaque), previsto e rótulo. */
 workouts: { done: string; planned: string | null; label: string; aria: string };
 stats: CardStat[];
 records: string[];
 recordsEmpty: string;
 /** Só existe com a opção marcada na hora. */
 body: CardStat[] | null;
 /** Linha da dieta e rodapé; `null` quando o domínio esconde a dieta. */
 diet: { line: string; footnote: string } | null;
}

function bodyStat(label: string, c: BodyChange | null, unit: string): CardStat {
 return { label, value: c ? signed(c.delta, unit) : 'sem comparação' };
}

export function cardContent(s: WeekSummary, opts: { today: DayIso; body: boolean; diet?: boolean }): CardContent {
 const ongoing = opts.today <= s.to;
 const sub = [weekRange(s.from, s.to), s.deload ? 'semana leve' : '', ongoing ? 'até hoje' : ''].filter(Boolean).join(' · ');
 const { done, partial, planned } = s.workouts;
 const partialText = partial === 0 ? '' : partial === 1 ? ' · 1 parcial' : ` · ${partial} parciais`;
 const label = `${done === 1 && planned === 0 ? 'treino do plano' : 'treinos do plano'}${partialText}`;
 const aria = planned > 0 ? `${done} de ${planned} treinos do plano${partialText.replace(' · ', ', ')}` : `${done} ${done === 1 ? 'treino' : 'treinos'} do plano${partialText.replace(' · ', ', ')}`;
 return {
  title: `Semana ${s.week + 1}`, of: 'de 12', sub,
  workouts: { done: String(done), planned: planned > 0 ? `de ${planned}` : null, label, aria },
  stats: [{ label: 'Séries', value: nf(s.sets, 0) }, { label: 'Total levantado', value: `${nf(Math.round(s.volume), 0)} kg` }],
  records: s.records.map(recordText),
  recordsEmpty: 'Nenhum recorde nesta semana.',
  // Peso e cintura só entram quando a pessoa marca a opção agora; o domínio também só calcula com body: true.
  body: opts.body && s.body ? [bodyStat('Peso', s.body.weight, 'kg'), bodyStat('Cintura', s.body.waist, 'cm')] : null,
  // Achado B-T1: "Incluir a dieta" (marcada por padrão, decisão 5 do ADR 011) tira a linha da tela e do PNG.
  diet: opts.diet !== false && s.diet ? { line: s.diet.text, footnote: DIET_FOOTNOTE } : null,
 };
}

/** Nome do arquivo: só a semana, nada pessoal. */
export const cardFilename = (s: WeekSummary) => `fitnez-semana-${s.week + 1}.png`;
