import type { Exercise, Payload, Plan, Repository, Session, StateV3 } from './repository';
import { RepositoryError } from './repository';
import type { DayIso } from '../domain/calendar';
import { checkPlanShare, planShareDiff } from '../domain/planShare';
import type { PlanShareFile } from '../domain/planShare';

// Aplicar e desfazer um plano compartilhado por um amigo (ADR 011, 1.3), no molde de application/onboarding.ts.
// Uma única gravação (`repository.save`, uma transação) troca treinos, ordem, exercícios, RIR, alternativo, condomínio
// (se o arquivo trouxer) e, só se a pessoa marcar, a rotina. Registros, metas, perfil e notas não mudam.
// O estado anterior vai para `recovery['plan-import-undo:<t>']`; `settings.planImport` guarda nome, dia e a chave (1 nível).

const clone = <T>(v: T): T => structuredClone(v);
const civil = (v: unknown): v is DayIso => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && new Date(`${v}T12:00:00Z`).toISOString().slice(0, 10) === v;
const own = (o: object, k: string) => Object.prototype.hasOwnProperty.call(o, k);

export type PlanImportSetting = NonNullable<StateV3['settings']['planImport']>;

/** O que fica em `recovery` para desfazer. Campos ausentes antes = `null`. */
export interface PlanImportUndoRecord {
 kind: 'plan-import-undo' | 'before-plan-import-undo';
 createdAt: number;
 plan: Payload; sched: Payload[]; start: DayIso; startConfirmed: boolean | null; planImport: Payload | null;
}

function undoRecordOf(s: StateV3, kind: PlanImportUndoRecord['kind'], time: number): Payload {
 const st = s.settings;
 return { kind, createdAt: time, plan: clone(s.catalog.plan), sched: clone(st.sched), start: st.start, startConfirmed: typeof st.startConfirmed === 'boolean' ? st.startConfirmed : null, planImport: st.planImport === undefined ? null : clone(st.planImport) };
}
function freeKey(s: StateV3, prefix: string, time: number): string {
 let id = `${prefix}:${time}`;
 for (let n = 2; s.recovery[id] !== undefined; n++) id = `${prefix}:${time}:${n}`;
 return id;
}

export interface ApplyPlanShareOptions {
 /** Data de início escolhida na revisão (mesmo passo do assistente). */
 start: DayIso;
 today: DayIso;
 now: number;
 /** Trocar também a rotina da semana (só vale se o arquivo trouxer). Padrão: não. */
 includeSched?: boolean;
}

/**
 * Função pura: estado novo com o plano do arquivo aplicado. Use `applyPlanShare` para gravar.
 * O arquivo é conferido de novo pela lista branca (o que é gravado nunca diverge das regras).
 */
export function applyPlanShareToState(state: StateV3, file: PlanShareFile, opts: ApplyPlanShareOptions): StateV3 {
 if (!civil(opts.start)) throw new RepositoryError('validation', 'Escolha uma data de início válida.');
 if (!civil(opts.today)) throw new RepositoryError('validation', 'Data de hoje inválida.');
 const checked = checkPlanShare(file);
 if (!checked.ok) throw new RepositoryError('validation', checked.error);
 const shared = checked.value;
 const cur = state.catalog.plan;
 const diff = planShareDiff(cur, shared, state.settings.sched);
 const { ex: exMap, sess: sessMap } = diff.mapping;
 const same = new Set(diff.exercises.same);

 const next = clone(state);
 const undoKey = freeKey(next, 'plan-import-undo', opts.now);
 next.recovery = { ...next.recovery, [undoKey]: undoRecordOf(state, 'plan-import-undo', opts.now) };

 const ex: Record<string, Exercise> = { ...clone(cur.ex) };
 for (const [k, e] of Object.entries(shared.plan.ex)) {
  const to = exMap[k];
  // Mesmo exercício: a prescrição do arquivo vale; o que o arquivo não traz (observação, grupo) continua o meu.
  ex[to] = same.has(k) && own(cur.ex, to) ? { ...clone(cur.ex[to]), ...clone(e) } : (clone(e) as Exercise);
 }
 const sess: Record<string, Session> = {};
 for (const [k, s] of Object.entries(shared.plan.sess)) sess[sessMap[k]] = { ...clone(s), ex: s.ex.map(e => exMap[e]) };
 const plan: Plan = { ...clone(cur), ex, sess, order: shared.plan.order.map(k => sessMap[k]) };
 if (shared.plan.alt !== undefined) plan.alt = sessMap[shared.plan.alt]; else delete plan.alt;
 if (shared.plan.rir !== undefined) plan.rir = [...shared.plan.rir]; else delete plan.rir;
 if (shared.plan.cond !== undefined) plan.cond = [...shared.plan.cond]; // sem condomínio no arquivo: o meu continua
 next.catalog = { ...next.catalog, plan, revision: (next.catalog.revision ?? 0) + 1 };

 if (opts.includeSched && shared.sched) {
  next.settings.sched = shared.sched.map(d => { const o: Payload = { ...d }; if (typeof d.s === 'string') o.s = sessMap[d.s]; return o; });
 } else {
  // A minha rotina continua; dias de academia que apontariam para treino que deixou de existir assumem os novos, na ordem.
  const sched = clone(state.settings.sched);
  for (const r of diff.schedRemap) sched[r.day] = { ...sched[r.day], s: r.to };
  next.settings.sched = sched;
 }
 next.settings.start = opts.start;
 next.settings.startConfirmed = true;
 next.settings.planImport = { v: 1, appliedOn: opts.today, name: shared.name, undoKey };
 return next;
}

