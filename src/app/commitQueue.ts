import type { Repository, StateV3 } from '../application/repository';

export type Mutate = (draft: StateV3) => StateV3;
interface Options { repository: Repository; onState: (state: StateV3) => void; onError: (message: string) => void }
interface Pending { seq: number; mutate: Mutate }

// Fila única de gravação com atualização otimista. Mutações ainda não gravadas
// ficam guardadas para serem reaplicadas se outra aba gravar antes (conflito).
export function createCommitter({ repository, onState, onError }: Options) {
 let local: StateV3 | null = null;
 let revision = 0;
 let seq = 0;
 let savedSeq = 0;
 let pending: Pending[] = [];
 let queue: Promise<unknown> = Promise.resolve();
 const clone = <T,>(v: T): T => structuredClone(v);
 const reapply = (base: StateV3) => pending.reduce((s, p) => p.mutate(s), clone(base));

 function adopt(state: StateV3) {
  revision = state.revision;
  local = pending.length ? reapply(state) : clone(state);
  onState(local);
 }
 async function flush(mySeq: number): Promise<boolean> {
  if (savedSeq >= mySeq) return true;
  const covered = seq;
  const attempt = async (snapshot: StateV3, expected: number) => {
   const saved = await repository.save({ state: snapshot, expectedRevision: expected });
   revision = saved.revision; savedSeq = covered; pending = pending.filter(p => p.seq > covered);
   if (seq === covered && local) { local = clone(saved); onState(local); }
  };
  try {
   await attempt(clone(local!), revision);
   return true;
  } catch (e) {
   if ((e as { code?: string })?.code === 'conflict') {
    try {
     const fresh = await repository.read();
     local = reapply(fresh); onState(local);
     await attempt(clone(local), fresh.revision);
     return true;
    } catch (second) { onError(second instanceof Error ? second.message : 'Não foi possível salvar seus dados.'); return false; }
   }
   onError(e instanceof Error ? e.message : 'Não foi possível salvar seus dados.');
   return false;
  }
 }
 function commit(mutate: Mutate): Promise<boolean> {
  if (!local) { onError('Seus dados ainda não foram abertos.'); return Promise.resolve(false); }
  let next: StateV3;
  try { next = mutate(clone(local)); } catch (e) { onError(e instanceof Error ? e.message : 'Não foi possível aplicar a alteração.'); return Promise.resolve(false); }
  const mySeq = ++seq;
  pending.push({ seq: mySeq, mutate });
  local = next; onState(next);
  const task = queue.then(() => flush(mySeq));
  queue = task.catch(() => false);
  return task;
 }
 return { commit, adopt, current: () => local };
}
