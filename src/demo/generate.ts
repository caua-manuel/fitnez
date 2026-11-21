import type { DayRecord, Exercise, Payload, StateV3, WorkoutMeta } from '../application/repository';
import { addDays, mondayOf } from '../domain/calendar';
import type { DayIso } from '../domain/calendar';
import { markEaten } from '../domain/diet';
import type { DietDay, DietOption, MealKey } from '../domain/diet';
import { isLower, muscleGroupOf } from '../domain/muscleGroups';
import { repRange, suggestNext } from '../domain/progression';
import { countDoneSets, sessionVolume, setsForWeek } from '../domain/workout';
import type { SetEntry } from '../domain/workout';

// Gerador da demonstração (ADR 011, 1.1). Função pura e determinística: nenhum relógio interno e nenhum sorteio.
// Carregado só por `import('../demo/generate')` (nunca por import estático). O resultado passa por `validateState`.
// Números: docs/handoffs/conteudo-adr-011.md, parte A (conteudo-treino-nutricao, 20/11/2026).

/** Todos os números da demonstração ficam aqui; nada de número espalhado no código abaixo. */
export const DEMO_PARAMS = {
 /** A.1: perfil fictício (sem nome real). `weightKg` = última medida. Sem `settings.dietTargets` (meta de exemplo). */
 profile: { name: 'Exemplo', goal: 'Recomposição corporal: perder gordura e manter a força', age: 30, heightCm: 178 },
 /** A.4: cargas da semana 1 (kg; halteres por halter; 0 = peso do corpo). Exercícios fora da lista: sem carga. */
 startKg: {
  supino: 28, remada_a: 60, press_a: 20, barra: 0, lat_a: 10, face: 25, rosca_a: 12, tri_a: 25, pallof: 15, farmer: 28,
  puxada: 60, inclinado: 24, press_b: 18, remada_b: 30, cruc: 40, lat_b: 7.5, inverso: 8, rosca_b: 25, tri_b: 20,
  agach: 80, stiff: 70, bulg: 14, hip_l: 90, pant_pe: 60,
 } as Record<string, number>,
 /** A.3: falta na sexta da semana 2 (semana 0 = primeira; dia 0 = segunda) e parcial na terça da semana 3, com os 4 primeiros exercícios. */
 missed: { week: 1, weekday: 4 },
 partial: { week: 2, weekday: 1, exercises: 4 },
 /** A.3: início às 18h30 de Brasília; 75 min (parcial: 40 min). */
 startTime: 'T18:30:00-03:00', workoutMinutes: 75, partialMinutes: 40,
 /** A.2: nota do dia no treino de academia; no Lower; na semana leve. */
 feel: { normal: 3, lower: 4, deload: 2 },
 /** A.5: medidas na segunda-feira das semanas 1 a 5 (texto com vírgula, como o formulário grava). */
 measurements: [
  { p: '77,0', c: '86,0' }, { p: '76,8', c: '85,8' }, { p: '76,6', c: '85,5' }, { p: '76,6', c: '85,5' }, { p: '76,3', c: '85,2' },
 ],
 /** A.6: opção das refeições por semana (A, B, C, A, B); domingos com registro; quintas sem jantar; água e creatina. */
 diet: { optionByWeek: ['A', 'B', 'C', 'A', 'B'], sundayWeeks: [0, 2], thursdayNoDinnerWeeks: [1, 3], water: 6, waterNoDinner: 4, creatine: true },
} as const;

const MEALS: MealKey[] = ['cafe', 'almoco', 'lanche', 'pos', 'jantar'];
const clone = <T>(v: T): T => structuredClone(v);
const fmt = (n: number) => String(Math.round(n * 100) / 100).replace('.', ',');
const parseText = (t: string) => Number(t.replace(',', '.'));

/** Primeiro e último número de um texto ("30–40 s" -> 30 e 40; "10 por lado" -> 10 e 10). */
function bounds(text: string): { min: number; max: number } | null {
 const m = /(\d+)(?:\s*[–—-]\s*(\d+))?/.exec(text);
 if (!m) return null;
 const min = Number(m[1]); const max = m[2] === undefined ? min : Number(m[2]);
 return { min, max: Math.max(min, max) };
}

