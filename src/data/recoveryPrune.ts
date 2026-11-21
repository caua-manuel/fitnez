import type { Payload, StateV3 } from '../application/repository';

// Poda do `recovery` (ADR 011, revisão de segurança M4). Os registros de desfazer guardam um plano inteiro e o
// desfazer só usa 1 nível; sem poda, `recovery` passa do limite de 400 registros e toda gravação falha.
// Aplicada dentro do `commit`, na mesma transação da gravação (cobre assistente e plano compartilhado).

/** Quantos registros mais recentes ficam por prefixo. */
export const RECOVERY_KEEP = 3;
export const PRUNED_PREFIXES = ['plan-import-undo:', 'before-plan-import-undo:', 'onboarding-undo:'] as const;

/** Instante do registro: `createdAt` quando houver, senão o primeiro número depois do prefixo (`<prefixo><t>[:n]`). */
function timeOf(key: string, prefix: string, value: unknown): number {
 const c = (value as Payload | null | undefined)?.createdAt;
 if (typeof c === 'number' && Number.isFinite(c)) return c;
 const t = Number(key.slice(prefix.length).split(':')[0]);
 return Number.isFinite(t) ? t : 0;
}
/** Sufixo `:n` de chaves criadas no mesmo instante (`freeKey`): a de maior n é a mais nova. */
const serialOf = (key: string, prefix: string) => { const n = Number(key.slice(prefix.length).split(':')[1]); return Number.isFinite(n) ? n : 1; };

/**
 * Chaves de `recovery` a apagar: além das 3 mais recentes de cada prefixo. Nunca apaga a chave apontada por
 * `settings.planImport.undoKey` nem por `settings.onboarding.undoKey` (o desfazer atual continua funcionando mesmo
 * com relógio para trás). Outros registros (`legacy:*`, `before-import:*` etc.) não são tocados.
 */
export function recoveryToPrune(recovery: Record<string, unknown>, settings?: StateV3['settings'] | null): string[] {
 const keep = new Set<string>();
 for (const k of [settings?.planImport?.undoKey, (settings?.onboarding as { undoKey?: unknown } | undefined)?.undoKey]) if (typeof k === 'string') keep.add(k);
 const drop: string[] = [];
 for (const prefix of PRUNED_PREFIXES) {
  const keys = Object.keys(recovery).filter(k => k.startsWith(prefix));
  if (keys.length <= RECOVERY_KEEP) continue;
  keys.sort((a, b) => timeOf(b, prefix, recovery[b]) - timeOf(a, prefix, recovery[a]) || serialOf(b, prefix) - serialOf(a, prefix) || (a < b ? 1 : a > b ? -1 : 0));
  keys.slice(RECOVERY_KEEP).forEach(k => { if (!keep.has(k)) drop.push(k); });
 }
 return drop;
}
