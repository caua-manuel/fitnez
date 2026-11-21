import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { useData } from '../../app/DataProvider';
import { hrefFor } from '../../app/router';
import { isDemo } from '../../app/demo';
import { addDays, mondayOf } from '../../domain/calendar';
import type { DayIso } from '../../domain/calendar';
import { localDayOf } from '../../domain/planStart';
import { PLAN_SHARE_LIMITS, buildPlanShare, parsePlanShare, planShareDiff } from '../../domain/planShare';
import type { PlanShareDiff, PlanShareFile } from '../../domain/planShare';
import { applyPlanShare, undoPlanShare } from '../../application/planShare';
import type { Payload } from '../../application/repository';
import { downloadText } from '../../ui/download';
import { Icon } from '../../ui/icons';
import { showToast } from '../../ui/UndoToast';
import { validateStartDay } from '../perfil/DataInicioSheet';
import { SemanaTipo, TreinosDoPlano } from '../assistente/PlanResumo';
import './compartilhar.css';

// Compartilhar plano entre amigos (ADR 011, 1.3). Regras e validação no domínio (src/domain/planShare.ts);
// gravação em src/application/planShare.ts. Textos: docs/handoffs/ux-primeira-abertura.md.
// Privacidade (seguranca-adr-011.md, M2 e M3): tamanho conferido antes de ler o arquivo; observações desmarcadas
// por padrão e, quando marcadas, mostradas antes de sair; nome do plano nunca vem do perfil.

const WD_LONG = ['segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado', 'domingo'];
const ddmm = (d: DayIso) => `${d.slice(8, 10)}/${d.slice(5, 7)}`;
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

