import seedPlan from '../../data/plan.json';
import seedDiet from '../../data/diet.json';
import seedRecipes from '../../data/recipes.json';
import type { Payload, StateV3 } from '../application/repository';
import { clone, noPhotos, parse, validateLegacy, validateState } from './validation';
import { RepositoryError } from '../application/repository';
import { defaultPlanStart } from '../domain/planStart';
export function foundation(now: number): StateV3 { return { v:3, revision:0, catalog:{plan:clone(seedPlan.plan),diet:clone(seedDiet),recipes:clone(seedRecipes),revision:0},settings:{start:defaultPlanStart(now),startConfirmed:false,sched:clone(seedPlan.sched),theme:'auto'},history:{days:{},measurements:{}},snapshots:{},recovery:{},meta:{initializedAt:now,updatedAt:now,migrationCompleted:true,migrationStatus:'none',migrationWarnings:[],lastBackupGeneratedAt:null,lastBackupConfirmedAt:null} }; }
export function migrate(v: Payload, now: number): StateV3 {
 validateLegacy(v); const s=foundation(now); if(v.plan!==undefined) s.catalog.plan=clone(v.plan); if(v.sched!==undefined) s.settings.sched=clone(v.sched); if(v.start!==undefined) { s.settings.start=v.start; s.settings.startConfirmed=true; }
 for(const field of ['log','done','feel','over','cond','notes','diet']) for(const [date,value] of Object.entries(v[field]??{})) { (s.history.days[date]??={})[field]=clone(value); }
 for(const [date,chosen] of Object.entries(v.opt??{})) if(chosen && s.history.days[date]?.over===undefined) (s.history.days[date]??={}).over=s.catalog.plan.alt??'LB';
 s.history.measurements=clone(v.meas??{}); s.snapshots['migration-catalog']={provenance:'migration',notice:'Catálogo recebido na migração; não comprova o plano de cada dia passado.',catalog:clone(s.catalog)};
 return s;
}
export function decode(text: string, now: number): { state: StateV3; version: 1|2|3 } {
 const data=parse(text); noPhotos(data);
 if(typeof data.v==='number'&&data.v>3) throw new RepositoryError('future-version','Este backup usa uma versão futura. Atualize o app antes de importar.');
 if(data.v===3) { if(data.app!=='treino12') throw new RepositoryError('validation','Identificador do backup inválido.'); if(typeof data.exportedAt!=='number'||!Number.isFinite(data.exportedAt)) throw new RepositoryError('validation','Data de exportação inválida.'); validateState(data.state); return {state:clone(data.state),version:3}; }
 return {state:migrate(data,now),version:data.v===1?1:2};
}
export function summary(s: StateV3) { return { days:Object.keys(s.history.days).length, measurements:Object.keys(s.history.measurements).length,exercises:Object.keys(s.catalog.plan.ex).length,sessions:Object.keys(s.catalog.plan.sess).length }; }

