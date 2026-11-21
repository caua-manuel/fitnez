import { describe, expect, it } from 'vitest';
import type { DayRecord, Exercise } from '../../src/application/repository';
import { exerciseHistory } from '../../src/domain/records';
import { planWeekIndex, stagnation, type Stagnation } from '../../src/domain/stagnation';

// ADR 011, 2.6: os 13 casos de docs/handoffs/conteudo-adr-011.md (parte C.6), como tabela.
const START = '2026-11-16';
const A: Exercise = { n: 'Exercício A', m: 'kg', s: [4, 5, 5], r: ['5–8', '4–6', '3–5'] };
const S: Record<string, string> = { s0: '2026-11-18', s1: '2026-11-25', s2: '2026-12-02', s3: '2026-12-09', s4: '2026-12-16', s5: '2026-12-23', s6: '2026-12-30', s8: '2027-01-13', s9: '2027-01-20' };

/** "30×6" -> sessão com a melhor série 30 kg × 6 (mais um aquecimento e uma série pior, que não mudam o resultado). */
function days(entries: [string, string][]): Record<string, DayRecord> {
 const out: Record<string, DayRecord> = {};
 for (const [key, lift] of entries) {
  const [kg, reps] = lift.split('×');
  const day = S[key] ?? key;
  out[day] = { log: { a: [{ kg: '50', reps: '5', done: true, kind: 'warm' }, { kg: kg!, reps: reps!, done: true }, { kg: kg!, reps: String(Math.max(1, Number(reps) - 1)), done: true }] } };
 }
 return out;
}
const all = (keys: string[], lift: string): [string, string][] => keys.map(k => [k, lift]);
interface Input { ex?: Exercise; entries: [string, string][]; today: string; beginner?: boolean }
const run = (input: Input) => {
 const ex = input.ex ?? A;
 return stagnation({ ex, sessions: exerciseHistory(days(input.entries), 'a', ex), start: START, today: input.today, week: planWeekIndex(START, input.today), beginner: input.beginner ?? false });
};

const BW: Exercise = { n: 'Barra', m: 'bw', s: [3, 3, 3], r: ['5–8', '5–8', '3–6'] };
const BEG: Exercise = { n: 'Rosca', m: 'kg', s: [3, 3, 3], r: ['8–12', '8–12', '8–12'] };
const HIGH: Exercise = { n: 'Elevação', m: 'kg', s: [3, 3, 3], r: ['12–20', '12–20', '12–20'] };
const PALLOF: Exercise = { n: 'Pallof', m: 'kg', s: [3, 3, 3], r: ['10 por lado', '10 por lado', '10 por lado'] };
const begSessions = all(['2026-11-16', '2026-11-18', '2026-11-20', '2026-11-23', '2026-11-25'], '20×10');
const TEXT_DROP = 'Seu desempenho caiu nos últimos 2 treinos deste exercício. Pode ser cansaço. Nesta semana, faça cerca de 1/3 menos séries dele e capriche no sono e na comida.';
const TEXT_DROP_NEXT_LIGHT = 'Seu desempenho caiu nos últimos 2 treinos deste exercício. A próxima semana já é leve: siga o plano, durma bem e coma o suficiente.';

const cases: { n: number; desc: string; input: Input; out: Partial<Stagnation> | null }[] = [
 { n: 1, desc: 'semanas 1 e 2', input: { today: '2026-11-26', entries: all(['s0', 's1'], '30×6') }, out: null },
 { n: 2, desc: 'semana leve', input: { today: '2026-12-10', entries: all(['s0', 's1', 's2'], '30×6') }, out: null },
 { n: 3, desc: 'repetições, s3 leve ignorada', input: { today: '2026-12-17', entries: [...all(['s0', 's1', 's2', 's4'], '30×6'), ['s3', '30×5']] },
  out: { acao: 'repeticoes', motivo: 'sem-progresso', sessoes: 3, novaFaixa: '6–8', kgSugerido: 27, texto: '3 treinos seguidos sem melhorar neste exercício. Uma ideia: mudar para 6–8 repetições, com cerca de 27 kg.' } },
 { n: 4, desc: 'melhorou 2,8% no 1RM', input: { today: '2026-12-17', entries: [...all(['s0', 's1', 's2'], '30×6'), ['s3', '30×5'], ['s4', '30×7']] }, out: null },
 { n: 5, desc: 'queda, texto normal', input: { today: '2026-12-24', entries: [['s0', '30×6'], ['s1', '30×7'], ['s2', '30×8'], ['s4', '30×6'], ['s5', '30×5']] },
  out: { acao: 'deload', motivo: 'queda', sessoes: 2, texto: TEXT_DROP } },
 { n: 6, desc: 'queda com a próxima semana leve', input: { today: '2026-12-29', entries: [['s0', '30×6'], ['s1', '30×8'], ['s2', '30×6'], ['s4', '30×6']] },
  out: { acao: 'deload', motivo: 'queda', sessoes: 2, texto: TEXT_DROP_NEXT_LIGHT } },
 { n: 7, desc: 'trocar depois de 5', input: { today: '2027-01-21', entries: all(['s0', 's1', 's2', 's4', 's5', 's6', 's8', 's9'], '30×6') },
  out: { acao: 'trocar', motivo: 'sem-progresso', sessoes: 5, texto: '5 treinos seguidos sem melhorar neste exercício. Trocar por um parecido por algumas semanas pode ajudar.' } },
 { n: 8, desc: 'peso do corpo não recebe faixa nova', input: { ex: BW, today: '2026-12-17', entries: all(['s0', 's1', 's2', 's4'], '0×6') }, out: { acao: 'trocar', motivo: 'sem-progresso', sessoes: 3 } },
 { n: 9, desc: 'pausa de 49 dias', input: { today: '2027-01-21', entries: all(['s0', 's1', 's8', 's9'], '30×6') }, out: null },
 { n: 10, desc: 'iniciante antes da semana 5', input: { ex: BEG, beginner: true, today: '2026-11-30', entries: begSessions }, out: null },
 { n: 11, desc: 'igual ao 10 sem iniciante', input: { ex: BEG, today: '2026-11-30', entries: begSessions },
  out: { acao: 'repeticoes', motivo: 'sem-progresso', sessoes: 4, novaFaixa: '12–15', kgSugerido: 18, texto: '4 treinos seguidos sem melhorar neste exercício. Uma ideia: mudar para 12–15 repetições, com cerca de 18 kg.' } },
 { n: 13, desc: 'faixa que o app não lê (C.2.6)', input: { ex: PALLOF, today: '2026-12-17', entries: all(['s0', 's1', 's2', 's4'], '15×10') }, out: null },
 { n: 12, desc: 'acima de 10 repetições e faixa até 20', input: { ex: HIGH, today: '2026-12-17', entries: all(['s0', 's1', 's2', 's4'], '10×15') }, out: { acao: 'trocar', motivo: 'sem-progresso', sessoes: 3 } },
];

