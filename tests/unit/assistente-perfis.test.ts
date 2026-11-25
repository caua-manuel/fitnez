import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import seedPlan from '../../data/plan.json';
import type { Exercise } from '../../src/application/repository';
import { RIR } from '../../src/domain/calendar';
import { ALL_DAY_TYPES, ANY_DAY_TYPE_LABEL } from '../../src/domain/dietTargets';
import type { AnyDayType } from '../../src/domain/dayActivity';
import { RIR_BEGINNER } from '../../src/domain/calendar';
import { RIR_CONSERVADOR, bmiOf, buildDietTargetsFromAnswers, buildOnboardingPreview, buildPlanFromAnswers, safetyFlagsOf } from '../../src/domain/onboarding';
import type { OnboardingAnswers } from '../../src/domain/onboarding';

// QA (Fase 1, item 6): 10 perfis fictícios passados pelo código real do assistente de início, para revisão
// do agente conteudo-treino-nutricao. Sem dados de pessoas reais.
// A tabela docs/revisao/assistente-10-perfis.md só é escrita com GERAR_TABELA_PERFIS=1.
// As asserções de sanidade rodam sempre.

const catalog = (seedPlan as any).plan.ex as Record<string, Exercise>;
const DIA = ['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom'];

interface Perfil { id: number; titulo: string; answers: OnboardingAnswers; estranho: string }

