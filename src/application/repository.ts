export type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };
// Campos adicionais preservam formatos legados e extensões sem normalização destrutiva.
export type Payload = Record<string, any>;
export interface Exercise extends Payload { n: string; s: number[]; r: string[]; m: string; t?: string; rest?: number }
export interface Session extends Payload { name: string; sub?: string; min?: string; ex: string[] }
export interface Plan extends Payload { ex: Record<string, Exercise>; sess: Record<string, Session>; order: string[]; alt?: string; cond?: string[] }
export interface DayRecord extends Payload { log?: Record<string, Payload[]>; done?: boolean; feel?: number; over?: string; cond?: Payload; notes?: Record<string, string>; diet?: Payload;
 workout?: { sessionId: string; startedAt: number; finishedAt?: number; status: 'partial' | 'done'; sets: number; volume: number };
 acts?: Partial<Record<'gym'|'bjj'|'volei'|'cond', boolean>> }
export interface StateV3 extends Payload {
 v: 3; revision: number;
 catalog: { plan: Plan; diet: Payload; recipes: Payload[]; revision: number; [key: string]: any };
 settings: { start: string; sched: Payload[]; theme: 'auto'|'light'|'dark'; profile?: { name: string; goal: string }; notifications?: { enabled: boolean; restEnd: boolean }; [key: string]: any };
 history: { days: Record<string, DayRecord>; measurements: Record<string, Payload>; [key: string]: any };
 snapshots: Record<string, Payload>; recovery: Record<string, Payload>;
 meta: { initializedAt: number; updatedAt: number; migrationCompleted: boolean; migrationStatus?: 'none'|'completed'|'pending'|'invalid'; lastBackupGeneratedAt: number|null; lastBackupConfirmedAt: number|null; [key: string]: any };
}
export type ErrorCode = 'unavailable'|'quota'|'conflict'|'validation'|'future-version'|'blocked'|'transaction';
export class RepositoryError extends Error { constructor(public code: ErrorCode, message: string) { super(message); this.name = 'RepositoryError'; } }
export interface MigrationSource { id: string; label: string; version: 1|2; days: number; measurements: number; warnings: string[] }
export type Initialization = { status: 'ready'; state: StateV3; warnings: string[] } | { status: 'migration-conflict'; state: StateV3; sources: MigrationSource[] };
export interface RepositoryEvent { status: 'saving'|'saved'|'error'|'external-change'; revision?: number; error?: RepositoryError }
export interface ImportPreview { token: string; sourceVersion: 1|2|3; expectedRevision: number; summary: { days: number; measurements: number; exercises: number; sessions: number }; warnings: string[] }
export interface Protection { persistence: 'granted'|'denied'|'unavailable'|'error'|'not-requested'; usage?: number; quota?: number; lastBackupGeneratedAt: number|null; lastBackupConfirmedAt: number|null; backupDue: boolean; message?: string }
export interface Repository {
 initialize(): Promise<Initialization>; read(): Promise<StateV3>;
 save(input: { state: StateV3; expectedRevision: number }): Promise<StateV3>;
 subscribe(listener: (event: RepositoryEvent) => void): () => void;
 export(): Promise<{ text: string; filename: string; generatedAt: number; revision: number }>;
 prepareImport(text: string): Promise<ImportPreview>;
 confirmImport(input: { token: string; expectedRevision: number }): Promise<StateV3>;
 selectMigration(input: { sourceId: string; expectedRevision: number }): Promise<StateV3>;
 confirmBackup(input: { expectedRevision: number }): Promise<StateV3>;
 protection(input?: { requestPersistence?: boolean }): Promise<Protection>; close(): void;
}
export interface RepositoryOptions { basePath?: string; now?: () => number; indexedDB?: IDBFactory|null; storage?: Pick<Storage, 'getItem'>|null; storageManager?: Partial<Pick<StorageManager, 'persist'|'persisted'|'estimate'>>|null }

