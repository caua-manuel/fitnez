// Calculadora de anilhas (conteudo-aval-ondas-hevy.md, seção 8). Função pura; trabalha em centésimos para evitar erro de ponto flutuante.

export const BAR_OPTIONS: readonly number[] = [20, 15, 10, 0]; // 0 = sem barra
export const DEFAULT_BAR = 20;
export const DEFAULT_PLATES: readonly number[] = [25, 20, 15, 10, 5, 2.5, 1.25];
/** Exercícios do plano que mostram o botão "Anilhas" (com barra). */
export const BARBELL_EXERCISES: readonly string[] = ['agach', 'stiff', 'hip_b', 'hip_l', 'remada_a', 'rosca_b'];

export interface PlateSettings { bar: number; available: number[] }
export const DEFAULT_PLATE_SETTINGS: PlateSettings = { bar: DEFAULT_BAR, available: [...DEFAULT_PLATES] };

export type PlatesResult =
 | { ok: true; perSide: number[]; achieved: number; exact: boolean; bar: number }
 | { ok: false; error: 'abaixo-da-barra' | 'carga-invalida' };

const c = (n: number) => Math.round(n * 100);

export function platesPerSide(total: number, bar: number = DEFAULT_BAR, available: readonly number[] = DEFAULT_PLATES): PlatesResult {
 if (!Number.isFinite(total) || total < 0 || !Number.isFinite(bar) || bar < 0) return { ok: false, error: 'carga-invalida' };
 if (c(total) < c(bar)) return { ok: false, error: 'abaixo-da-barra' };
 const plates = [...new Set(available.filter(p => Number.isFinite(p) && p > 0).map(c))].sort((a, b) => b - a);
 // Guloso: com as anilhas padrão dá o menor número de anilhas; a sobra devolve a combinação mais próxima abaixo.
 let side = Math.floor((c(total) - c(bar)) / 2);
 const perSide: number[] = [];
 for (const p of plates) while (side >= p) { perSide.push(p / 100); side -= p; }
 const achieved = (c(bar) + 2 * perSide.reduce((t, p) => t + c(p), 0)) / 100;
 return { ok: true, perSide, achieved, exact: c(achieved) === c(total), bar };
}

/** Validação de `settings.plates` (backup e estado). Retorna o motivo ou null. */
export function checkStoredPlates(v: unknown): string | null {
 if (!v || typeof v !== 'object' || Array.isArray(v)) return 'esperado objeto.';
 const p = v as Record<string, unknown>;
 if (typeof p.bar !== 'number' || !BAR_OPTIONS.includes(p.bar)) return 'barra inválida.';
 if (!Array.isArray(p.available) || p.available.length > DEFAULT_PLATES.length) return 'lista de anilhas inválida.';
 if (!p.available.every(x => typeof x === 'number' && DEFAULT_PLATES.includes(x))) return 'anilha inválida.';
 return null;
}
