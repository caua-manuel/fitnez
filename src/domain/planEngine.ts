import type { Exercise } from '../application/repository';
import { BIG_GROUPS, GROUP_RANGES } from './weeklySets';
import type { MuscleGroup } from './muscleGroups';
import type { Duration, Experience, Goal, Place } from './onboarding';

// Motor do plano do assistente (ADR 015). Regras puras: escolhe os exercícios de cada treino, calcula as séries por
// exercício para cada grupo ficar na faixa semanal e confere o tempo. Sem interface e sem acesso a dados.
// Contrato de conteúdo: docs/handoffs/conteudo-volume-assistente-v2.md. Todos os números: a verificar.

// ---------- respostas novas (só em memória, como o passo 0: nada disso entra em StoredAnswers) ----------
export type Equipment = 'halteres' | 'elastico' | 'barra_fixa' | 'banco';
export const EQUIPMENT: readonly Equipment[] = ['halteres', 'elastico', 'barra_fixa', 'banco'];
export type PainRegion = 'ombro' | 'joelho' | 'lombar' | 'punho_cotovelo' | 'quadril';
export const PAIN_REGIONS: readonly PainRegion[] = ['ombro', 'joelho', 'lombar', 'punho_cotovelo', 'quadril'];
export type Priority = 'equilibrado' | 'peito' | 'costas' | 'ombros' | 'bracos' | 'gluteos' | 'pernas';
export const PRIORITIES: readonly Priority[] = ['equilibrado', 'peito', 'costas', 'ombros', 'bracos', 'gluteos', 'pernas'];
/** Equipamento padrão de quem não marcou nada: casa com equipamento = halteres e elástico (como antes); casa livre = nenhum. */
export const DEFAULT_EQUIPMENT: Readonly<Record<Place, readonly Equipment[]>> = { academia: [], casa_equip: ['halteres', 'elastico'], casa_livre: [] };

export type SessionKey = 'CIA' | 'CIB' | 'SUPA' | 'SUPB' | 'PERA' | 'PERB' | 'EMP' | 'EMP2' | 'PUX' | 'PUX2';
export type SlotKey = 'SQ' | 'UNI' | 'HIP' | 'POST' | 'CALF' | 'PH' | 'PI' | 'PV' | 'PUV' | 'PUH' | 'PUH2' | 'FLY' | 'LAT' | 'RDLT' | 'BIC' | 'TRI' | 'CORE' | 'CORE2';
export type Role = 'principal' | 'acessorio' | 'core';

// ---------- números de conteúdo (conteudo-volume-assistente-v2.md; a verificar) ----------
/** Posição dentro da faixa de séries semanais (0 = mínimo, 1 = máximo), por objetivo. */
export const GOAL_POSITION: Readonly<Record<Goal, number>> = { saude: 0, perder: 0.33, recomp: 0.5, massa: 1 };
/** Séries a mais por grupo da opção de prioridade, por experiência (soma de 2, 3 e 4; handoff seção 4). */
export const PRIORITY_BONUS: Readonly<Record<Priority, Readonly<Record<Experience, Partial<Record<MuscleGroup, number>>>>>> = {
 equilibrado: { nunca: {}, iniciante: {}, intermediario: {} },
 peito: { nunca: { peito: 2 }, iniciante: { peito: 3 }, intermediario: { peito: 4 } },
 costas: { nunca: { costas: 2 }, iniciante: { costas: 3 }, intermediario: { costas: 4 } },
 ombros: { nunca: { 'ombro-lateral': 1, 'ombro-posterior': 1 }, iniciante: { 'ombro-lateral': 1, 'ombro-posterior': 1, press: 1 }, intermediario: { 'ombro-lateral': 2, 'ombro-posterior': 1, press: 1 } },
 bracos: { nunca: { biceps: 1, triceps: 1 }, iniciante: { biceps: 2, triceps: 1 }, intermediario: { biceps: 2, triceps: 2 } },
 gluteos: { nunca: { 'posterior-gluteos': 2 }, iniciante: { 'posterior-gluteos': 3 }, intermediario: { 'posterior-gluteos': 4 } },
 pernas: { nunca: { quadriceps: 1, 'posterior-gluteos': 1 }, iniciante: { quadriceps: 2, 'posterior-gluteos': 1 }, intermediario: { quadriceps: 2, 'posterior-gluteos': 2 } }
};
/** Quanto o grupo prioritário pode passar do máximo da faixa, por experiência (sem excesso quando o objetivo efetivo é perder). */
export const PRIORITY_OVER_MAX: Readonly<Record<Experience, number>> = { nunca: 0, iniciante: 1, intermediario: 2 };
export const PRIORITY_GROUPS: Readonly<Record<Priority, readonly MuscleGroup[]>> = {
 equilibrado: [], peito: ['peito'], costas: ['costas'], ombros: ['ombro-lateral', 'ombro-posterior', 'press'], bracos: ['biceps', 'triceps'], gluteos: ['posterior-gluteos'], pernas: ['quadriceps', 'posterior-gluteos']
};