const PERFIS: Perfil[] = [
 {
  id: 1, titulo: 'Adolescente (16) querendo massa, 4 dias',
  answers: { safety: ['nenhum'], goal: 'massa', experience: 'iniciante', daysPerWeek: 4, duration: 'medio', place: 'academia', activities: [], body: { sex: 'm', age: 16, heightCm: 172, weightKg: 61, lifestyle: 'moderado' } },
  estranho: 'Pediu 4 dias como iniciante; a idade (16) virou "menor18" sem marcar no passo 0 e o treino segue as regras de "nunca treinou", com os 4 dias pedidos (ADR 014, sem teto por experiência). Sem metas de dieta (motivo: segurança). ADR 012: afundo e Pallof com "Repetições por perna/lado." na observação.'
 },
 {
  id: 2, titulo: 'Idosa (67), saúde, nunca treinou, em casa sem equipamento',
  answers: { safety: ['nenhum'], goal: 'saude', experience: 'nunca', daysPerWeek: 2, duration: 'curto', place: 'casa_livre', activities: [], body: { sex: 'f', age: 67, heightCm: 158, weightKg: 66, lifestyle: 'pouco' } },
  estranho: 'ADR 012: aviso idade60, RIR conservador, sentar e levantar da cadeira no lugar do agachamento livre, ponte com as duas pernas, sem stiff com uma perna nem flexão pike. Repetições do catálogo e 90 s nos principais sem carga. Descanso com 1.400 kcal: é manutenção (objetivo saúde), não o piso.'
 },
 {
  id: 3, titulo: 'IMC baixo (17) querendo perder, casa com equipamento',
  answers: { safety: ['nenhum'], goal: 'perder', experience: 'iniciante', daysPerWeek: 3, duration: 'medio', place: 'casa_equip', activities: [], body: { sex: 'nao_informar', age: 27, heightCm: 176, weightKg: 52.5, lifestyle: 'moderado' } },
  estranho: 'Objetivo "perder" trocado para "saúde" com aviso imc-baixo (sem déficit). Sexo "não informar" usa constante intermediária (-78) na TMB. Gordura no piso de 40 g (mantido no ADR 012). Puxada com elástico (principal sem carga): 90 s.'
 },
 {
  id: 4, titulo: 'IMC alto (36) querendo massa, intermediário, 5 dias longos',
  answers: { safety: ['nenhum'], goal: 'massa', experience: 'intermediario', daysPerWeek: 5, duration: 'longo', place: 'academia', activities: [], body: { sex: 'm', age: 34, heightCm: 175, weightKg: 110, lifestyle: 'pouco' } },
  estranho: 'Objetivo "massa" trocado para "saúde" com aviso imc-alto-massa. Proteína e gordura pelo peso de referência (IMC 25 = 76,6 kg); a sanidade passou a ser 1,4 a 2,2 g/kg desse peso (ADR 012). ADR 014: 5 dias viram Superior, Pernas A, Empurrar, Puxar e Pernas B, com só 2 dias de pernas (antes Corpo inteiro A ia para domingo).'
 },
 {
  id: 5, titulo: 'Gestante, iniciante, academia',
  answers: { safety: ['gestacao'], goal: 'perder', experience: 'iniciante', daysPerWeek: 3, duration: 'medio', place: 'academia', activities: [], body: { sex: 'f', age: 31, heightCm: 165, weightKg: 72, lifestyle: 'moderado' } },
  estranho: 'ADR 012: gestação não gera plano nem metas (blocked: gestacao). A tela mostra texto próprio, sem "Começar o plano".'
 },
 {
  id: 6, titulo: 'Condição de saúde, perder, intermediário, 4 dias',
  answers: { safety: ['condicao'], goal: 'perder', experience: 'intermediario', daysPerWeek: 4, duration: 'medio', place: 'academia', activities: [], body: { sex: 'm', age: 52, heightCm: 180, weightKg: 98, lifestyle: 'pouco' } },
  estranho: 'ADR 012: plano leve (experiência usada "nunca"; 4 treinos, como pediu, desde o ADR 014), RIR conservador, ponte com halter no lugar do hip thrust com barra e confirmação obrigatória da liberação médica (requiresClearance, não gravada). Sem metas de dieta.'
 },
 {
  id: 7, titulo: 'Lutador, recomp, intermediário, pediu 6 dias longos',
  answers: { safety: ['nenhum'], goal: 'recomp', experience: 'intermediario', daysPerWeek: 6, duration: 'longo', place: 'academia', activities: [{ kind: 'luta', days: [1, 3] }], body: { sex: 'm', age: 26, heightCm: 178, weightKg: 80, lifestyle: 'muito' } },
  estranho: 'Pediu 6 dias; as 2 lutas reduziram a 4 treinos para sobrar 1 dia de descanso (daysReason: atividades). ADR 012: Pernas B passa de sábado para domingo, para não ficar no dia seguinte a Pernas A. Jiu-jitsu tem a maior kcal da semana.'
 },
 {
  id: 8, titulo: 'Nunca treinou, perder, pediu 6 dias de 60 a 90 min',
  answers: { safety: ['nenhum'], goal: 'perder', experience: 'nunca', daysPerWeek: 6, duration: 'longo', place: 'academia', activities: [], body: { sex: 'f', age: 22, heightCm: 163, weightKg: 58, lifestyle: 'pouco' } },
  estranho: 'ADR 012: quem nunca treinou com 60 a 90 min recebe 45 a 60 min (6 exercícios) e aviso duracao-reduzida. ADR 014: recebe os 6 dias pedidos (Empurrar, Puxar e Pernas duas vezes, 2 séries por exercício no bloco 1). kcal no piso de 1.400 em dia de descanso (mantido).'
 },
 {
  id: 9, titulo: 'Corredor(a), massa, iniciante, casa com equipamento, treino curto',
  answers: { safety: ['nenhum'], goal: 'massa', experience: 'iniciante', daysPerWeek: 4, duration: 'curto', place: 'casa_equip', activities: [{ kind: 'corrida', days: [5, 6] }], body: { sex: 'nao_informar', age: 44, heightCm: 171, weightKg: 70, lifestyle: 'moderado' } },
  estranho: 'Corrida entra como "esporte" (+300 kcal, mantido). ADR 012: Pernas B passa de sexta (véspera da corrida) para quinta e Superior B para sexta. Pernas A e B com os mesmos 4 exercícios em outra ordem: limite do catálogo (mantido).'
 },
 {
  id: 10, titulo: 'Semana cheia (luta + corrida em 6 dias), sem peso e altura',
  answers: { safety: ['nenhum'], goal: 'recomp', experience: 'intermediario', daysPerWeek: 5, duration: 'longo', place: 'casa_livre', activities: [{ kind: 'luta', days: [0, 2, 4] }, { kind: 'corrida', days: [1, 3, 5] }], body: { sex: 'f', age: 38 } },
  estranho: 'Semana cheia: 2 treinos curtos fora da rotina, duração "longo" ignorada (decisão do dono). Sem metas de dieta por falta de altura e peso. ADR 012: remada com mochila mantém a faixa do catálogo (10–15/10–15/8–12) e os principais sem carga têm 90 s.'
 }
];

