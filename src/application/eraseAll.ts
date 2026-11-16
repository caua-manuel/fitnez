import { RepositoryError } from './repository';
import type { StateV3 } from './repository';
import { foundation } from '../data/migration';
import { clone } from '../data/validation';
import { asError, completed, open, request } from '../data/idb';

type KeyedStorage = Pick<Storage, 'getItem'> & Partial<Pick<Storage, 'removeItem' | 'key' | 'length'>>;
export interface EraseAllOptions {
 expectedRevision: number;
 basePath?: string; now?: () => number;
 indexedDB?: IDBFactory | null; storage?: KeyedStorage | null; session?: KeyedStorage | null;
}
export interface EraseResult { state: StateV3; storageWarnings: string[] }

// Chaves legadas (protótipo) e auxiliares do app. Tudo o mais em localStorage/sessionStorage pertence a outros apps.
const LEGACY_KEYS = ['treino12-v1', 'treino12-v2', 'treino-theme'];
const isOurs = (key: string) => LEGACY_KEYS.includes(key) || key.startsWith('treino12:');

function wipe(store: KeyedStorage | null | undefined, label: string): string[] {
 if (!store) return [];
 try {
  if (typeof store.removeItem !== 'function' || typeof store.key !== 'function' || typeof store.length !== 'number') return [`Não foi possível limpar ${label}.`];
  const keys: string[] = [];
  for (let i = 0; i < store.length; i++) { const k = store.key(i); if (k !== null && isOurs(k)) keys.push(k); }
  keys.forEach(k => store.removeItem!(k));
  return [];
 } catch { return [`Não foi possível limpar ${label}.`]; }
}

/**
 * Apaga tudo o que o usuário gravou e devolve o app ao estado de primeira abertura.
 * 1) Uma única transação do IndexedDB limpa 'state' e 'recovery' e grava o estado de fábrica
 *    (ou tudo ou nada). A revisão cresce, então abas antigas recebem 'conflict' ao salvar.
 * 2) Só depois, limpa chaves do app em localStorage/sessionStorage (melhor esforço; falhas voltam em storageWarnings).
 * Não toca no Cache Storage: o cache do service worker guarda só o app, nunca dados do usuário.
 * Avisa os repositórios abertos (esta aba e outras) pelo BroadcastChannel, que emitem 'external-change'.
 */
export async function eraseAllData(options: EraseAllOptions): Promise<EraseResult> {
 const now = options.now ?? Date.now;
 const base = options.basePath ?? import.meta.env.BASE_URL;
 const name = `treino12:${encodeURIComponent(base)}`;
 const factory = options.indexedDB === undefined ? globalThis.indexedDB : options.indexedDB;
 let local = options.storage; if (local === undefined) { try { local = globalThis.localStorage; } catch { local = null; } }
 let session = options.session; if (session === undefined) { try { session = globalThis.sessionStorage; } catch { session = null; } }
 const connection = await open(factory, name);
 let tx: IDBTransaction | undefined; let done: Promise<void> | undefined; let next: StateV3;
 try {
  tx = connection.transaction(['state', 'recovery'], 'readwrite'); done = completed(tx); done.catch(() => undefined);
  const stored = await request<StateV3 | undefined>(tx.objectStore('state').get('active'));
  if (stored !== undefined && stored.revision !== options.expectedRevision) throw new RepositoryError('conflict', 'Os dados mudaram em outra aba. Recarregue antes de tentar novamente.');
  next = foundation(now()); next.revision = (stored?.revision ?? options.expectedRevision) + 1;
  tx.objectStore('recovery').clear(); tx.objectStore('state').clear(); tx.objectStore('state').put(clone(next), 'active');
  await done;
 } catch (e) {
  try { tx?.abort(); } catch { /* Já finalizada. */ }
  if (done) await done.catch(() => undefined);
  throw asError(e);
 } finally { connection.close(); }
 const storageWarnings = [...wipe(local, 'localStorage'), ...wipe(session, 'sessionStorage')];
 if (typeof BroadcastChannel !== 'undefined') { const channel = new BroadcastChannel(name); channel.postMessage({ revision: next.revision }); channel.close(); }
 return { state: clone(next), storageWarnings };
}
