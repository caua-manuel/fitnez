import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useData } from '../../app/DataProvider';
import { localDayOf } from '../../domain/planStart';
import { mondayOf } from '../../domain/calendar';
import { weekSummaryOf } from '../../domain/weekSummary';
import type { WeekSummary } from '../../domain/weekSummary';
import { Icon } from '../../ui/icons';
import { Sheet } from '../../ui/Sheet';
import { cardContent, cardFilename } from './content';
import type { CardContent } from './content';
import { paletteFromDocument, renderCardPng } from './draw';
import './resumo.css';

// Resumo da semana e cartão compartilhável (ADR 011, 2.5). Carregado por import() a partir da Evolução.
// Regras em src/domain/weekSummary.ts. Peso e cintura só com a opção marcada agora: o estado é local e some ao fechar.

type Which = 'anterior' | 'atual';
const ddmm = (d: string) => `${d.slice(8, 10)}/${d.slice(5, 7)}`;

function canShareFile(file: File): boolean {
 try { return typeof navigator.canShare === 'function' && typeof navigator.share === 'function' && navigator.canShare({ files: [file] }); } catch { return false; }
}

/** Download pelo navegador; o endereço temporário é revogado depois. */
function downloadBlob(blob: Blob, filename: string) {
 const url = URL.createObjectURL(blob);
 const a = document.createElement('a'); a.href = url; a.download = filename; a.rel = 'noopener';
 document.body.append(a); a.click(); a.remove();
 window.setTimeout(() => URL.revokeObjectURL(url), 30000);
}

/** Texto real do cartão (a mesma CardContent do desenho). */
function Texto({ c, id }: { c: CardContent; id: string }) {
 return <section className="rs-text" aria-labelledby={id}>
  <h3 id={id} className="rs-title">{c.title} <span>{c.of}</span></h3>
  <p className="rs-sub">{c.sub}</p>
  <p className="rs-hero"><span className="visually-hidden">{c.workouts.aria}.</span><span aria-hidden="true"><strong>{c.workouts.done}</strong>{c.workouts.planned ? <> {c.workouts.planned}</> : null}</span>
   <small aria-hidden="true">{c.workouts.label}</small></p>
  <dl className="rs-stats">
   {[...c.stats, ...(c.body ?? [])].map(s => <div key={s.label}><dt>{s.label}</dt><dd>{s.value}</dd></div>)}
  </dl>
  <h4 className="rs-h4">Recordes da semana</h4>
  {c.records.length ? <ul className="rs-records">{c.records.map(r => <li key={r}>{r}</li>)}</ul> : <p className="muted">{c.recordsEmpty}</p>}
  {c.diet ? <><p className="rs-diet">{c.diet.line}</p><p className="rs-foot">{c.diet.footnote}</p></> : null}
 </section>;
}

