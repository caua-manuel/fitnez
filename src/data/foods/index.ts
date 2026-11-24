import type { Food, MealTemplates } from '../../domain/mealPlan';

// Tabela de alimentos e moldes do cardápio (ADR 013). Sempre por import() dinâmico: nunca na carga inicial.
export interface FoodData { version: number; source: string; foods: Food[]; templates: MealTemplates }

let cache: Promise<FoodData> | null = null;
/** Carrega `foods.json` e `templates.json` sob demanda (um chunk separado; fica em memória depois). */
export function loadFoodData(): Promise<FoodData> {
 cache ??= Promise.all([import('./foods.json'), import('./templates.json')]).then(([f, t]) => {
  const table = (f.default ?? f) as unknown as { version: number; source: string; foods: Food[] };
  return { version: table.version, source: table.source, foods: table.foods, templates: (t.default ?? t) as unknown as MealTemplates };
 }).catch(e => { cache = null; throw e; });
 return cache;
}