describe('stagnation: casos do conteúdo (C.6)', () => {
 it.each(cases)('caso $n: $desc', ({ input, out }) => {
  const r = run(input);
  if (out === null) expect(r).toBeNull();
  else expect(r).toMatchObject(out);
 });
 it('trocar e deload não trazem faixa nem carga', () => {
  for (const n of [5, 7, 8, 12]) {
   const r = run(cases.find(c => c.n === n)!.input)!;
   expect(r.novaFaixa, `caso ${n}`).toBeUndefined();
   expect(r.kgSugerido, `caso ${n}`).toBeUndefined();
  }
 });
});

describe('stagnation: regras gerais', () => {
 it('exercício por tempo (prancha), por repetição ou kgs nunca avisa', () => {
  const plank: Exercise = { n: 'Prancha', m: 's', s: [3, 3, 3], r: ['30', '30', '30'] };
  expect(run({ ex: plank, today: '2026-12-17', entries: all(['s0', 's1', 's2', 's4'], '0×30') })).toBeNull();
  expect(run({ ex: { ...A, m: 'rep' }, today: '2026-12-17', entries: all(['s0', 's1', 's2', 's4'], '0×6') })).toBeNull();
  expect(run({ ex: { ...A, m: 'kgs' }, today: '2026-12-17', entries: all(['s0', 's1', 's2', 's4'], '20×30') })).toBeNull();
 });
 it('antes do início e depois do plano', () => {
  const sessions = exerciseHistory(days(all(['s0', 's1', 's2', 's4'], '30×6')), 'a', A);
  expect(stagnation({ ex: A, sessions, start: START, today: '2026-11-10', week: 2, beginner: false })).toBeNull();
  expect(stagnation({ ex: A, sessions, start: START, today: '2027-02-10', week: 12, beginner: false })).toBeNull();
 });
 it('a ordem das sessões na entrada não importa e a sessão de hoje fica fora', () => {
  const sessions = exerciseHistory(days(all(['s0', 's1', 's2', 's4'], '30×6')), 'a', A);
  const base = stagnation({ ex: A, sessions, start: START, today: '2026-12-17', week: 4, beginner: false });
  expect(base).not.toBeNull();
  expect(stagnation({ ex: A, sessions: [...sessions].reverse(), start: START, today: '2026-12-17', week: 4, beginner: false })).toEqual(base);
  // Hoje = 12-16: s4 ainda não conta; sobram 3 sessões, abaixo do mínimo de 4 para "sem progresso".
  expect(stagnation({ ex: A, sessions, start: START, today: '2026-12-16', week: 4, beginner: false })).toBeNull();
 });
 it('com 3 sessões só a queda pode avisar', () => {
  expect(run({ today: '2026-12-17', entries: all(['s1', 's2', 's4'], '30×6') })).toBeNull();
  expect(run({ today: '2026-12-17', entries: [['s1', '30×8'], ['s2', '30×6'], ['s4', '30×6']] })).toMatchObject({ acao: 'deload', sessoes: 2 });
 });
 it('sem 1RM: menos carga com mais repetições conta como igual', () => {
  expect(run({ ex: BW, today: '2026-12-17', entries: [['s0', '10×6'], ['s1', '7,5×7'], ['s2', '7,5×7'], ['s4', '7,5×7']] })).toMatchObject({ acao: 'trocar', sessoes: 3 });
 });
 it('kgSugerido arredonda para baixo em 0,5 kg e o texto usa vírgula', () => {
  expect(run({ today: '2026-12-17', entries: all(['s0', 's1', 's2', 's4'], '32,5×6') })).toMatchObject({ acao: 'repeticoes', kgSugerido: 29, texto: expect.stringContaining('cerca de 29 kg') });
  expect(run({ today: '2026-12-17', entries: all(['s0', 's1', 's2', 's4'], '25×6') })).toMatchObject({ kgSugerido: 22.5, texto: expect.stringContaining('cerca de 22,5 kg') });
 });
 it('usa no máximo as 6 últimas sessões válidas', () => {
  // Pico antigo (s0) fora da janela de 6: a referência vira s2, e sem queda nem progresso dá "trocar" com 5.
  const entries: [string, string][] = [['s0', '40×8'], ...all(['s1', 's2', 's4', 's5', 's6', 's8', 's9'], '30×6')];
  expect(run({ today: '2027-01-21', entries })).toMatchObject({ acao: 'trocar', sessoes: 5 });
 });
});
