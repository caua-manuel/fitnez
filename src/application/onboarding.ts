import seedPlan from '../../data/plan.json';
import type { Exercise, Payload, Repository, StateV3 } from './repository';
import { RepositoryError } from './repository';
import type { DayIso } from '../domain/calendar';
import { isExampleTarget, restoreDefaultVersion, withDietTargetsVersion } from '../domain/dietTargets';
import { buildOnboardingPreview, mergeGeneratedPlan, storedAnswersOf, validateOnboardingAnswers } from '../domain/onboarding';
import type { OnboardingPreview, OnboardingSetting } from '../domain/onboarding';

// Aplicar e desfazer o assistente de início (ADR 008). Uma única gravação (`repository.save`, uma transação do
// IndexedDB) troca plano, rotina, data de início, RIR, metas (nova versão a partir de hoje), perfil físico e marcações.
// O estado anterior desses campos vai para `recovery` para "Desfazer". Nunca toca em registros, notas e medidas.
// Privacidade: sexo e marcações do passo 0 não são gravados em lugar nenhum (só o resultado: as marcações abaixo).

const clone = <T>(v: T): T => structuredClone(v);
const civil = (v: unknown): v is DayIso => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && new Date(`${v}T12:00:00Z`).toISOString().slice(0, 10) === v;

/** Catálogo de exercícios do assistente: o de fábrica (data/plan.json), que inclui os exercícios para casa. */
export function assistantCatalog(): Record<string, Exercise> {
 return clone(seedPlan.plan.ex) as Record<string, Exercise>;
}

/** Prévia para a tela de revisão. `answers` pode vir direto do formulário (é validado). */
export function previewOnboarding(answers: unknown): { ok: true; preview: OnboardingPreview } | { ok: false; errors: Record<string, string> } {
 const r = validateOnboardingAnswers(answers);
 if (!r.ok) return r;
 return { ok: true, preview: buildOnboardingPreview(r.value, assistantCatalog()) };
}

/** O que fica guardado em `recovery` para desfazer. Campos ausentes antes = `null`. */
export interface OnboardingUndoRecord {
 kind: 'onboarding-undo';
 createdAt: number;
 plan: Payload; sched: Payload[]; start: DayIso; startConfirmed: boolean | null;
 dietTargets: Payload | null; profile: Payload | null; onboarding: Payload | null;
}

function undoRecordOf(s: StateV3, kind: 'onboarding-undo' | 'before-onboarding-undo', time: number): Payload {
 const st = s.settings;
 return { kind, createdAt: time, plan: clone(s.catalog.plan), sched: clone(st.sched), start: st.start, startConfirmed: typeof st.startConfirmed === 'boolean' ? st.startConfirmed : null, dietTargets: st.dietTargets === undefined ? null : clone(st.dietTargets), profile: st.profile === undefined ? null : clone(st.profile), onboarding: st.onboarding === undefined ? null : clone(st.onboarding) };
}
function freeKey(s: StateV3, prefix: string, time: number): string {
 let id = `${prefix}:${time}`;
 for (let n = 2; s.recovery[id] !== undefined; n++) id = `${prefix}:${time}:${n}`;
 return id;
}

export interface ApplyOnboardingOptions { start: DayIso; today: DayIso; now: number }

/**
 * Função pura: estado novo com o plano do assistente aplicado. Use `applyOnboarding` para gravar.
 * Metas: com cálculo, nova versão a partir de `today`; sem cálculo por segurança, volta à meta de exemplo
 * (se havia meta própria); sem dados físicos, as metas atuais ficam como estão.
 */
