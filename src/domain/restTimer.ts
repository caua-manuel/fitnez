// Descanso por carimbo: o tempo restante sai sempre de endsAt e do relógio, nunca de contagem de ticks.
export function restRemaining(endsAt: number, now: number): number {
 return Math.max(0, Math.ceil((endsAt - now) / 1000));
}

export function adjustRest(endsAt: number, deltaSec: number, now: number): number {
 return Math.max(now, endsAt + deltaSec * 1000);
}

// ---------- Retomar o descanso salvo (ADR 011, 2.1) ----------

/** Descanso salvo em `storageKey('descanso')`: treino (`id`), dia, exercício, fim (ms) e duração total (s). */
export interface SavedRest { exId: string; endsAt: number; total: number }
export type RestoreRest =
 | { kind: 'ativo'; rest: SavedRest; remainingSec: number }
 | { kind: 'terminado'; rest: SavedRest; endedAgoSec: number }
 | { kind: 'nada' };

/** Até quanto tempo depois do fim o painel ainda mostra "Descanso terminou". */
export const REST_ENDED_GRACE_MS = 10 * 60 * 1000;
/** Fim mais distante que isso no futuro é tratado como lixo (relógio trocado ou dado corrompido). */
export const REST_MAX_AHEAD_MS = 60 * 60 * 1000;

const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

/**
 * Lê o descanso salvo e decide o que a tela mostra. `raw` pode ser o texto do `localStorage` (ou `null`)
 * ou o objeto já lido. Outro treino, outro dia, formato inválido ou vencido há mais de 10 min: `nada`.
 * Vencido há até 10 min (inclusive o instante exato do fim): `terminado`. Ainda correndo: `ativo`.
 */
export function restoreRest(raw: unknown, ctx: { id: string; day: string; now: number }): RestoreRest {
 let v: unknown = raw;
 if (typeof raw === 'string') { try { v = JSON.parse(raw); } catch { return { kind: 'nada' }; } }
 if (!v || typeof v !== 'object' || Array.isArray(v)) return { kind: 'nada' };
 const r = v as Record<string, unknown>;
 if (r.id !== ctx.id || r.day !== ctx.day || typeof r.exId !== 'string' || !r.exId) return { kind: 'nada' };
 if (!finite(r.endsAt) || !finite(r.total) || r.total < 0 || !finite(ctx.now)) return { kind: 'nada' };
 const rest: SavedRest = { exId: r.exId, endsAt: r.endsAt, total: r.total };
 const diff = rest.endsAt - ctx.now, ago = ctx.now - rest.endsAt;
 if (diff > REST_MAX_AHEAD_MS) return { kind: 'nada' };
 if (diff > 0) return { kind: 'ativo', rest, remainingSec: restRemaining(rest.endsAt, ctx.now) };
 if (ago <= REST_ENDED_GRACE_MS) return { kind: 'terminado', rest, endedAgoSec: Math.floor(ago / 1000) };
 return { kind: 'nada' };
}
