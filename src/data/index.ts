import { RepositoryError } from '../application/repository';
import type { ImportPreview, Initialization, MigrationSource, Payload, Protection, Repository, RepositoryEvent, RepositoryOptions, StateV3 } from '../application/repository';
import { asError, completed, open, request } from './idb';
import { decode, foundation, migrate, summary } from './migration';
import { clone, parse, validateState } from './validation';
import { backupText, restoredState, transferableText } from './capacity';
import { repairStoredState } from './repair';
import { databaseName } from './names';
import { recoveryToPrune } from './recoveryPrune';
import { backupDue, hasUserData, nextUsage, usageAfterBackup } from '../domain/userData';
import { localDayOf } from '../domain/planStart';

/** Opções internas de src/data/: `demo` só é usada por createDemoRepository (assinatura meta.demo, ADR 011 M1). */
export type InternalRepositoryOptions = RepositoryOptions & { demo?: boolean };

export function createRepository(options: InternalRepositoryOptions = {}): Repository {
 const demo=options.demo===true;
 const now=options.now??Date.now;
 const base=options.basePath??import.meta.env.BASE_URL;
 const name=options.dbName??databaseName(base);
 const today=()=>localDayOf(now());
 const factory=options.indexedDB===undefined?globalThis.indexedDB:options.indexedDB;
 let legacy:RepositoryOptions['storage']=options.storage;
 let legacyAccessError=false;
 if(legacy===undefined) try { legacy=globalThis.localStorage; } catch { legacyAccessError=true; }
 const manager=options.storageManager===undefined?(typeof navigator!=='undefined'?navigator.storage:undefined):options.storageManager;
 let dbPromise:Promise<IDBDatabase>|undefined; let closed=false; let queue=Promise.resolve();
 const listeners=new Set<(event:RepositoryEvent)=>void>();
 const previews=new Map<string,{state:StateV3;raw:string;revision:number}>();
 let serial=0; let prepareSerial=0;
 const channel=typeof window!=='undefined'&&typeof BroadcastChannel!=='undefined'?new BroadcastChannel(name):null;
 const emit=(event:RepositoryEvent)=>listeners.forEach(fn=>{try{fn(event);}catch{/* Um consumidor não invalida commits. */}});
 if(channel) channel.onmessage=()=>emit({status:'external-change'});
 const focus=()=>emit({status:'external-change'});
 if(typeof window!=='undefined') window.addEventListener('focus',focus);
 async function db() { if(closed) throw new RepositoryError('unavailable','Reabra o app para acessar o armazenamento.'); if(!dbPromise) dbPromise=open(factory,name).then(connection=>{connection.onversionchange=()=>{connection.close(); dbPromise=undefined; emit({status:'error',error:new RepositoryError('blocked','O banco foi atualizado em outra aba. Reabra este app.')});};return connection;}).catch(e=>{dbPromise=undefined;throw e;}); return dbPromise; }
 const repairedRevisions=new Set<number>();
 async function readOptional():Promise<StateV3|undefined> { const stored=await readStored(); if(!stored)return undefined; if(!demo&&stored.meta&&'demo' in stored.meta)delete stored.meta.demo; // banco real nunca tem meta.demo
 const fixed=repairStoredState(stored,now()); if(fixed.repaired)repairedRevisions.add(fixed.state.revision); return fixed.state; }
 async function readStored():Promise<StateV3|undefined> { const connection=await db(); const tx=connection.transaction(['state','recovery'],'readonly'); const done=completed(tx); const states=request(tx.objectStore('state').get('active')); const keys=request(tx.objectStore('recovery').getAllKeys()); const values=request(tx.objectStore('recovery').getAll()); const [state,ids,records]=await Promise.all([states,keys,values]); await done; if(!state)return undefined; state.recovery={...state.recovery}; ids.forEach((id,i)=>{state.recovery[String(id)]=records[i];}); return clone(state); }
 async function read():Promise<StateV3> { const state=await readOptional(); if(!state) throw new RepositoryError('unavailable','Inicialize o armazenamento antes de continuar.'); return state; }
 function enqueue<T>(action:()=>Promise<T>):Promise<T> { const next=queue.then(action,action); queue=next.then(()=>undefined,()=>undefined); return next; }
 async function commit(expected:number|undefined,change:(current:StateV3|undefined)=>StateV3):Promise<StateV3> {
  emit({status:'saving'}); let tx:IDBTransaction|undefined; let done:Promise<void>|undefined;
  try {
   const previous=await readOptional();
   if(expected===undefined ? previous!==undefined : previous?.revision!==expected) throw new RepositoryError('conflict','Os dados mudaram em outra aba. Recarregue antes de tentar novamente.');
   const next=change(previous);
   // ADR 011 (M1): só o banco da demo guarda meta.demo; o real nunca.
   if(!demo&&next.meta&&'demo' in next.meta)delete next.meta.demo;
   // ADR 011 (M4): poda dos registros de desfazer na mesma transação.
   const drop=recoveryToPrune({...(previous?.recovery??{}),...next.recovery},next.settings); for(const id of drop)delete next.recovery[id];
   backupText(next,now()); // Preparação e validação completas antes da transação de escrita.
   const connection=await db(); tx=connection.transaction(['state','recovery'],'readwrite'); done=completed(tx); // Attach catch immediately: sync put failures also abort asynchronously.
   done.catch(()=>undefined);
   const stored=await request<StateV3|undefined>(tx.objectStore('state').get('active'));
   if(expected===undefined ? stored!==undefined : stored?.revision!==expected) throw new RepositoryError('conflict','Os dados mudaram em outra aba. Recarregue antes de tentar novamente.');
   for(const [id,value] of Object.entries(next.recovery)) tx.objectStore('recovery').put(clone(value),id);
   for(const id of drop) tx.objectStore('recovery').delete(id);
   tx.objectStore('state').put(clone(next),'active');
   await done;
   emit({status:'saved',revision:next.revision}); channel?.postMessage({revision:next.revision}); return clone(next);
  } catch(e) { try{tx?.abort();}catch{/* Já finalizada. */} if(done) await done.catch(()=>undefined); const error=asError(e);emit({status:'error',error});throw error; }
 }
 const ensureSelected=(s:StateV3)=>{if(!s.meta.migrationCompleted&&s.meta.migrationSources?.length) throw new RepositoryError('conflict','Escolha a origem da migração antes de alterar os dados.');};
 const bumped=(s:StateV3)=>{s.revision++;s.meta.updatedAt=now();return s;};
 function migrationResult(s:StateV3):Initialization { if(!s.meta.migrationCompleted&&Array.isArray(s.meta.migrationSources)&&s.meta.migrationSources.length) return {status:'migration-conflict',state:s,sources:clone(s.meta.migrationSources)}; return {status:'ready',state:s,warnings:clone(s.meta.migrationWarnings??[])}; }
 async function initialize():Promise<Initialization> { return enqueue(async()=>{
  const current=await readOptional();
  if(current) {
   // Estado salvo com perfil inválido (gravado antes da validação): grava o reparo uma vez, preservando o original em recovery.
   if(repairedRevisions.has(current.revision)) { try { return migrationResult(await commit(current.revision,previous=>{if(!previous)throw new RepositoryError('unavailable','Banco vazio.');return bumped(previous);})); } catch { /* Mantém a versão reparada só em memória; tenta de novo na próxima abertura. */ } }
   return migrationResult(current);
  }
  let s=foundation(now()); const warnings:string[]=[]; const candidates:{id:string;state:StateV3;version:1|2}[]=[];
  if(legacyAccessError) warnings.push('Não foi possível ler o armazenamento do protótipo. Importe um backup JSON para recuperar seus dados.');
  for(const key of ['treino12-v1','treino12-v2','treino-theme']) {
   let raw:string|null=null; try {raw=legacy?.getItem(key)??null;} catch {warnings.push(`Não foi possível ler ${key}.`);continue;}
   if(raw===null)continue;
   s.recovery[`legacy:${key}`]={source:key,raw,importedAt:now()};
   if(key==='treino-theme') { const theme=raw.replace(/^"|"$/g,''); if(['auto','light','dark'].includes(theme))s.settings.theme=theme as 'auto'|'light'|'dark';else warnings.push('Tema legado desconhecido preservado na recuperação.'); continue; }
   try { const value=parse(raw); if(value.v===undefined)value.v=key==='treino12-v1'?1:2; const state=migrate(value,now()); candidates.push({id:key,state,version:value.v===1?1:2}); }catch(e){warnings.push(`${key}: ${e instanceof Error?e.message:'Fonte inválida preservada.'}`);}
  }
  if(candidates.length) {
   const comparable=(x:StateV3)=>JSON.stringify({catalog:x.catalog,settings:{...x.settings,theme:'auto'},history:x.history});
   if(candidates.length===1||comparable(candidates[0].state)===comparable(candidates[1].state)) { const selected=candidates[candidates.length-1].state; selected.recovery=s.recovery;selected.settings.theme=s.settings.theme;s=selected; }
   else { s.meta.migrationCompleted=false; s.meta.migrationSources=candidates.map(c=>({id:c.id,label:c.id,version:c.version,...{days:summary(c.state).days,measurements:summary(c.state).measurements},warnings:[]} satisfies MigrationSource)); }
  }
  const hasLegacy=Object.keys(s.recovery).some(key=>key!=='legacy:treino-theme');
  s.meta.migrationStatus=candidates.length?(s.meta.migrationCompleted?'completed':'pending'):(hasLegacy?'invalid':'none');
  if(s.meta.migrationStatus==='invalid')s.meta.migrationCompleted=false;
  s.meta.migrationWarnings=warnings;
  try{s=await commit(undefined,()=>s);}catch(e){if(e instanceof RepositoryError&&e.code==='conflict')return migrationResult(await read());throw e;}
  return migrationResult(s);
 }); }
 function save(input:{state:StateV3;expectedRevision:number}) { const candidate=clone(input.state); validateState(candidate); return enqueue(()=>commit(input.expectedRevision,current=>{if(!current)throw new RepositoryError('unavailable','Banco vazio.');ensureSelected(current); const demoMark=demo&&input.state.meta?.demo===true;candidate.meta=clone(current.meta);if(demoMark)candidate.meta.demo=true;candidate.recovery={...candidate.recovery,...current.recovery};candidate.revision=current.revision;if(candidate.settings.start!==current.settings.start)candidate.settings.startConfirmed=true;
  // Dia de uso (ADR 011, 1.2): a contagem vai no mesmo estado desta gravação, sem transação extra.
  const usage=nextUsage(candidate.meta.usage,today());if(usage!==candidate.meta.usage)candidate.meta.usage=usage;
  bumped(candidate);const future=clone(candidate);future.revision=Number.MAX_SAFE_INTEGER;future.meta.updatedAt=Number.MAX_VALUE;future.meta.lastBackupGeneratedAt=Number.MAX_VALUE;transferableText(future,foundation(now()),Number.MAX_VALUE);return candidate;})); }
 async function prepareImport(text:string):Promise<ImportPreview> { const attempt=++prepareSerial;previews.clear();const candidate=decode(text,now()); if(candidate.state.meta?.demo===true)throw new RepositoryError('validation','Este arquivo veio da demonstração e não pode ser importado nos seus dados.'); const current=await read();ensureSelected(current);if(attempt!==prepareSerial)throw new RepositoryError('validation','A prévia expirou. Selecione o arquivo novamente.'); const token=globalThis.crypto?.randomUUID?.()??`${now()}-${++serial}-${Math.random().toString(36).slice(2)}`;previews.set(token,{state:clone(candidate.state),raw:text,revision:current.revision});return {token,sourceVersion:candidate.version,expectedRevision:current.revision,summary:summary(candidate.state),warnings:candidate.version<3?['Backup legado: o catálogo de migração não comprova o plano usado em cada registro passado.']:[]}; }
 function confirmImport(input:{token:string;expectedRevision:number}) { return enqueue(async()=>{ const preview=previews.get(input.token);if(!preview)throw new RepositoryError('validation','A prévia expirou. Selecione o arquivo novamente.');if(preview.revision!==input.expectedRevision)throw new RepositoryError('conflict','Os dados mudaram depois da prévia. Selecione o arquivo novamente.'); const state=await commit(input.expectedRevision,current=>{if(!current)throw new RepositoryError('unavailable','Banco vazio.');ensureSelected(current);return restoredState(current,preview.state,preview.raw,now());});previews.delete(input.token);return state; }); }
 function selectMigration(input:{sourceId:string;expectedRevision:number}) { return enqueue(()=>commit(input.expectedRevision,current=>{if(!current)throw new RepositoryError('unavailable','Banco vazio.');if(current.meta.migrationCompleted||!current.meta.migrationSources?.some((x:MigrationSource)=>x.id===input.sourceId))throw new RepositoryError('validation','Origem de migração inválida.'); const raw=current.recovery[`legacy:${input.sourceId}`]?.raw;if(typeof raw!=='string')throw new RepositoryError('validation','Origem preservada não encontrada.');const data=parse(raw);if(data.v===undefined)data.v=input.sourceId==='treino12-v1'?1:2;const next=migrate(data,now());next.settings.theme=current.settings.theme;next.recovery=clone(current.recovery);next.meta={...clone(current.meta),migrationCompleted:true,migrationStatus:'completed',migrationSources:[]};next.revision=current.revision;return bumped(next);})); }
 async function exportBackup() { return enqueue(async()=>{const s=await read();const generatedAt=now();const exported=clone(s);exported.meta.lastBackupGeneratedAt=generatedAt;exported.meta.updatedAt=generatedAt;exported.revision=s.revision+1;const text=transferableText(exported,foundation(generatedAt),generatedAt);const saved=await commit(s.revision,current=>{if(!current)throw new RepositoryError('unavailable','Banco vazio.');current.meta.lastBackupGeneratedAt=generatedAt;return bumped(current);});return {text,filename:`treino12-backup-${new Date(generatedAt).toISOString().slice(0,10)}-r${saved.revision}.json`,generatedAt,revision:saved.revision};}); }
 function confirmBackup(input:{expectedRevision:number}) { return enqueue(()=>commit(input.expectedRevision,current=>{if(!current)throw new RepositoryError('unavailable','Banco vazio.');ensureSelected(current);if(current.meta.lastBackupGeneratedAt===null||current.meta.lastBackupGeneratedAt>now())throw new RepositoryError('validation','Gere e guarde um backup antes de confirmar.');current.meta.lastBackupConfirmedAt=now();current.meta.usage=usageAfterBackup(current.meta.usage,today());return bumped(current);})); }
 async function protection(input:{requestPersistence?:boolean}={}):Promise<Protection> { const s=await read();let persistence:Protection['persistence']='unavailable';let usage:number|undefined;let quota:number|undefined;let message:string|undefined;
  try {if(manager?.persisted)persistence=await manager.persisted()?'granted':'not-requested';if(input.requestPersistence){persistence=manager?.persist?await manager.persist()?'granted':'denied':'unavailable';}}catch{persistence='error';message='Não foi possível verificar ou solicitar armazenamento persistente.';}
  try {if(manager?.estimate){const estimate=await manager.estimate();usage=estimate.usage;quota=estimate.quota;}}catch{message='Não foi possível estimar o espaço disponível.';}
  const confirmed=s.meta.lastBackupConfirmedAt;return {persistence,usage,quota,message,lastBackupGeneratedAt:s.meta.lastBackupGeneratedAt,lastBackupConfirmedAt:confirmed,backupDue:backupDue({usage:s.meta.usage,lastBackupConfirmedAt:confirmed,hasUserData:hasUserData(s),snoozedOn:s.meta.prompts?.backupSnoozedOn,today:today()})};
 }
 // Gravações só de meta (ADR 011): não contam como dia de uso; mesma transação e conferência de revisão de sempre.
 function prompts(expectedRevision:number,change:(p:NonNullable<StateV3['meta']['prompts']>)=>void) { return enqueue(()=>commit(expectedRevision,current=>{if(!current)throw new RepositoryError('unavailable','Banco vazio.');ensureSelected(current);const p={...(current.meta.prompts??{})};change(p);current.meta.prompts=p;return bumped(current);})); }
 function snoozeBackup(input:{expectedRevision:number}) { return prompts(input.expectedRevision,p=>{p.backupSnoozedOn=today();}); }
 function markPrompt(input:{prompt:'persist'|'install';expectedRevision:number}) { if(input.prompt!=='persist'&&input.prompt!=='install')return Promise.reject(new RepositoryError('validation','Pedido desconhecido.')); return prompts(input.expectedRevision,p=>{if(input.prompt==='persist')p.persistAskedAt=now();else p.installShownAt=now();}); }
 return {initialize,read,save,subscribe(fn){listeners.add(fn);return()=>{listeners.delete(fn);};},export:exportBackup,prepareImport,confirmImport,selectMigration,confirmBackup,protection,snoozeBackup,markPrompt,close(){closed=true;channel?.close();if(typeof window!=='undefined')window.removeEventListener('focus',focus);dbPromise?.then(x=>x.close()).catch(()=>undefined);listeners.clear();previews.clear();}};
}


