import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';
import { useData } from '../../app/DataProvider';
import { Icon } from '../../ui/icons';
import { showToast } from '../../ui/UndoToast';
import { addDays, mondayOf } from '../../domain/calendar';
import type { DayIso } from '../../domain/calendar';
import { SPORT_LABEL_MAX } from '../../domain/dayActivity';
import { localDayOf } from '../../domain/planStart';
import { DURATION_TEXT, answersFromStored, defaultAnswers, defaultOnboardingStart, validateOnboardingAnswers } from '../../domain/onboarding';
import type { Duration, Experience, FixedKind, Goal, Lifestyle, OnboardingAnswers, OnboardingPreview, OnboardingWarning, Place, SafetyAnswer, Sex } from '../../domain/onboarding';
import { applyOnboarding, previewOnboarding, undoOnboarding } from '../../application/onboarding';
import { validateStartDay } from '../perfil/DataInicioSheet';
import { ASSISTANT_QUESTIONS, closeAssistant } from './store';
import { DemoEntry, isDemo } from '../../app/demo';
import { hasUserData } from '../../domain/userData';
import { SemanaTipo } from './PlanResumo';
import type { AssistantMode } from './store';
import './assistente.css';

// Textos: docs/handoffs/conteudo-assistente-inicio.md, seção 10. Regras: src/domain/onboarding.ts (nada é calculado aqui).
const AVISO_FIXO = 'As metas são estimativas e o plano é uma sugestão geral. O app não substitui nutricionista, médico ou educador físico.';
const WARN: Record<OnboardingWarning, string> = {
 menor18: 'Para quem tem menos de 18 anos, o app monta só um treino leve e não calcula metas de dieta. Converse com um médico ou nutricionista, e treine com orientação de um educador físico.',
 gestacao: 'Na gravidez e na amamentação, o app não calcula metas de dieta. Peça ao seu médico liberação para o treino e procure um nutricionista.',
 // ADR 012: textos aprovados em conteudo-revisao-10-perfis.md (seção 4) e conteudo-adr-012-textos.md (item 2).
 amamentacao: 'Durante a amamentação, o app monta um começo leve e não calcula metas de dieta, porque a amamentação muda quanto você precisa comer e beber. Antes de começar, peça liberação ao seu médico, principalmente nos primeiros meses depois do parto, e procure um nutricionista. Beba água antes e depois do treino.',
 condicao: 'Com uma condição de saúde, o app monta um começo leve, com esforço longe do limite, e não calcula metas de dieta. Antes de começar, peça liberação ao seu médico e procure um nutricionista. Durante o esforço, não prenda a respiração.',
 transtorno: 'O app não vai calcular calorias nem sugerir déficit. Se quiser apoio com alimentação, procure um nutricionista ou psicólogo.',
 // Textos aprovados em docs/handoffs/conteudo-revisao-10-perfis.md, seção 4.
 idade60: 'A partir dos 60 anos, o app monta um começo mais leve, com exercícios mais estáveis. Se tiver alguma condição de saúde ou estiver parado há muito tempo, converse com seu médico antes de começar.',
 'duracao-reduzida': 'Para quem está começando, o app montou treinos de 45 a 60 minutos. Depois de algumas semanas, você pode acrescentar exercícios em Treinos.',
 'sem-dados': 'Sem idade, altura e peso, usamos metas de exemplo. Você pode informar depois em Perfil.',
 'imc-baixo': 'Seu peso já está baixo para sua altura, então o app não sugere déficit de calorias. Converse com um nutricionista.',
 'imc-alto-massa': 'O app sugere manter as calorias por enquanto. Um nutricionista pode ajustar sua meta.',
 'semana-cheia': 'Sua semana já tem muita atividade. O app montou 2 treinos curtos de musculação, que ficam em Treinos, fora da rotina, para quando der. Descanse pelo menos 1 dia.',
};
// ADR 012: plano não gerado. Gestação: conteudo-revisao-10-perfis.md (seção 4); menos de 14 anos: conteudo-adr-012-textos.md (item 1).
const BLOCKED_TITLE = 'Ainda não dá para montar seu plano';
const BLOCKED: Record<'gestacao' | 'menor14', string> = {
 gestacao: 'Na gravidez, o treino muda a cada fase e precisa de acompanhamento. Por isso o app não monta um plano nem calcula metas de dieta. Converse com seu médico e, com a liberação dele, procure um educador físico. O plano de exemplo do app também não foi feito para a gravidez.',
 menor14: 'Abaixo dos 14 anos, o treino precisa de orientação de perto, de um adulto e de um professor de educação física. Por isso o app não monta um plano nem calcula metas de dieta. Converse com seus pais ou responsáveis antes de começar a treinar.',
};
const DOR = 'Dor acima de 4 em 10, que dura mais de 2 semanas ou vem com formigamento ou perda de força: pare o exercício e procure um fisioterapeuta ou médico.';
const SAFETY: [SafetyAnswer, string][] = [['menor18', 'Tenho menos de 18 anos'], ['gestacao', 'Estou grávida'], ['amamentacao', 'Estou amamentando'], ['condicao', 'Tenho uma condição de saúde (coração, pressão alta, diabetes, rins, lesão ou cirurgia recente, ou outra em acompanhamento)'], ['transtorno', 'Tenho ou já tive transtorno alimentar'], ['nenhum', 'Nenhuma dessas']];
const GOALS: [Goal, string][] = [['perder', 'Perder gordura'], ['massa', 'Ganhar massa muscular'], ['recomp', 'Perder gordura e ganhar massa'], ['saude', 'Saúde e condicionamento']];
const EXPS: [Experience, string][] = [['nunca', 'Nunca treinei'], ['iniciante', 'Pouco (menos de 1 ano, ou parado há mais de 6 meses)'], ['intermediario', 'Treino há 1 ano ou mais']];
const DURS: [Duration, string][] = [['curto', '30 a 45 min'], ['medio', '45 a 60 min'], ['longo', '60 a 90 min']];
const PLACES: [Place, string][] = [['academia', 'Academia'], ['casa_equip', 'Em casa, com halteres e elástico'], ['casa_livre', 'Em casa, sem equipamento']];
const KINDS: [FixedKind, string][] = [['luta', 'Luta (jiu-jitsu ou outra)'], ['esporte', 'Esporte'], ['corrida', 'Corrida']];
const SEXES: [Sex, string][] = [['m', 'Masculino'], ['f', 'Feminino'], ['nao_informar', 'Prefiro não informar']];
const LIFE: [Lifestyle, string][] = [['pouco', 'Sentado a maior parte do tempo'], ['moderado', 'Em pé ou andando parte do dia'], ['muito', 'Trabalho físico']];
const WD = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
const WD_LONG = ['segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado', 'domingo'];