export const VOLUME: Readonly<Record<Experience, { ps: number[]; pr: string[]; as: number[]; ar: string[]; prest: number; arest: number }>> = {
 nunca: { ps: [2, 3, 3], pr: ['10–12', '8–12', '8–12'], as: [2, 2, 3], ar: ['12–15', '12–15', '10–15'], prest: 120, arest: 60 },
 iniciante: { ps: [3, 3, 4], pr: ['8–12', '8–10', '6–10'], as: [2, 3, 3], ar: ['12–15', '10–15', '10–12'], prest: 120, arest: 60 },
 intermediario: { ps: [3, 4, 4], pr: ['6–10', '6–8', '5–8'], as: [3, 3, 4], ar: ['10–12', '10–12', '8–12'], prest: 150, arest: 60 }
};
export const CORE_REST = 45;
/** Descanso do exercício principal sem carga (rep, s e carga limitada): ADR 012, a verificar. */
export const NO_LOAD_PRINCIPAL_REST = 90;
/** Carga limitada: mantém as repetições do catálogo mesmo medido em kg (a mochila não comporta 5–8 repetições). */
export const LOAD_LIMITED: ReadonlySet<string> = new Set(['remada_mochila']);
/** Exercícios por treino (mínimo de 5 em todos os tempos; o curto não passa disso). */
export const SLOT_COUNT: Readonly<Record<Duration, number>> = { curto: 5, medio: 6, longo: 8 };
export const MIN_EXERCISES = 5;
/** Máximo e mínimo em minutos prometidos por tempo (DURATION_TEXT). */
export const DURATION_MAX_MIN: Readonly<Record<Duration, number>> = { curto: 45, medio: 60, longo: 90 };
export const DURATION_MIN_MIN: Readonly<Record<Duration, number>> = { curto: 30, medio: 45, longo: 60 };
/** Modelo de tempo: aquecimento geral, execução de cada série, troca entre exercícios e aquecimento específico dos compostos com carga. */
export const TIME = { warmupMin: 5, setSec: 40, setSecUnilateral: 80, transitionSecGym: 60, transitionSecHome: 45, approachSetSec: 75 } as const;
/** Séries por exercício no bloco 1: de 2 até o teto da experiência (principal, acessório, core). */
const CAPS: Readonly<Record<Experience, { principal: number; acessorio: number; core: number }>> = {
 nunca: { principal: 3, acessorio: 3, core: 3 },
 iniciante: { principal: 4, acessorio: 3, core: 3 },
 intermediario: { principal: 5, acessorio: 4, core: 4 }
};
const MIN_SETS = 2;

// ---------- grupos, exercícios e equipamento ----------
const SLOT_GROUP: Readonly<Record<SlotKey, MuscleGroup>> = {
 SQ: 'quadriceps', UNI: 'quadriceps', HIP: 'posterior-gluteos', POST: 'posterior-gluteos', CALF: 'panturrilha', PH: 'peito', PI: 'peito', PV: 'press', PUV: 'costas', PUH: 'costas', PUH2: 'costas',
 FLY: 'peito', LAT: 'ombro-lateral', RDLT: 'ombro-posterior', BIC: 'biceps', TRI: 'triceps', CORE: 'core', CORE2: 'core'
};
const PRINCIPAL_SLOTS: ReadonlySet<SlotKey> = new Set(['SQ', 'HIP', 'PH', 'PI', 'PV', 'PUV', 'PUH', 'PUH2']);
/** Exercícios de um músculo só ou de articulação única: vêm depois dos compostos. */
const ISOLATION_IDS: ReadonlySet<string> = new Set(['mesa', 'nordic', 'cruc', 'lat_a', 'lat_b', 'lat_elastico', 'face', 'face_elastico', 'inverso', 'ytw', 'rosca_a', 'rosca_b', 'rosca_elastico', 'tri_a', 'tri_b', 'pant_pe', 'pant_sent', 'pant_degrau']);
const CORE_IDS: ReadonlySet<string> = new Set(['pallof', 'deadbug', 'prancha', 'joelhos', 'roll', 'med']);
export const isIsolation = (id: string): boolean => ISOLATION_IDS.has(id);
export const isCoreId = (id: string): boolean => CORE_IDS.has(id);
/** 0 = composto, 1 = isolador, 2 = core (sempre por último). */
export const orderClass = (id: string): number => (isCoreId(id) ? 2 : isIsolation(id) ? 1 : 0);

