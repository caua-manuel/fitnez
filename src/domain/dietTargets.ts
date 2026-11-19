import type { DayIso } from './calendar';
import type { AnyDayType, DayType } from './dayActivity';
import { DAY_TARGET_DEFAULTS, DEFAULT_WATER_L, dayTarget } from './diet';
import type { DayTarget } from './diet';
import { DEFAULT_FAT_G, proteinTargetG } from './profile';

// Metas de dieta editáveis (ADR 007). Funções puras; sem acesso a dados.
// Nenhum número padrão mora aqui: vêm de diet.ts (kcal, carboidrato, água) e profile.ts (proteína, gordura).

export const DAY_TYPES: readonly DayType[] = ['perna', 'academia', 'jiujitsu', 'volei', 'descanso'];
export const DAY_TYPE_LABEL: Readonly<Record<DayType, string>> = { perna: 'Perna', academia: 'Academia', jiujitsu: 'Jiu-jitsu', volei: 'Vôlei', descanso: 'Descanso' };
/** Com o dia de esporte do assistente (ADR 008). `DAY_TYPES` continua com os cinco originais. */
export const ALL_DAY_TYPES: readonly AnyDayType[] = [...DAY_TYPES, 'esporte'];
export const ANY_DAY_TYPE_LABEL: Readonly<Record<AnyDayType, string>> = { ...DAY_TYPE_LABEL, esporte: 'Esporte' };

type DayRow = { kcal: number; carbs: number };
/** Dias das metas: os cinco originais sempre; `esporte` opcional (ausente = usa o de vôlei). */
export type DietTargetDays = Record<DayType, DayRow> & { esporte?: DayRow };

export interface DietTargets {
 days: DietTargetDays;
 proteinG: number | null; // null = automática pelo peso
 fatG: number;
 waterL: number;
}
export interface DietTargetsVersion { from: DayIso; targets: DietTargets | null }
export interface DietTargetsSetting { schema: 1; versions: DietTargetsVersion[] }

export const DIET_TARGETS_SCHEMA = 1 as const;
export const MAX_DIET_TARGET_VERSIONS = 100;
export const OLDEST_VERSION_FROM = '1970-01-01';

/** Limites absolutos (bloqueiam salvar e rejeitam backup). Só podem ser ampliados no futuro. */
export const LIMITS = {
 kcal: { min: 1000, max: 6000 },
 protein: { min: 20, max: 400 },
 carbs: { min: 0, max: 800 },
 fat: { min: 20, max: 300 },
 water: { min: 1, max: 6, step: 0.5 }
} as const;
/** Limiares de aviso (não bloqueiam). Todos "a verificar" com profissional de saúde. */
export const WARN = { kcalLow: 1400, kcalHigh: 4500, proteinPerKgLow: 0.8, proteinPerKgHigh: 3.0, fatLow: 30, waterHigh: 5 } as const;

export function defaultDietTargets(): DietTargets {
 const days = {} as DietTargets['days'];
 for (const t of DAY_TYPES) days[t] = { kcal: DAY_TARGET_DEFAULTS[t].kcal, carbs: DAY_TARGET_DEFAULTS[t].carbs };
 return { days, proteinG: null, fatG: DEFAULT_FAT_G, waterL: DEFAULT_WATER_L };
}

// ---------- cálculos ----------
export const kcalFromMacros = (p: number, c: number, g: number): number => Math.round(4 * p + 4 * c + 9 * g);
export const macroTolerance = (kcal: number): number => Math.max(100, Math.round((kcal * 5) / 100));
export const carbsFromRest = (kcal: number, p: number, g: number): number => Math.max(0, Math.round((kcal - 4 * p - 9 * g) / 4));
/** Copos de 500 ml da meta de água. */
export const waterCups = (waterL: number): number => Math.round((waterL * 1000) / 500);