interface Step { h: string; help?: string; optional?: boolean }
const STEPS: Step[] = [
 { h: 'Alguma destas situações vale para você?', help: 'Marque todas as que valerem. Essa resposta só ajusta o plano e não é guardada.' },
 { h: 'Qual é seu objetivo principal?' },
 { h: 'Há quanto tempo você treina musculação?' },
 { h: 'Quantos dias por semana você pode fazer musculação?', help: 'Escolha o que cabe numa semana normal, não na melhor semana.' },
 { h: 'Quanto tempo você tem por treino?' },
 { h: 'Onde você vai treinar?' },
 { h: 'Você faz outra atividade em dias fixos?', help: 'O app evita treino pesado de pernas na véspera dessas atividades.', optional: true },
 { h: 'Seus dados para a dieta', help: 'Servem só para calcular calorias e proteína. Sem eles, o app usa metas de exemplo.', optional: true },
 { h: 'Começar quando?', help: 'O plano sempre começa numa segunda-feira. Dá para mudar depois em Perfil.' },
];
const N = STEPS.length;
if (import.meta.env.DEV && N !== ASSISTANT_QUESTIONS) console.warn(`ASSISTANT_QUESTIONS (${ASSISTANT_QUESTIONS}) difere dos passos do assistente (${N}).`);
const BODY_STEP = 7, ACT_STEP = 6, START_STEP = 8;