/** Alternativas por vaga e local, da preferida para a última. Filtradas por `usable`. */
const ALT: Readonly<Record<SlotKey, Readonly<Record<Place, readonly string[]>>>> = {
 SQ: { academia: ['agach', 'leg', 'goblet'], casa_equip: ['goblet', 'agach_livre', 'sentar_levantar'], casa_livre: ['agach_livre', 'sentar_levantar'] },
 UNI: { academia: ['bulg', 'afundo'], casa_equip: ['bulg', 'afundo_livre', 'afundo'], casa_livre: ['afundo_livre'] },
 HIP: { academia: ['hip_b', 'ponte_h', 'ponte_uni', 'ponte'], casa_equip: ['ponte_h', 'ponte_uni', 'ponte'], casa_livre: ['ponte_uni', 'ponte'] },
 POST: { academia: ['stiff', 'mesa'], casa_equip: ['stiff', 'stiff_uni'], casa_livre: ['stiff_uni'] },
 CALF: { academia: ['pant_pe', 'pant_sent'], casa_equip: ['pant_degrau', 'pant_sent'], casa_livre: ['pant_degrau'] },
 PH: { academia: ['supino', 'supino_chao', 'flexao'], casa_equip: ['supino_chao', 'flexao'], casa_livre: ['flexao'] },
 PI: { academia: ['inclinado', 'supino', 'flexao'], casa_equip: ['supino_chao', 'flexao'], casa_livre: ['flexao'] },
 PV: { academia: ['press_b', 'press_a', 'pike'], casa_equip: ['press_b', 'pike'], casa_livre: ['pike'] },
 PUV: { academia: ['puxada', 'barra'], casa_equip: ['puxada_elastico', 'barra', 'remada_b', 'remada_mochila'], casa_livre: ['puxada_elastico', 'barra', 'remada_mochila'] },
 PUH: { academia: ['remada_b', 'remada_a'], casa_equip: ['remada_b', 'remada_a', 'remada_mochila'], casa_livre: ['remada_mochila'] },
 PUH2: { academia: ['remada_a'], casa_equip: ['remada_a'], casa_livre: [] },
 FLY: { academia: ['cruc'], casa_equip: [], casa_livre: [] },
 LAT: { academia: ['lat_a', 'lat_b'], casa_equip: ['lat_a', 'lat_elastico'], casa_livre: ['lat_elastico'] },
 RDLT: { academia: ['face', 'inverso', 'face_elastico'], casa_equip: ['face_elastico', 'inverso', 'ytw'], casa_livre: ['ytw', 'face_elastico'] },
 BIC: { academia: ['rosca_a', 'rosca_b'], casa_equip: ['rosca_a', 'rosca_elastico', 'rosca_b'], casa_livre: ['rosca_elastico'] },
 TRI: { academia: ['tri_a', 'tri_b', 'flexao_fechada'], casa_equip: ['tri_b', 'flexao_fechada'], casa_livre: ['flexao_fechada'] },
 CORE: { academia: ['pallof', 'deadbug', 'prancha'], casa_equip: ['deadbug', 'prancha'], casa_livre: ['deadbug', 'prancha'] },
 CORE2: { academia: ['prancha', 'deadbug', 'pallof'], casa_equip: ['prancha', 'deadbug'], casa_livre: ['prancha', 'deadbug'] }
};
/** Equipamento que o exercício pede em casa (na academia tudo existe). Sem entrada: só o corpo. */
const NEEDS: Readonly<Record<string, readonly Equipment[]>> = {
 supino_chao: ['halteres'], remada_b: ['halteres'], remada_a: ['halteres'], puxada_elastico: ['elastico'], barra: ['barra_fixa'], face_elastico: ['elastico'], inverso: ['halteres'],
 rosca_a: ['halteres'], rosca_b: ['halteres'], rosca_elastico: ['elastico'], lat_a: ['halteres'], lat_elastico: ['elastico'], tri_b: ['halteres'], press_b: ['halteres'],
 goblet: ['halteres'], ponte_h: ['halteres'], bulg: ['halteres'], stiff: ['halteres'], pant_sent: ['halteres']
};
/** Fora para quem nunca treinou e para iniciante (técnica ou impacto): mesma lista da troca de exercício. */
const BEGINNER_OUT: ReadonlySet<string> = new Set(['nordic', 'roll', 'med', 'barra', 'remada_a']);

/** Todas as IDs que o assistente pode usar (todas precisam existir no catálogo e no guia). */
export const ENGINE_EXERCISE_IDS: readonly string[] = [...new Set((Object.values(ALT) as Array<Record<Place, readonly string[]>>).flatMap(p => [...p.academia, ...p.casa_equip, ...p.casa_livre]))].sort();

export interface PickContext {
 place: Place;
 /** Experiência para escolher exercícios (já com as regras de menor de 18, condição de saúde e 60+). */
 exp: Experience;
 older: boolean;
 conservative: boolean;
 equipment: ReadonlySet<Equipment>;
 /** IDs a evitar (dor por região). */
 avoid: ReadonlySet<string>;
 /** Dor no quadril: o agachamento bilateral sai na ordem de menor exigência (handoff 2.1). */
 hipPain?: boolean;
}