// ---------- validação de formulário ----------
export type WarningCode = 'macros-incoerentes' | 'kcal-baixa' | 'kcal-alta' | 'proteina-baixa' | 'proteina-alta' | 'gordura-baixa' | 'agua-alta';
export interface DietWarning { code: WarningCode; message: string; day?: AnyDayType }
export interface DietTargetsInput {
 days?: Partial<Record<AnyDayType, { kcal?: unknown; carbs?: unknown } | null>> | null;
 /** null, undefined ou 'auto' = automática pelo peso */
 proteinG?: unknown;
 fatG?: unknown;
 waterL?: unknown;
}
export type DietTargetsResult = { ok: true; value: DietTargets; warnings: DietWarning[] } | { ok: false; errors: Record<string, string> };

const thousands = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
const isEmpty = (v: unknown) => v === undefined || v === null || (typeof v === 'string' && v.trim() === '');
type Parsed = { kind: 'ok'; n: number } | { kind: 'empty' } | { kind: 'text' } | { kind: 'decimal'; n: number };

function parseField(raw: unknown, allowDecimal: boolean): Parsed {
 if (isEmpty(raw)) return { kind: 'empty' };
 let n: number;
 if (typeof raw === 'number') {
  if (!Number.isFinite(raw)) return { kind: 'text' };
  n = raw;
 } else if (typeof raw === 'string') {
  const t = raw.trim().replace(',', '.');
  if (!/^-?\d+(\.\d+)?$/.test(t)) return { kind: 'text' };
  n = Number(t);
  if (!Number.isFinite(n)) return { kind: 'text' };
 } else return { kind: 'text' };
 if (!allowDecimal && !Number.isInteger(n)) return { kind: 'decimal', n };
 return { kind: 'ok', n };
}

