import type { Exercise, Payload, Plan } from '../application/repository';
import { MUSCLE_GROUPS } from './muscleGroups';

// Compartilhar plano entre amigos (ADR 011, 1.3). Funções puras, sem relógio e sem armazenamento.
// O arquivo leva só o plano (exercícios, treinos, ordem, alternativo, condomínio, RIR) e, se houver, a rotina da semana.
// Nunca sai: histórico, medidas, dieta e metas, perfil, assistente, notas pessoais, anilhas, data de início, meta, recovery.
// Lista branca estrita: qualquer chave fora dela, em qualquer nível, rejeita o arquivo inteiro (nada é ignorado em silêncio).

export const PLAN_SHARE_APP = 'fitnez-plano';
export const PLAN_SHARE_VERSION = 1;
export const PLAN_SHARE_LIMITS = {
 bytes: 200 * 1024, // checado antes do JSON.parse
 exercises: 150, sessions: 30,
 fileName: 60, exerciseName: 120, sessionName: 120, sub: 160, min: 20, note: 300,
 reps: 30, rir: 30, condItems: 30, condLine: 300, sportLabel: 30,
 columns: 3, setsMin: 1, setsMax: 10, restMin: 0, restMax: 600, depth: 12,
} as const;
/**
 * Ids aceitos. O ADR pede `^[a-z0-9_-]{1,40}$`, mas os treinos de fábrica usam maiúsculas (`UA`, `UB`, `LW`, `LB`),
 * então maiúsculas também são aceitas (decisão registrada no handoff `dados-adr-011-fase-1.md`).
 */
export const PLAN_SHARE_ID = /^[A-Za-z0-9_-]{1,40}$/;
const RECORD_KINDS = ['kg', 'bw', 'rep', 's', 'kgs'] as const;
const DAY_KINDS = ['bjj', 'gym', 'volei', 'esporte', 'rest'] as const;
const RESERVED = ['__proto__', 'prototype', 'constructor'];
/** Ids que coincidem com nomes de Object.prototype (toString, hasOwnProperty, valueOf...) são recusados (revisão B3). */
const reservedId = (v: string) => RESERVED.includes(v) || v in Object.prototype;
/**
 * Caracteres de controle e de direção (bidi) que permitem disfarçar nomes na revisão (revisão B2).
 * Quebra de linha e tabulação só nos textos longos (observação e condomínio).
 */
const HIDDEN = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F\u061C\u200E\u200F\u202A-\u202E\u2066-\u2069]/;
const LINE_BREAKS = /[\t\n\r]/;

const KEYS = {
 file: ['app', 'v', 'name', 'plan', 'sched'],
 plan: ['ex', 'sess', 'order', 'alt', 'cond', 'rir'],
 exercise: ['n', 's', 'r', 'm', 't', 'rest', 'g'],
 session: ['name', 'sub', 'min', 'ex'],
 day: ['k', 's', 'gi', 'label'],
} as const;

export interface SharedExercise { n: string; s: number[]; r: string[]; m: string; t?: string; rest?: number; g?: string }
export interface SharedSession { name: string; sub?: string; min?: string; ex: string[] }
export interface SharedPlan { ex: Record<string, SharedExercise>; sess: Record<string, SharedSession>; order: string[]; alt?: string; cond?: string[]; rir?: string[] }
export interface SharedDay { k: string; s?: string; gi?: boolean; label?: string }
export interface PlanShareFile { app: typeof PLAN_SHARE_APP; v: 1; name: string; plan: SharedPlan; sched?: SharedDay[] }
export type PlanShareParse = { ok: true; value: PlanShareFile; warnings: string[] } | { ok: false; error: string };
export type PlanShareBuild = { ok: true; file: PlanShareFile; text: string; filename: string; warnings: string[] } | { ok: false; error: string };

class ShareError extends Error {}
const fail = (message: string): never => { throw new ShareError(message); };
const own = (o: object, k: string) => Object.prototype.hasOwnProperty.call(o, k);
const short = (k: string) => (k.length > 40 ? `${k.slice(0, 40)}…` : k);