// ---------- formatação ----------
const br = (n: number, d = 1) => n.toLocaleString('pt-BR', { maximumFractionDigits: d });
const seq = <T,>(xs: readonly T[]) => xs.join('/');
const unidade = (m: string) => (m === 's' ? ' s' : '');

function resumoEntrada(a: OnboardingAnswers): string {
 const b = a.body ?? {};
 const fis = [b.sex ? `sexo ${b.sex}` : 'sexo -', b.age !== undefined ? `${b.age} anos` : 'idade -', b.heightCm !== undefined ? `${b.heightCm} cm` : 'altura -', b.weightKg !== undefined ? `${br(b.weightKg)} kg` : 'peso -', b.lifestyle ? `rotina ${b.lifestyle}` : 'rotina -'];
 if (b.heightCm !== undefined && b.weightKg !== undefined) fis.push(`IMC ${br(bmiOf(b.weightKg, b.heightCm))}`);
 const acts = a.activities.length ? a.activities.map(x => `${x.kind} ${x.days.map(d => DIA[d]).join('+')}`).join(', ') : 'nenhuma';
 return `segurança: ${a.safety.join('+')}; objetivo ${a.goal}; experiência ${a.experience}; ${a.daysPerWeek} dias; duração ${a.duration}; local ${a.place}; atividades fixas: ${acts}; ${fis.join(', ')}`;
}

/** Peso de referência da proteína: o peso de IMC 25 quando o IMC passa de 30; senão o peso informado. */
function refWeight(a: OnboardingAnswers): number | null {
 const w = a.body?.weightKg, h = a.body?.heightCm;
 if (typeof w !== 'number' || typeof h !== 'number') return null;
 return bmiOf(w, h) > 30 ? 25 * (h / 100) ** 2 : w;
}

/** Problemas de sanidade de um perfil (vazio = passou). */
function sanidade(p: Perfil): string[] {
 const out: string[] = [];
 const prev = buildOnboardingPreview(p.answers, catalog);
 const g = prev.generated;
 const num = (label: string, v: unknown) => { if (typeof v !== 'number' || !Number.isFinite(v) || v < 0) out.push(`${label} inválido (${String(v)})`); };
 const flags = safetyFlagsOf(p.answers);
 // ADR 012: gestação não gera plano; qualquer outro perfil precisa de plano.
 if (flags.includes('gestacao') !== (prev.blocked === 'gestacao')) out.push(`bloqueio inesperado (${String(prev.blocked)})`);
 if (!g) { if (!prev.blocked) out.push('plano ausente sem bloqueio'); }
 else for (const key of g.plan.order) {
  const s = g.plan.sess[key];
  if (!s || s.ex.length === 0) out.push(`sessão ${key} vazia`);
  for (const id of s?.ex ?? []) {
   const e = g.plan.ex[id];
   if (!e) { out.push(`exercício ${id} ausente em ${key}`); continue; }
   if (e.s.length !== 3) out.push(`${id}: séries sem 3 blocos`);
   e.s.forEach((n, i) => { num(`${id}.s[${i}]`, n); if (n === 0) out.push(`${id}.s[${i}] = 0`); });
   num(`${id}.rest`, e.rest);
   if (e.r.some(r => !r || /NaN|undefined/.test(r))) out.push(`${id}: repetições inválidas`);
  }
 }
 if (g) {
  for (const d of g.sched) if (d.k === 'gym' && !g.plan.sess[d.s as string]) out.push(`rotina aponta para treino inexistente ${String(d.s)}`);
  if (g.plan.order.length === 0) out.push('nenhum treino gerado');
 }
 const d = prev.diet;
 if (d.kind === 'targets') {
  for (const t of ALL_DAY_TYPES) {
   const row = (d.targets.days as Record<AnyDayType, { kcal: number; carbs: number }>)[t];
   num(`kcal ${t}`, row?.kcal); num(`carbo ${t}`, row?.carbs);
   if (row && (row.kcal < 1200 || row.kcal > 4500)) out.push(`kcal ${t} = ${row.kcal} fora de 1200 a 4500`);
  }
  num('proteína', d.targets.proteinG); num('gordura', d.targets.fatG); num('água', d.targets.waterL);
  const ref = refWeight(p.answers);
  if (ref && typeof d.targets.proteinG === 'number') {
   // ADR 012 (2.6): 1,4 a 2,2 g/kg do peso de referência (IMC acima de 30 usa o peso de IMC 25).
   const gkg = d.targets.proteinG / ref;
   if (gkg < 1.4 || gkg > 2.2) out.push(`proteína ${br(gkg, 2)} g/kg do peso de referência fora de 1,4 a 2,2`);
  }
 }
 if ((flags.includes('menor18') || flags.includes('gestacao')) && d.kind === 'targets') out.push('menor de 18 ou gestação recebeu meta calórica');
 return out;
}

