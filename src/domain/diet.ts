import type { DayType } from './dayActivity';
import { dietTargetsFromProfile } from './profile';

export type MealKey = 'cafe' | 'almoco' | 'lanche' | 'pos' | 'jantar';
export interface DietOption { key: string; name: string; kcal: number; p: number; c: number; g: number; items: string[]; rec?: string }
export interface DayTarget { kcal: number; carbs: number; protein: number; fat: number; waterL: number; focus: string; adjustments: string[] }
export interface Consumed { key: string; name: string; kcal: number; p: number; c: number; g: number }
export interface DietDay {
 pick: Partial<Record<MealKey, string>>;
 eaten: Partial<Record<MealKey, boolean>>;
 skip: Partial<Record<MealKey, boolean>>;
 water: number; // copos de 500 ml
 crea: boolean;
 consumed?: Partial<Record<MealKey, Consumed>>;
}
export interface Totals { kcal: number; p: number; c: number; g: number }

const MEALS: MealKey[] = ['cafe', 'almoco', 'lanche', 'pos', 'jantar'];
const num = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? v : 0);

const TARGETS: Record<DayType, { kcal: number; carbs: number; focus: string; adjustments: string[] }> = {
 perna: { kcal: 2600, carbs: 340, focus: 'Perna pesada: mais carboidrato para o treino', adjustments: ['+50 g de arroz no almoço', '+1 banana no pré-treino'] },
 academia: { kcal: 2450, carbs: 305, focus: 'Academia: cardápio base', adjustments: [] },
 jiujitsu: { kcal: 2500, carbs: 315, focus: 'Jiu-jitsu: banana opcional antes da aula, sódio e água', adjustments: ['Banana opcional antes da aula', 'Sódio e água'] },
 volei: { kcal: 2500, carbs: 315, focus: 'Vôlei: água de coco e banana antes', adjustments: ['Água de coco 300 ml', '1 banana antes'] },
 descanso: { kcal: 2100, carbs: 215, focus: 'Descanso: menos calorias, sem o lanche da tarde', adjustments: ['Pular o lanche da tarde'] }
};

/** Metas de exemplo do plano por tipo de dia (fonte única dos números padrão). */
export const DAY_TARGET_DEFAULTS: Readonly<Record<DayType, Readonly<{ kcal: number; carbs: number }>>> = {
 perna: { kcal: TARGETS.perna.kcal, carbs: TARGETS.perna.carbs },
 academia: { kcal: TARGETS.academia.kcal, carbs: TARGETS.academia.carbs },
 jiujitsu: { kcal: TARGETS.jiujitsu.kcal, carbs: TARGETS.jiujitsu.carbs },
 volei: { kcal: TARGETS.volei.kcal, carbs: TARGETS.volei.carbs },
 descanso: { kcal: TARGETS.descanso.kcal, carbs: TARGETS.descanso.carbs }
};
export const DEFAULT_WATER_L = 3;

/** `kcal`, `carbs` e `waterL` opcionais: usados pelas metas editáveis (ver dietTargets.ts); ausentes = padrão do plano. */
export function dayTarget(type: DayType, opts: { protein?: number; fat?: number; kcal?: number; carbs?: number; waterL?: number } = {}): DayTarget {
 const t = TARGETS[type] ?? TARGETS.academia;
 return {
  kcal: typeof opts.kcal === 'number' && opts.kcal > 0 ? opts.kcal : t.kcal,
  carbs: typeof opts.carbs === 'number' && opts.carbs >= 0 ? opts.carbs : t.carbs,
  protein: typeof opts.protein === 'number' && opts.protein > 0 ? opts.protein : 185,
  fat: typeof opts.fat === 'number' && opts.fat > 0 ? opts.fat : 55,
  waterL: typeof opts.waterL === 'number' && opts.waterL > 0 ? opts.waterL : DEFAULT_WATER_L, focus: t.focus, adjustments: [...t.adjustments]
 };
}

export function markEaten(day: DietDay, meal: MealKey, option: DietOption): DietDay {
 const copy: Consumed = { key: option.key, name: option.name, kcal: option.kcal, p: option.p, c: option.c, g: option.g };
 return { ...day, eaten: { ...day.eaten, [meal]: true }, consumed: { ...day.consumed, [meal]: copy } };
}

export function unmarkEaten(day: DietDay, meal: MealKey): DietDay {
 const eaten = { ...day.eaten }; delete eaten[meal];
 const next: DietDay = { ...day, eaten };
 if (day.consumed) { const consumed = { ...day.consumed }; delete consumed[meal]; next.consumed = consumed; }
 return next;
}