/** O exercício serve para esta pessoa? (experiência, idade, condição, equipamento e dor). */
export function usable(id: string, c: PickContext): boolean {
 if (c.avoid.has(id)) return false;
 const beginner = c.exp === 'nunca' || c.exp === 'iniciante';
 if (beginner && BEGINNER_OUT.has(id)) return false;
 if (c.place === 'academia') {
  if (c.exp !== 'intermediario' && (id === 'bulg' || id === 'stiff')) return false;
  if (c.exp === 'nunca' && id === 'agach') return false;
 }
 if ((c.exp === 'nunca' || c.older) && id === 'ponte_uni') return false;
 if (c.older && (id === 'stiff_uni' || id === 'agach_livre')) return false;
 if ((c.older || c.conservative) && id === 'pike') return false;
 if (c.conservative && id === 'hip_b') return false;
 if (c.place !== 'academia') for (const need of NEEDS[id] ?? []) if (!c.equipment.has(need)) return false;
 return true;
}

/** Escolhe o exercício da vaga: a primeira alternativa usável que ainda não está no dia. `offset` 1 gira a lista (treino B). */
export function pickForSlot(slot: SlotKey, c: PickContext, used: ReadonlySet<string>, offset = 0): string | null {
 let list = ALT[slot][c.place].filter(id => usable(id, c));
 if (slot === 'SQ' && c.hipPain) { const order = ['leg', 'goblet', 'sentar_levantar', 'agach_livre', 'agach']; list = [...list].sort((x, y) => order.indexOf(x) - order.indexOf(y)); }
 const shift = list.length > 1 ? offset % list.length : 0;
 const rotated = shift ? [...list.slice(shift), ...list.slice(0, shift)] : list;
 return rotated.find(id => !used.has(id)) ?? null;
}

// ---------- treinos ----------
interface SlotRef { k: SlotKey; o: number }
const s = (k: SlotKey, o = 0): SlotRef => ({ k, o });
export interface SessionTemplate { name: string; sub: string; full: boolean; slots: readonly SlotRef[] }
export const SESSION_TEMPLATES: Readonly<Record<SessionKey, SessionTemplate>> = {
 CIA: { name: 'Corpo inteiro A', sub: 'Pernas, peito, costas e abdômen', full: true, slots: [s('SQ'), s('PH'), s('PUV'), s('HIP'), s('LAT'), s('BIC'), s('CALF'), s('CORE')] },
 CIB: { name: 'Corpo inteiro B', sub: 'Pernas, ombros, costas e abdômen', full: true, slots: [s('POST'), s('PV'), s('PUH'), s('UNI'), s('PI'), s('RDLT'), s('TRI'), s('CALF', 1), s('CORE', 1)] },
 SUPA: { name: 'Superior A', sub: 'Peito, costas, ombros e braços', full: false, slots: [s('PH'), s('PUV'), s('PV'), s('PUH'), s('LAT'), s('BIC'), s('TRI'), s('RDLT')] },
 SUPB: { name: 'Superior B', sub: 'Costas, peito, ombros e braços', full: false, slots: [s('PUH', 1), s('PI'), s('PUV', 1), s('PV', 1), s('RDLT'), s('TRI', 1), s('BIC', 1), s('LAT', 1)] },
 PERA: { name: 'Pernas A', sub: 'Pernas, glúteos e abdômen', full: false, slots: [s('SQ'), s('HIP'), s('UNI'), s('POST'), s('CALF'), s('CORE'), s('CORE2')] },
 PERB: { name: 'Pernas B', sub: 'Pernas, glúteos e abdômen', full: false, slots: [s('SQ', 1), s('HIP', 1), s('UNI', 1), s('POST', 1), s('CALF', 1), s('CORE', 1), s('CORE2', 1)] },
 EMP: { name: 'Empurrar', sub: 'Peito, ombros e tríceps', full: false, slots: [s('PH'), s('PI'), s('PV'), s('LAT'), s('TRI'), s('CORE')] },
 EMP2: { name: 'Empurrar B', sub: 'Peito, ombros e tríceps', full: false, slots: [s('PI'), s('FLY'), s('PV', 1), s('LAT', 1), s('TRI', 1), s('CORE', 1)] },
 PUX: { name: 'Puxar', sub: 'Costas, ombros, bíceps e abdômen', full: false, slots: [s('PUV'), s('PUH'), s('PUH2'), s('RDLT'), s('BIC'), s('CORE2'), s('CORE')] },
 PUX2: { name: 'Puxar B', sub: 'Costas, ombros, bíceps e abdômen', full: false, slots: [s('PUV', 1), s('PUH', 2), s('RDLT', 1), s('BIC', 1), s('CORE', 1), s('CORE2', 1)] }
};
/** Vagas de reforço quando o treino fica com menos de 5 exercícios por falta de equipamento. */
const FILLERS: readonly SlotKey[] = ['CORE', 'CORE2', 'CALF'];
/** Ordem de preferência dos isoladores quando o treino não comporta todos (a rotação entre dias usa a cobertura primeiro). */
const ISO_ORDER: readonly SlotKey[] = ['LAT', 'RDLT', 'TRI', 'BIC', 'CALF', 'FLY', 'CORE', 'CORE2'];