function rirTexto(rir: readonly string[] | undefined): string {
 if (!rir) return `padrão do plano: ${seq(RIR)}`;
 const nome = seq(rir) === seq(RIR_CONSERVADOR) ? 'conservador' : seq(rir) === seq(RIR_BEGINNER) ? 'iniciante' : 'próprio';
 return `${nome}: ${seq(rir)}`;
}

function blocoPerfil(p: Perfil, problemas: string[]): string {
 const prev = buildOnboardingPreview(p.answers, catalog);
 const g = prev.generated;
 const L: string[] = [];
 L.push(`## Perfil ${p.id}: ${p.titulo}`, '');
 L.push(`**Entrada:** ${resumoEntrada(p.answers)}`, '');
 L.push('| Campo | Saída |', '| --- | --- |');
 if (!g) {
  L.push(`| Plano | não gerado (blocked: ${String(prev.blocked)}) |`);
  L.push(`| Avisos | ${prev.warnings.length ? prev.warnings.join(', ') : 'nenhum'} |`);
  L.push(`| Dieta | não gera metas (motivo: ${prev.diet.kind === 'none' ? prev.diet.reason : '-'}); objetivo usado: ${prev.diet.effectiveGoal} |`);
  L.push(`| Sanidade | ${problemas.length ? `**FALHOU:** ${problemas.join('; ')}` : 'passou'} |`);
  L.push(`| Estranho? | ${p.estranho} |`, '');
  return L.join('\n');
 }
 L.push(`| Experiência usada | ${g.experience} |`);
 L.push(`| Treinos na divisão / na rotina | ${g.gymDays} / ${g.scheduledGymDays} |`);
 L.push(`| Motivo do corte de dias | ${g.daysReason ?? 'nenhum'} |`);
 L.push(`| Duração usada | ${g.duration} |`);
 L.push(`| Liberação médica obrigatória | ${prev.requiresClearance ? 'sim (não gravada)' : 'não'} |`);
 L.push(`| Semana | ${g.sched.map((d, i) => `${DIA[i]}: ${d.k === 'gym' ? g.plan.sess[d.s as string]?.name : d.k === 'bjj' ? 'Jiu-jitsu' : d.k === 'esporte' ? String(d.label) : 'descanso'}`).join('; ')} |`);
 for (const key of g.plan.order) {
  const s = g.plan.sess[key];
  const exs = s.ex.map(id => { const e = g.plan.ex[id]; const por = /^Repetições por (perna|lado)\./.exec(e.t ?? '')?.[1]; return `${e.n}: ${seq(e.s)} × ${seq(e.r)}${unidade(e.m)}${por ? ` por ${por}` : ''}, desc. ${e.rest ?? '-'} s`; });
  L.push(`| ${s.name} (${s.min}, ${s.ex.length} exercícios) | ${exs.join('<br>')} |`);
 }
 L.push(`| RIR por semana (1 a 12) | ${rirTexto(g.plan.rir)} |`);
 L.push(`| Avisos | ${prev.warnings.length ? prev.warnings.join(', ') : 'nenhum'} |`);
 const d = prev.diet;
 if (d.kind === 'targets') {
  const t = d.targets;
  const w = p.answers.body?.weightKg;
  const dias = prev.usedDayTypes.map(x => { const r = (t.days as Record<AnyDayType, { kcal: number; carbs: number }>)[x]; return `${ANY_DAY_TYPE_LABEL[x]}: ${r.kcal} kcal, carbo ${r.carbs} g`; });
  L.push(`| Objetivo usado na dieta | ${d.effectiveGoal} |`);
  L.push(`| Metas por tipo de dia (só os usados na rotina) | ${dias.join('<br>')} |`);
  const ref = refWeight(p.answers);
  L.push(`| Proteína / gordura / água | ${t.proteinG} g${w ? ` (${br((t.proteinG as number) / w, 2)} g/kg do peso real${ref && ref !== w ? `; ${br((t.proteinG as number) / ref, 2)} g/kg do peso de referência, ${br(ref)} kg` : ''})` : ''} / ${t.fatG} g / ${br(t.waterL)} L |`);
 } else {
  L.push(`| Dieta | não gera metas (motivo: ${d.reason}); objetivo usado: ${d.effectiveGoal}; Dieta sem números: ${prev.flags.hideDietNumbers ? 'sim' : 'não'} |`);
 }
 L.push(`| Sanidade | ${problemas.length ? `**FALHOU:** ${problemas.join('; ')}` : 'passou'} |`);
 L.push(`| Estranho? | ${p.estranho} |`, '');
 return L.join('\n');
}