function isObject(v: unknown): v is Record<string, unknown> { return v !== null && typeof v === 'object' && !Array.isArray(v); }
function obj(v: unknown, where: string): Record<string, unknown> { if (!isObject(v)) fail(`${where}: esperado objeto.`); return v as Record<string, unknown>; }
function only(o: Record<string, unknown>, allowed: readonly string[], where: string) {
 for (const k of Object.keys(o)) if (!allowed.includes(k)) fail(`${where}: campo desconhecido "${short(k)}". O arquivo não foi aceito.`);
}
function str(v: unknown, where: string, max: number, required = false, multiline = false): string {
 if (typeof v !== 'string') fail(`${where}: esperado texto.`);
 const s = v as string;
 if (HIDDEN.test(s) || (!multiline && LINE_BREAKS.test(s))) fail(`${where}: contém caracteres invisíveis ou de controle.`);
 if (s.length > max) fail(`${where}: use no máximo ${max} caracteres (recebido: ${s.length}).`);
 if (required && s.trim() === '') fail(`${where}: não pode ficar vazio.`);
 return s;
}
function id(v: unknown, where: string): string {
 if (typeof v !== 'string' || !PLAN_SHARE_ID.test(v) || reservedId(v)) fail(`${where}: identificador inválido.`);
 return v as string;
}
function int(v: unknown, where: string, min: number, max: number): number {
 if (typeof v !== 'number' || !Number.isInteger(v) || v < min || v > max) fail(`${where}: use um número inteiro de ${min} a ${max}.`);
 return v as number;
}
function list(v: unknown, where: string): unknown[] { if (!Array.isArray(v)) fail(`${where}: esperado lista.`); return v as unknown[]; }

/** JSON seguro: sem chaves perigosas, sem números infinitos, sem profundidade excessiva. */
function safe(v: unknown, depth = 0) {
 if (depth > PLAN_SHARE_LIMITS.depth) fail('Arquivo com estrutura profunda demais.');
 if (v === null || typeof v === 'string' || typeof v === 'boolean') return;
 if (typeof v === 'number') { if (!Number.isFinite(v)) fail('Arquivo com número inválido.'); return; }
 if (typeof v !== 'object') fail('Arquivo não é JSON.');
 if (!Array.isArray(v) && Object.getPrototypeOf(v) !== Object.prototype && Object.getPrototypeOf(v) !== null) fail('Objeto não suportado.');
 for (const [k, child] of Object.entries(v as object)) { if (RESERVED.includes(k)) fail('Arquivo contém chave perigosa.'); safe(child, depth + 1); }
}

function exercise(v: unknown, where: string): SharedExercise {
 const e = obj(v, where); only(e, KEYS.exercise, where);
 const out: SharedExercise = { n: str(e.n, `${where}, nome`, PLAN_SHARE_LIMITS.exerciseName, true), s: [], r: [], m: '' };
 const s = list(e.s, `${where}, séries`); if (s.length !== PLAN_SHARE_LIMITS.columns) fail(`${where}, séries: são ${PLAN_SHARE_LIMITS.columns} blocos.`);
 out.s = s.map((x, i) => int(x, `${where}, séries do bloco ${i + 1}`, PLAN_SHARE_LIMITS.setsMin, PLAN_SHARE_LIMITS.setsMax));
 const r = list(e.r, `${where}, repetições`); if (r.length !== PLAN_SHARE_LIMITS.columns) fail(`${where}, repetições: são ${PLAN_SHARE_LIMITS.columns} blocos.`);
 out.r = r.map((x, i) => str(x, `${where}, repetições do bloco ${i + 1}`, PLAN_SHARE_LIMITS.reps));
 if (typeof e.m !== 'string' || !(RECORD_KINDS as readonly string[]).includes(e.m)) fail(`${where}: tipo de registro inválido.`);
 out.m = e.m as string;
 if (e.t !== undefined) out.t = str(e.t, `${where}, observação`, PLAN_SHARE_LIMITS.note, false, true);
 if (e.rest !== undefined) out.rest = int(e.rest, `${where}, descanso (s)`, PLAN_SHARE_LIMITS.restMin, PLAN_SHARE_LIMITS.restMax);
 if (e.g !== undefined) { if (typeof e.g !== 'string' || (e.g !== '' && !(MUSCLE_GROUPS as readonly string[]).includes(e.g))) fail(`${where}: grupo muscular inválido.`); out.g = e.g as string; }
 return out;
}