export function validateDietTargets(input: DietTargetsInput, ctx: { weightKg?: number | null } = {}): DietTargetsResult {
 const errors: Record<string, string> = {};
 const warnings: DietWarning[] = [];
 const readInt = (key: string, label: string, raw: unknown, min: number, max: number, example: string): number | null => {
  const p = parseField(raw, false);
  if (p.kind === 'empty') { errors[key] = `${label}: preencha este campo.`; return null; }
  if (p.kind === 'text') { errors[key] = `${label}: use só números.`; return null; }
  if (p.kind === 'decimal') { errors[key] = `${label}: use um número inteiro, sem vírgula. Exemplo: ${example}.`; return null; }
  if (p.n < min || p.n > max) { errors[key] = `${label}: informe um valor entre ${thousands(min)} e ${thousands(max)} ${key.endsWith('kcal') ? 'kcal' : 'g'}.`; return null; }
  return p.n;
 };
 const days = {} as DietTargets['days'];
 for (const t of DAY_TYPES) {
  const row = input.days?.[t];
  const kcal = readInt(`days.${t}.kcal`, 'Calorias', row?.kcal, LIMITS.kcal.min, LIMITS.kcal.max, '2450');
  const carbs = readInt(`days.${t}.carbs`, 'Carboidrato', row?.carbs, LIMITS.carbs.min, LIMITS.carbs.max, '305');
  days[t] = { kcal: kcal ?? 0, carbs: carbs ?? 0 };
 }
 // Esporte (ADR 008) é opcional: só entra se veio no formulário; ausente = usa o dia de vôlei.
 const sport = input.days?.esporte;
 if (sport !== undefined && sport !== null) {
  const kcal = readInt('days.esporte.kcal', 'Calorias', sport.kcal, LIMITS.kcal.min, LIMITS.kcal.max, '2500');
  const carbs = readInt('days.esporte.carbs', 'Carboidrato', sport.carbs, LIMITS.carbs.min, LIMITS.carbs.max, '315');
  days.esporte = { kcal: kcal ?? 0, carbs: carbs ?? 0 };
 }
 let proteinG: number | null = null;
 if (!(isEmpty(input.proteinG) || input.proteinG === 'auto')) proteinG = readInt('proteinG', 'Proteína', input.proteinG, LIMITS.protein.min, LIMITS.protein.max, '185');
 const manualProtein = !(isEmpty(input.proteinG) || input.proteinG === 'auto');
 const fatG = readInt('fatG', 'Gordura', input.fatG, LIMITS.fat.min, LIMITS.fat.max, '55');

 let waterL: number | null = null;
 const w = parseField(input.waterL, true);
 if (w.kind === 'empty') errors.waterL = 'Água: preencha este campo.';
 else if (w.kind === 'text') errors.waterL = 'Água: use só números.';
 else if (w.kind === 'ok') {
  if (w.n < LIMITS.water.min || w.n > LIMITS.water.max) errors.waterL = `Água: informe um valor entre ${LIMITS.water.min} e ${LIMITS.water.max} L.`;
  else if (!Number.isInteger(w.n / LIMITS.water.step)) errors.waterL = 'Água: use valores de 0,5 em 0,5 L. Exemplo: 3 ou 3,5.';
  else waterL = w.n;
 }

 if (Object.keys(errors).length) return { ok: false, errors };
 const fat = fatG as number;
 const water = waterL as number;
 const weight = ctx.weightKg;
 const weightOk = typeof weight === 'number' && Number.isFinite(weight) && weight >= 30 && weight <= 300;
 const effectiveProtein = proteinG ?? proteinTargetG(weight);

 for (const t of ALL_DAY_TYPES) {
  const row = days[t as DayType] as DayRow | undefined;
  if (!row) continue;
  const { kcal, carbs } = row;
  if (kcal < WARN.kcalLow) warnings.push({ code: 'kcal-baixa', day: t, message: 'Calorias abaixo de 1.400 kcal por dia costumam pedir acompanhamento profissional. Converse com um nutricionista ou médico antes de seguir.' });
  if (kcal > WARN.kcalHigh) warnings.push({ code: 'kcal-alta', day: t, message: 'Calorias acima de 4.500 kcal por dia são incomuns. Confira se o valor está certo.' });
  const sum = kcalFromMacros(effectiveProtein, carbs, fat);
  if (Math.abs(sum - kcal) > macroTolerance(kcal)) warnings.push({ code: 'macros-incoerentes', day: t, message: `Proteína, carboidrato e gordura somam cerca de ${thousands(sum)} kcal, diferente das calorias informadas (${thousands(kcal)} kcal). Você pode salvar assim.` });
 }
 if (manualProtein && weightOk) {
  if (10 * (proteinG as number) < 8 * (weight as number)) warnings.push({ code: 'proteina-baixa', message: 'Proteína abaixo de 0,8 g por kg do seu peso. Confira se o valor está certo.' });
  if ((proteinG as number) > 3 * (weight as number)) warnings.push({ code: 'proteina-alta', message: 'Proteína acima de 3,0 g por kg do seu peso. Se você tem doença nos rins ou outra condição, converse com um médico ou nutricionista.' });
 }
 if (fat < WARN.fatLow) warnings.push({ code: 'gordura-baixa', message: 'Gordura abaixo de 30 g por dia. Peça orientação a um nutricionista antes de manter uma meta tão baixa.' });
 if (water > WARN.waterHigh) warnings.push({ code: 'agua-alta', message: 'Mais de 5 L de água por dia é muito. Se sentir mal-estar, procure um profissional de saúde.' });
 return { ok: true, value: { days, proteinG, fatG: fat, waterL: water }, warnings };
}

/** Valores do formulário (texto) a partir de metas salvas; proteína automática = ''. */
export function targetsToInput(t: DietTargets): { days: Record<DayType, { kcal: string; carbs: string }> & { esporte?: { kcal: string; carbs: string } }; proteinAuto: boolean; proteinG: string; fatG: string; waterL: string } {
 const days = {} as Record<DayType, { kcal: string; carbs: string }> & { esporte?: { kcal: string; carbs: string } };
 for (const d of DAY_TYPES) days[d] = { kcal: String(t.days[d].kcal), carbs: String(t.days[d].carbs) };
 if (t.days.esporte) days.esporte = { kcal: String(t.days.esporte.kcal), carbs: String(t.days.esporte.carbs) };
 return { days, proteinAuto: t.proteinG === null, proteinG: t.proteinG === null ? '' : String(t.proteinG), fatG: String(t.fatG), waterL: String(t.waterL).replace('.', ',') };
}