function gerarTabela(): string {
 const res = PERFIS.map(p => ({ p, problemas: sanidade(p) }));
 const L: string[] = [
  '# Assistente de início: saída para 10 perfis fictícios',
  '',
  'Gerado por `tests/unit/assistente-perfis.test.ts` com o código real (`src/domain/onboarding.ts`) e o catálogo de `data/plan.json`, já com as regras do ADR 012.',
  'Para refazer: `GERAR_TABELA_PERFIS=1 npx vitest run tests/unit/assistente-perfis.test.ts`. Perfis inventados; nenhum dado de pessoa real.',
  '',
  'Leitura: séries e repetições aparecem por bloco (semanas 1–4 / 5–8 / 9–12). Dias da semana: 0 = segunda. A coluna "Estranho?" registra o que mudou com o ADR 012 ou o que foi mantido; não é parecer de nutrição ou de treino. Sanidade da proteína: 1,4 a 2,2 g/kg do peso de referência (IMC acima de 30 usa o peso de IMC 25).',
  '',
  '## Resumo',
  '',
  '| # | Perfil | Treinos (divisão/rotina) | Dieta | Avisos | Sanidade | Estranho? |',
  '| --- | --- | --- | --- | --- | --- | --- |'
 ];
 for (const { p, problemas } of res) {
  const prev = buildOnboardingPreview(p.answers, catalog);
  const dieta = prev.diet.kind === 'targets' ? `${prev.summary.kcalMin}–${prev.summary.kcalMax} kcal, P ${prev.summary.proteinG} g` : `sem metas (${prev.diet.reason})`;
  const treinos = prev.blocked ? `não gerado (${prev.blocked})` : `${prev.summary.gymDays}/${prev.summary.scheduledGymDays}: ${prev.summary.sessionNames.join(', ')}`;
  L.push(`| ${p.id} | ${p.titulo} | ${treinos} | ${dieta} | ${prev.warnings.join(', ') || 'nenhum'} | ${problemas.length ? '**FALHOU**' : 'passou'} | ${p.estranho} |`);
 }
 L.push('');
 for (const { p, problemas } of res) L.push(blocoPerfil(p, problemas));
 return L.join('\n');
}

