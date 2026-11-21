import { RepositoryError } from '../application/repository';
import type { Protection, Repository, RepositoryOptions } from '../application/repository';
import { createRepository } from './index';
import { databaseName } from './names';

// Modo demonstração (ADR 011, 1.1). Banco próprio `treino12:demo:<base>`; o banco real nunca é aberto por aqui.
// Sem leitura do protótipo legado (`storage: null`). Backup, importação e confirmação de backup são recusados:
// nada da demo sai do aparelho nem entra no backup. O BroadcastChannel segue o nome do banco, então abas
// de modos diferentes não se misturam.

export type DemoRepositoryOptions = Omit<RepositoryOptions, 'dbName' | 'storage'>;

const refuse = (): Promise<never> => Promise.reject(new RepositoryError('validation', 'Indisponível na demonstração. Saia da demonstração para usar seus próprios dados.'));

export function demoDatabaseName(basePath: string = import.meta.env.BASE_URL): string { return databaseName(basePath, 'demo'); }

export function createDemoRepository(options: DemoRepositoryOptions = {}): Repository {
 const base = options.basePath ?? import.meta.env.BASE_URL;
 const inner = createRepository({ ...options, basePath: base, dbName: demoDatabaseName(base), storage: null, storageManager: null, demo: true });
 return {
  ...inner,
  export: refuse,
  prepareImport: refuse,
  confirmImport: refuse,
  confirmBackup: refuse,
  async protection(): Promise<Protection> {
   const s = await inner.read();
   return { persistence: 'unavailable', lastBackupGeneratedAt: s.meta.lastBackupGeneratedAt, lastBackupConfirmedAt: s.meta.lastBackupConfirmedAt, backupDue: false };
  },
 };
}

/**
 * Apaga o banco da demo. Idempotente: banco inexistente também resolve. Conexões abertas deste app fecham
 * sozinhas no `versionchange`; se outra aba demorar, a exclusão conclui quando ela fechar.
 */
export function deleteDemoDatabase(options: { basePath?: string; indexedDB?: IDBFactory | null } = {}): Promise<void> {
 const factory = options.indexedDB === undefined ? globalThis.indexedDB : options.indexedDB;
 if (!factory) return Promise.resolve();
 return new Promise((resolve, reject) => {
  let request: IDBOpenDBRequest;
  try { request = factory.deleteDatabase(demoDatabaseName(options.basePath ?? import.meta.env.BASE_URL)); } catch (e) { reject(e); return; }
  request.onsuccess = () => resolve();
  request.onerror = () => reject(request.error ?? new RepositoryError('transaction', 'Não foi possível apagar os dados da demonstração.'));
 });
}
