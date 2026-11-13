import type { Exercise, Plan } from '../application/repository';

const copy = (plan: Plan): Plan => structuredClone(plan);

function slug(text: string): string {
 const base = text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 24);
 return base || 'item';
}
function uniqueId(taken: Record<string, unknown>, text: string): string {
 const base = slug(text);
 let id = base, n = 2;
 while (Object.prototype.hasOwnProperty.call(taken, id) || ['__proto__', 'constructor', 'prototype'].includes(id)) id = `${base}_${n++}`;
 return id;
}
function session(plan: Plan, id: string) {
 const s = Object.prototype.hasOwnProperty.call(plan.sess, id) ? plan.sess[id] : undefined;
 if (!s) throw new Error(`Treino inexistente: ${id}`);
 return s;
}

export function createSession(plan: Plan, input: { name: string; sub?: string; min?: string }): { plan: Plan; id: string } {
 const next = copy(plan);
 const id = uniqueId(next.sess, input.name);
 const s: Plan['sess'][string] = { name: input.name, ex: [] };
 if (input.sub !== undefined) s.sub = input.sub;
 if (input.min !== undefined) s.min = input.min;
 next.sess[id] = s;
 next.order.push(id);
 return { plan: next, id };
}

export function duplicateSession(plan: Plan, id: string): { plan: Plan; id: string } {
 const original = session(plan, id);
 const next = copy(plan);
 const newId = uniqueId(next.sess, id);
 next.sess[newId] = { ...structuredClone(original), name: `${original.name} (cópia)`, ex: [...original.ex] };
 const at = next.order.indexOf(id);
 next.order.splice(at < 0 ? next.order.length : at + 1, 0, newId);
 return { plan: next, id: newId };
}

export function deleteSession(plan: Plan, id: string): Plan {
 const next = copy(plan);
 delete next.sess[id];
 next.order = next.order.filter(x => x !== id);
 return next;
}

export function upsertExercise(plan: Plan, id: string | null, ex: Exercise): { plan: Plan; id: string } {
 if (ex.rest !== undefined && (typeof ex.rest !== 'number' || !Number.isFinite(ex.rest) || ex.rest < 0)) throw new Error('Descanso inválido.');
 const next = copy(plan);
 const target = id ?? uniqueId(next.ex, ex.n);
 next.ex[target] = structuredClone(ex);
 return { plan: next, id: target };
}

export function addExerciseToSession(plan: Plan, sessionId: string, exId: string): Plan {
 session(plan, sessionId);
 if (!Object.prototype.hasOwnProperty.call(plan.ex, exId)) throw new Error(`Exercício inexistente: ${exId}`);
 const next = copy(plan);
 if (!next.sess[sessionId].ex.includes(exId)) next.sess[sessionId].ex.push(exId);
 return next;
}

export function removeExerciseFromSession(plan: Plan, sessionId: string, exId: string): Plan {
 session(plan, sessionId);
 const next = copy(plan);
 next.sess[sessionId].ex = next.sess[sessionId].ex.filter(x => x !== exId);
 return next;
}

export function moveExercise(plan: Plan, sessionId: string, from: number, to: number): Plan {
 const len = session(plan, sessionId).ex.length;
 const next = copy(plan);
 if (!Number.isInteger(from) || !Number.isInteger(to) || from < 0 || to < 0 || from >= len || to >= len) return next;
 const list = next.sess[sessionId].ex;
 const [item] = list.splice(from, 1);
 list.splice(to, 0, item);
 return next;
}

/** Cria o treino já com o primeiro exercício (novo, com id gerado). O id do exercício sai em `exId`. */
export function createSessionWithExercise(plan: Plan, input: { name: string; sub?: string; min?: string }, ex: Exercise): { plan: Plan; id: string; exId: string } {
 const created = createSession(plan, input);
 const saved = upsertExercise(created.plan, null, ex);
 return { plan: addExerciseToSession(saved.plan, created.id, saved.id), id: created.id, exId: saved.id };
}

/** Atualiza só nome, descrição e duração do treino. Descrição ou duração vazias removem o campo. */
export function updateSession(plan: Plan, id: string, input: { name: string; sub?: string; min?: string }): Plan {
 session(plan, id);
 const next = copy(plan);
 const s = next.sess[id];
 s.name = input.name;
 if (input.sub) s.sub = input.sub; else delete s.sub;
 if (input.min) s.min = input.min; else delete s.min;
 return next;
}

/** Volta aos treinos originais (semente). Exercícios criados pelo usuário continuam em `ex` para o histórico seguir com nome. */
export function restoreSeedPlan(plan: Plan, seed: Plan): Plan {
 const next = copy(plan);
 next.ex = { ...next.ex, ...structuredClone(seed.ex) };
 next.sess = structuredClone(seed.sess);
 next.order = [...seed.order];
 return next;
}

/** Ids dos treinos que usam o exercício. */
export function sessionsUsing(plan: Plan, exId: string): string[] {
 return Object.keys(plan.sess).filter(id => plan.sess[id].ex.includes(exId));
}