describe('assistente de início: 10 perfis fictícios', () => {
 it('cobre as combinações pedidas', () => {
  const as = PERFIS.map(p => p.answers);
  expect(as.some(a => (a.body?.age ?? 99) < 18)).toBe(true);
  expect(as.some(a => (a.body?.age ?? 0) >= 60)).toBe(true);
  for (const s of ['m', 'f', 'nao_informar']) expect(as.some(a => a.body?.sex === s), s).toBe(true);
  for (const g of ['perder', 'massa', 'recomp', 'saude']) expect(as.some(a => a.goal === g), g).toBe(true);
  for (const e of ['nunca', 'iniciante', 'intermediario']) expect(as.some(a => a.experience === e), e).toBe(true);
  for (const d of [2, 3, 4, 5, 6]) expect(as.some(a => a.daysPerWeek === d), String(d)).toBe(true);
  for (const l of ['academia', 'casa_equip', 'casa_livre']) expect(as.some(a => a.place === l), l).toBe(true);
  for (const k of ['luta', 'corrida']) expect(as.some(a => a.activities.some(x => x.kind === k)), k).toBe(true);
  expect(as.some(a => a.safety.includes('gestacao'))).toBe(true);
  expect(as.some(a => a.safety.includes('condicao'))).toBe(true);
 });

 it('escreve docs/revisao/assistente-10-perfis.md quando GERAR_TABELA_PERFIS=1', () => {
  if (process.env.GERAR_TABELA_PERFIS !== '1') return;
  const file = resolve(__dirname, '../../docs/revisao/assistente-10-perfis.md');
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, `${gerarTabela()}\n`, 'utf8');
 });

 it('menor de 18 e gestação: sem meta calórica (o código devolve kind "none", motivo "seguranca")', () => {
  for (const p of PERFIS.filter(x => safetyFlagsOf(x.answers).some(f => f === 'menor18' || f === 'gestacao'))) {
   const d = buildDietTargetsFromAnswers(p.answers);
   expect(d.kind, `perfil ${p.id}`).toBe('none');
   if (d.kind === 'none') { expect(d.reason).toBe('seguranca'); expect(d.effectiveGoal).not.toBe('perder'); }
  }
  // Menor de 18 recebe o treino de quem nunca treinou.
  expect(buildPlanFromAnswers(PERFIS[0].answers, catalog).experience).toBe('nunca');
 });

 for (const p of PERFIS) {
  it(`sanidade do perfil ${p.id}: ${p.titulo}`, () => {
   expect(sanidade(p)).toEqual([]);
  });
 }
});