/** A.4: estado de progressão de um exercício. `kg` = carga da próxima sessão normal; `lastKg` = a última feita. */
interface Track { kg: number | null; lastKg: number | null; base: number | null; block: number | null; history: SetEntry[][] }

/**
 * Estado de demonstração: plano e rotina de fábrica (os de `empty`), início na segunda-feira de 4 semanas antes da
 * semana de `today` (hoje cai na semana 5), registros até ontem (1 falta e 1 parcial), cargas pelo modelo de
 * repetições da parte A.4 com subida pela própria `suggestNext`, semana leve (semana 4) com metade das séries e
 * sem subir carga, medidas nas segundas e dieta pela parte A.6. Nada depois de `today`.
 */
export function demoState(today: DayIso, empty: StateV3): StateV3 {
 const P = DEMO_PARAMS;
 const s = clone(empty);
 const plan = s.catalog.plan;
 const sched = s.settings.sched;
 const start = addDays(mondayOf(today), -28);
 s.settings.start = start;
 s.meta.demo = true; // assinatura da demo (ADR 011, M1): a abertura em modo demo confere state.meta.demo === true
 s.settings.startConfirmed = true;
 const days: Record<string, DayRecord> = {};
 const measurements: Record<string, Payload> = {};
 const tracks: Record<string, Track> = {};
 const diet = s.catalog.diet as Partial<Record<MealKey, DietOption[]>>;
 let lastWeight: string = P.measurements[0]!.p;

 // A.5: medidas (a segunda da semana 5 pode ser hoje).
 for (let w = 0; w < P.measurements.length; w++) {
  const day = addDays(start, w * 7);
  if (day > today) break;
  const m = P.measurements[w]!;
  measurements[day] = { p: m.p, c: m.c };
  lastWeight = m.p;
 }

 for (let idx = 0; ; idx++) {
  const day = addDays(start, idx);
  if (day >= today) break;
  const week = Math.floor(idx / 7), weekday = idx % 7, deload = week % 4 === 3;
  const rec: DayRecord = {};
  const act = sched[weekday] ?? { k: 'rest' };

  if (act.k === 'gym' && typeof act.s === 'string' && plan.sess[act.s]) {
   const sessionId = act.s;
   const missed = week === P.missed.week && weekday === P.missed.weekday;
   const partial = week === P.partial.week && weekday === P.partial.weekday;
   if (!missed) {
    const ids = plan.sess[sessionId].ex.filter(e => plan.ex[e]);
    const doneIds = partial ? ids.slice(0, P.partial.exercises) : ids;
    const log: Record<string, SetEntry[]> = {};
    for (const exId of doneIds) log[exId] = sessionRows(exId, plan.ex[exId], week, deload);
    const entries = Object.values(log);
    const startedAt = Date.parse(`${day}${P.startTime}`);
    const meta: WorkoutMeta = {
     sessionId, startedAt, finishedAt: startedAt + (partial ? P.partialMinutes : P.workoutMinutes) * 60000,
     status: partial ? 'partial' : 'done', sets: countDoneSets(entries), volume: sessionVolume(entries),
    };
    rec.log = log; rec.workouts = { [sessionId]: meta }; rec.workout = { ...meta };
    if (!partial) rec.acts = { gym: true };
    const lower = /lower|perna/i.test(plan.sess[sessionId].name);
    rec.feel = deload ? P.feel.deload : lower ? P.feel.lower : P.feel.normal;
   }
  } else if (act.k === 'bjj') rec.acts = { bjj: true };
  else if (act.k === 'volei') rec.acts = { volei: true };

  // A.6: dieta de segunda a sexta; domingo só nas semanas listadas; sábado nunca.
  const sunday = weekday === 6 && (P.diet.sundayWeeks as readonly number[]).includes(week);
  if (weekday <= 4 || sunday) {
   const key = P.diet.optionByWeek[week] ?? P.diet.optionByWeek[0];
   const noDinner = weekday === 3 && (P.diet.thursdayNoDinnerWeeks as readonly number[]).includes(week);
   let d: DietDay = { pick: {}, eaten: {}, skip: {}, water: noDinner ? P.diet.waterNoDinner : P.diet.water, crea: P.diet.creatine };
   for (const meal of MEALS) {
    if (sunday && meal === 'lanche') { d.skip = { ...d.skip, lanche: true }; continue; }
    const option = (diet[meal] ?? []).find(o => o.key === key) ?? diet[meal]?.[0];
    if (!option) continue;
    d.pick = { ...d.pick, [meal]: option.key };
    if (noDinner && meal === 'jantar') continue;
    d = markEaten(d, meal, option);
   }
   rec.diet = d as unknown as Payload;
  }
  if (Object.keys(rec).length) days[day] = rec;
 }

 /** Séries de uma sessão pelo modelo da parte A.4. */
 function sessionRows(exId: string, ex: Exercise, week: number, deload: boolean): SetEntry[] {
  const start0 = P.startKg[exId];
  const t = (tracks[exId] ??= { kg: start0 ?? null, lastKg: null, base: null, block: null, history: [] });
  const planned = setsForWeek(ex, week);
  const block = Math.floor(week / 4);
  const strict = repRange(planned.reps); // faixa que o app entende (sem ela, a carga nunca sobe)
  const range = strict ?? bounds(planned.reps);
  const kgOf = (v: number | null) => (ex.m === 'bw' ? '0' : v === null ? '' : fmt(v));
  const rows: SetEntry[] = [];

  if (ex.m === 's' || ex.m === 'kgs' || !range) {
   // Tempo (e farmer, kgs): ponto médio da faixa, igual em todas as séries; carga fixa.
   const b = range ?? { min: 0, max: 0 };
   const reps = String(Math.round((b.min + b.max) / 2));
   for (let i = 0; i < planned.sets; i++) rows.push({ kg: kgOf(t.kg), reps, done: true });
   t.history.push(rows);
   return rows.map(r => ({ ...r }));
  }

  if (deload) {
   // Semana leve: metade das séries (setsForWeek), a carga da última sessão e `min` repetições; nada muda.
   const kg = kgOf(t.lastKg ?? t.kg);
   for (let i = 0; i < planned.sets; i++) rows.push({ kg, reps: String(range.min), done: true });
   t.history.push(rows);
   return rows.map(r => ({ ...r }));
  }

  if (t.base === null) t.base = range.min + 1; // 1. primeira sessão
  else if (t.block !== null && t.block !== block) t.base = Math.min(t.base, range.max + 1); // 4. troca de bloco
  t.block = block;
  const all = Math.min(t.base, range.max);
  const last = Math.max(range.min, Math.min(t.base - 1, range.max));
  const kg = kgOf(t.kg);
  for (let i = 0; i < planned.sets; i++) rows.push({ kg, reps: String(i === planned.sets - 1 ? last : all), done: true });
  t.history.push(rows);
  t.lastKg = t.kg;

  // 3. Todas no topo: a carga sobe o que suggestNext devolve e as repetições recomeçam. Só com faixa legível e
  // carga em kg; sem isso (peso do corpo, repetição, "por perna", "por lado") as repetições param no topo.
  if (rows.every(r => Number(r.reps) >= range.max)) {
   if (strict && ex.m === 'kg' && t.kg !== null) {
    const lower = isLower(muscleGroupOf(exId, ex));
    const sug = suggestNext({ ex, week, history: t.history, lower });
    t.kg = sug.reason === 'subir' && sug.kg !== null ? sug.kg : parseText(fmt(t.kg + (lower ? 5 : 2.5)));
    t.base = range.min + 1;
   }
  } else t.base = t.base + 1;
  return rows.map(r => ({ ...r }));
 }

 s.history = { ...s.history, days, measurements };
 s.settings.profile = { name: P.profile.name, goal: P.profile.goal, age: P.profile.age, heightCm: P.profile.heightCm, weightKg: parseText(lastWeight) };
 return s;
}
