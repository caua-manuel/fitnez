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