export interface PlanNote {
 kind: 'sem_equipamento' | 'dor' | 'treino_curto';
 /** `sem_equipamento`: o grupo que não dá para treinar. */
 group?: MuscleGroup;
 /** `dor`: região, exercício que sairia e o que entrou (null = sem troca possível). */
 region?: PainRegion;
 from?: string;
 to?: string | null;
 /** `treino_curto`: a chave do treino que ficou com menos de 5 exercícios. */
 session?: SessionKey;
}

export interface EngineInput {
 split: readonly SessionKey[];
 place: Place;
 /** Experiência para escolher exercícios. */
 exp: Experience;
 /** Experiência para o volume (iniciante quando não treinou nos últimos 3 meses). */
 volExp: Experience;
 older: boolean;
 conservative: boolean;
 equipment: readonly Equipment[];
 /** Cada região já resolvida em IDs a evitar. */
 painAvoid: ReadonlyArray<{ region: PainRegion; ids: readonly string[] }>;
 duration: Duration;
 goal: Goal;
 priority: Priority;
 /** Número final de treinos da semana (a regra de 2 dias usa). */
 days: number;
 catalog: Readonly<Record<string, Exercise>>;
}

export interface EngineResult {
 /** IDs por treino, na ordem final (compostos, isoladores, core). */
 sessions: Record<string, string[]>;
 /** Séries do bloco 1 por exercício. */
 sets: Record<string, number>;
 roles: Record<string, Role>;
 groups: Record<string, MuscleGroup>;
 weekly: Partial<Record<MuscleGroup, number>>;
 minutes: Record<string, number>;
 notes: PlanNote[];
 /** Treinos que passaram do tempo mesmo no mínimo possível. */
 overBudget: string[];
 /** Como as séries crescem nos blocos 2 e 3 (o encaixe no tempo pode deixar os acessórios, ou todos, sem crescimento). */
 growth: Growth;
}

interface Entry { slot: SlotKey; id: string; group: MuscleGroup }

const isBig = (g: MuscleGroup) => BIG_GROUPS.includes(g);
function rangeOf(g: MuscleGroup, volExp: Experience): [number, number] | null {
 const r = GROUP_RANGES[volExp];
 if (isBig(g)) return r.big;
 return g === 'core' ? null : r.small;
}

const isCoreSlot = (slot: SlotKey) => slot === 'CORE' || slot === 'CORE2';
export function roleOf(slot: SlotKey): Role { return isCoreSlot(slot) ? 'core' : PRINCIPAL_SLOTS.has(slot) ? 'principal' : 'acessorio'; }

/** Séries por bloco a partir das séries do bloco 1 (mesma progressão das tabelas de VOLUME). */
export type Growth = 'normal' | 'acessorios' | 'todos';
export function setsPattern(volExp: Experience, role: Role, first: number, growth: Growth = 'normal'): number[] {
 // Encaixe no tempo (handoff 6.1): primeiro os acessórios deixam de ganhar série nos blocos 2 e 3, depois os principais.
 if (growth === 'todos' || (growth === 'acessorios' && role !== 'principal')) return [first, first, first];
 const base = role === 'principal' ? VOLUME[volExp].ps : VOLUME[volExp].as;
 return [first, Math.min(6, first + base[1] - base[0]), Math.min(6, first + base[2] - base[0])];
}

/** Descanso dos principais com carga por tempo (handoff seção 6.1, a verificar): curto 90 s, médio 120 s, longo como a experiência. */
const LOADED_PRINCIPAL_REST_CAP: Readonly<Record<Duration, number>> = { curto: 90, medio: 120, longo: 999 };
export function restFor(id: string, base: Exercise, role: Role, volExp: Experience, duration: Duration): number {
 const vol = VOLUME[volExp];
 if (role === 'core') return CORE_REST;
 if (role === 'acessorio') return vol.arest;
 const keepCatalogReps = !(base.m === 'kg' || base.m === 'bw') || LOAD_LIMITED.has(id);
 return keepCatalogReps ? NO_LOAD_PRINCIPAL_REST : Math.min(vol.prest, LOADED_PRINCIPAL_REST_CAP[duration]);
}

/**
 * Minutos estimados do treino (handoff seção 6.1): aquecimento geral, aproximação nos principais com carga (2 séries no primeiro,
 * 1 nos demais), séries com descanso entre elas e troca entre exercícios. Usa o bloco mais pesado.
 */
