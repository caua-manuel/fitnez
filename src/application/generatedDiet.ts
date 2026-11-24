import type { Payload, Repository, StateV3 } from './repository';
import { RepositoryError } from './repository';
import type { DayIso } from '../domain/calendar';
import type { MealKey } from '../domain/diet';
import { effectiveDietTargets } from '../domain/dietTargets';
import type { DietTargets } from '../domain/dietTargets';
import type { Eligibility, Food, GeneratedOption, MealTemplates } from '../domain/mealPlan';
import { buildDietTargetsFromAnswers, validateOnboardingAnswers } from '../domain/onboarding';
import type { OnboardingAnswers } from '../domain/onboarding';

// Cardápio gerado pelo assistente (ADR 013). Uma gravação (`repository.save`, uma transação) troca `catalog.diet`
// e guarda as respostas `food` em `settings.onboarding`. O cardápio anterior vai para `recovery` para desfazer.
// A regra (domain/mealPlan) e a tabela (data/foods) só carregam aqui, por import(), nunca na carga inicial.

const clone = <T>(v: T): T => structuredClone(v);
const MEALS: readonly MealKey[] = ['cafe', 'almoco', 'lanche', 'pos', 'jantar'];
export interface FoodDataInput { foods: readonly Food[]; templates: MealTemplates }
type MealPlanModule = typeof import('../domain/mealPlan');

async function loadAll(): Promise<{ mp: MealPlanModule; data: FoodDataInput }> {
 const [mp, d] = await Promise.all([import('../domain/mealPlan'), import('../data/foods/index')]);
 return { mp, data: await d.loadFoodData() };
}

function freeKey(s: StateV3, prefix: string, time: number): string {
 let id = `${prefix}:${time}`;
 for (let n = 2; s.recovery[id] !== undefined; n++) id = `${prefix}:${time}:${n}`;
 return id;
}

export interface DietUndoRecord { kind: 'diet-undo'; createdAt: number; diet: Payload; food: Payload | null }

export type GeneratedDietResult =
 | { ok: true; state: StateV3; withinTolerance: boolean }
 | { ok: false; reason: Exclude<Eligibility, { ok: true }>['reason'] };

/**
 * Função pura: estado novo com o cardápio gerado em `catalog.diet`. Precisa de `settings.onboarding`
 * (aplique o assistente antes). Nos casos bloqueados devolve `ok: false` e nada muda.
 */
export function applyGeneratedDietToState(state: StateV3, answers: unknown, data: FoodDataInput, mp: Pick<MealPlanModule, 'mealEligibility' | 'generateMeals'>, now: number): GeneratedDietResult {
 const checked = validateOnboardingAnswers(answers);
 if (!checked.ok) throw new RepositoryError('validation', `Respostas do assistente inválidas. ${Object.values(checked.errors)[0]}`);
 const a: OnboardingAnswers = checked.value;
 const el = mp.mealEligibility(a);
 if (!el.ok) return { ok: false, reason: el.reason };
 const t = buildDietTargetsFromAnswers(a);
 if (t.kind !== 'targets') return { ok: false, reason: 'sem-dados' };
 if (!state.settings.onboarding) throw new RepositoryError('validation', 'Aplique o plano do assistente antes de gerar o cardápio.');
 const { meals, withinTolerance } = mp.generateMeals(a, t.targets, data.foods, data.templates);
 const next = clone(state);
 const key = freeKey(next, 'diet-undo', now);
 const rec: DietUndoRecord = { kind: 'diet-undo', createdAt: now, diet: clone(state.catalog.diet), food: state.settings.onboarding.answers.food ? clone(state.settings.onboarding.answers.food) as unknown as Payload : null };
 next.recovery = { ...next.recovery, [key]: rec as unknown as Payload };
 const diet: Record<string, GeneratedOption[]> = {};
 for (const m of MEALS) diet[m] = meals[m];
 next.catalog = { ...next.catalog, diet, revision: (next.catalog.revision ?? 0) + 1 };
 const ob = next.settings.onboarding!;
 next.settings.onboarding = { ...ob, answers: { ...ob.answers, food: clone(a.food!) }, dietUndoKey: key };
 return { ok: true, state: next, withinTolerance };
}