/** Confere um objeto já lido do JSON. Devolve uma cópia limpa (só as chaves da lista branca). */
export function checkPlanShare(input: unknown): PlanShareParse {
 try {
  safe(input);
  const f = obj(input, 'Arquivo');
  if (f.app !== PLAN_SHARE_APP) fail('Este arquivo não é um plano do Fitnez.');
  if (typeof f.v === 'number' && Number.isFinite(f.v) && f.v > PLAN_SHARE_VERSION) fail('Este plano foi feito numa versão mais nova do app. Atualize o app e tente de novo.');
  if (f.v !== PLAN_SHARE_VERSION) fail('Versão do plano inválida.');
  only(f, KEYS.file, 'Arquivo');
  const name = str(f.name, 'Nome do plano', PLAN_SHARE_LIMITS.fileName, true).trim();
  const p = obj(f.plan, 'Plano'); only(p, KEYS.plan, 'Plano');
  const exIn = obj(p.ex, 'Exercícios');
  const exIds = Object.keys(exIn);
  if (exIds.length > PLAN_SHARE_LIMITS.exercises) fail(`Exercícios: no máximo ${PLAN_SHARE_LIMITS.exercises} (recebido: ${exIds.length}).`);
  const ex: Record<string, SharedExercise> = {};
  for (const k of exIds) ex[id(k, 'Exercício')] = exercise(exIn[k], `Exercício "${k}"`);
  const sessIn = obj(p.sess, 'Treinos');
  const sessIds = Object.keys(sessIn);
  if (sessIds.length < 1) fail('Treinos: o plano precisa de pelo menos 1 treino.');
  if (sessIds.length > PLAN_SHARE_LIMITS.sessions) fail(`Treinos: no máximo ${PLAN_SHARE_LIMITS.sessions} (recebido: ${sessIds.length}).`);
  const sess: Record<string, SharedSession> = {};
  for (const k of sessIds) {
   id(k, 'Treino'); const where = `Treino "${k}"`;
   const s = obj(sessIn[k], where); only(s, KEYS.session, where);
   const out: SharedSession = { name: str(s.name, `${where}, nome`, PLAN_SHARE_LIMITS.sessionName, true), ex: [] };
   if (s.sub !== undefined) out.sub = str(s.sub, `${where}, descrição`, PLAN_SHARE_LIMITS.sub);
   if (s.min !== undefined) out.min = str(s.min, `${where}, duração`, PLAN_SHARE_LIMITS.min);
   const items = list(s.ex, `${where}, exercícios`);
   if (items.length > PLAN_SHARE_LIMITS.exercises) fail(`${where}: no máximo ${PLAN_SHARE_LIMITS.exercises} exercícios.`);
   for (const x of items) {
    const e = id(x, `${where}, exercício`);
    if (!own(ex, e)) fail(`${where}: aponta para exercício que não está no arquivo ("${e}").`);
    if (out.ex.includes(e)) fail(`${where}: exercício repetido ("${e}").`);
    out.ex.push(e);
   }
   sess[k] = out;
  }
  const orderIn = list(p.order, 'Ordem dos treinos');
  if (orderIn.length < 1 || orderIn.length > PLAN_SHARE_LIMITS.sessions) fail(`Ordem dos treinos: de 1 a ${PLAN_SHARE_LIMITS.sessions} treinos.`);
  const order: string[] = [];
  for (const x of orderIn) { const s = id(x, 'Ordem dos treinos'); if (!own(sess, s)) fail(`Ordem dos treinos: treino inexistente ("${s}").`); if (order.includes(s)) fail(`Ordem dos treinos: treino repetido ("${s}").`); order.push(s); }
  const plan: SharedPlan = { ex, sess, order };
  if (p.alt !== undefined) { const a = id(p.alt, 'Treino alternativo'); if (!own(sess, a)) fail('Treino alternativo: treino inexistente.'); plan.alt = a; }
  if (p.cond !== undefined) { const c = list(p.cond, 'Condomínio'); if (c.length > PLAN_SHARE_LIMITS.condItems) fail(`Condomínio: no máximo ${PLAN_SHARE_LIMITS.condItems} itens.`); plan.cond = c.map(x => str(x, 'Item do condomínio', PLAN_SHARE_LIMITS.condLine, false, true)); }
  if (p.rir !== undefined) { const r = list(p.rir, 'RIR'); if (r.length !== 12) fail('RIR: são 12 semanas.'); plan.rir = r.map(x => str(x, 'RIR', PLAN_SHARE_LIMITS.rir, true)); }
  const value: PlanShareFile = { app: PLAN_SHARE_APP, v: 1, name, plan };
  if (f.sched !== undefined) {
   const days = list(f.sched, 'Rotina'); if (days.length !== 7) fail('Rotina: são 7 dias.');
   value.sched = days.map((d, i) => {
    const where = `Rotina, dia ${i + 1}`; const o = obj(d, where); only(o, KEYS.day, where);
    if (typeof o.k !== 'string' || !(DAY_KINDS as readonly string[]).includes(o.k)) fail(`${where}: atividade inválida.`);
    const out: SharedDay = { k: o.k as string };
    // Lista branca por tipo de dia (revisão B1): treino só em academia, kimono só no jiu-jitsu, nome só no esporte.
    if (o.s !== undefined && o.k !== 'gym') fail(`${where}: treino só em dia de academia.`);
    if (o.gi !== undefined && o.k !== 'bjj') fail(`${where}: kimono só em dia de jiu-jitsu.`);
    if (o.label !== undefined && o.k !== 'esporte') fail(`${where}: nome do esporte só em dia de esporte.`);
    if (o.s !== undefined) { const s = id(o.s, `${where}, treino`); if (!own(sess, s)) fail(`${where}: aponta para treino inexistente ("${s}").`); out.s = s; }
    if (o.k === 'gym' && out.s === undefined) fail(`${where}: dia de academia sem treino.`);
    if (o.gi !== undefined) { if (typeof o.gi !== 'boolean') fail(`${where}: kimono deve ser sim ou não.`); out.gi = o.gi as boolean; }
    if (o.label !== undefined) out.label = str(o.label, `${where}, nome do esporte`, PLAN_SHARE_LIMITS.sportLabel);
    return out;
   });
  }
  const warnings: string[] = [];
  const used = new Set(Object.values(sess).flatMap(s => s.ex));
  const unused = exIds.filter(k => !used.has(k)).length;
  if (unused) warnings.push(unused === 1 ? '1 exercício do arquivo não está em nenhum treino.' : `${unused} exercícios do arquivo não estão em nenhum treino.`);
  if (!value.sched) warnings.push('O arquivo não traz rotina da semana; a sua continua.');
  return { ok: true, value, warnings };
 } catch (e) {
  if (e instanceof ShareError) return { ok: false, error: e.message };
  return { ok: false, error: 'Arquivo de plano inválido.' };
 }
}