// ---------- validação estrita do formato salvo ----------
const int = (v: unknown, min: number, max: number) => typeof v === 'number' && Number.isSafeInteger(v) && v >= min && v <= max;
function civilOk(v: unknown): v is string {
 if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
 const d = new Date(`${v}T12:00:00Z`);
 return Number.isFinite(d.getTime()) && d.toISOString().slice(0, 10) === v;
}
const plain = (v: unknown): v is Record<string, unknown> => v !== null && typeof v === 'object' && !Array.isArray(v);

export function isValidDietTargets(t: unknown): t is DietTargets {
 if (!plain(t) || !plain(t.days)) return false;
 for (const d of DAY_TYPES) {
  const row = t.days[d];
  if (!plain(row) || !int(row.kcal, LIMITS.kcal.min, LIMITS.kcal.max) || !int(row.carbs, LIMITS.carbs.min, LIMITS.carbs.max)) return false;
 }
 const sport = t.days.esporte;
 if (sport !== undefined && (!plain(sport) || !int(sport.kcal, LIMITS.kcal.min, LIMITS.kcal.max) || !int(sport.carbs, LIMITS.carbs.min, LIMITS.carbs.max))) return false; if (t.proteinG !== null && !int(t.proteinG, LIMITS.protein.min, LIMITS.protein.max)) return false;
 if (!int(t.fatG, LIMITS.fat.min, LIMITS.fat.max)) return false;
 return typeof t.waterL === 'number' && Number.isFinite(t.waterL) && t.waterL >= LIMITS.water.min && t.waterL <= LIMITS.water.max && Number.isInteger(t.waterL / LIMITS.water.step);
}

/** Valida `settings.dietTargets` salvo ou importado (schema 1, até 100 versões, `from` estritamente crescente). */
export function isValidDietTargetsSetting(s: unknown): s is DietTargetsSetting {
 if (!plain(s) || s.schema !== DIET_TARGETS_SCHEMA || !Array.isArray(s.versions) || s.versions.length > MAX_DIET_TARGET_VERSIONS) return false;
 let last = '';
 for (const v of s.versions) {
  if (!plain(v) || !civilOk(v.from) || v.from <= last) return false;
  if (v.targets !== null && !isValidDietTargets(v.targets)) return false;
  last = v.from;
 }
 return true;
}

// ---------- resolução por data ----------
type SettingsLike = { dietTargets?: unknown; profile?: { weightKg?: number } | null } | null | undefined;

function versionsOf(settings: SettingsLike): DietTargetsVersion[] {
 const s = settings?.dietTargets;
 return plain(s) && s.schema === DIET_TARGETS_SCHEMA && Array.isArray(s.versions) ? (s.versions as DietTargetsVersion[]) : [];
}
function versionFor(settings: SettingsLike, date: DayIso): DietTargetsVersion | undefined {
 let found: DietTargetsVersion | undefined;
 for (const v of versionsOf(settings)) if (typeof v?.from === 'string' && v.from <= date && (!found || v.from >= found.from)) found = v;
 return found;
}

/** Metas editáveis em vigor no dia (padrão de exemplo quando não há versão vigente). */
export function effectiveDietTargets(settings: SettingsLike, date: DayIso): DietTargets {
 const v = versionFor(settings, date);
 return v?.targets ? v.targets : defaultDietTargets();
}