export function estimateMinutes(ids: readonly string[], sets: Readonly<Record<string, number>>, roles: Readonly<Record<string, Role>>, catalog: Readonly<Record<string, Exercise>>, volExp: Experience, duration: Duration, place: Place, growth: Growth = 'normal'): number {
 let sec = TIME.warmupMin * 60;
 let firstLoaded = true;
 for (const id of ids) {
  const base = catalog[id];
  const role = roles[id] ?? 'acessorio';
  const rest = base ? restFor(id, base, role, volExp, duration) : 60;
  const first = sets[id] ?? 2;
  const s = Math.max(...setsPattern(volExp, role, first, growth));
  const unilateral = !!base && /spor (lado|perna)s*$/.test(String(base.r[0] ?? ''));
  sec += s * (unilateral ? TIME.setSecUnilateral : TIME.setSec) + (s - 1) * rest + (place === 'academia' ? TIME.transitionSecGym : TIME.transitionSecHome);
  if (role === 'principal' && base && base.m === 'kg') { sec += (firstLoaded ? 2 : 1) * TIME.approachSetSec; firstLoaded = false; }
 }
 return Math.ceil(sec / 60);
}

// ---------- montagem ----------
export function buildEngine(input: EngineInput): EngineResult {
 const equipment = new Set<Equipment>(input.equipment);
 const base: PickContext = { place: input.place, exp: input.exp, older: input.older, conservative: input.conservative, equipment, avoid: new Set() };
 const ctx: PickContext = { ...base, avoid: new Set(input.painAvoid.flatMap(p => p.ids)), hipPain: input.painAvoid.some(p => p.region === 'quadril') };
 const limit = SLOT_COUNT[input.duration];
 const prioGroups = new Set(PRIORITY_GROUPS[input.priority]);
 const notes: PlanNote[] = [];
 const distinct = [...new Set(input.split)];
 const cover = new Map<MuscleGroup, number>();
 const sessions: Record<string, Entry[]> = {};
 const missingEquip = new Set<MuscleGroup>();
 const covered = new Set<MuscleGroup>();

 for (const key of distinct) {
  const entries: Entry[] = [];
  const used = new Set<string>();
  const usedBase = new Set<string>();
  for (const { k, o } of SESSION_TEMPLATES[key].slots) {
   const g = SLOT_GROUP[k];
   const wanted = pickForSlot(k, base, usedBase, o);
   if (wanted) usedBase.add(wanted);
   const id = pickForSlot(k, ctx, used, o);
   if (id) { used.add(id); entries.push({ slot: k, id, group: g }); }
   // Troca por dor: só o exercício que sairia por causa da região, e o que entrou no lugar (null = sem troca possível).
   if (wanted && id !== wanted) {
    const region = input.painAvoid.find(p => p.ids.includes(wanted))?.region;
    if (region && !notes.some(n => n.kind === 'dor' && n.from === wanted && n.region === region)) notes.push({ kind: 'dor', region, from: wanted, to: id });
   }
   // A vaga existe neste local mas nada serve (falta equipamento): o grupo só vira aviso se nenhum treino o cobrir.
   if (!wanted && ALT[k][input.place].length > 0) missingEquip.add(g);
  }
  // Sem espaço para tudo: os compostos ficam; dos isoladores entram os do grupo menos coberto na semana (rodízio entre os dias).
  const comps = entries.filter(e => orderClass(e.id) === 0);
  const rest = entries.filter(e => orderClass(e.id) !== 0);
  const keepComps = comps.slice(0, limit);
  const room = Math.max(0, limit - keepComps.length);
  const rank = (e: Entry): number[] => [isBig(e.group) && !comps.some(c => c.group === e.group) ? 0 : 1, (cover.get(e.group) ?? 0) > 0 ? 1 : 0, prioGroups.has(e.group) ? 0 : isBig(e.group) ? 1 : 2, cover.get(e.group) ?? 0, Math.max(0, ISO_ORDER.indexOf(e.slot))];
  const keepRest = new Set([...rest].sort((a, b) => { const ra = rank(a), rb = rank(b); return ra[0] - rb[0] || ra[1] - rb[1] || ra[2] - rb[2]; }).slice(0, room));
  let kept = [...keepComps, ...rest.filter(e => keepRest.has(e))];
  // Treino com menos de 5 exercícios: reforço (core e panturrilha) antes de aceitar.
  if (kept.length < MIN_EXERCISES) {
   const have = new Set(kept.map(e => e.id));
   for (const k of FILLERS) {
    if (kept.length >= MIN_EXERCISES) break;
    // A panturrilha de reforço só entra se, somada às outras vezes na semana, não passar do máximo da faixa.
    if (k === 'CALF') {
     const times = input.split.filter(x => x === key).length;
     const planned = input.split.filter(x => SESSION_TEMPLATES[x].slots.some(sl => sl.k === 'CALF')).length;
     const fillers = Object.entries(sessions).reduce((a, [k2, es]) => a + (!SESSION_TEMPLATES[k2 as SessionKey].slots.some(sl => sl.k === 'CALF') && es.some(e => e.group === 'panturrilha') ? input.split.filter(x => x === k2).length : 0), 0);
     if ((planned + fillers + times) * MIN_SETS > GROUP_RANGES[input.volExp].small[1]) continue;
    }
    const id = pickForSlot(k, ctx, have);
    if (id) { have.add(id); kept.push({ slot: k, id, group: SLOT_GROUP[k] }); }
   }
  }
  kept = kept.map((e, i) => ({ e, i })).sort((a, b) => orderClass(a.e.id) - orderClass(b.e.id) || a.i - b.i).map(x => x.e);
  sessions[key] = kept;
  for (const e of kept) { cover.set(e.group, (cover.get(e.group) ?? 0) + 1); covered.add(e.group); }
 }
 // Grupos que a pessoa não consegue treinar por falta de equipamento (e que nenhum treino cobre).
 for (const g of missingEquip) if (!covered.has(g) && g !== 'core') notes.push({ kind: 'sem_equipamento', group: g });
 return solve(input, sessions, notes);
}

