import type { Repository, StateV3 } from '../application/repository';

export type Mutate = (draft: StateV3) => StateV3;
interface Options { repository: Repository; onState: (state: StateV3) => void; onError: (message: string) => void }
interface Pending { seq: number; mutate: Mutate }

// Fila única de gravação com atualização otimista. Mutações ainda não gravadas
// ficam guardadas para serem reaplicadas se outra aba gravar antes (conflito).
// Gravação recusada por validação (RepositoryError code "validation"): o lote é regravado uma mutação
// por vez sobre o último estado salvo; a que for recusada é descartada, a tela volta ao
// salvo (mais as mutações aceitas) e a fila segue funcionando.
export function createCommitter({ repository, onState, onError }: Options) {
 let local: StateV3 | null = null;
 let saved: StateV3 | null = null;
 let revision = 0;
 let seq = 0;
 let savedSeq = 0;
 let pending: Pending[] = [];
 const rejected = new Set<number>();
 let queue: Promise<unknown> = Promise.resolve();
 const clone = <T,>(v: T): T => structuredClone(v);
 const reapply = (base: StateV3) => pending.reduce((s, p) => p.mutate(s), clone(base));
 const codeOf = (e: unknown) => (e as { code?: string })?.code;
 const isConflict = (e: unknown) => codeOf(e) === 'conflict';
 // Só recusa por validação descarta a mutação; falha passageira (quota, transação, desconhecida) mantém tudo pendente.
 const fail = async (covered: number, e: unknown) => { if (codeOf(e) === 'validation') { await salvage(covered, e); return true; } onError(message(e)); return false; };
 const message = (e: unknown) => e instanceof Error ? e.message : 'Não foi possível salvar seus dados.';

 function adopt(state: StateV3) {
  revision = state.revision;
  saved = clone(state);
  local = pending.length ? reapply(state) : clone(state);
  onState(local);
 }
 async function salvage(covered: number, first: unknown): Promise<void> {
  const batch = pending.filter(p => p.seq <= covered);
  let lastError: unknown = first, done = 0;
  for (const p of batch) {
   try {
    if (!saved) throw first;
    const result = await repository.save({ state: p.mutate(clone(saved)), expectedRevision: revision });
    revision = result.revision; saved = clone(result);
   } catch (e) {
    lastError = e;
    // Falha passageira no meio: esta e as seguintes ficam pendentes para a próxima gravação.
    if (codeOf(e) !== 'validation') break;
    rejected.add(p.seq);
   }
   done = p.seq;
  }
  savedSeq = Math.max(savedSeq, done);
  pending = pending.filter(p => p.seq > done);
  if (saved) {
   try { local = reapply(saved); } catch { pending = []; local = clone(saved); }
   onState(local);
  }
  onError(message(lastError));
 }
 async function flush(mySeq: number): Promise<boolean> {
  if (savedSeq >= mySeq) return !rejected.has(mySeq);
  const covered = seq;
  const attempt = async (snapshot: StateV3, expected: number) => {
   const result = await repository.save({ state: snapshot, expectedRevision: expected });
   revision = result.revision; savedSeq = covered; saved = clone(result); pending = pending.filter(p => p.seq > covered);
   if (seq === covered && local) { local = clone(result); onState(local); }
  };
  try {
   await attempt(clone(local!), revision);
   return true;
  } catch (e) {
   if (isConflict(e)) {
    try {
     const fresh = await repository.read();
     saved = clone(fresh); revision = fresh.revision;
     local = reapply(fresh); onState(local);
     await attempt(clone(local), fresh.revision);
     return true;
    } catch (second) {
     // Conflito de novo: mantém as mutações para reaplicar na próxima gravação (comportamento de sempre).
     if (isConflict(second)) { onError(message(second)); return false; }
     if (!(await fail(covered, second))) return false;
     return savedSeq >= mySeq && !rejected.has(mySeq);
    }
   }
   if (!(await fail(covered, e))) return false;
   return savedSeq >= mySeq && !rejected.has(mySeq);
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