export function canUndoGeneratedDiet(state: StateV3): boolean {
 const key = state.settings.onboarding?.dietUndoKey;
 return typeof key === 'string' && (state.recovery[key] as Payload | undefined)?.kind === 'diet-undo';
}

/** Função pura: devolve `catalog.diet` e as respostas `food` ao que eram antes (1 nível). */
export function undoGeneratedDietInState(state: StateV3): StateV3 {
 if (!canUndoGeneratedDiet(state)) throw new RepositoryError('validation', 'Não há cardápio anterior para voltar.');
 const rec = state.recovery[state.settings.onboarding!.dietUndoKey!] as unknown as DietUndoRecord;
 const next = clone(state);
 next.catalog = { ...next.catalog, diet: clone(rec.diet), revision: (next.catalog.revision ?? 0) + 1 };
 const ob = clone(next.settings.onboarding!);
 delete ob.dietUndoKey;
 if (rec.food === null) delete ob.answers.food; else ob.answers.food = clone(rec.food) as unknown as NonNullable<typeof ob.answers.food>;
 next.settings.onboarding = ob;
 return next;
}

const conflict = () => new RepositoryError('conflict', 'Os dados mudaram em outra aba. Recarregue antes de tentar novamente.');

/** Gera e grava o cardápio numa transação. `answers`: as respostas completas do assistente (em memória). */
export async function applyGeneratedDiet(repo: Repository, input: { answers: OnboardingAnswers; expectedRevision: number; now?: number }): Promise<{ ok: true; state: StateV3; withinTolerance: boolean } | { ok: false; reason: Exclude<Eligibility, { ok: true }>['reason'] }> {
 const { mp, data } = await loadAll();
 const current = await repo.read();
 if (current.revision !== input.expectedRevision) throw conflict();
 const r = applyGeneratedDietToState(current, input.answers, data, mp, input.now ?? Date.now());
 if (!r.ok) return r;
 return { ok: true, state: await repo.save({ state: r.state, expectedRevision: input.expectedRevision }), withinTolerance: r.withinTolerance };
}

/** Desfaz o último cardápio gerado numa transação. */
export async function undoGeneratedDiet(repo: Repository, input: { expectedRevision: number }): Promise<StateV3> {
 const current = await repo.read();
 if (current.revision !== input.expectedRevision) throw conflict();
 return repo.save({ state: undoGeneratedDietInState(current), expectedRevision: input.expectedRevision });
}

/**
 * "Trocar este alimento": troca `foodId` na opção `optionKey` da refeição `meal` e grava numa transação.
 * Usa as respostas `food` guardadas. `exclude`: ids já mostrados nesta sequência de trocas.
 * Devolve `null` quando não há troca válida (nada é gravado).
 */
export async function swapDietFood(repo: Repository, input: { meal: MealKey; optionKey: string; foodId: string; expectedRevision: number; today: DayIso; exclude?: string[] }): Promise<StateV3 | null> {
 const { mp, data } = await loadAll();
 const current = await repo.read();
 if (current.revision !== input.expectedRevision) throw conflict();
 const food = current.settings.onboarding?.answers.food;
 const list = (current.catalog.diet as Record<string, GeneratedOption[] | undefined>)[input.meal];
 const at = list?.findIndex(o => o.key === input.optionKey) ?? -1;
 if (!food || !list || at < 0) return null;
 const targets: DietTargets = effectiveDietTargets(current.settings, input.today);
 const swapped = mp.swapFood(list[at]!, input.foodId, { food }, targets, data.foods, input.exclude);
 if (!swapped) return null;
 const next = clone(current);
 const nl = [...list]; nl[at] = swapped;
 next.catalog = { ...next.catalog, diet: { ...next.catalog.diet, [input.meal]: nl }, revision: (next.catalog.revision ?? 0) + 1 };
 return repo.save({ state: next, expectedRevision: input.expectedRevision });
}
