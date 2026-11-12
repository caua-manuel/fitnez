import type { StateV3 } from '../application/repository';
import { RepositoryError } from '../application/repository';
import { clone, parse, validateState } from './validation';

// O orçamento usa a representação completa que será lida pela importação.
export function backupText(state: StateV3, time: number): string {
 validateState(state);
 const text=JSON.stringify({app:'treino12',v:3,exportedAt:time,state},null,2);
 try { parse(text); } catch(error) {
  if(error instanceof RepositoryError&&error.code==='validation')throw new RepositoryError('validation',`A operação excede a capacidade de backup e recuperação: ${error.message} Os dados anteriores foram mantidos; nenhum original foi truncado.`);
  throw error;
 }
 return text;
}
export function restoredState(current: StateV3, imported: StateV3, raw: string, time: number): StateV3 {
 const next=clone(imported);
 next.meta={...clone(current.meta),migrationCompleted:true,migrationStatus:'completed',migrationSources:[]};
 next.revision=current.revision+1;next.meta.updatedAt=time;
 const id=`r${current.revision}:${time}`;
 next.recovery={...next.recovery,...clone(current.recovery),[`before-import:${id}`]:{kind:'before-import',createdAt:time,state:clone(current)},[`import:${id}`]:{source:'import',raw}};
 return next;
}
export function transferableText(state: StateV3, empty: StateV3, time: number): string {
 const text=backupText(state,time);
 empty=clone(empty);
 // Reserva para instantes locais com representação numérica maior na instalação de destino.
 empty.meta.initializedAt=Number.MAX_VALUE;empty.meta.updatedAt=Number.MAX_VALUE;
 // Inclui bruto e snapshot anterior na prova de capacidade de restauração.
 backupText(restoredState(empty,state,text,time),time);
 return text;
}