// Saídas esperadas depois do ADR 012 (docs/handoffs/conteudo-revisao-10-perfis.md, seção 3).
describe('assistente de início: 10 perfis depois do ADR 012', () => {
 const pv = (id: number) => buildOnboardingPreview(PERFIS[id - 1].answers, catalog);
 const gen = (id: number) => pv(id).generated!;
 const semana = (id: number) => { const g = gen(id); return g.sched.map(d => (d.k === 'gym' ? g.plan.sess[d.s as string].name : d.k === 'bjj' ? 'luta' : d.k === 'esporte' ? String(d.label) : '-')); };
 it('1: afundo e Pallof com a unidade na observação', () => {
  const g = gen(1);
  expect(g.plan.ex.afundo.t).toBe('Repetições por perna. Passo controlado.');
  expect(g.plan.ex.pallof.t).toBe('Repetições por lado. Sem girar o tronco.');
 });
 it('2: idade60, RIR conservador, exercícios estáveis, 90 s nos principais, dieta igual', () => {
  const p = pv(2), g = p.generated!;
  expect(p.warnings).toEqual(['idade60']);
  expect(g.plan.rir).toEqual([...RIR_CONSERVADOR]);
  expect(g.plan.sess.CIA.ex).toEqual(['sentar_levantar', 'flexao', 'remada_mochila', 'ponte', 'pant_degrau']);
  expect(g.plan.sess.CIB.ex).toEqual(['remada_mochila', 'afundo_livre', 'flexao', 'flexao_fechada', 'ytw']);
  for (const id of ['sentar_levantar', 'flexao', 'remada_mochila', 'ponte']) expect(g.plan.ex[id], id).toMatchObject({ rest: 90, r: catalog[id].r });
  expect(g.plan.ex.afundo_livre).toMatchObject({ s: [2, 2, 3], rest: 60, r: catalog.afundo_livre.r });
  expect(g.plan.ex.remada_mochila.r).toEqual(['10–15', '10–15', '8–12']);
  expect([p.summary.kcalMin, p.summary.kcalMax, p.summary.proteinG]).toEqual([1400, 1600, 105]);
 });
 it('3: puxada com elástico com 90 s', () => { expect(gen(3).plan.ex.puxada_elastico.rest).toBe(90); });
 it('4: 5 dias com Empurrar e Puxar (ADR 014), proteína 1,63 g/kg do peso de referência', () => {
  expect(semana(4)).toEqual(['Superior', 'Pernas A', 'Empurrar', '-', 'Puxar', 'Pernas B', '-']);
  const p = pv(4);
  expect(p.summary.proteinG).toBe(125);
  expect(Math.round((125 / refWeight(PERFIS[3].answers)!) * 100) / 100).toBe(1.63);
  expect(gen(4).plan.ex.pallof.t).toMatch(/^Repetições por lado\./);
 });
 it('5: gestação bloqueada, sem plano e sem metas', () => {
  expect(pv(5)).toMatchObject({ blocked: 'gestacao', generated: null, diet: { kind: 'none', reason: 'seguranca' } });
 });
 it('6: condição de saúde: nunca, 4 treinos como pediu (ADR 014), trocas e liberação médica', () => {
  const p = pv(6), g = p.generated!;
  expect(g.experience).toBe('nunca');
  expect(g.daysReason).toBeNull();
  expect(semana(6)).toEqual(['Superior A', 'Pernas A', '-', 'Superior B', 'Pernas B', '-', '-']);
  expect(g.plan.sess.SUPA.ex).toEqual(['supino', 'puxada', 'press_b', 'remada_b', 'lat_a', 'rosca_a']);
  expect(g.plan.sess.PERA.ex).toEqual(['leg', 'ponte_h', 'afundo', 'mesa', 'pant_pe', 'pallof']);
  expect(Object.keys(g.plan.ex)).not.toContain('hip_b');
  expect(g.plan.ex.supino.s).toEqual([2, 3, 3]);
  expect(g.plan.rir).toEqual([...RIR_CONSERVADOR]);
  expect(p.requiresClearance).toBe(true);
 });
 it('7: Pernas B no domingo', () => {
  expect(semana(7)).toEqual(['Superior A', 'luta', 'Superior B', 'luta', 'Pernas A', '-', 'Pernas B']);
 });
 it('8: 45 a 60 min, 6 exercícios, aviso duracao-reduzida, dieta igual', () => {
  const p = pv(8), g = p.generated!;
  expect(g.duration).toBe('medio');
  for (const k of g.plan.order) expect(g.plan.sess[k].ex).toHaveLength(6);
  expect(p.warnings).toEqual(['duracao-reduzida']);
  // ADR 014: recebe os 6 dias pedidos.
  expect(p.summary).toMatchObject({ gymDays: 6, daysRequested: 6, daysReason: null });
  expect(p.summary.sessionNames).toEqual(['Empurrar A', 'Puxar A', 'Pernas A', 'Empurrar B', 'Puxar B', 'Pernas B']);
 });
 it('9: Pernas B na quinta e Superior B na sexta; puxada com elástico com 90 s', () => {
  expect(semana(9)).toEqual(['Superior A', 'Pernas A', '-', 'Pernas B', 'Superior B', 'Corrida', 'Corrida']);
  expect(gen(9).plan.ex.puxada_elastico.rest).toBe(90);
 });
 it('10: remada com mochila 10–15/10–15/8–12 e 90 s; agachamento livre, flexão e ponte com uma perna com 90 s', () => {
  const g = gen(10);
  expect(g.plan.ex.remada_mochila).toMatchObject({ r: ['10–15', '10–15', '8–12'], rest: 90 });
  for (const id of ['agach_livre', 'flexao', 'ponte_uni']) expect(g.plan.ex[id].rest, id).toBe(90);
 });
});
