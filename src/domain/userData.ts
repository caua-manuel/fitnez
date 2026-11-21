// Regra pura: há dados do usuário que valham um aviso de backup?
// O app recém-aberto (só o plano de fábrica) não tem nada a proteger.
interface UserDataShape {
 history?: { days?: Record<string, unknown>; measurements?: Record<string, unknown> };
 catalog?: { revision?: number };
 settings?: { profile?: { name?: string; goal?: string } };
}

export function hasUserData(state: UserDataShape | null | undefined): boolean {
 if (!state) return false;
 if (Object.keys(state.history?.days ?? {}).length > 0) return true;
 if (Object.keys(state.history?.measurements ?? {}).length > 0) return true;
 if ((state.catalog?.revision ?? 0) > 0) return true;
 const p = state.settings?.profile;
 return !!((p?.name ?? '').trim() || (p?.goal ?? '').trim());
}

export function shouldShowBackupReminder(state: UserDataShape | null | undefined, backupDue: boolean | undefined): boolean {
 return backupDue === true && hasUserData(state);
}

// ---------- ADR 011, itens 1.2 e 1.4: dias de uso, lembrete de backup e momento de instalar ----------
// Funções puras: a data de hoje (dia civil local) entra como parâmetro; nada de relógio aqui.

/** Dia civil no formato AAAA-MM-DD (comparação por texto equivale à cronológica). */
type Day = string;

/** `meta.usage`: último dia de uso (dia com gravação) e quantos dias de uso desde o último backup confirmado. */
export interface Usage { lastDay: Day; daysSinceBackup: number }
/** `meta.prompts`: quando cada pedido apareceu (instante em ms) e o dia em que o lembrete de backup foi adiado. */
export interface Prompts { persistAskedAt?: number; installShownAt?: number; backupSnoozedOn?: Day }

export const USAGE_MAX = 100000;
export const BACKUP_DUE_DAYS = 7;

const validUsage = (u: unknown): u is Usage => !!u && typeof u === 'object' && typeof (u as Usage).lastDay === 'string' && Number.isSafeInteger((u as Usage).daysSinceBackup) && (u as Usage).daysSinceBackup >= 0;

/**
 * Contagem de dias de uso depois de uma gravação feita em `today`.
 * Mesmo dia não conta duas vezes; relógio para trás (`today < lastDay`) não conta nem zera.
 * Sem contagem anterior (estado antigo ou recém-criado), hoje é o primeiro dia contado.
 * Devolve o mesmo objeto quando nada muda (o chamador pode comparar por referência).
 */
export function nextUsage(usage: Usage | null | undefined, today: Day): Usage {
 if (!validUsage(usage)) return { lastDay: today, daysSinceBackup: 1 };
 if (today <= usage.lastDay) return usage;
 return { lastDay: today, daysSinceBackup: Math.min(USAGE_MAX, usage.daysSinceBackup + 1) };
}

/** Contagem depois de confirmar um backup: zera, sem contar hoje (o backup cobre o que foi gravado até agora). */
export function usageAfterBackup(usage: Usage | null | undefined, today: Day): Usage {
 const lastDay = validUsage(usage) && usage.lastDay > today ? usage.lastDay : today;
 return { lastDay, daysSinceBackup: 0 };
}

/**
 * O lembrete de backup é devido? Só com dados do usuário, a partir do 7º dia de uso sem backup confirmado,
 * e não no dia em que a pessoa tocou "Agora não". `lastBackupConfirmedAt` é informativo: a contagem
 * (zerada a cada confirmação) já reflete o último backup; sem `usage`, nada é devido até a próxima gravação.
 */
export function backupDue(input: { usage: Usage | null | undefined; lastBackupConfirmedAt: number | null; hasUserData: boolean; snoozedOn: Day | null | undefined; today: Day }): boolean {
 if (!input.hasUserData) return false;
 if (!validUsage(input.usage) || input.usage.daysSinceBackup < BACKUP_DUE_DAYS) return false;
 return input.snoozedOn !== input.today;
}

/** Algum treino real foi concluído? (`workouts`/`workout` com status `done` em qualquer dia.) */
export function hasCompletedWorkout(days: Record<string, { workouts?: Record<string, { status?: unknown }>; workout?: { status?: unknown } }> | null | undefined): boolean {
 for (const d of Object.values(days ?? {})) {
  if (!d || typeof d !== 'object') continue;
  if (d.workout?.status === 'done') return true;
  for (const w of Object.values(d.workouts ?? {})) if (w?.status === 'done') return true;
 }
 return false;
}

/**
 * Mostrar o cartão "Instalar no celular" na tela de treino concluído? Uma vez só (`installShownAt` ausente),
 * fora da demonstração, se o app ainda não está instalado e já houve treino real concluído.
 */
export function shouldOfferInstall(input: { prompts: Prompts | null | undefined; installMode: string; demo: boolean; firstWorkoutDone: boolean }): boolean {
 if (input.demo || !input.firstWorkoutDone || input.installMode === 'installed') return false;
 return input.prompts?.installShownAt === undefined;
}

/**
 * Pedir armazenamento persistente automaticamente (no mesmo momento do treino concluído)? Uma vez só
 * (`persistAskedAt` ausente), fora da demonstração, se ainda não concedido e a API existe.
 */
export function shouldAskPersistence(input: { prompts: Prompts | null | undefined; persistence: string | undefined; demo: boolean; firstWorkoutDone: boolean }): boolean {
 if (input.demo || !input.firstWorkoutDone) return false;
 if (input.persistence === 'granted' || input.persistence === 'unavailable') return false;
 return input.prompts?.persistAskedAt === undefined;
}