function solve(input: EngineInput, sessions: Record<string, Entry[]>, notes: PlanNote[]): EngineResult {
 const { catalog, volExp } = input;
 const caps = CAPS[volExp];
 const prioGroups = new Set(PRIORITY_GROUPS[input.priority]);
 const roles: Record<string, Role> = {};
 const groupOf: Record<string, MuscleGroup> = {};
 const idsInOrder: Record<string, string[]> = {};
 for (const [key, entries] of Object.entries(sessions)) {
  idsInOrder[key] = entries.map(e => e.id);
  for (const e of entries) {
   const r = roleOf(e.slot);
   if (!roles[e.id] || (r === 'principal' && roles[e.id] !== 'principal')) roles[e.id] = r;
   groupOf[e.id] = e.group;
  }
 }
 const occ: Record<string, number> = {};
 const countOcc = () => { for (const k of Object.keys(occ)) delete occ[k]; for (const key of input.split) for (const id of idsInOrder[key] ?? []) occ[id] = (occ[id] ?? 0) + 1; };
 countOcc();

 // Faixas e alvos por grupo.
 const groups = [...new Set(Object.values(groupOf))].filter(g => g !== 'core');
 const bonusOf: Record<string, number> = {};
 const lo: Record<string, number> = {}, hi: Record<string, number> = {}, target: Record<string, number> = {}, floor: Record<string, number> = {};
 for (const g of groups) {
  const r = rangeOf(g, volExp)!;
  // Exceções documentadas (ADR 010): tempo curto sem mínimo nos grupos grandes; 2 dias (curto e médio) com mínimo de 2 × séries principais.
  const exempt = input.duration === 'curto' && isBig(g);
  const twoDaysExempt = input.days === 2 && isBig(g) && input.duration !== 'longo';
  const minEff = exempt ? 0 : twoDaysExempt ? Math.min(r[0], 2 * VOLUME[volExp].ps[0]) : r[0];
  const bonus = PRIORITY_BONUS[input.priority][volExp][g] ?? 0;
  const prio = prioGroups.has(g);
  const high = prio && input.goal !== 'perder' ? r[1] + PRIORITY_OVER_MAX[volExp] : r[1];
  const basePos = Math.round(r[0] + GOAL_POSITION[input.goal] * (r[1] - r[0]));
  bonusOf[g] = bonus;
  lo[g] = minEff; hi[g] = high; floor[g] = minEff; target[g] = Math.max(minEff, Math.min(r[1], basePos));
 }
 const sets: Record<string, number> = {};
 const idsOfGroup = (g: MuscleGroup) => Object.keys(groupOf).filter(id => groupOf[id] === g && (occ[id] ?? 0) > 0);
 const n0 = (id: string) => (roles[id] === 'principal' ? VOLUME[volExp].ps[0] : VOLUME[volExp].as[0]);
 const capOf = (id: string, g: MuscleGroup) => Math.min(6, (roles[id] === 'principal' ? caps.principal : roles[id] === 'core' ? caps.core : caps.acessorio) + (prioGroups.has(g) ? 1 : 0));

 function solveGroup(g: MuscleGroup, tgt: number) {
  const ids = idsOfGroup(g);
  if (!ids.length) return;
  if (g === 'core') { for (const id of ids) sets[id] = Math.max(MIN_SETS, Math.min(caps.core, n0(id))); return; }
  const cap = ids.map(id => Math.max(MIN_SETS, capOf(id, g)));
  let best: number[] = ids.map(() => MIN_SETS), bestCost = Infinity;
  const cur: number[] = ids.map(() => MIN_SETS);
  const rec = (i: number) => {
   if (i === ids.length) {
    const sum = ids.reduce((a, id, j) => a + cur[j] * occ[id], 0);
    let cost = Math.abs(sum - tgt) * 100;
    if (sum < lo[g]) cost += (lo[g] - sum) * 10000;
    if (sum > hi[g]) cost += (sum - hi[g]) * 10000;
    cost += cur.reduce((a, n, j) => a + Math.abs(n - n0(ids[j])) * 3, 0);
    cost += (Math.max(...cur) - Math.min(...cur)) * 2;
    if (cost < bestCost) { bestCost = cost; best = [...cur]; }
    return;
   }
   for (let n = MIN_SETS; n <= cap[i]; n++) { cur[i] = n; rec(i + 1); }
  };
  rec(0);
  ids.forEach((id, j) => { sets[id] = best[j]; });
 }
 let growth: Growth = 'normal';
 const minutesOf = (key: string) => estimateMinutes(idsInOrder[key], sets, roles, catalog, volExp, input.duration, input.place, growth);
 const solveAll = () => { for (const g of groups) solveGroup(g, target[g]); solveGroup('core', 0); };

 // Tempo: parte do mínimo de cada grupo e sobe até a meta enquanto todos os treinos do grupo cabem no tempo escolhido.
 // Se nem o mínimo cabe, tira isoladores do treino (nunca os compostos).
 const budget = DURATION_MAX_MIN[input.duration];
 const overBudget: string[] = [];
 const want: Record<string, number> = { ...target };
 for (const g of groups) target[g] = floor[g];
 solveAll();
 const fits = () => Object.keys(sessions).every(k => minutesOf(k) <= budget);
 if (!fits()) growth = 'acessorios';
 if (!fits()) growth = 'todos';
 const keysOf = (g: MuscleGroup) => Object.keys(sessions).filter(k => idsInOrder[k].some(id => groupOf[id] === g));
 const raiseOrder = [...groups].sort((a, b) => Number(prioGroups.has(b)) - Number(prioGroups.has(a)) || Number(isBig(b)) - Number(isBig(a)));
 const raise = () => {
  let changed = true;
  while (changed) {
   changed = false;
   for (const g of raiseOrder) {
    if (target[g] >= want[g]) continue;
    target[g] += 1; solveGroup(g, target[g]);
    if (keysOf(g).some(k => minutesOf(k) > budget)) { target[g] -= 1; solveGroup(g, target[g]); want[g] = target[g]; } else changed = true;
   }
  }
 };
 // Prioridade: o bônus soma ao volume que a semana já tem (a estrutura pode estar acima do mínimo da faixa), até o teto do grupo.
 const achieved = (g: MuscleGroup) => idsOfGroup(g).reduce((a, id) => a + (sets[id] ?? 0) * (occ[id] ?? 0), 0);
 const raiseAll = () => {
  raise();
  for (const g of groups) if (bonusOf[g] > 0) { want[g] = Math.min(achieved(g) + bonusOf[g], hi[g]); target[g] = achieved(g); }
  raise();
 };
 if (Object.keys(sessions).every(k => minutesOf(k) <= budget)) raiseAll();
 for (let guard = 0; guard < 400; guard++) {
  const over = Object.keys(sessions).filter(k => minutesOf(k) > budget);
  if (!over.length) break;
  const inOver = new Set(over.flatMap(k => idsInOrder[k]));
  const reducible = groups.filter(g => idsOfGroup(g).some(id => inOver.has(id)) && target[g] > floor[g]);
  if (reducible.length) {
   reducible.sort((a, b) => (target[b] - floor[b]) - (target[a] - floor[a]) || Number(isBig(a)) - Number(isBig(b)));
   target[reducible[0]] -= 1;
   solveAll();
   continue;
  }
  let dropped = false;
  for (const key of over) {
   const entries = sessions[key];
   if (entries.length <= MIN_EXERCISES) continue;
   const iso = entries.map((e, i) => ({ e, i })).filter(x => orderClass(x.e.id) === 1);
   if (!iso.length) continue;
   const elsewhere = (grp: MuscleGroup) => Object.entries(sessions).some(([k2, es]) => k2 !== key && es.some(e => e.group === grp));
   const drop = [...iso].reverse().find(x => elsewhere(x.e.group)) ?? iso[iso.length - 1];
   sessions[key] = entries.filter((_, i) => i !== drop.i);
   idsInOrder[key] = sessions[key].map(e => e.id);
   dropped = true;
   break;
  }
  if (!dropped) { overBudget.push(...over); break; }
  countOcc();
  for (const g of groups) target[g] = floor[g];
  solveAll();
  if (Object.keys(sessions).every(k => minutesOf(k) <= budget)) raiseAll();
 }

 const finalIds = new Set(Object.values(idsInOrder).flat());
 for (const n of notes) if (n.kind === 'dor' && n.to && !finalIds.has(n.to)) n.to = null;
 const weekly: Partial<Record<MuscleGroup, number>> = {};
 for (const key of input.split) for (const id of idsInOrder[key]) weekly[groupOf[id]] = (weekly[groupOf[id]] ?? 0) + (sets[id] ?? 0);
 const minutes: Record<string, number> = {};
 for (const key of Object.keys(sessions)) minutes[key] = minutesOf(key);
 for (const key of Object.keys(sessions)) if (idsInOrder[key].length < MIN_EXERCISES) notes.push({ kind: 'treino_curto', session: key as SessionKey });
 return { sessions: idsInOrder, sets, roles, groups: groupOf, weekly, minutes, notes, overBudget: [...new Set(overBudget)], growth };
}