/** kcal e carboidrato de um tipo de dia. Esporte sem valor próprio usa o de vôlei (mesmo padrão da especificação). */
export function dayRowFor(days: DietTargetDays, type: AnyDayType): DayRow {
 if (type === 'esporte') return days.esporte ?? days.volei;
 return days[type] ?? days.academia;
}

export interface ResolvedDietTargets {
 days: DietTargetDays;
 protein: number;
 proteinAuto: boolean;
 fat: number;
 waterL: number;
 isExample: boolean;
}
export function resolveDietTargets(settings: SettingsLike, date: DayIso, profile?: { weightKg?: number } | null): ResolvedDietTargets {
 const v = versionFor(settings, date);
 const t = effectiveDietTargets(settings, date);
 const p = profile === undefined ? settings?.profile : profile;
 return {
  days: t.days, protein: t.proteinG ?? proteinTargetG(p?.weightKg), proteinAuto: t.proteinG === null,
  fat: t.fatG, waterL: t.waterL, isExample: !v?.targets
 };
}

/** Meta completa do dia (compatível com `DayTarget`). Sem `dietTargets` devolve exatamente o padrão de `dayTargetForProfile`. */
export function dayTargetFor(type: AnyDayType, date: DayIso, settings: SettingsLike, profile?: { weightKg?: number } | null): DayTarget {
 const r = resolveDietTargets(settings, date, profile);
 const d = dayRowFor(r.days, type);
 return dayTarget(type, { kcal: d.kcal, carbs: d.carbs, protein: r.protein, fat: r.fat, waterL: r.waterL });
}

/** "Meta de exemplo": nada salvo ou a versão mais recente (qualquer data) é o padrão restaurado. */
export function isExampleTarget(settings: SettingsLike): boolean {
 const vs = versionsOf(settings);
 return vs.length === 0 || vs[vs.length - 1].targets === null;
}

// ---------- histórico de versões ----------
export function pushDietTargetsVersion(versions: readonly DietTargetsVersion[], today: DayIso, targets: DietTargets | null): DietTargetsVersion[] {
 const list = versions.map(v => ({ from: v.from, targets: v.targets }));
 const last = list[list.length - 1];
 const from = last && today < last.from ? last.from : today; // relógio voltou: mantém a lista ordenada
 const entry: DietTargetsVersion = { from, targets: targets ? structuredClone(targets) : null };
 if (last && last.from === from) list[list.length - 1] = entry; else list.push(entry);
 if (list.length > MAX_DIET_TARGET_VERSIONS) { list.shift(); list[0] = { ...list[0], from: OLDEST_VERSION_FROM }; }
 return list;
}

/**
 * Novo valor de `settings.dietTargets` com uma versão a partir de `today`.
 * `previous` é o valor atual (guarde-o para desfazer). `targets: null` = restaurar padrão.
 */
export function withDietTargetsVersion(current: unknown, today: DayIso, targets: DietTargets | null): DietTargetsSetting {
 const versions = plain(current) && Array.isArray(current.versions) ? (current.versions as DietTargetsVersion[]) : [];
 return { schema: DIET_TARGETS_SCHEMA, versions: pushDietTargetsVersion(versions, today, targets) };
}

/** "Usar esta meta": confirma o padrão de exemplo sem alterar números (proteína automática). */
export const confirmExampleVersion = (current: unknown, today: DayIso): DietTargetsSetting => withDietTargetsVersion(current, today, defaultDietTargets());
/** "Restaurar padrão": versão com `targets: null`, mantendo o histórico. */
export const restoreDefaultVersion = (current: unknown, today: DayIso): DietTargetsSetting => withDietTargetsVersion(current, today, null);

/** Devolve `settings` com `dietTargets` trocado (ou removido, se `undefined`). Use para salvar e para desfazer. */
export function settingsWithDietTargets<S extends { dietTargets?: unknown }>(settings: S, value: DietTargetsSetting | undefined): S {
 const next = { ...settings };
 if (value === undefined) delete next.dietTargets; else next.dietTargets = value;
 return next;
}