/** Lê o texto de um arquivo de plano compartilhado. O tamanho é conferido antes do `JSON.parse`. */
export function parsePlanShare(text: string): PlanShareParse {
 if (typeof text !== 'string') return { ok: false, error: 'Arquivo de plano inválido.' };
 if (new TextEncoder().encode(text).byteLength > PLAN_SHARE_LIMITS.bytes) return { ok: false, error: 'O arquivo passa de 200 KB e não parece um plano do Fitnez.' };
 let data: unknown;
 try { data = JSON.parse(text); } catch { return { ok: false, error: 'O arquivo está incompleto ou não é JSON.' }; }
 return checkPlanShare(data);
}

/** Nome do arquivo: `fitnez-plano-<nome>.json` (sem acentos, só letras, números e hífen). */
export function planShareFilename(name: string): string {
 const slug = String(name ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40).replace(/-+$/g, '');
 return `fitnez-plano-${slug || 'plano'}.json`;
}

/**
 * Monta o arquivo a partir do estado. Leva só os treinos da ordem, o alternativo e os da rotina, e só os exercícios
 * usados por eles. Observações (`t`) só com `includeNotes`. Rotina só se todos os dias de academia apontam para treino
 * existente (senão sai sem rotina, com aviso). O resultado passa pela mesma validação da importação.
 */