/** Há plano anterior guardado para "Desfazer" / "Voltar ao plano anterior"? */
export function canUndoPlanShare(state: StateV3): boolean {
 const key = state.settings.planImport?.undoKey;
 return typeof key === 'string' && (state.recovery[key] as Payload | undefined)?.kind === 'plan-import-undo';
}

/** Função pura: devolve plano, rotina, início e a marcação do plano importado ao que eram antes de aplicar. */
export function undoPlanShareInState(state: StateV3, now: number): StateV3 {
 if (!canUndoPlanShare(state)) throw new RepositoryError('validation', 'Não há plano anterior para voltar.');
 const rec = state.recovery[state.settings.planImport!.undoKey!] as unknown as PlanImportUndoRecord;
 const next = clone(state);
 next.recovery = { ...next.recovery, [freeKey(next, 'before-plan-import-undo', now)]: undoRecordOf(state, 'before-plan-import-undo', now) };
 next.catalog = { ...next.catalog, plan: clone(rec.plan) as Plan, revision: (next.catalog.revision ?? 0) + 1 };
 next.settings.sched = clone(rec.sched);
 next.settings.start = rec.start;
 if (rec.startConfirmed === null) delete next.settings.startConfirmed; else next.settings.startConfirmed = rec.startConfirmed;
 if (rec.planImport === null) delete next.settings.planImport;
 else { const p = clone(rec.planImport) as PlanImportSetting; delete p.undoKey; next.settings.planImport = p; } // 1 nível
 return next;
}

/** Grava o plano do arquivo numa única transação. Conflito se os dados mudaram desde `expectedRevision`. */
export async function applyPlanShare(repo: Repository, input: { file: PlanShareFile; start: DayIso; today: DayIso; includeSched?: boolean; expectedRevision: number; now?: number }): Promise<StateV3> {
 const current = await repo.read();
 if (current.revision !== input.expectedRevision) throw new RepositoryError('conflict', 'Os dados mudaram em outra aba. Recarregue antes de tentar novamente.');
 const next = applyPlanShareToState(current, input.file, { start: input.start, today: input.today, now: input.now ?? Date.now(), includeSched: input.includeSched });
 return repo.save({ state: next, expectedRevision: input.expectedRevision });
}

/** Volta ao plano anterior ao último importado, numa única transação. */
export async function undoPlanShare(repo: Repository, input: { expectedRevision: number; now?: number }): Promise<StateV3> {
 const current = await repo.read();
 if (current.revision !== input.expectedRevision) throw new RepositoryError('conflict', 'Os dados mudaram em outra aba. Recarregue antes de tentar novamente.');
 return repo.save({ state: undoPlanShareInState(current, input.now ?? Date.now()), expectedRevision: input.expectedRevision });
}