function Enviar() {
 const { state } = useData();
 const [name, setName] = useState('');
 const [notes, setNotes] = useState(false);
 const [sched, setSched] = useState(true);
 const [tried, setTried] = useState(false);
 const [result, setResult] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);
 if (!state) return null;
 const empty = name.trim() === '';
 // Achado M-T1: a prévia sai do próprio arquivo montado (inclui o treino alternativo e os citados só pela rotina),
 // com o texto exatamente como vai, e acompanha a opção da semana.
 const preview = notes ? buildPlanShare(state, { name: name.trim() || 'x', includeNotes: true, includeSched: sched }) : null;
 const notesOut = preview?.ok ? Object.entries(preview.file.plan.ex).filter(([, e]) => typeof e.t === 'string' && e.t !== '').map(([id, e]) => ({ id, n: e.n, t: e.t! })) : [];
 const canShareFiles = (() => {
  try { return typeof navigator.canShare === 'function' && navigator.canShare({ files: [new File(['{}'], 'x.json', { type: 'application/json' })] }); } catch { return false; }
 })();
 const send = async () => {
  setResult(null);
  if (empty) { setTried(true); document.getElementById('cp-nome')?.focus(); return; }
  const built = buildPlanShare(state, { name: name.trim(), includeNotes: notes, includeSched: sched });
  if (!built.ok) { setResult({ kind: 'error', text: built.error }); return; }
  try {
   if (canShareFiles) {
    const file = new File([built.text], built.filename, { type: 'application/json' });
    try { await navigator.share({ files: [file], title: built.file.name }); }
    catch (e) { if (e instanceof DOMException && e.name === 'AbortError') return; throw e; }
    setResult({ kind: 'ok', text: `Plano enviado: ${built.filename}` });
   } else {
    downloadText(built.text, built.filename, 'application/json');
    setResult({ kind: 'ok', text: `Arquivo salvo: ${built.filename}` });
   }
   if (built.warnings.length) setResult(r => r && { ...r, text: `${r.text}. ${built.warnings.join(' ')}` });
  } catch { setResult({ kind: 'error', text: 'Não foi possível criar o arquivo. Tente de novo.' }); }
 };
 return <section className="card cp-sec" aria-labelledby="cp-enviar">
  <h2 id="cp-enviar">Enviar meu plano</h2>
  <div>
   <label htmlFor="cp-nome">Nome do plano</label>
   <input id="cp-nome" type="text" maxLength={PLAN_SHARE_LIMITS.fileName} autoComplete="off" value={name} aria-invalid={tried && empty ? true : undefined} aria-describedby={`cp-nome-ajuda${tried && empty ? ' cp-nome-erro' : ''}`} onChange={e => setName(e.target.value)} />
   <p id="cp-nome-ajuda" className="muted cp-help">Quem receber vê este nome. Até {PLAN_SHARE_LIMITS.fileName} caracteres.</p>
   {tried && empty ? <p id="cp-nome-erro" className="in-error">Dê um nome ao plano.</p> : null}
  </div>
  <label className="cp-check"><input type="checkbox" checked={sched} onChange={() => setSched(v => !v)} /><span>Incluir minha semana de treino<small>Os dias de treino e das outras atividades.</small></span></label>
  <label className="cp-check"><input type="checkbox" checked={notes} aria-controls="cp-notas" onChange={() => setNotes(v => !v)} /><span>Incluir observações dos exercícios<small>Dicas de execução que estão no plano. Confira antes de enviar: quem receber vai ler.</small></span></label>
  {notes ? <div id="cp-notas" className="cp-notes" role="region" aria-label="Observações que vão no arquivo">
   {notesOut.length ? <><p className="cp-notes-h">{plural(notesOut.length, 'observação vai', 'observações vão')} no arquivo:</p>
    <ul>{notesOut.map(x => <li key={x.id}><strong>{x.n}</strong><span>{x.t}</span></li>)}</ul></>
    : <p className="muted">Nenhum exercício do plano tem observação.</p>}
  </div> : null}
  <p className="cp-line"><Icon name="marca" size={18} /><span><strong>Vai:</strong> treinos, exercícios, séries, repetições, descansos{sched ? ' e sua semana de treino' : ''}{notes ? ', com as observações acima' : ''}.</span></p>
  <p className="cp-line"><Icon name="circulo" size={18} /><span><strong>Não vai:</strong> histórico, medidas, dieta, perfil e suas anotações pessoais.</span></p>
  <button type="button" className="button block" onClick={() => void send()}><Icon name={canShareFiles ? 'compartilhar' : 'baixar'} size={20} />{canShareFiles ? 'Enviar plano' : 'Baixar arquivo'}</button>
  <p role={result?.kind === 'error' ? 'alert' : 'status'} className={result?.kind === 'error' ? 'in-error' : 'muted cp-help'}>{result?.text ?? ''}</p>
 </section>;
}

type Start = 'manter' | 'proxima' | 'outra';