export function buildPlanShare(state: { catalog: { plan: Plan }; settings: { sched?: Payload[] } }, opts: { name: string; includeNotes: boolean; includeSched?: boolean }): PlanShareBuild {
 const plan = state.catalog.plan;
 const warnings: string[] = [];
 const has = (o: object, k: unknown): k is string => typeof k === 'string' && own(o, k);
 const sessIds: string[] = [];
 const addSess = (k: unknown) => { if (has(plan.sess, k) && !sessIds.includes(k)) sessIds.push(k); };
 (plan.order ?? []).forEach(addSess);
 if (plan.alt !== undefined) addSess(plan.alt);
 const sched = state.settings.sched;
 const wantSched = opts.includeSched !== false && Array.isArray(sched) && sched.length === 7;
 let schedOut: SharedDay[] | undefined;
 if (wantSched) {
  const dangling = sched!.some(d => d?.k === 'gym' && !has(plan.sess, d?.s));
  if (dangling) warnings.push('A rotina não foi incluída porque aponta para um treino que não existe mais.');
  else {
   sched!.forEach(d => { if (d?.k === 'gym') addSess(d.s); });
   schedOut = sched!.map(d => {
    const out: SharedDay = { k: String(d?.k) };
    if (d?.k === 'gym') out.s = d.s;
    if (d?.k === 'bjj' && typeof d.gi === 'boolean') out.gi = d.gi;
    if (d?.k === 'esporte' && typeof d.label === 'string') out.label = d.label;
    return out;
   });
  }
 }
 const sess: Record<string, SharedSession> = {};
 const exIds: string[] = [];
 for (const k of sessIds) {
  const s = plan.sess[k];
  const ids = (Array.isArray(s.ex) ? s.ex : []).filter((e, i, all): e is string => has(plan.ex, e) && all.indexOf(e) === i);
  const out: SharedSession = { name: s.name, ex: ids };
  if (typeof s.sub === 'string' && s.sub !== '') out.sub = s.sub;
  if (typeof s.min === 'string' && s.min !== '') out.min = s.min;
  sess[k] = out;
  ids.forEach(e => { if (!exIds.includes(e)) exIds.push(e); });
 }
 const ex: Record<string, SharedExercise> = {};
 for (const k of exIds) {
  const e: Exercise = plan.ex[k];
  const out: SharedExercise = { n: e.n, s: Array.isArray(e.s) ? [...e.s] : e.s, r: Array.isArray(e.r) ? [...e.r] : e.r, m: e.m };
  if (opts.includeNotes && typeof e.t === 'string' && e.t.trim() !== '') out.t = e.t;
  if (typeof e.rest === 'number') out.rest = e.rest;
  if (typeof e.g === 'string') out.g = e.g;
  ex[k] = out;
 }
 const sharedPlan: SharedPlan = { ex, sess, order: (plan.order ?? []).filter(k => has(plan.sess, k)) };
 if (has(plan.sess, plan.alt)) sharedPlan.alt = plan.alt;
 if (Array.isArray(plan.cond)) sharedPlan.cond = [...plan.cond];
 if (Array.isArray(plan.rir)) sharedPlan.rir = [...plan.rir];
 const file: PlanShareFile = { app: PLAN_SHARE_APP, v: 1, name: String(opts.name ?? '').trim(), plan: sharedPlan };
 if (schedOut) file.sched = schedOut;
 const checked = checkPlanShare(file);
 if (!checked.ok) return { ok: false, error: `Não foi possível montar o arquivo. ${checked.error}` };
 const text = JSON.stringify(checked.value, null, 1);
 if (new TextEncoder().encode(text).byteLength > PLAN_SHARE_LIMITS.bytes) return { ok: false, error: 'O plano passa de 200 KB e não pode ser compartilhado.' };
 return { ok: true, file: checked.value, text, filename: planShareFilename(file.name), warnings };
}

