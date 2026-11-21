import { databaseName, modeKeyName } from '../data/names';
import type { AppMode } from '../data/names';
export type { AppMode };

// Modo do app (ADR 011, 1.1): real ou demonstração, escolhido por uma marca em localStorage lida uma vez,
// de forma síncrona, antes de criar o repositório. O valor fica fixo durante a sessão da página: mesmo que
// outra aba mude a marca, esta só troca de modo ao recarregar (o evento `storage` da marca pede o recarregamento).

const base = (): string => import.meta.env.BASE_URL;

/** Leitura pura da marca (testável com armazenamento simulado). Qualquer falha de acesso = modo real. */
export function readMode(storage: Pick<Storage, 'getItem'> | null | undefined, basePath: string): AppMode {
 try { return storage?.getItem(modeKeyName(basePath)) === 'demo' ? 'demo' : 'real'; } catch { return 'real'; }
}

let cached: AppMode | undefined;
/** Modo desta página (lido na primeira chamada e mantido até recarregar). */
export function appMode(): AppMode {
 if (cached === undefined) { let s: Storage | null = null; try { s = globalThis.localStorage; } catch { /* sem acesso: real */ } cached = readMode(s, base()); }
 return cached;
}

/** Chave auxiliar de localStorage/sessionStorage do modo ativo: `treino12:<nome>` ou `treino12:demo:<nome>`. */
export function storageKey(nome: string): string {
 return appMode() === 'demo' ? `treino12:demo:${nome}` : `treino12:${nome}`;
}

/** Nome do banco do modo ativo (também usado pelo ErrorBoundary para oferecer a recuperação certa). */
export function dbName(): string { return databaseName(base(), appMode()); }

/** Chave da marca do modo (para escutar o evento `storage` em outras abas). */
export function modeKey(): string { return modeKeyName(base()); }

/** Grava a marca da demo. Só chamar depois de a demo estar gravada no banco da demo (ADR 011). */
export function setDemoMark(): void { globalThis.localStorage.setItem(modeKey(), 'demo'); }
/** Apaga a marca da demo (primeiro passo de "Sair da demonstração"). Sem acesso ao armazenamento: ignora. */
export function clearDemoMark(): void { try { globalThis.localStorage.removeItem(modeKey()); } catch { /* sem acesso */ } }