type Screen = 'boas-vindas' | 'exemplo' | 'resumo' | number;
type StartChoice = 'manter' | 'esta' | 'proxima' | 'outra';
interface Body { sex?: Sex; lifestyle?: Lifestyle; age: string; heightCm: string; weightKg: string }
interface Draft extends Omit<OnboardingAnswers, 'body' | 'activities'> { activities: { kind: FixedKind; days: number[]; label?: string }[]; body: Body }

const ddmm = (d: DayIso) => `${d.slice(8, 10)}/${d.slice(5, 7)}`;
const emptyBody = (): Body => ({ age: '', heightCm: '', weightKg: '' });
const nf = new Intl.NumberFormat('pt-BR');

function Choice({ type = 'radio', name, checked, onChange, children }: { type?: 'radio' | 'checkbox'; name: string; checked: boolean; onChange: () => void; children: ReactNode }) {
 return <label className="source-choice as-opt"><input type={type} name={name} checked={checked} onChange={onChange} /><span>{children}</span></label>;
}

export function Assistente({ mode }: { mode: AssistantMode }) {
 const { state, repository, run, commit, busy, error } = useData();
 const today = localDayOf(Date.now());
 const refazer = mode === 'refazer';
 const [screen, setScreen] = useState<Screen>(refazer ? 0 : 'boas-vindas');
 const [draft, setDraft] = useState<Draft>(() => {
  const a = refazer ? answersFromStored(state?.settings.onboarding) : defaultAnswers();
  return { ...a, activities: a.activities.map(x => ({ ...x, days: [...x.days] })), body: emptyBody() };
 });
 const [noActs, setNoActs] = useState(() => refazer && !draft.activities.length);
 const [start, setStart] = useState<StartChoice>(refazer ? 'manter' : 'proxima');
 const [other, setOther] = useState('');
 const [editing, setEditing] = useState(false);
 const [tried, setTried] = useState(false);
 const [failed, setFailed] = useState(false);
 // Liberação médica (condição de saúde ou amamentação): só habilita "Começar o plano"; nunca é gravada.
 const [cleared, setCleared] = useState(false);
 const heading = useRef<HTMLHeadingElement>(null);
 useEffect(() => { heading.current?.focus({ preventScroll: true }); window.scrollTo(0, 0); }, [screen]);
 // Botão voltar do sistema: uma entrada de histórico de guarda (sem URL nova e sem respostas) enquanto houver passo para voltar.
 // Ao voltar, o passo recua e a guarda é recolocada. Nada das respostas vai para o histórico nem para o armazenamento.
 const guard = useRef(false);
 const backRef = useRef<() => void>(() => undefined);
 const atRoot = screen === 'boas-vindas' || (refazer && screen === 0);
 useEffect(() => { if (!atRoot && !guard.current) { history.pushState({ assistente: true }, ''); guard.current = true; } }, [screen, atRoot]);
 useEffect(() => {
  const hash = window.location.hash;
  const onPop = () => { guard.current = false; backRef.current(); };
  window.addEventListener('popstate', onPop);
  return () => { window.removeEventListener('popstate', onPop); if (guard.current && window.location.hash === hash) { guard.current = false; history.back(); } };
 }, []);
 if (!state) return null;

 const thisMonday = mondayOf(today);
 const suggested = defaultOnboardingStart(today);
 const nextMonday = suggested === thisMonday ? addDays(thisMonday, 7) : suggested;
 const current = mondayOf(state.settings.start);
 const otherError = start === 'outra' ? validateStartDay(other) : '';
 const startDay: DayIso | null = start === 'manter' ? current : start === 'esta' ? thisMonday : start === 'proxima' ? nextMonday : otherError ? null : mondayOf(other);

 const b = draft.body;
 const input = { ...draft, body: { sex: b.sex, lifestyle: b.lifestyle, age: b.age, heightCm: b.heightCm, weightKg: b.weightKg } };
 const checked = validateOnboardingAnswers(input);
 const errors = checked.ok ? {} : checked.errors;
 const pv = checked.ok ? previewOnboarding(checked.value) : null;
 const preview: OnboardingPreview | null = pv && pv.ok ? pv.preview : null;
 const set = (patch: Partial<Draft>) => { setDraft(d => ({ ...d, ...patch })); setFailed(false); };
 const setBody = (patch: Partial<Body>) => set({ body: { ...b, ...patch } });

 const stepError = (i: number): string => {
  if (i === 0) return draft.safety.length ? '' : 'Marque uma opção para continuar.';
  if (i === ACT_STEP) {
   if (!noActs && !draft.activities.length) return 'Escolha uma opção para continuar.';
   return Object.entries(errors).find(([k]) => k.startsWith('activities'))?.[1] ?? '';
  }
  if (i === BODY_STEP) return Object.entries(errors).find(([k]) => k.startsWith('body'))?.[1] ?? '';
  if (i === START_STEP) return otherError;
  return '';
 };

 const goNext = () => {
  if (typeof screen !== 'number') return;
  if (stepError(screen)) { setTried(true); return; }
  setTried(false);
  setScreen(editing || screen === N - 1 ? 'resumo' : screen + 1);
  if (editing) setEditing(false);
 };
 const goBack = () => {
  setTried(false);
  if (screen === 'boas-vindas') return;
  if (screen === 'exemplo') { setScreen('boas-vindas'); return; }
  if (screen === 'resumo') { setScreen(N - 1); return; }
  if (editing) { setEditing(false); setScreen('resumo'); return; }
  if (screen === 0) { if (refazer) closeAssistant(); else setScreen('boas-vindas'); return; }
  setScreen(screen - 1);
 };
 backRef.current = goBack;
 const skip = () => {
  if (screen === ACT_STEP) { set({ activities: [] }); setNoActs(true); }
  if (screen === BODY_STEP) set({ body: emptyBody() });
  setTried(false);
  setScreen(editing ? 'resumo' : (screen as number) + 1);
  if (editing) setEditing(false);
 };
 const alter = (i: number) => { setEditing(true); setScreen(i); };
 const onKey = (e: KeyboardEvent) => {
  if (e.key === 'Escape') { e.preventDefault(); goBack(); return; }
  const t = e.target as HTMLElement;
  if (e.key === 'Enter' && typeof screen === 'number' && t.tagName !== 'BUTTON' && t.tagName !== 'A') { e.preventDefault(); goNext(); }
 };

 const confirm = async () => {
  if (!preview || !startDay || preview.blocked || !preview.generated || (preview.requiresClearance && !cleared)) return;
  setFailed(false);
  const saved = await run(() => applyOnboarding(repository, { preview, start: startDay, today, expectedRevision: state.revision, clearanceConfirmed: preview.requiresClearance ? cleared : undefined }));
  if (!saved) { setFailed(true); return; }
  closeAssistant();
  if (window.location.hash !== '#inicio') window.location.hash = '#inicio';
  showToast('Plano pronto. Bom treino.', () => void run(async () => undoOnboarding(repository, { expectedRevision: (await repository.read()).revision }), 'Plano anterior restaurado.'));
 };
 const chooseExample = async () => {
  if (!startDay) { setTried(true); return; }
  const ok = await commit(s => { s.settings.start = startDay; s.settings.startConfirmed = true; return s; });
  if (!ok) { setFailed(true); return; }
  closeAssistant();
  showToast(`Plano padrão: começa em ${ddmm(startDay)}`);
 };

 const toggleSafety = (k: SafetyAnswer) => {
  const has = draft.safety.includes(k);
  set({ safety: k === 'nenhum' ? (has ? [] : ['nenhum']) : has ? draft.safety.filter(x => x !== k) : [...draft.safety.filter(x => x !== 'nenhum'), k] });
 };
 const actOf = (k: FixedKind) => draft.activities.find(a => a.kind === k);
 const toggleKind = (k: FixedKind) => { setNoActs(false); set({ activities: actOf(k) ? draft.activities.filter(a => a.kind !== k) : [...draft.activities, { kind: k, days: [] }] }); };
 const patchAct = (k: FixedKind, patch: Partial<{ days: number[]; label: string }>) => set({ activities: draft.activities.map(a => (a.kind === k ? { ...a, ...patch } : a)) });
 const takenBy = (d: number, k: FixedKind) => draft.activities.some(a => a.kind !== k && a.days.includes(d));

 // Exemplo: mantém a segunda sugerida (como a antiga folha da primeira abertura). Refazer: manter a data atual.
 const keepLabel = refazer ? `Manter a data atual (${ddmm(current)})` : current === today ? `Hoje, segunda (${ddmm(today)})` : `Nesta segunda (${ddmm(current)})`;
 const startPicker = (examplePlan: boolean) => <fieldset aria-labelledby="as-h">
  {refazer || examplePlan ? <Choice name="inicio" checked={start === 'manter'} onChange={() => setStart('manter')}>{keepLabel}</Choice> : null}
  {!examplePlan && thisMonday !== current || !refazer && !examplePlan ? <Choice name="inicio" checked={start === 'esta'} onChange={() => setStart('esta')}>{thisMonday === today ? `Hoje, segunda (${ddmm(today)})` : `Nesta segunda (${ddmm(thisMonday)})`}</Choice> : null}
  {nextMonday !== current || !refazer ? <Choice name="inicio" checked={start === 'proxima'} onChange={() => setStart('proxima')}>Na próxima segunda ({ddmm(nextMonday)})</Choice> : null}
  <Choice name="inicio" checked={start === 'outra'} onChange={() => setStart('outra')}>Outra data</Choice>
  {start === 'outra' ? <div className="as-field">
   <label htmlFor="as-data">Data de início</label>
   <input id="as-data" type="date" min="2020-01-01" max="2100-12-31" value={other} aria-invalid={tried && otherError ? true : undefined} aria-describedby="as-data-ajuda" onChange={e => setOther(e.target.value)} />
   <p id="as-data-ajuda" className="muted">Usamos a segunda-feira da semana escolhida{!otherError ? ` (${ddmm(mondayOf(other))})` : ''}.</p>
  </div> : null}
 </fieldset>;

 const stepBody = (i: number): ReactNode => {
  if (i === 0) return <fieldset aria-labelledby="as-h">{SAFETY.map(([k, t]) => <Choice key={k} type="checkbox" name="seguranca" checked={draft.safety.includes(k)} onChange={() => toggleSafety(k)}>{t}</Choice>)}</fieldset>;
  if (i === 1) return <fieldset aria-labelledby="as-h">{GOALS.map(([k, t]) => <Choice key={k} name="objetivo" checked={draft.goal === k} onChange={() => set({ goal: k })}>{t}</Choice>)}</fieldset>;
  if (i === 2) return <fieldset aria-labelledby="as-h">{EXPS.map(([k, t]) => <Choice key={k} name="experiencia" checked={draft.experience === k} onChange={() => set({ experience: k })}>{t}</Choice>)}</fieldset>;
  if (i === 3) return <fieldset aria-labelledby="as-h" className="as-row">{([2, 3, 4, 5, 6] as const).map(n => <Choice key={n} name="dias" checked={draft.daysPerWeek === n} onChange={() => set({ daysPerWeek: n })}>{n}<span className="visually-hidden"> dias</span></Choice>)}</fieldset>;
  if (i === 4) return <fieldset aria-labelledby="as-h">{DURS.map(([k, t]) => <Choice key={k} name="tempo" checked={draft.duration === k} onChange={() => set({ duration: k })}>{t}</Choice>)}</fieldset>;
  if (i === 5) return <fieldset aria-labelledby="as-h">{PLACES.map(([k, t]) => <Choice key={k} name="local" checked={draft.place === k} onChange={() => set({ place: k })}>{t}</Choice>)}</fieldset>;
  if (i === ACT_STEP) return <fieldset aria-labelledby="as-h">
   {KINDS.map(([k, t]) => { const a = actOf(k); return <div key={k}>
    <Choice type="checkbox" name="atividade" checked={!!a} onChange={() => toggleKind(k)}>{t}</Choice>
    {a ? <div className="as-sub">
     {k === 'esporte' ? <div className="as-field"><label htmlFor="as-esporte">Qual esporte? <span className="muted">(opcional)</span></label><input id="as-esporte" type="text" maxLength={SPORT_LABEL_MAX} autoComplete="off" placeholder="Ex.: Futebol" value={a.label ?? ''} onChange={e => patchAct(k, { label: e.target.value })} /></div> : null}
     <fieldset className="as-days"><legend>Em quais dias? <span className="visually-hidden">{t}</span></legend>
      {WD.map((w, d) => <label key={d} className="source-choice as-day"><input type="checkbox" checked={a.days.includes(d)} disabled={takenBy(d, k)} onChange={() => patchAct(k, { days: a.days.includes(d) ? a.days.filter(x => x !== d) : [...a.days, d] })} /><span aria-hidden="true">{w}</span><span className="visually-hidden">{WD_LONG[d]}</span></label>)}
      {WD.some((_, d) => takenBy(d, k)) ? <p className="muted as-why as-taken">Dias já usados por outra atividade ficam desligados.</p> : null}
     </fieldset>
    </div> : null}
   </div>; })}
   <Choice type="checkbox" name="atividade" checked={noActs && !draft.activities.length} onChange={() => { set({ activities: [] }); setNoActs(!noActs || draft.activities.length > 0); }}>Nenhuma</Choice>
  </fieldset>;
  if (i === BODY_STEP) {
   const num = (k: 'age' | 'heightCm' | 'weightKg', label: string, mode: 'numeric' | 'decimal') => {
    const err = tried ? errors[`body.${k}`] : undefined;
    return <div className="as-field as-num"><label htmlFor={`as-${k}`}>{label}</label>
     <input id={`as-${k}`} type="text" inputMode={mode} autoComplete="off" value={b[k]} aria-invalid={err ? true : undefined} aria-describedby={err ? `as-${k}-erro` : undefined} onChange={e => setBody({ [k]: e.target.value })} />
     {err ? <p className="in-error" id={`as-${k}-erro`}>{err}</p> : null}</div>;
   };
   return <>
    <fieldset><legend>Sexo (só para a conta das calorias; não é guardado)</legend>{SEXES.map(([k, t]) => <Choice key={k} name="sexo" checked={b.sex === k} onChange={() => setBody({ sex: k })}>{t}</Choice>)}</fieldset>
    <div className="as-nums">{num('age', 'Idade', 'numeric')}{num('heightCm', 'Altura (cm)', 'numeric')}{num('weightKg', 'Peso (kg)', 'decimal')}</div>
    <fieldset><legend>Como é seu dia fora do treino?</legend>{LIFE.map(([k, t]) => <Choice key={k} name="rotina" checked={(b.lifestyle ?? 'pouco') === k} onChange={() => setBody({ lifestyle: k })}>{t}</Choice>)}</fieldset>
   </>;
  }
  return startPicker(false);
 };

 const exampleSessions = state.catalog.plan.order.filter(id => state.catalog.plan.sess[id]).length;
 let content: ReactNode, foot: ReactNode, top: ReactNode = null, progress: ReactNode = null;

 if (screen === 'boas-vindas') {
  content = <>
   <h1 id="as-h" ref={heading} tabIndex={-1}>Vamos montar seu plano</h1>
   <p>Responda {N} perguntas rápidas e o app monta seus treinos e suas metas de dieta. Dá para mudar tudo depois.</p>
   <p className="muted">O plano padrão é de quem já treina e faz musculação, jiu-jitsu e vôlei.</p>
   {!isDemo() && !hasUserData(state) ? <DemoEntry question className="as-demo" /> : null}
  </>;
  foot = <>
   <button type="button" className="button block" onClick={() => { setStart('proxima'); setScreen(0); }}>Montar meu plano</button>
   <button type="button" className="button secondary block" onClick={() => { setStart('manter'); setScreen('exemplo'); }}>Usar o plano padrão</button>
   <button type="button" className="as-link as-later" onClick={closeAssistant}>Decidir depois</button>
  </>;
 } else if (screen === 'exemplo') {
  top = <div className="as-top"><button type="button" className="as-link" onClick={goBack}><Icon name="voltar" size={20} />Voltar</button></div>;
  content = <>
   <h1 id="as-h" ref={heading} tabIndex={-1}>Quando o plano padrão começa?</h1>
   <p className="muted">Plano padrão: {exampleSessions} treinos, 12 semanas. Dá para trocar a data ou montar seu plano depois, em Perfil.</p>
   {startPicker(true)}
  </>;
  foot = <>{tried && otherError ? <p className="in-error" role="alert">{otherError}</p> : null}
   {failed ? <p className="in-error" role="alert">Não foi possível salvar. Tente de novo.</p> : null}
   <button type="button" className="button block" disabled={busy} onClick={() => void chooseExample()}>Usar o plano padrão</button></>;
 } else if (screen === 'resumo') {
  top = <div className="as-top"><button type="button" className="as-link" onClick={goBack}><Icon name="voltar" size={20} />Voltar</button></div>;
  if (!preview) content = <><h1 id="as-h" ref={heading} tabIndex={-1}>Seu plano</h1><p role="alert" className="in-error">Alguma resposta ficou inválida. Volte e confira.</p></>;
  else if (preview.blocked || !preview.generated) content = <><h1 id="as-h" ref={heading} tabIndex={-1}>{BLOCKED_TITLE}</h1><p>{BLOCKED[preview.blocked ?? 'gestacao']}</p></>;
  else {
   const s = preview.summary, g = preview.generated;
   const out = s.gymDays - s.scheduledGymDays;
   content = <>
    <h1 id="as-h" ref={heading} tabIndex={-1}>Seu plano</h1>
    <p className="muted">{s.weeks} semanas{startDay ? ` · começa na segunda, ${ddmm(startDay)}` : ''}. A cada 4 semanas, uma semana leve, com menos séries, para o corpo recuperar.</p>
    <section className="as-block" aria-labelledby="as-b1">
     <div className="as-block-h"><h2 id="as-b1">Treinos</h2><button type="button" className="as-link" onClick={() => alter(3)} aria-label="Alterar treinos">Alterar</button></div>
     <p>Musculação: {s.gymDays} dias por semana ({[...new Set(s.sessionNames)].join(', ')}), {DURATION_TEXT[g.duration]} cada.</p>
     {s.daysReason === 'teto' ? <p className="muted">Você pediu {s.daysRequested} dias. O app montou {s.gymDays} treinos por semana para sobrar tempo de recuperação. Depois de algumas semanas, você pode acrescentar treinos em Treinos.</p>
      : s.daysReason === 'atividades' ? <p className="muted">Com suas outras atividades, o app montou {s.gymDays} treinos por semana para você ter pelo menos 1 dia de descanso.</p> : null}
     <p className="muted">Em cada série, pare antes de não aguentar mais: o app mostra quantas repetições deixar sobrando.</p>
     {out > 0 && !preview.warnings.includes('semana-cheia') ? <p className="muted">{out === 1 ? 'Um treino curto fica' : `Os ${out} treinos curtos ficam`} em Treinos, fora da rotina: faça quando der.</p> : null}
    </section>
    <section className="as-block" aria-labelledby="as-b2">
     <div className="as-block-h"><h2 id="as-b2">Semana tipo</h2><button type="button" className="as-link" onClick={() => alter(ACT_STEP)} aria-label="Alterar semana tipo">Alterar</button></div>
     <SemanaTipo sched={g.sched} plan={g.plan} />
    </section>
    <section className="as-block" aria-labelledby="as-b3">
     <div className="as-block-h"><h2 id="as-b3">Dieta</h2><button type="button" className="as-link" onClick={() => alter(BODY_STEP)} aria-label="Alterar dados da dieta">Alterar</button></div>
     {preview.diet.kind === 'targets' && s.kcalMin !== null && s.kcalMax !== null
      ? <p>{s.kcalMin === s.kcalMax ? `Calorias: ${nf.format(s.kcalMin)} kcal por dia.` : `Calorias: de ${nf.format(s.kcalMin)} a ${nf.format(s.kcalMax)} kcal por dia (mais nos dias de treino).`} Proteína: {s.proteinG} g por dia.</p>
      : <p>{preview.diet.kind === 'none' && preview.diet.reason === 'seguranca' ? 'O app não calcula metas de dieta para você. A Dieta mostra valores de exemplo.' : 'Sem metas calculadas: a Dieta usa a meta de exemplo.'}</p>}
    </section>
    {preview.warnings.length ? <ul className="as-warn">{preview.warnings.map(w => <li key={w}><Icon name="info" size={18} />{WARN[w]}</li>)}</ul> : null}
    {preview.requiresClearance ? <label className="source-choice as-opt as-clear"><input type="checkbox" checked={cleared} onChange={() => setCleared(c => !c)} /><span>Meu médico me liberou para fazer musculação.</span></label> : null}
    <p className="as-note">{DOR}</p>
    {refazer ? <p className="as-note">Seus registros, notas e medidas continuam salvos. Você pode voltar ao plano anterior em Perfil.</p> : null}
   </>;
  }
  foot = <>
   {failed ? <p className="in-error" role="alert">Não foi possível salvar o plano. Suas respostas continuam aqui.{error ? ` ${error}` : ''}</p> : null}
   {preview?.blocked || !preview?.generated ? <>
    <button type="button" className="button block" onClick={() => { setTried(false); setScreen(preview?.blocked === 'menor14' ? BODY_STEP : 0); }}>Voltar</button>
    <button type="button" className="as-link as-later" onClick={closeAssistant}>Explorar o app</button>
   </>
    : <button type="button" className="button block" disabled={busy || !startDay || (preview.requiresClearance && !cleared)} onClick={() => void confirm()}>{failed ? 'Tentar de novo' : 'Começar o plano'}</button>}
   {refazer || preview?.blocked ? null : <button type="button" className="as-link as-later" onClick={() => { setStart('manter'); setScreen('exemplo'); }}>Usar o plano padrão</button>}
  </>;
 } else {
  const st = STEPS[screen];
  const err = stepError(screen);
  top = <div className="as-top">
   <button type="button" className="as-link" onClick={goBack}><Icon name="voltar" size={20} />{screen === 0 && refazer ? 'Sair' : 'Voltar'}</button>
   {st.optional ? <button type="button" className="as-link" onClick={skip}>Pular</button> : null}
  </div>;
  progress = <div className="as-prog">
   <span className="bar" role="progressbar" aria-label="Progresso" aria-valuemin={1} aria-valuemax={N} aria-valuenow={screen + 1} aria-valuetext={`Passo ${screen + 1} de ${N}`}><span style={{ width: `${((screen + 1) / N) * 100}%` }} /></span>
   <span className="as-prog-t" aria-hidden="true">Passo {screen + 1} de {N}</span>
  </div>;
  content = <>
   {screen === 0 ? <p className="as-eyebrow">Antes de começar</p> : null}
   <h1 id="as-h" ref={heading} tabIndex={-1}>{st.h}</h1>
   {st.help ? <p className="muted">{st.help}</p> : null}
   {stepBody(screen)}
  </>;
  foot = <>
   {err && (tried || screen === 0 || screen === ACT_STEP) ? <p className={tried ? 'in-error' : 'muted as-why'} role={tried ? 'alert' : undefined}>{err}</p> : null}
   <button type="button" className="button block" aria-disabled={err ? true : undefined} onClick={goNext}>{editing ? 'Voltar ao resumo' : 'Continuar'}</button>
  </>;
 }

 return <div className="as" role="dialog" aria-modal="true" aria-labelledby="as-h" onKeyDown={onKey}>
  {top}{progress}
  <div className="as-body" key={String(screen)}>
   {content}
   {screen === 'boas-vindas' || screen === 'resumo' ? <p className="as-note">{AVISO_FIXO}</p> : null}
  </div>
  <div className="as-foot">{foot}</div>
 </div>;
}