function Revisar({ file, diff, onCancel }: { file: PlanShareFile; diff: PlanShareDiff; onCancel: () => void }) {
 const { state, repository, run, busy, error } = useData();
 const [useSched, setUseSched] = useState(false);
 const [start, setStart] = useState<Start>('manter');
 const [other, setOther] = useState('');
 const [tried, setTried] = useState(false);
 const [failed, setFailed] = useState(false);
 const heading = useRef<HTMLHeadingElement>(null);
 useEffect(() => { heading.current?.focus(); }, []);
 if (!state) return null;
 const today = localDayOf(Date.now());
 const current = mondayOf(state.settings.start);
 const thisMonday = mondayOf(today);
 const nextMonday = addDays(thisMonday, 7);
 const otherError = start === 'outra' ? validateStartDay(other) : '';
 const startDay: DayIso | null = start === 'manter' ? current : start === 'proxima' ? nextMonday : otherError ? null : mondayOf(other);
 const nEx = Object.keys(file.plan.ex).length, nSess = Object.keys(file.plan.sess).length;
 const mine = state.catalog.plan;
 const sessName = (id: string) => file.plan.sess[Object.keys(diff.mapping.sess).find(k => diff.mapping.sess[k] === id) ?? '']?.name ?? mine.sess[id]?.name ?? id;
 const apply = async () => {
  setFailed(false);
  if (!startDay) { setTried(true); return; }
  const saved = await run(async () => applyPlanShare(repository, { file, start: startDay, today, includeSched: useSched && diff.hasSched, expectedRevision: (await repository.read()).revision }));
  if (!saved) { setFailed(true); return; }
  window.location.hash = hrefFor({ tab: 'inicio' });
  showToast(`Plano “${file.name}” aplicado.`, () => void run(async () => undoPlanShare(repository, { expectedRevision: (await repository.read()).revision }), 'Plano anterior restaurado.'));
 };
 const failText = /outra aba/.test(error) ? 'Seus dados mudaram em outra aba. Recarregue a página e tente de novo.' : 'Não foi possível aplicar o plano. Nada mudou. Tente de novo.';
 return <section className="card cp-sec cp-review" aria-labelledby="cp-rev-h">
  <h2 id="cp-rev-h" ref={heading} tabIndex={-1}>Revisar “{file.name}”</h2>
  <p>{plural(nSess, 'treino', 'treinos')}, {plural(nEx, 'exercício', 'exercícios')}.</p>
  <TreinosDoPlano plan={file.plan} />
  {diff.exercises.same.length ? <p className="cp-line"><Icon name="marca" size={18} /><span>{plural(diff.exercises.same.length, 'exercício você já tem', 'exercícios você já tem')}: o histórico {diff.exercises.same.length === 1 ? 'dele' : 'deles'} continua.</span></p> : null}
  {diff.exercises.added.length ? <p className="cp-line"><Icon name="plus" size={18} /><span>{plural(diff.exercises.added.length, 'exercício novo entra', 'exercícios novos entram')} no seu catálogo.</span></p> : null}
  {diff.exercises.renamed.length ? <p className="cp-line"><Icon name="info" size={18} /><span>{plural(diff.exercises.renamed.length, 'exercício entra como novo', 'exercícios entram como novos')}, para não misturar com o seu histórico.</span></p> : null}
  {diff.sessions.renamed.length ? <p className="cp-line"><Icon name="info" size={18} /><span>{plural(diff.sessions.renamed.length, 'treino tem', 'treinos têm')} o mesmo código de um seu com outro nome e {diff.sessions.renamed.length === 1 ? 'entra' : 'entram'} à parte.</span></p> : null}

  {diff.hasSched && file.sched ? <>
   <h3>Semana do amigo</h3>
   <SemanaTipo sched={file.sched as unknown as Payload[]} plan={file.plan} />
   <label className="cp-check"><input type="checkbox" checked={useSched} onChange={() => setUseSched(v => !v)} /><span>Usar também a semana do amigo<small>Desmarcado, seus dias de treino continuam como estão.</small></span></label>
  </> : null}
  {!useSched && diff.schedRemap.length ? <div className="cp-remap"><p><strong>Na sua semana</strong>, os dias com treinos que deixam de existir passam para os treinos novos:</p>
   <ul>{diff.schedRemap.map(r => <li key={r.day}>{WD_LONG[r.day]}: {mine.sess[r.from]?.name ?? r.from} passa a ser {sessName(r.to)}</li>)}</ul></div> : null}

  <fieldset className="cp-start"><legend>Começar quando?</legend>
   <label className="source-choice"><input type="radio" name="cp-inicio" checked={start === 'manter'} onChange={() => setStart('manter')} /><span>Manter a data atual ({ddmm(current)})</span></label>
   {nextMonday !== current ? <label className="source-choice"><input type="radio" name="cp-inicio" checked={start === 'proxima'} onChange={() => setStart('proxima')} /><span>Na próxima segunda ({ddmm(nextMonday)})</span></label> : null}
   <label className="source-choice"><input type="radio" name="cp-inicio" checked={start === 'outra'} onChange={() => setStart('outra')} /><span>Outra data</span></label>
   {start === 'outra' ? <div><label htmlFor="cp-data">Data de início</label>
    <input id="cp-data" type="date" min="2020-01-01" max="2100-12-31" value={other} aria-invalid={tried && otherError ? true : undefined} aria-describedby="cp-data-ajuda" onChange={e => setOther(e.target.value)} />
    <p id="cp-data-ajuda" className="muted cp-help">Usamos a segunda-feira da semana escolhida{!otherError ? ` (${ddmm(mondayOf(other))})` : ''}.</p>
    {tried && otherError ? <p className="in-error" role="alert">{otherError}</p> : null}</div> : null}
  </fieldset>
  <p className="cp-line"><Icon name="info" size={18} /><span>Seus registros, medidas, dieta e perfil não mudam.</span></p>
  {failed ? <p className="in-error" role="alert">{failText}</p> : null}
  <div className="cp-acts">
   <button type="button" className="button" disabled={busy} onClick={() => void apply()}>Usar este plano</button>
   <button type="button" className="button secondary" disabled={busy} onClick={onCancel}>Cancelar</button>
  </div>
 </section>;
}