export function applyOnboardingToState(state: StateV3, preview: OnboardingPreview, opts: ApplyOnboardingOptions): StateV3 {
 if (!civil(opts.start)) throw new RepositoryError('validation', 'Escolha uma data de início válida.');
 if (!civil(opts.today)) throw new RepositoryError('validation', 'Data de hoje inválida.');
 const checked = validateOnboardingAnswers(preview.answers);
 if (!checked.ok) throw new RepositoryError('validation', `Respostas do assistente inválidas. ${Object.values(checked.errors)[0]}`);
 // Refaz a prévia a partir das respostas: o que é gravado nunca diverge das regras.
 const fresh = buildOnboardingPreview(checked.value, assistantCatalog());
 const next = clone(state);
 const undoKey = freeKey(next, 'onboarding-undo', opts.now);
 next.recovery = { ...next.recovery, [undoKey]: undoRecordOf(state, 'onboarding-undo', opts.now) };

 next.catalog = { ...next.catalog, plan: mergeGeneratedPlan(next.catalog.plan, fresh.generated.plan), revision: (next.catalog.revision ?? 0) + 1 };
 next.settings.sched = clone(fresh.generated.sched);
 next.settings.start = opts.start;
 next.settings.startConfirmed = true;
 if (fresh.diet.kind === 'targets') next.settings.dietTargets = withDietTargetsVersion(next.settings.dietTargets, opts.today, fresh.diet.targets);
 else if (fresh.diet.reason === 'seguranca' && !isExampleTarget(next.settings)) next.settings.dietTargets = restoreDefaultVersion(next.settings.dietTargets, opts.today);

 const b = checked.value.body;
 if (b && (b.age !== undefined || b.heightCm !== undefined || b.weightKg !== undefined)) {
  const p = { name: '', goal: '', ...(next.settings.profile ?? {}) };
  if (b.age !== undefined) p.age = b.age;
  if (b.heightCm !== undefined) p.heightCm = b.heightCm;
  if (b.weightKg !== undefined) p.weightKg = b.weightKg;
  next.settings.profile = p; // sexo e rotina fora do treino não entram no perfil
 }
 const onboarding: OnboardingSetting = { v: 1, appliedOn: opts.today, answers: storedAnswersOf(checked.value), dietTargetsDisabled: fresh.flags.dietTargetsDisabled, hideDietNumbers: fresh.flags.hideDietNumbers, undoKey };
 next.settings.onboarding = onboarding;
 return next;
}

/** Há plano anterior guardado para "Desfazer" / "Voltar ao plano anterior"? */
export function canUndoOnboarding(state: StateV3): boolean {
 const key = state.settings.onboarding?.undoKey;
 return typeof key === 'string' && (state.recovery[key] as Payload | undefined)?.kind === 'onboarding-undo';
}

/** Função pura: devolve plano, rotina, início, metas, perfil e marcações ao que eram antes de aplicar. */
export function undoOnboardingInState(state: StateV3, now: number): StateV3 {
 if (!canUndoOnboarding(state)) throw new RepositoryError('validation', 'Não há plano anterior para voltar.');
 const rec = state.recovery[state.settings.onboarding!.undoKey!] as unknown as OnboardingUndoRecord;
 const next = clone(state);
 next.recovery = { ...next.recovery, [freeKey(next, 'before-onboarding-undo', now)]: undoRecordOf(state, 'before-onboarding-undo', now) };
 next.catalog = { ...next.catalog, plan: clone(rec.plan) as StateV3['catalog']['plan'], revision: (next.catalog.revision ?? 0) + 1 };
 next.settings.sched = clone(rec.sched);
 next.settings.start = rec.start;
 if (rec.startConfirmed === null) delete next.settings.startConfirmed; else next.settings.startConfirmed = rec.startConfirmed;
 if (rec.dietTargets === null) delete next.settings.dietTargets; else next.settings.dietTargets = clone(rec.dietTargets) as StateV3['settings']['dietTargets'];
 if (rec.profile === null) delete next.settings.profile; else next.settings.profile = clone(rec.profile) as StateV3['settings']['profile'];
 if (rec.onboarding === null) delete next.settings.onboarding;
 else { const o = clone(rec.onboarding) as OnboardingSetting; delete o.undoKey; next.settings.onboarding = o; } // 1 nível
 return next;
}

/** Grava o plano do assistente numa única transação. Conflito se os dados mudaram desde `expectedRevision`. */
export async function applyOnboarding(repo: Repository, input: { preview: OnboardingPreview; start: DayIso; today: DayIso; expectedRevision: number; now?: number }): Promise<StateV3> {
 const current = await repo.read();
 if (current.revision !== input.expectedRevision) throw new RepositoryError('conflict', 'Os dados mudaram em outra aba. Recarregue antes de tentar novamente.');
 const next = applyOnboardingToState(current, input.preview, { start: input.start, today: input.today, now: input.now ?? Date.now() });
 return repo.save({ state: next, expectedRevision: input.expectedRevision });
}

/** Desfaz o último uso do assistente numa única transação. */
export async function undoOnboarding(repo: Repository, input: { expectedRevision: number; now?: number }): Promise<StateV3> {
 const current = await repo.read();
 if (current.revision !== input.expectedRevision) throw new RepositoryError('conflict', 'Os dados mudaram em outra aba. Recarregue antes de tentar novamente.');
 return repo.save({ state: undoOnboardingInState(current, input.now ?? Date.now()), expectedRevision: input.expectedRevision });
}