// ---------- comparação com o plano atual ----------

/** Nome comparável: sem acentos, minúsculo, espaços simples. */
export function normalizeName(name: unknown): string {
 return String(name ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
}

export interface PlanShareRenamed { from: string; to: string; name: string }
export interface PlanShareDiff {
 /** `same`: mesmo id, mesmo nome (normalizado) e mesmo tipo: é o mesmo exercício, o histórico continua. */
 exercises: { added: string[]; same: string[]; renamed: PlanShareRenamed[] };
 /** Treinos: mesmo id e mesmo nome = `same`; mesmo id e nome diferente ganha id livre (`renamed`). */
 sessions: { added: string[]; same: string[]; renamed: PlanShareRenamed[] };
 /** Id no arquivo -> id final no meu plano. */
 mapping: { ex: Record<string, string>; sess: Record<string, string> };
 /** Exercícios meus que não estão no arquivo: ficam no catálogo (histórico preservado). */
 kept: string[];
 hasSched: boolean;
 /** Se eu mantiver a minha rotina: dias de academia que apontariam para treino que deixou de existir e o treino novo que assumem. */
 schedRemap: { day: number; from: string; to: string }[];
}

/** Id livre `<base>-n`, cortando a base para caber nos 40 caracteres do formato (revisão B4). */
function freeId(base: string, taken: (k: string) => boolean): string {
 for (let n = 2; ; n++) { const suffix = `-${n}`; const k = `${base.slice(0, 40 - suffix.length)}${suffix}`; if (!taken(k)) return k; }
}

export function planShareDiff(currentPlan: Plan, shared: PlanShareFile, currentSched?: Payload[] | null): PlanShareDiff {
 const cur = currentPlan;
 const fileEx = Object.keys(shared.plan.ex);
 const fileSess = Object.keys(shared.plan.sess);
 const exMap: Record<string, string> = {};
 const sessMap: Record<string, string> = {};
 const exercises: PlanShareDiff['exercises'] = { added: [], same: [], renamed: [] };
 const sessions: PlanShareDiff['sessions'] = { added: [], same: [], renamed: [] };
 const usedEx = new Set<string>();
 for (const k of fileEx) {
  const e = shared.plan.ex[k];
  if (!own(cur.ex, k)) { exMap[k] = k; exercises.added.push(k); }
  else if (normalizeName(cur.ex[k].n) === normalizeName(e.n) && cur.ex[k].m === e.m) { exMap[k] = k; exercises.same.push(k); }
  else { const to = freeId(k, x => own(cur.ex, x) || fileEx.includes(x) || usedEx.has(x)); exMap[k] = to; exercises.renamed.push({ from: k, to, name: e.n }); }
  usedEx.add(exMap[k]);
 }
 const usedSess = new Set<string>();
 for (const k of fileSess) {
  const s = shared.plan.sess[k];
  if (!own(cur.sess, k)) { sessMap[k] = k; sessions.added.push(k); }
  else if (normalizeName(cur.sess[k].name) === normalizeName(s.name)) { sessMap[k] = k; sessions.same.push(k); }
  else { const to = freeId(k, x => own(cur.sess, x) || fileSess.includes(x) || usedSess.has(x)); sessMap[k] = to; sessions.renamed.push({ from: k, to, name: s.name }); }
  usedSess.add(sessMap[k]);
 }
 const kept = Object.keys(cur.ex).filter(k => !usedEx.has(k));
 const finalOrder = shared.plan.order.map(k => sessMap[k]);
 const schedRemap: PlanShareDiff['schedRemap'] = [];
 if (Array.isArray(currentSched)) {
  let i = 0;
  currentSched.forEach((d, day) => {
   if (d?.k !== 'gym') return;
   if (typeof d.s === 'string' && usedSess.has(d.s)) return;
   schedRemap.push({ day, from: String(d.s ?? ''), to: finalOrder[i++ % finalOrder.length] });
  });
 }
 return { exercises, sessions, mapping: { ex: exMap, sess: sessMap }, kept, hasSched: Array.isArray(shared.sched), schedRemap };
}
