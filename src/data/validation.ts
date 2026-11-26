import { RepositoryError } from '../application/repository';
import type { Payload, StateV3 } from '../application/repository';
import { isValidDietTargetsSetting } from '../domain/dietTargets';
import { LIMITS as L } from '../domain/limits';
import { checkStoredProfile } from '../domain/profile';
import { checkStoredOnboarding } from '../domain/onboarding';
import { checkStoredExerciseNotes } from '../domain/exerciseNotesCheck';
import { checkStoredPlates } from '../domain/plates';
import { USAGE_MAX } from '../domain/userData';
export const clone = <T>(value: T): T => structuredClone(value);
const fail = (message: string): never => { throw new RepositoryError('validation', message); };
export function object(v: unknown, name = 'objeto'): asserts v is Payload { if (v === null || typeof v !== 'object' || Array.isArray(v)) fail(`${name}: esperado objeto.`); }
function array(v: unknown, name: string): asserts v is any[] { if (!Array.isArray(v)) fail(`${name}: esperado lista.`); }
function text(v: unknown, name: string, max?: number): asserts v is string { if (typeof v !== 'string') fail(`${name}: esperado texto.`); else if (max !== undefined && v.length > max) fail(`${name}: use no máximo ${max} caracteres (recebido: ${v.length}).`); }
function cap(n: number, max: number, name: string) { if (n > max) fail(`${name}: no máximo ${max} itens (recebido: ${n}).`); }
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
function records(v: unknown, name: string, validator: (v: any) => void, max: number = L.perDayEntries) { object(v, name); cap(Object.keys(v).length, max, name); Object.values(v).forEach(validator); }
function dates(v: unknown, name: string, validator: (v: any) => void, max: number = L.days) { object(v, name); cap(Object.keys(v).length, max, name); Object.entries(v).forEach(([date, val]) => { civil(date); validator(val); }); }
function list(v: unknown, name: string, max: number, item: (x: any) => void) { array(v, name); cap(v.length, max, name); v.forEach(item); }
export function validatePlan(p: unknown) {
 object(p, 'Plano');
 records(p.ex, 'Exercícios', e => { object(e); text(e.n, 'Nome do exercício', L.name); list(e.s, 'Séries', L.seriesColumns, n => integer(n, 'Séries')); list(e.r, 'Repetições', L.seriesColumns, n => text(n, 'Repetições', L.value)); text(e.m, 'Tipo'); if (!['kg','bw','rep','s','kgs'].includes(e.m)) fail('Tipo de exercício inválido.'); if (e.rest !== undefined) number(e.rest, 'Descanso'); if (e.t !== undefined) text(e.t, 'Observação do exercício', L.exerciseNote); if (e.g !== undefined) text(e.g, 'Grupo muscular', L.id); }, L.exercises);
 records(p.sess, 'Treinos', s => { object(s); text(s.name, 'Nome do treino', L.name); list(s.ex, 'Exercícios do treino', L.sessionExercises, x => text(x, 'ID', L.id)); if (s.sub !== undefined) text(s.sub, 'Descrição do treino', L.sub); if (s.min !== undefined) text(s.min, 'Duração do treino', L.min); }, L.sessions);
 list(p.order, 'Ordem', L.order, x => text(x, 'ID', L.id)); if (p.alt !== undefined) text(p.alt, 'Alternativo', L.id); if (p.rir !== undefined) { list(p.rir, 'RIR do plano', 12, x => text(x, 'RIR', L.value)); if (p.rir.length !== 12) fail('RIR do plano: são 12 semanas.'); } if (p.cond !== undefined) list(p.cond, 'Condomínio', L.planList, x => text(x, 'Item', L.line));
}
function schedule(s: unknown) { array(s,'Rotina'); if(s.length!==7) fail('A rotina precisa de sete dias.'); s.forEach(d=>{ object(d); if(!['bjj','gym','volei','esporte','rest'].includes(d.k)) fail('Atividade inválida.'); if(d.k==='gym') text(d.s,'Treino',L.id); if(d.k==='esporte'&&d.label!==undefined) text(d.label,'Nome do esporte',L.sportLabel); if(d.gi!==undefined) bool(d.gi,'Kimono'); }); }
function log(v: unknown) { records(v, 'Registros', rows => { list(rows, 'Séries', L.rowsPerExercise, row => { object(row); for (const k of ['kg','reps','time']) if (row[k] !== undefined) text(row[k], k, L.value); if (row.done !== undefined) bool(row.done, 'Concluída'); if (row.kind !== undefined && row.kind !== 'warm') fail('Tipo de série inválido.'); }); }, L.exercisesPerDay); }
function dietDay(d: unknown) { object(d,'Dieta'); for(const k of ['pick','eaten','skip']) if(d[k]!==undefined) records(d[k],k,x=> k==='pick'?text(x,k,L.value):bool(x,k)); if(d.water!==undefined) integer(d.water,'Água'); if(d.crea!==undefined) bool(d.crea,'Creatina'); }
function measurement(m: unknown) { object(m,'Medidas'); for(const k of ['p','c','b','t']) if(m[k]!==undefined) text(m[k],k,L.value); }
function workoutMeta(w: unknown) { object(w, 'Treino do dia'); text(w.sessionId, 'Treino do dia', L.id); if (!['partial','done'].includes(w.status)) fail('Treino do dia: situação inválida.'); for (const k of ['startedAt','finishedAt','sets','volume']) if (w[k] !== undefined) number(w[k], k); }
function day(d: unknown) {
 object(d,'Dia'); if(d.log!==undefined) log(d.log); if(d.done!==undefined) bool(d.done,'Concluído'); if(d.feel!==undefined) { number(d.feel,'Sensação'); if(d.feel<1||d.feel>5) fail('Sensação inválida.'); } if(d.over!==undefined) text(d.over,'Substituição',L.id); if(d.cond!==undefined) records(d.cond,'Condomínio',x=>bool(x,'Item')); if(d.notes!==undefined) records(d.notes,'Notas',x=>text(x,'Nota',L.dayNote)); if(d.diet!==undefined) dietDay(d.diet); if(d.swaps!==undefined) records(d.swaps,'Trocas do dia',x=>text(x,'Troca do dia',L.id),L.sessionExercises);
 if (d.workout !== undefined) workoutMeta(d.workout); if (d.workouts !== undefined) records(d.workouts, 'Treinos do dia', workoutMeta, L.workoutsPerDay);
 if (d.acts !== undefined) { object(d.acts, 'Atividades'); for (const k of ['gym','bjj','volei','esporte','cond']) if (d.acts[k] !== undefined) bool(d.acts[k], 'Atividade'); }
}
function catalogDiet(d: unknown) { records(d, 'Cardápio', options => { list(options, 'Opções', L.optionsPerMeal, o => { object(o); text(o.name, 'Refeição', L.name); text(o.key, 'Opção', L.id); for (const k of ['kcal','p','c','g']) number(o[k], k); list(o.items, 'Ingredientes', L.optionItems, x => text(x, 'Ingrediente', L.line)); if (o.rec !== undefined) text(o.rec, 'Receita', L.id); if (o.edited !== undefined) bool(o.edited, 'Edição da opção'); if (o.foods !== undefined) list(o.foods, 'Alimentos da opção', 8, x => { object(x, 'Alimento'); text(x.id, 'Alimento', 40); if (!/^[a-z0-9_-]{1,40}$/.test(x.id)) fail('Alimento: id inválido.'); number(x.qty, 'Quantidade'); if (x.qty < 0 || x.qty > 2000) fail('Quantidade do alimento fora do limite.'); }); }); }, L.meals); }
function recipes(r: unknown) { list(r, 'Receitas', L.recipes, x => { object(x); text(x.id, 'ID receita', L.id); text(x.n, 'Nome receita', L.name); for (const k of ['t','uso','dica']) if (x[k] !== undefined) text(x[k], k, L.recipeText); for (const k of ['ing','pas']) list(x[k], k, L.recipeLines, y => text(y, k, L.line)); }); }
function settings(s: unknown) {
 object(s, 'Configurações'); civil(s.start); if(s.startConfirmed!==undefined) bool(s.startConfirmed,'Início confirmado'); if(s.dietTargets!==undefined && !isValidDietTargetsSetting(s.dietTargets)) fail('As metas de dieta do backup são inválidas.'); schedule(s.sched);
 if(!['auto','light','dark'].includes(s.theme)) fail('Tema inválido.');
 if (s.notifications !== undefined) { object(s.notifications, 'Notificações'); bool(s.notifications.enabled, 'Notificações'); bool(s.notifications.restEnd, 'Aviso de descanso'); }
 if (s.sleepOk !== undefined) records(s.sleepOk, 'Sono', x => bool(x, 'Sono'), L.sleepWeeks);
 if (s.dietReviewDismissed !== undefined) text(s.dietReviewDismissed, 'Revisão da dieta', L.id);
 if (s.onboarding !== undefined) { const why = checkStoredOnboarding(s.onboarding, L.id, L.sportLabel); if (why) fail(`Assistente do backup inválido. ${why}`); }
 if (s.exerciseNotes !== undefined) { const why = checkStoredExerciseNotes(s.exerciseNotes); if (why) fail(`Notas dos exercícios do backup inválidas: ${why}`); }
 if (s.plates !== undefined) { const why = checkStoredPlates(s.plates); if (why) fail(`Anilhas do backup inválidas: ${why}`); }
 if (s.profile !== undefined) { const first = Object.values(checkStoredProfile(s.profile))[0]; if (first) fail(`Perfil do backup inválido. ${first}`); }
 if (s.planImport !== undefined) planImport(s.planImport);
}
// ADR 011: campos opcionais; validados só quando presentes (backups v3 antigos continuam válidos).
function planImport(p: unknown) { object(p, 'Plano importado'); if (p.v !== 1) fail('Plano importado: versão inválida.'); civil(p.appliedOn); text(p.name, 'Nome do plano importado', L.name); if (p.undoKey !== undefined) text(p.undoKey, 'Desfazer plano importado', L.id); }
function usage(u: unknown) { object(u, 'Dias de uso'); civil(u.lastDay); integer(u.daysSinceBackup, 'Dias de uso'); if (u.daysSinceBackup > USAGE_MAX) fail(`Dias de uso: no máximo ${USAGE_MAX}.`); }
function prompts(p: unknown) { object(p, 'Pedidos'); for (const k of ['persistAskedAt', 'installShownAt']) if (p[k] !== undefined) { number(p[k], k); if (p[k] < 0) fail(`${k}: instante inválido.`); } if (p.backupSnoozedOn !== undefined) civil(p.backupSnoozedOn); }
export function noPhotos(v: Payload) { for(const k of ['photos','attachments','anexos','fotos']) if(v[k]!==undefined && v[k]!==null && (typeof v[k]!=='object' || Object.keys(v[k]).length)) fail('Fotos/anexos não são suportados nesta fase.'); }
export function validateLegacy(v: Payload) {
 noPhotos(v); if(v.v!==undefined && v.v!==1 && v.v!==2) { if(typeof v.v==='number'&&v.v>3) throw new RepositoryError('future-version','Este backup usa uma versão futura.'); fail('Versão legada inválida.'); }
 if(!['plan','log','meas','sched','diet','done','notes','start'].some(k=>v[k]!==undefined)) fail('Formato de backup desconhecido.');
 if(v.start!==undefined) civil(v.start); if(v.plan!==undefined) validatePlan(v.plan); if(v.sched!==undefined) schedule(v.sched);
 for(const field of ['log','done','feel','over','cond','notes','diet']) if(v[field]!==undefined) dates(v[field],field,x=>day({ [field]: x }));
 if(v.meas!==undefined) dates(v.meas,'Medidas',measurement,L.measurements); if(v.opt!==undefined) dates(v.opt,'Alternativas',x=>bool(x,'Alternativa')); if(v.ts!==undefined) number(v.ts,'Timestamp');
}
function snapshotsAndRecovery(v: Payload) {
 records(v.snapshots, 'Snapshots', x => { object(x, 'Snapshot'); if (JSON.stringify(x).length > L.snapshotChars) fail(`Snapshot: excede ${L.snapshotChars} caracteres.`); }, L.snapshots);
 records(v.recovery, 'Recuperação', x => object(x, 'Recuperação'), L.recovery);
}
export function validateState(v: unknown): asserts v is StateV3 {
 safeJson(v); object(v); noPhotos(v); if(v.v!==3) { if(v.v>3) throw new RepositoryError('future-version','Este backup usa uma versão futura.'); fail('Estado v3 inválido.'); }
 integer(v.revision,'Revisão'); object(v.catalog); validatePlan(v.catalog.plan); integer(v.catalog.revision,'Revisão catálogo'); catalogDiet(v.catalog.diet); recipes(v.catalog.recipes);
 settings(v.settings);
 object(v.history); dates(v.history.days,'Dias',day); dates(v.history.measurements,'Medidas',measurement,L.measurements); snapshotsAndRecovery(v); object(v.meta); for(const k of ['initializedAt','updatedAt']) number(v.meta[k],k); bool(v.meta.migrationCompleted,'Migração'); for(const k of ['lastBackupGeneratedAt','lastBackupConfirmedAt']) if(v.meta[k]!==null) number(v.meta[k],k); if(v.meta.usage!==undefined) usage(v.meta.usage); if(v.meta.prompts!==undefined) prompts(v.meta.prompts); if(v.meta.demo!==undefined) bool(v.meta.demo,'Demonstração'); noPhotos(v.catalog); noPhotos(v.history);
}
