import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { createCommitter } from './commitQueue';
import type { Initialization, Protection, Repository, StateV3 } from '../application/repository';

interface DataContextValue {
 repository: Repository; state: StateV3 | null; initialization: Initialization | null;
 protection: Protection | null; loading: boolean; busy: boolean; saving: boolean;
 error: string; notice: string; refresh: () => Promise<void>;
 requestPersistence: () => Promise<void>;
 commit: (mutate: (draft: StateV3) => StateV3) => Promise<boolean>;
 run: <T>(action: () => Promise<T>, message?: string) => Promise<T | undefined>;
}
const DataContext = createContext<DataContextValue | null>(null);
export function DataProvider({ repository, children }: { repository: Repository; children: ReactNode }) {
 const [initialization, setInitialization] = useState<Initialization | null>(null);
 const [state, setState] = useState<StateV3 | null>(null);
 const [protection, setProtection] = useState<Protection | null>(null);
 const [loading, setLoading] = useState(true);
 const [busy, setBusy] = useState(false);
 const [saving, setSaving] = useState(false);
 const [error, setError] = useState('');
 const [notice, setNotice] = useState('');
 const running = useRef(false);
 const committer = useRef<ReturnType<typeof createCommitter> | null>(null);
 if (!committer.current) committer.current = createCommitter({ repository, onState: s => setState(s), onError: m => setError(m) });
 const persistenceResult = useRef<Protection | null>(null);
 const refresh = useCallback(async () => {
  const initialized = await repository.initialize();
  setInitialization(initialized); committer.current!.adopt(initialized.state);
  const queried = await repository.protection();
  if (queried.persistence !== 'granted' && persistenceResult.current) {
   queried.persistence = persistenceResult.current.persistence;
   queried.message = queried.message ?? persistenceResult.current.message;
  }
  setProtection(queried);
 }, [repository]);
 useEffect(() => {
  let active = true;
  refresh().catch(e => active && setError(e instanceof Error ? e.message : 'Não foi possível abrir os dados.')).finally(() => active && setLoading(false));
  const unsubscribe = repository.subscribe(event => {
   if (!active) return;
   if (event.status === 'saving') setSaving(true);
   if (event.status === 'saved') { setSaving(false); }
   if (event.status === 'error') { setSaving(false); setError(event.error?.message ?? 'Não foi possível salvar seus dados.'); }
   if (event.status === 'external-change') refresh().catch(e => setError(e.message));
  });
  return () => { active = false; unsubscribe(); };
 }, [repository, refresh]);
 const run = useCallback(async <T,>(action: () => Promise<T>, message = ''): Promise<T | undefined> => {
  if (running.current) return undefined;
  running.current = true; setBusy(true); setError(''); setNotice('');
  try { const result = await action(); await refresh(); setNotice(message); return result; }
  catch(e) { setError(e instanceof Error ? e.message : 'Não foi possível concluir. Tente novamente.'); return undefined; }
  finally { running.current = false; setBusy(false); setSaving(false); }
 }, [refresh]);
 const commit = useCallback((mutate: (draft: StateV3) => StateV3) => { setError(''); return committer.current!.commit(mutate); }, []);
 const requestPersistence = useCallback(async () => {
  const result = await run(() => repository.protection({ requestPersistence: true }), 'Solicitação de armazenamento concluída. Consulte o resultado acima.');
  if (result) { persistenceResult.current = result; setProtection(result); }
 }, [repository, run]);
 return <DataContext.Provider value={{ repository, state, initialization, protection, loading, busy, saving, error, notice, refresh, run, requestPersistence, commit }}>{children}</DataContext.Provider>;
}
export function useData() { const data = useContext(DataContext); if (!data) throw new Error('Dados indisponíveis.'); return data; }
