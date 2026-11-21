// Nomes do armazenamento por modo (ADR 011, 1.1). Arquivo mínimo: entra na carga inicial por src/app/mode.ts.
// Banco real: `treino12:<base>` (inalterado desde a Fase 1). Banco da demo: `treino12:demo:<base>`.
export type AppMode = 'real' | 'demo';

export function databaseName(base: string, mode: AppMode = 'real'): string {
 return `treino12:${mode === 'demo' ? 'demo:' : ''}${encodeURIComponent(base)}`;
}

/** Chave da marca do modo em localStorage: `treino12:<base>:modo` = 'demo'. Ausente ou outro valor = real. */
export function modeKeyName(base: string): string {
 return `treino12:${encodeURIComponent(base)}:modo`;
}
