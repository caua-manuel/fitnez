// Vibração (ADR 011, 2.1). API do navegador sempre detectada antes do uso; iPhone não tem a API e fica em silêncio.

type VibrateEnv = { vibrate?: (pattern: number | number[]) => boolean };

function defaultEnv(): VibrateEnv | undefined {
 return (globalThis as { navigator?: VibrateEnv }).navigator;
}

/** O aparelho oferece vibração? */
export function canVibrate(env: VibrateEnv | undefined = defaultEnv()): boolean {
 return typeof env?.vibrate === 'function';
}

/** Padrão do fim do descanso: dois toques curtos. */
export const REST_END_PATTERN: readonly number[] = [200, 100, 200];

/**
 * Vibra uma vez. `enabled` reserva a futura opção de desligar a vibração nas preferências
 * (por enquanto sempre ligada). Nunca lança: vibração é só um reforço.
 */
export function vibrate(pattern: number | readonly number[], { enabled = true, env = defaultEnv() }: { enabled?: boolean; env?: VibrateEnv } = {}): boolean {
 if (!enabled || !env || !canVibrate(env)) return false;
 try { return env.vibrate!(typeof pattern === 'number' ? pattern : [...pattern]) === true; } catch { return false; }
}

/** Reforço tátil do fim do descanso. */
export function restEndHaptic(options?: { enabled?: boolean; env?: VibrateEnv }): boolean {
 return vibrate(REST_END_PATTERN, options);
}

/** Recorde batido: toque curto duplo, diferente do fim do descanso (ux-auditoria-fase-3.md, seção 3B). */
export const RECORD_PATTERN: readonly number[] = [12, 60, 12];
export function recordHaptic(options?: { enabled?: boolean; env?: VibrateEnv }): boolean {
 return vibrate(RECORD_PATTERN, options);
}