export default function ResumoSemana({ onClose, now = Date.now }: { onClose: () => void; now?: () => number }) {
 const { state } = useData();
 const uid = useId();
 const today = localDayOf(now());
 const [body, setBody] = useState(false); // nunca salvo
 const [diet, setDiet] = useState(true); // nunca salvo; marcada por padrão (ADR 011, decisão 5)
 const weeks = useMemo(() => {
  if (!state) return { atual: null, anterior: null } as Record<Which, WeekSummary | null>;
  const atual = weekSummaryOf(state, { today, body });
  // Depois da semana 12 só existe a última semana do plano.
  const anterior = atual ? (atual.week > 0 ? weekSummaryOf(state, { today, week: atual.week - 1, body }) : null) : weekSummaryOf(state, { today, week: 11, body });
  return { atual, anterior };
 }, [state, today, body]);
 const [which, setWhich] = useState<Which>(() => (weeks.atual ? 'atual' : 'anterior'));
 const summary = weeks[which] ?? weeks.atual ?? weeks.anterior;
 const content = useMemo(() => (summary ? cardContent(summary, { today, body, diet }) : null), [summary, today, body, diet]);

 const canvas = useRef<HTMLCanvasElement>(null);
 const [png, setPng] = useState<{ blob: Blob; key: string } | null>(null);
 const [failed, setFailed] = useState(false);
 const [result, setResult] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);
 const key = content ? JSON.stringify(content) : '';
 useEffect(() => {
  if (!content) return;
  const el = canvas.current;
  if (!el) return;
  let alive = true;
  setFailed(false);
  renderCardPng(el, content, paletteFromDocument()).then(blob => { if (alive) setPng({ blob, key }); }).catch(() => { if (alive) setFailed(true); });
  return () => { alive = false; };
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [key]);
 useEffect(() => { setResult(null); }, [key]);

 const ready = png && png.key === key ? png : null;
 const filename = summary ? cardFilename(summary) : 'fitnez-semana.png';
 const probe = useMemo(() => (typeof File === 'function' ? new File([new Uint8Array(1)], 'x.png', { type: 'image/png' }) : null), []);
 const sharing = probe ? canShareFile(probe) : false;

 const send = async () => {
  if (!ready) return;
  setResult(null);
  const file = new File([ready.blob], filename, { type: 'image/png' });
  if (canShareFile(file)) {
   try { await navigator.share({ files: [file], title: 'Resumo da semana' }); setResult({ kind: 'ok', text: 'Imagem enviada.' }); return; }
   catch (e) { if (e instanceof DOMException && e.name === 'AbortError') return; /* cai no download */ }
  }
  try { downloadBlob(ready.blob, filename); setResult({ kind: 'ok', text: `Imagem salva: ${filename}` }); }
  catch { setResult({ kind: 'error', text: 'Não foi possível salvar a imagem. Tente de novo.' }); }
 };

 if (!state) return null;
 const first = mondayOf(state.settings.start);
 return <Sheet title="Resumo da semana" onClose={onClose} className="rs-sheet">
  {!summary || !content ? <div className="sheet-body">
   <p>O resumo aparece quando o plano começar, na segunda-feira {ddmm(first)}.</p>
  </div> : <div className="sheet-body rs">
   {weeks.atual && weeks.anterior ? <div className="segmented" role="group" aria-label="Semana do resumo">
    <button type="button" aria-pressed={which === 'anterior'} onClick={() => setWhich('anterior')}>Semana passada</button>
    <button type="button" aria-pressed={which === 'atual'} onClick={() => setWhich('atual')}>Esta semana</button>
   </div> : null}

   <Texto c={content} id={`${uid}-t`} />

   <label className="rs-check"><input type="checkbox" checked={body} onChange={() => setBody(v => !v)} />
    <span>Incluir variação de peso e cintura<small>Vale só agora. Fica desmarcado da próxima vez.</small></span></label>
   {summary.diet ? <label className="rs-check"><input type="checkbox" checked={diet} onChange={() => setDiet(v => !v)} />
    <span>Incluir a dieta<small>Mostra em quantos dias você ficou na meta. Vale só agora.</small></span></label> : null}

   <figure className="rs-fig">
    <canvas ref={canvas} width={1080} height={1350} className={ready ? 'rs-card is-ready' : 'rs-card'} role="img" aria-label="Prévia do cartão, com o mesmo conteúdo do resumo acima." />
    <figcaption className="rs-cap">Sem nome, idade ou fotos{content.body ? '' : '; peso e medidas ficam de fora'}.</figcaption>
   </figure>
   {failed ? <p className="in-error" role="alert">Não foi possível criar a imagem. O resumo acima continua valendo.</p> : null}
   <p role={result?.kind === 'error' ? 'alert' : 'status'} className={result?.kind === 'error' ? 'in-error' : 'muted rs-status'}>{result?.text ?? (ready || failed ? '' : 'Preparando a imagem…')}</p>
  </div>}
  <div className="sheet-actions stack">
   {content ? <button type="button" className="button block" disabled={!ready} onClick={() => void send()}>
    <Icon name={sharing ? 'compartilhar' : 'baixar'} size={20} />{sharing ? 'Compartilhar imagem' : 'Baixar imagem'}</button> : null}
   <button type="button" className="button secondary block" onClick={onClose}>Fechar</button>
  </div>
 </Sheet>;
}