function Importar({ onReview }: { onReview: (file: PlanShareFile, warnings: string[]) => void }) {
 const [status, setStatus] = useState<{ kind: 'busy' | 'error'; text: string } | null>(null);
 const input = useRef<HTMLInputElement>(null);
 const pick = async (event: ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  event.target.value = '';
  if (!file) return;
  // Achado M2: o tamanho é conferido antes de ler o arquivo para a memória.
  if (file.size > PLAN_SHARE_LIMITS.bytes) { setStatus({ kind: 'error', text: `Arquivo grande demais para ser um plano (máximo ${Math.round(PLAN_SHARE_LIMITS.bytes / 1024)} KB).` }); return; }
  setStatus({ kind: 'busy', text: 'Lendo o arquivo…' });
  let text: string;
  try { text = await file.text(); } catch { setStatus({ kind: 'error', text: 'Este arquivo não é um plano do Fitnez. Confira se escolheu o arquivo certo.' }); return; }
  const parsed = parsePlanShare(text);
  if (!parsed.ok) { setStatus({ kind: 'error', text: parsed.error }); return; }
  setStatus(null);
  onReview(parsed.value, parsed.warnings);
 };
 return <section className="card cp-sec" aria-labelledby="cp-usar">
  <h2 id="cp-usar">Usar o plano de um amigo</h2>
  <p className="muted cp-help" id="cp-arquivo-ajuda">O arquivo .json que seu amigo mandou (começa com fitnez-plano).</p>
  <div className="file-picker"><label className="button secondary" htmlFor="cp-arquivo"><Icon name="adicionar" size={20} />Escolher arquivo</label>
   <input ref={input} className="visually-hidden" id="cp-arquivo" type="file" accept="application/json,.json" aria-describedby="cp-arquivo-ajuda" onChange={e => void pick(e)} /></div>
  {status ? <p role={status.kind === 'error' ? 'alert' : 'status'} className={status.kind === 'error' ? 'in-error' : 'muted'}>{status.text}</p> : null}
 </section>;
}

/** Tela "Compartilhar plano" (Perfil > Compartilhar plano). */
export function Compartilhar() {
 const { state } = useData();
 const [review, setReview] = useState<{ file: PlanShareFile; diff: PlanShareDiff; warnings: string[] } | null>(null);
 if (!state) return null;
 if (isDemo()) return <div className="cp"><p>Indisponível na demonstração. Saia para usar com seus dados.</p><a className="tr-back" href={hrefFor({ tab: 'perfil' })}>Voltar ao Perfil</a></div>;
 return <div className="cp">
  <a className="cp-back" href={hrefFor({ tab: 'perfil' })}><Icon name="voltar" size={20} />Perfil</a>
  {review ? <>
   {review.warnings.map(w => <p key={w} className="muted">{w}</p>)}
   <Revisar file={review.file} diff={review.diff} onCancel={() => setReview(null)} />
  </> : <>
   <Enviar />
   <Importar onReview={(file, warnings) => setReview({ file, warnings, diff: planShareDiff(state.catalog.plan, file, state.settings.sched) })} />
  </>}
 </div>;
}