export function dayTotals(day: DietDay, catalog: Record<MealKey, DietOption[]>): Totals & { eatenCount: number; mealCount: 5 } {
 const t = { kcal: 0, p: 0, c: 0, g: 0 };
 let eatenCount = 0;
 for (const m of MEALS) {
  if (!day.eaten?.[m] || day.skip?.[m]) continue;
  const src = day.consumed?.[m] ?? catalog?.[m]?.find(o => o.key === day.pick?.[m]);
  eatenCount++;
  if (!src) continue;
  t.kcal += num(src.kcal); t.p += num(src.p); t.c += num(src.c); t.g += num(src.g);
 }
 return { ...t, eatenCount, mealCount: 5 };
}

const ratio = (a: number, b: number) => (num(b) > 0 ? num(a) / num(b) : 0);
export function progress(totals: Totals, target: DayTarget): { kcal: number; protein: number; carbs: number; fat: number; remaining: number } {
 return {
  kcal: ratio(totals.kcal, target.kcal), protein: ratio(totals.p, target.protein),
  carbs: ratio(totals.c, target.carbs), fat: ratio(totals.g, target.fat),
  remaining: Math.max(0, num(target.kcal) - num(totals.kcal))
 };
}

export function applyAdjustments(option: DietOption, type: DayType, meal: MealKey): { option: DietOption; note?: string } {
 if (type === 'perna' && meal === 'almoco') return { option, note: 'Dia de perna: some +50 g de arroz neste almoço.' };
 if (type === 'perna' && meal === 'lanche') return { option, note: 'Dia de perna: some +1 banana no pré-treino.' };
 if (type === 'descanso' && meal === 'lanche') return { option, note: 'Dia de descanso: sugerimos pular o lanche da tarde.' };
 return { option };
}

export function weeklyReview(input: { weights: number[]; waists: number[]; strengthDown: boolean; hungerHigh: boolean }): { suggestion: 'cortar' | 'aumentar' | 'manter' | 'dados-insuficientes'; kcalDelta: number; text: string } {
 const w = (input.weights ?? []).filter(v => typeof v === 'number' && Number.isFinite(v));
 const c = (input.waists ?? []).filter(v => typeof v === 'number' && Number.isFinite(v));
 const up = 'Sugestão: aumentar cerca de 150 kcal por dia (50 g de arroz no almoço e no jantar, ou 1 banana com 1 colher de doce de leite). Você decide se aplica.';
 if (input.strengthDown) return { suggestion: 'aumentar', kcalDelta: 150, text: `A força está caindo. ${up}` };
 if (input.hungerHigh) return { suggestion: 'aumentar', kcalDelta: 150, text: `Fome ou cansaço excessivos. ${up}` };
 if (w.length < 2) return { suggestion: 'dados-insuficientes', kcalDelta: 0, text: 'Dados insuficientes: registre a média de peso de pelo menos 2 semanas para receber uma sugestão.' };
 const loss = w[w.length - 2] - w[w.length - 1];
 if (loss > 0.7) return { suggestion: 'aumentar', kcalDelta: 150, text: `Perda de ${loss.toFixed(2).replace('.', ',')} kg na semana, acima de 0,7 kg. ${up}` };
 if (c.length < 2) return { suggestion: 'dados-insuficientes', kcalDelta: 0, text: 'Dados insuficientes: registre a cintura em pelo menos 2 semanas para receber uma sugestão.' };
 const waistDown = c[c.length - 1] < c[c.length - 2];
 if (Math.abs(loss) < 0.15 && !waistDown) {
  return { suggestion: 'cortar', kcalDelta: -130, text: 'Peso e cintura estáveis. Antes de cortar, revise o carboidrato do pré-treino. Sugestão: reduzir cerca de 130 kcal por dia (50 g de arroz no almoço e no jantar). Você decide se aplica.' };
 }
 if (loss >= 0.2 && loss <= 0.4 && waistDown) return { suggestion: 'manter', kcalDelta: 0, text: 'Perda de 0,2 a 0,4 kg por semana com a cintura diminuindo: mantenha o plano atual.' };
 return { suggestion: 'manter', kcalDelta: 0, text: 'Nenhuma mudança sugerida agora. Mantenha o plano e acompanhe a próxima semana.' };
}

/** Meta do dia com proteína vinda do peso do perfil (185 g sem peso). Kcal e carboidrato seguem o tipo de dia. */
export function dayTargetForProfile(type: DayType, profile?: { weightKg?: number } | null): DayTarget {
 return dayTarget(type, dietTargetsFromProfile(profile));
}
