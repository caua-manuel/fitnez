import { RepositoryError } from '../application/repository';
import type { Payload, StateV3 } from '../application/repository';
export const clone = <T>(value: T): T => structuredClone(value);
const fail = (message: string): never => { throw new RepositoryError('validation', message); };
export function object(v: unknown, name = 'objeto'): asserts v is Payload { if (v === null || typeof v !== 'object' || Array.isArray(v)) fail(`${name}: esperado objeto.`); }
function array(v: unknown, name: string): asserts v is any[] { if (!Array.isArray(v)) fail(`${name}: esperado lista.`); }
function text(v: unknown, name: string): asserts v is string { if (typeof v !== 'string') fail(`${name}: esperado texto.`); }
function bool(v: unknown, name: string) { if (typeof v !== 'boolean') fail(`${name}: esperado verdadeiro/falso.`); }
function number(v: unknown, name: string) { if (typeof v !== 'number' || !Number.isFinite(v)) fail(`${name}: esperado número finito.`); }
function integer(v: unknown, name: string) { number(v, name); if (!Number.isSafeInteger(v) || (v as number) < 0) fail(`${name}: inteiro inválido.`); }
export function civil(v: unknown) { text(v, 'Data'); const date = new Date(`${v}T12:00:00Z`); if (!/^\d{4}-\d{2}-\d{2}$/.test(v) || !Number.isFinite(date.getTime()) || date.toISOString().slice(0,10) !== v) fail('Data civil inválida.'); }
export function safeJson(value: unknown) {
 let nodes = 0;
 function walk(v: unknown, depth: number) {
  if (++nodes > 200000 || depth > 64) fail('Arquivo excede os limites de complexidade.');
  if (v === null || typeof v === 'string' || typeof v === 'boolean') return;
  if (typeof v === 'number') { number(v, 'Valor'); return; }
  if (typeof v !== 'object') fail('Valor não é JSON.');
  if (!Array.isArray(v) && Object.getPrototypeOf(v) !== Object.prototype && Object.getPrototypeOf(v) !== null) fail('Objeto não suportado.');
  for (const [k, child] of Object.entries(v as object)) { if (['__proto__','prototype','constructor'].includes(k)) fail('Arquivo contém chave perigosa.'); walk(child, depth + 1); }
 }
 walk(value, 0);
}
export function parse(textValue: string): Payload {
 if (new TextEncoder().encode(textValue).byteLength > 10 * 1024 * 1024) fail('O arquivo excede 10 MiB.');
 let v: unknown; try { v = JSON.parse(textValue); } catch { return fail('JSON inválido ou incompleto.'); }
 safeJson(v); object(v, 'Backup'); return v;
}
function records(v: unknown, name: string, validator: (v: any) => void) { object(v, name); Object.values(v).forEach(validator); }
function dates(v: unknown, name: string, validator: (v: any) => void) { object(v, name); Object.entries(v).forEach(([date, val]) => { civil(date); validator(val); }); }
export function validatePlan(p: unknown) { object(p, 'Plano'); records(p.ex, 'Exercícios', e => { object(e); text(e.n, 'Nome'); array(e.s,'Séries'); e.s.forEach((n: unknown)=>integer(n,'Séries')); array(e.r,'Repetições'); e.r.forEach((n: unknown)=>text(n,'Repetições')); text(e.m,'Tipo'); if (!['kg','bw','rep','s','kgs'].includes(e.m)) fail('Tipo de exercício inválido.'); if (e.rest !== undefined) number(e.rest,'Descanso'); if(e.t !== undefined) text(e.t,'Nota'); }); records(p.sess,'Treinos', s => { object(s); text(s.name,'Nome'); array(s.ex,'Exercícios do treino'); s.ex.forEach((x: unknown)=>text(x,'ID')); for(const k of ['sub','min']) if(s[k] !== undefined) text(s[k],k); }); array(p.order,'Ordem'); p.order.forEach((x: unknown)=>text(x,'ID')); if(p.alt!==undefined) text(p.alt,'Alternativo'); if(p.cond!==undefined) { array(p.cond,'Condomínio'); p.cond.forEach((x: unknown)=>text(x,'Item')); } }
function schedule(s: unknown) { array(s,'Rotina'); if(s.length!==7) fail('A rotina precisa de sete dias.'); s.forEach(d=>{ object(d); if(!['bjj','gym','volei','rest'].includes(d.k)) fail('Atividade inválida.'); if(d.k==='gym') text(d.s,'Treino'); if(d.gi!==undefined) bool(d.gi,'Kimono'); }); }
function log(v: unknown) { records(v,'Registros', rows=>{ array(rows,'Séries'); rows.forEach(row=>{ object(row); for(const k of ['kg','reps','time']) if(row[k]!==undefined) text(row[k],k); if(row.done!==undefined) bool(row.done,'Concluída'); }); }); }
function dietDay(d: unknown) { object(d,'Dieta'); for(const k of ['pick','eaten','skip']) if(d[k]!==undefined) records(d[k],k,x=> k==='pick'?text(x,k):bool(x,k)); if(d.water!==undefined) integer(d.water,'Água'); if(d.crea!==undefined) bool(d.crea,'Creatina'); }
function measurement(m: unknown) { object(m,'Medidas'); for(const k of ['p','c','b','t']) if(m[k]!==undefined) text(m[k],k); }
function day(d: unknown) { object(d,'Dia'); if(d.log!==undefined) log(d.log); if(d.done!==undefined) bool(d.done,'Concluído'); if(d.feel!==undefined) { number(d.feel,'Sensação'); if(d.feel<1||d.feel>5) fail('Sensação inválida.'); } if(d.over!==undefined) text(d.over,'Substituição'); if(d.cond!==undefined) records(d.cond,'Condomínio',x=>bool(x,'Item')); if(d.notes!==undefined) records(d.notes,'Notas',x=>text(x,'Nota')); if(d.diet!==undefined) dietDay(d.diet); }
function catalogDiet(d: unknown) { records(d,'Cardápio',options=>{ array(options,'Opções'); options.forEach(o=>{ object(o); text(o.name,'Refeição'); text(o.key,'Opção'); for(const k of ['kcal','p','c','g']) number(o[k],k); array(o.items,'Ingredientes'); o.items.forEach((x: unknown)=>text(x,'Ingrediente')); if(o.rec!==undefined) text(o.rec,'Receita'); }); }); }
function recipes(r: unknown) { array(r,'Receitas'); r.forEach(x=>{ object(x); text(x.id,'ID receita'); text(x.n,'Nome receita'); for(const k of ['ing','pas']) { array(x[k],k); x[k].forEach((y: unknown)=>text(y,k)); } }); }
export function noPhotos(v: Payload) { for(const k of ['photos','attachments','anexos','fotos']) if(v[k]!==undefined && v[k]!==null && (typeof v[k]!=='object' || Object.keys(v[k]).length)) fail('Fotos/anexos não são suportados nesta fase.'); }
export function validateLegacy(v: Payload) {
 noPhotos(v); if(v.v!==undefined && v.v!==1 && v.v!==2) { if(typeof v.v==='number'&&v.v>3) throw new RepositoryError('future-version','Este backup usa uma versão futura.'); fail('Versão legada inválida.'); }
 if(!['plan','log','meas','sched','diet','done','notes','start'].some(k=>v[k]!==undefined)) fail('Formato de backup desconhecido.');
 if(v.start!==undefined) civil(v.start); if(v.plan!==undefined) validatePlan(v.plan); if(v.sched!==undefined) schedule(v.sched);
 for(const field of ['log','done','feel','over','cond','notes','diet']) if(v[field]!==undefined) dates(v[field],field,x=>day({ [field]: x }));
 if(v.meas!==undefined) dates(v.meas,'Medidas',measurement); if(v.opt!==undefined) dates(v.opt,'Alternativas',x=>bool(x,'Alternativa')); if(v.ts!==undefined) number(v.ts,'Timestamp');
}
export function validateState(v: unknown): asserts v is StateV3 {
 safeJson(v); object(v); noPhotos(v); if(v.v!==3) { if(v.v>3) throw new RepositoryError('future-version','Este backup usa uma versão futura.'); fail('Estado v3 inválido.'); }
 integer(v.revision,'Revisão'); object(v.catalog); validatePlan(v.catalog.plan); integer(v.catalog.revision,'Revisão catálogo'); catalogDiet(v.catalog.diet); recipes(v.catalog.recipes);
 object(v.settings); civil(v.settings.start); schedule(v.settings.sched); if(!['auto','light','dark'].includes(v.settings.theme)) fail('Tema inválido.');
 object(v.history); dates(v.history.days,'Dias',day); dates(v.history.measurements,'Medidas',measurement); records(v.snapshots,'Snapshots',x=>object(x)); records(v.recovery,'Recuperação',x=>object(x)); object(v.meta); for(const k of ['initializedAt','updatedAt']) number(v.meta[k],k); bool(v.meta.migrationCompleted,'Migração'); for(const k of ['lastBackupGeneratedAt','lastBackupConfirmedAt']) if(v.meta[k]!==null) number(v.meta[k],k); noPhotos(v.catalog); noPhotos(v.history);
}
