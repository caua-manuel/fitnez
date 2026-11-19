import { useCallback, useEffect, useRef, useState } from 'react';
import { useData } from '../../app/DataProvider';
import { hrefFor } from '../../app/router';
import { isLower, muscleGroupOf } from '../../domain/muscleGroups';
import { suggestNext } from '../../domain/progression';
import { adjustRest, restRemaining } from '../../domain/restTimer';
import { countDoneSets, sessionVolume, setsForWeek } from '../../domain/workout';
import { confirmSet, lastWorkingSession, placeholderFor, workingHistory } from '../../domain/setPlaceholder';
import type { Placeholder } from '../../domain/setPlaceholder';
import { personalRecords, recordForSet } from '../../domain/records';
import { NO_SWAP_TEXT, exercisesWithSwaps, setDaySwap, swapOptions, swapPrescription } from '../../domain/swap';
import { GENERAL_WARMUP_TEXT, WARMUP_TEXT, warmupSets } from '../../domain/warmup';
import { BARBELL_EXERCISES } from '../../domain/plates';
import { Menu } from '../../ui/Menu';
import { Sheet } from '../../ui/Sheet';
import { showToast } from '../../ui/UndoToast';
import { AnilhasSheet, ExercicioSheet } from './ExercicioPagina';
import { recordLine } from './recordText';
import type { SetEntry } from '../../domain/workout';
import { getWorkout, overlappingExercises, upsertWorkout } from '../../domain/workoutRecord';
import type { WorkoutMeta } from '../../domain/workoutRecord';
import type { Exercise, StateV3 } from '../../application/repository';
import { notifyRestEnd } from '../../pwa/notifications';
import { Icon } from '../../ui/icons';
import { Thumb } from '../../ui/Thumb';
import { Glyph } from './glyphs';
import { ConfirmSheet } from '../../ui/Sheet';
import { CheckDraw } from '../../ui/motion';
import { useJustTurnedOn } from './stagger';
import { FREE_SESSION_ID } from '../../domain/weekStreak';
import { GROUP_LABEL, freeExercises, firstIncomplete, formatDay, formatKg, planWeek, readCursor, todayIso, writeCursor } from './util';
import './treino.css';

const REST_KEY = 'treino12:descanso';
const DEFAULT_REST = 90;

interface Rest { exId: string; endsAt: number; total: number }
interface RestSaved extends Rest { id: string; day: string }

function readRest(id: string, day: string): Rest | null {
 try {
  const raw = JSON.parse(localStorage.getItem(REST_KEY) ?? 'null') as RestSaved | null;
  if (!raw || raw.id !== id || raw.day !== day || typeof raw.endsAt !== 'number' || raw.endsAt <= Date.now()) return null;
  return { exId: raw.exId, endsAt: raw.endsAt, total: raw.total };
 } catch { return null; }
}
function writeRest(id: string, day: string, rest: Rest | null) {
 try {
  if (rest) localStorage.setItem(REST_KEY, JSON.stringify({ ...rest, id, day }));
  else localStorage.removeItem(REST_KEY);
 } catch { /* o descanso é apenas conveniência; sem armazenamento, segue sem retomar */ }
}

export function clock(totalSec: number): string {
 const s = Math.max(0, Math.floor(totalSec));
 const m = Math.floor(s / 60), sec = s % 60;
 return `${m}:${String(sec).padStart(2, '0')}`;
}
function elapsed(ms: number): string {
 const s = Math.max(0, Math.floor(ms / 1000));
 return `${String(Math.floor(s / 3600)).padStart(2, '0')}:${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

const weighted = (ex: Exercise) => ex.m === 'kg' || ex.m === 'kgs';
const hasKgField = (ex: Exercise) => ex.m === 'kg' || ex.m === 'kgs' || ex.m === 'bw';
const kgLabel = (ex: Exercise) => ex.m === 'bw' ? 'Carga extra (kg)' : 'Carga (kg)';
const repsLabel = (ex: Exercise) => ex.m === 's' ? 'Tempo (s)' : 'Repetições';

/** Sugestão, "Antes" e aquecimento sugerido de um exercício no dia (tudo do domínio). */
function exContext(state: StateV3, exIds: string[], exId: string, day: string, week: number) {
 const plan = state.catalog.plan, days = state.history.days, ex = plan.ex[exId]!;
 const suggestion = suggestNext({ ex, week, history: workingHistory(days, exId, day), lower: isLower(muscleGroupOf(exId, ex)) });
 const previous = lastWorkingSession(days, exId, day)?.sets ?? [];
 const base = placeholderFor({ ex, week, suggestion, previous, today: [], index: 0 }).kg;
 const pos = exIds.indexOf(exId);
 const earlier = exIds.slice(0, pos < 0 ? 0 : pos).filter(e => plan.ex[e]).map(e => ({ id: e, ex: plan.ex[e]! }));
 const warm = warmupSets({ exId, ex, baseKg: base === null ? null : Number(base), earlier });
 return { suggestion, previous, warm };
}

/** Séries previstas hoje (com troca, as séries do original). */
function plannedSets(state: StateV3, day: string, exId: string, week: number): number {
 const plan = state.catalog.plan, swaps = (state.history.days[day]?.swaps ?? {}) as Record<string, string>;
 const from = Object.keys(swaps).find(k => swaps[k] === exId);
 return from && plan.ex[from] ? swapPrescription(plan.ex[from]!, plan.ex[exId]!, week).sets : setsForWeek(plan.ex[exId]!, week).sets;
}

function freshRows(state: StateV3, exIds: string[], exId: string, day: string, week: number): SetEntry[] {
 const warm = exContext(state, exIds, exId, day, week).warm.map((): SetEntry => ({ kg: '', reps: '', done: false, kind: 'warm' }));
 return [...warm, ...Array.from({ length: plannedSets(state, day, exId, week) }, () => ({ kg: '', reps: '', done: false }))];
}

function initialRows(state: StateV3, exIds: string[], day: string, week: number): Record<string, SetEntry[]> {
 const rec = state.history.days[day];
 const out: Record<string, SetEntry[]> = {};
 for (const exId of exIds) {
  const saved = rec?.log?.[exId];
  if (Array.isArray(saved) && saved.length > 0) out[exId] = saved.map(r => ({ kg: String(r.kg ?? ''), reps: String(r.reps ?? ''), done: r.done === true, ...(r.kind === 'warm' ? { kind: 'warm' as const } : {}) }));
  else out[exId] = freshRows(state, exIds, exId, day, week);
 }
 return out;
}

const dayExIds = (state: StateV3, id: string, day: string, picked?: string) => id === FREE_SESSION_ID ? freeExercises(state, day, picked) : exercisesWithSwaps(state.catalog.plan.sess[id]?.ex ?? [], state.history.days[day]).filter(e => state.catalog.plan.ex[e]);

/** Caixa de marcar da série: a marca se desenha só quando a série é concluída agora (não ao abrir a tela nem ao trocar de exercício). */
function SetCheck({ done }: { done: boolean }) {
 const fresh = useJustTurnedOn(done);
 return <span className="ex-check-box" aria-hidden="true">{done ? <CheckDraw play={fresh} size={18} /> : null}</span>;
}

function RestPanel({ rest, name, now, ended, onAdjust, onClose }: { rest: Rest; name: string; now: number; ended: boolean; onAdjust: (d: number) => void; onClose: () => void }) {
 const left = restRemaining(rest.endsAt, now);
 const pct = rest.total > 0 ? Math.min(100, Math.max(0, (left / rest.total) * 100)) : 0;
 return <section className={`ex-sheet compact${ended ? ' ended' : ''}`} aria-label="Descanso">
  <div className="ex-rest-row">
   <div className="ex-rest-time">
    <span className="ex-clock num" role="timer" aria-label={`Tempo de descanso restante, ${name}`}>{clock(left)}</span>
    <span className="ex-rest-state" aria-hidden="true">{ended ? 'Próxima série' : 'Descanso'}</span>
   </div>
   <div className="ex-sheet-actions">
    <button type="button" className="button secondary" onClick={() => onAdjust(-15)}>−15 s</button>
    <button type="button" className="button secondary" onClick={() => onAdjust(15)}>+15 s</button>
    <button type="button" className="button secondary" onClick={onClose}>{ended ? 'Fechar' : 'Pular'}</button>
   </div>
  </div>
  <div className="ex-bar" aria-hidden="true"><span style={{ width: `${pct}%` }} /></div>
  <p className="visually-hidden" role="status">{ended ? 'Descanso terminado. Próxima série.' : ''}</p>
 </section>;
}

export function Executar({ id, day: dayParam, picked }: { id: string; day?: string; picked?: string }) {
 const { state, commit } = useData();
 const day = dayParam ?? todayIso();
 const startedRef = useRef<number>(0);
 const [rows, setRows] = useState<Record<string, SetEntry[]> | null>(null);
 const [idx, setIdx] = useState(0);
 const [now, setNow] = useState(() => Date.now());
 const [rest, setRest] = useState<Rest | null>(null);
 const [ended, setEnded] = useState(false);
 const [askRest, setAskRest] = useState<string | null>(null);
 const [askValue, setAskValue] = useState(String(DEFAULT_REST));
 const [problem, setProblem] = useState('');
 const [saveError, setSaveError] = useState(false);
 const [busy, setBusy] = useState(false);
 const [notice, setNotice] = useState<{ exId: string; text: string } | null>(null);
 const [open, setOpen] = useState<"ex" | "plates" | "swap" | null>(null);
 const [askFinish, setAskFinish] = useState(false);
 const [overlap, setOverlap] = useState<string[]>([]);
 // Pausa do cronômetro do treino (só visual e da sessão aberta; o tempo parado não entra na duração final).
 const [pausedAt, setPausedAt] = useState<number | null>(null);
 const [pausedMs, setPausedMs] = useState(0);
 const endedFor = useRef<number>(0);
 const latest = useRef<Record<string, SetEntry[]> | null>(null);
 const week = state ? planWeek(state, todayIso()) : 0;

 useEffect(() => {
  if (!state || rows) return;
  const rec = state.history.days[day], plan0 = state.catalog.plan;
  const own = getWorkout(rec, id);
  startedRef.current = own?.startedAt ?? Date.now();
  const ids = dayExIds(state, id, day, picked);
  const init = initialRows(state, ids, day, week);
  setRows(init);
  // Retoma onde a pessoa estava; sem cursor, cai no primeiro exercício incompleto.
  setIdx(readCursor(day, id, ids.length) ?? firstIncomplete(init, ids));
  setRest(readRest(id, day));
  // Aviso (sem apagar nada): séries de hoje que vieram de outro treino.
  if (!own) setOverlap(overlappingExercises(rec, plan0, id).map(e => plan0.ex[e]?.n ?? 'Exercício'));
 }, [state, rows, id, day, week, picked]);
 useEffect(() => { if (rows) writeCursor(day, id, idx); }, [rows, day, id, idx]);

 useEffect(() => { const t = setInterval(() => setNow(Date.now()), 500); return () => clearInterval(t); }, []);

 const plan = state?.catalog.plan;
 const free = id === FREE_SESSION_ID;
 const exIds = state ? dayExIds(state, id, day, picked) : [];
 const sess = free ? { name: 'Treino livre' } : plan?.sess[id];

 useEffect(() => {
  if (!rest || ended || restRemaining(rest.endsAt, now) > 0 || endedFor.current === rest.endsAt) return;
  endedFor.current = rest.endsAt;
  setEnded(true); writeRest(id, day, null);
  try { navigator.vibrate?.([200, 100, 200]); } catch { /* vibração é opcional */ }
  const name = plan?.ex[rest.exId]?.n ?? 'Exercício';
  notifyRestEnd(name).catch(() => undefined);
 }, [rest, ended, now, id, day, plan]);

 // Mede a altura real do rodapé fixo e a publica em --ex-footer-h (espaçador e scroll-padding dependem dela).
 const observer = useRef<ResizeObserver | null>(null);
 const footerRef = useCallback((node: HTMLDivElement | null) => {
  observer.current?.disconnect(); observer.current = null;
  const root = document.documentElement;
  if (!node) { root.style.removeProperty('--ex-footer-h'); return; }
  const publish = () => root.style.setProperty('--ex-footer-h', `${Math.ceil(node.getBoundingClientRect().height)}px`);
  publish();
  if (typeof ResizeObserver !== 'undefined') { observer.current = new ResizeObserver(publish); observer.current.observe(node); }
 }, []);

 const back = <a className="tr-back" href={hrefFor({ tab: 'treino', view: 'detalhe', id })}>← Voltar</a>;
 const backIcon = <a className="icon-button ex-back" href={hrefFor({ tab: 'treino', view: 'detalhe', id })} aria-label="Voltar ao treino"><Icon name="voltar" size={24} /></a>;
 const togglePause = () => {
  if (pausedAt === null) setPausedAt(Date.now());
  else { setPausedMs(ms => ms + (Date.now() - pausedAt)); setPausedAt(null); }
 };
 if (!state || !plan) return null;
 if (!sess) return <section className="card"><p>Treino não encontrado.</p><a className="tr-back" href={hrefFor({ tab: 'treino', view: 'lista' })}>← Voltar aos treinos</a></section>;
 if (!rows || exIds.length === 0) return <section className="card">{exIds.length === 0 && rows ? <div className="tr-empty-card"><strong>Este treino não tem exercícios.</strong><p className="muted">Adicione exercícios ao treino para poder executá-lo.</p><a className="button" href={hrefFor({ tab: 'treino', view: free ? 'detalhe' : 'editar', id })}>{free ? 'Escolher exercícios' : 'Editar treino'}</a></div> : <p className="loading" role="status">Abrindo o treino…</p>}{back}</section>;

 const exId = exIds[Math.min(idx, exIds.length - 1)]!;
 const ex = plan.ex[exId]!;
 const list = rows[exId] ?? [];
 const group = muscleGroupOf(exId, ex);
 const all = exIds.map(e => rows[e] ?? []);
 const doneSets = countDoneSets(all);

 const persist = async (next: Record<string, SetEntry[]>, finish: boolean): Promise<boolean> => {
  const entries = exIds.map(e => next[e] ?? []);
  const sets = countDoneSets(entries), volume = sessionVolume(entries);
  const idle = pausedMs + (pausedAt !== null ? Date.now() - pausedAt : 0);
  const finishedAt = Date.now() - (finish ? idle : 0);
  const ok = await commit(draft => {
   const rec = draft.history.days[day] ?? {};
   const log = { ...(rec.log ?? {}) };
   for (const e of exIds) {
    const r = next[e] ?? [];
    const planned = plannedSets(state, day, e, week);
    if (r.some(s => s.done || s.kg !== '' || s.reps !== '') || r.length !== planned || log[e]) log[e] = r.map(s => ({ ...s }));
   }
   const prev = getWorkout(rec, id);
   const meta: WorkoutMeta = {
    sessionId: id, startedAt: prev?.startedAt ?? startedRef.current,
    status: finish || prev?.status === 'done' ? 'done' : 'partial', sets, volume,
   };
   if (finish) meta.finishedAt = finishedAt; else if (prev?.finishedAt) meta.finishedAt = prev.finishedAt;
   // Treino livre não marca o dia de academia (não conta na sequência).
   const acts = finish && !free ? { ...(rec.acts ?? {}), gym: true } : rec.acts;
   // Só o treino `id` muda: os demais treinos do dia ficam como estão.
   draft.history.days[day] = { ...upsertWorkout({ ...rec, log }, meta), ...(acts ? { acts } : {}) };
   return draft;
  });
  setSaveError(!ok);
  return ok;
 };

 const setField = (i: number, field: 'kg' | 'reps', value: string) => {
  setProblem('');
  setRows(r => ({ ...r!, [exId]: r![exId]!.map((s, k) => k === i ? { ...s, [field]: value } : s) }));
 };

 const beginRest = (forEx: string, seconds: number) => {
  const total = seconds, endsAt = Date.now() + seconds * 1000;
  const r = { exId: forEx, endsAt, total };
  setRest(r); setEnded(false); setAskRest(null); writeRest(id, day, r);
 };

 const ctx = exContext(state, exIds, exId, day, week);
 const workIdx = (i: number) => list.slice(0, i).filter(s => s.kind !== 'warm').length;
 const phOf = (i: number): Placeholder => {
  if (list[i]!.kind === 'warm') {
   const w = ctx.warm[i - workIdx(i)];
   return { kg: w ? String(w.kg) : null, reps: w ? String(w.reps) : null, podeConfirmar: !!w, falta: w ? null : 'reps', dica: { kg: 'kg', reps: 'reps' } };
  }
  return placeholderFor({ ex, week, suggestion: ctx.suggestion, previous: ctx.previous, today: list, index: workIdx(i) });
 };
 const bests = ex.m === 'kg' ? personalRecords(state.history.days, exId, ex, day) : null;
 const recOf = (i: number, s: SetEntry) => !bests || !s.done || s.kind === 'warm' ? null
  : recordForSet({ ex, bests, todayBefore: list.slice(0, i).filter(x => x.done && x.kind !== 'warm'), set: s, day });
 const setLabel = (s: SetEntry) => s.kg !== '' && hasKgField(ex) ? `${s.kg.replace('.', ',')} kg × ${s.reps}${ex.m === 'kgs' ? ' s' : ''}` : `${s.reps} ${ex.m === 's' ? 's' : 'repetições'}`;
 latest.current = rows;

 const toggle = (i: number) => {
  const row = list[i]!;
  let nextRow: SetEntry, msg = '';
  if (row.done) nextRow = { ...row, done: false };
  else {
   // Campo vazio grava o placeholder (sugestão e "Antes"), com Desfazer.
   const r = confirmSet({ kg: row.kg, reps: row.reps }, phOf(i), ex, row.kind);
   if (!r.ok) { setProblem(`${r.mensagem} da série ${workIdx(i) + 1}`); return; }
   nextRow = r.set;
   if (row.kg === '' || row.reps === '') msg = `Registrado ${setLabel(nextRow)}`;
  }
  setProblem('');
  const next = { ...rows, [exId]: list.map((s, k) => k === i ? nextRow : s) };
  setRows(next);
  void persist(next, false);
  const pr = recOf(i, nextRow);
  setNotice(pr ? { exId, text: recordLine(pr) } : null);
  if (msg) showToast(msg, () => {
   const cur = latest.current!, back = { ...cur, [exId]: (cur[exId] ?? []).map((s, k) => k === i ? row : s) };
   setRows(back); void persist(back, false); setNotice(null); closeRest();
  });
  if (nextRow.done) {
   if (typeof ex.rest === 'number' && ex.rest > 0) beginRest(exId, ex.rest);
   else { setAskRest(exId); setRest(null); writeRest(id, day, null); }
  }
 };

 const addSet = () => {
  const next = { ...rows, [exId]: [...list, { kg: '', reps: '', done: false }] };
  setRows(next); void persist(next, false);
 };

 const adjust = (delta: number) => {
  if (!rest) return;
  const t = Date.now();
  const endsAt = adjustRest(rest.endsAt, delta, t);
  const r = { ...rest, endsAt, total: Math.max(rest.total, restRemaining(endsAt, t)) };
  setRest(r); setNow(t); writeRest(id, day, r);
  if (endsAt > t) { setEnded(false); }
 };
 const closeRest = () => { setRest(null); setEnded(false); writeRest(id, day, null); };

 const touched = all.filter(r => r.some(s => s.done && s.kind !== 'warm')).length;
 const tryFinish = () => {
  if (doneSets === 0 || busy) return;
  if (touched < exIds.length) setAskFinish(true); else void finish();
 };
 const finish = async () => {
  if (doneSets === 0 || busy) return;
  setAskFinish(false);
  setBusy(true);
  const ok = await persist(rows, true);
  setBusy(false);
  if (ok) { writeRest(id, day, null); writeCursor(day, id, null); window.location.hash = hrefFor({ tab: 'treino', view: 'concluido', id, day }); }
 };

 const sug = ctx.suggestion;
 const sugText = !ctx.previous.length || sug.reason === 'sem-historico' ? null
  : sug.reason === 'reduzir' ? `reduzir a carga${weighted(ex) && sug.kg !== null ? ` (${formatKg(sug.kg)} kg)` : ''} e manter ${sug.reps}`
  : weighted(ex) && sug.kg !== null ? `${formatKg(sug.kg)} kg · ${sug.reps}${sug.reason === 'manter' ? ' (manter a carga)' : ''}` : sug.reps;
 const plannedNow = { sets: plannedSets(state, day, exId, week), reps: setsForWeek(ex, week).reps };
 const restName = rest ? plan.ex[rest.exId]?.n ?? '' : '';
 const swaps = (state.history.days[day]?.swaps ?? {}) as Record<string, string>;
 const original = Object.keys(swaps).find(k => swaps[k] === exId) ?? exId;
 const answers = state.settings.onboarding?.answers;
 const options = open === 'swap' ? swapOptions(original, answers?.place, answers?.experience, exIds) : [];
 const note = ((state.settings.exerciseNotes ?? {}) as Record<string, string>)[exId];
 const hasWarm = list.some(s => s.kind === 'warm');
 const kgCol = hasKgField(ex);
 const antesText = (s: SetEntry | null | undefined) => !s ? '—' : kgCol && s.kg !== '' ? `${s.kg.replace('.', ',')}×${s.reps}` : s.reps || '—';
 const doSwap = async (to: string | null) => {
  setOpen(null);
  const target = to ?? original;
  if (target === exId) return;
  const nextDay = setDaySwap(state.history.days[day], original, to);
  const ok = await commit(d => { d.history.days[day] = setDaySwap(d.history.days[day], original, to); return d; });
  if (!ok) { setSaveError(true); return; }
  const virtual = { ...state, history: { ...state.history, days: { ...state.history.days, [day]: nextDay } } };
  setRows(r => r && !r[target]?.length ? { ...r, [target]: freshRows(virtual, exIds.map(e => e === exId ? target : e), target, day, week) } : r);
  setNotice(null);
 };
 const menu = [
  { label: 'Ver exercício', onClick: () => setOpen('ex') },
  ...(list.some(s => s.done) ? [] : [{ label: 'Trocar exercício só hoje', icon: 'troca' as const, onClick: () => setOpen('swap') }]),
  ...(BARBELL_EXERCISES.includes(exId) ? [{ label: 'Calcular anilhas', onClick: () => setOpen('plates') }] : []),
 ];

 return <div className="ex-wrap tone-treino">
  <div className="ex-top">
   {backIcon}
   <span className="ex-elapsed num"><span className="visually-hidden">Tempo de treino </span>{elapsed((pausedAt ?? now) - startedRef.current - pausedMs)}</span>
   <button type="button" className="ex-pause" aria-label="Pausar cronômetro do treino" aria-pressed={pausedAt !== null} onClick={togglePause}>
    {pausedAt === null ? <Glyph name="pausa" size={22} /> : <Icon name="play" size={20} />}
   </button>
  </div>
  <p className="ex-sess">{sess.name}</p>
  {overlap.length > 0 ? <p className="ex-overlap" role="note"><strong>Estes exercícios já têm séries registradas hoje:</strong> {overlap.join(', ')}. As séries continuam salvas e nada é apagado; o que você registrar aqui as atualiza.</p> : null}
  <div className="ex-name">
   <span className="ex-count">Exercício {idx + 1} de {exIds.length}</span>
   <h2><button type="button" className="ex-title-btn" onClick={() => setOpen('ex')}>{ex.n}</button></h2>
   {group ? <span className="ex-group">{GROUP_LABEL[group]}{original !== exId ? ` · no lugar de ${plan.ex[original]?.n ?? ''}` : ''}</span> : null}
   {note ? <span className="muted ex-tip">{note}</span> : null}
   <Menu className="ex-more" label={`Mais opções de ${ex.n}`} trigger={<Icon name="mais" size={22} weight={2} />} items={menu} />
  </div>
  <div className="ex-stage">
   <button type="button" className="icon-button ex-arrow" aria-label="Exercício anterior" disabled={idx === 0} onClick={() => { setProblem(''); setIdx(i => Math.max(0, i - 1)); }}><Glyph name="esq" size={26} weight={2.4} /></button>
   <div className="ex-art"><Thumb kind="exercise" id={exId} group={group ?? undefined} size={144} className="ex-thumb" label={ex.n} /></div>
   <button type="button" className="icon-button ex-arrow" aria-label="Próximo exercício" disabled={idx >= exIds.length - 1} onClick={() => { setProblem(''); setIdx(i => Math.min(exIds.length - 1, i + 1)); }}><Glyph name="dir" size={26} weight={2.4} /></button>
  </div>
  <div className="ex-info">
   <p className="ex-plan"><strong className="num">{plannedNow.sets} {plannedNow.sets === 1 ? 'série' : 'séries'}</strong> · <span className="num">{plannedNow.reps}</span></p>
   {ex.t ? <p className="muted ex-tip">{ex.t}</p> : null}
   {idx === 0 ? <p className="muted ex-tip">{GENERAL_WARMUP_TEXT}</p> : null}
   {sugText ? <p className="tr-sug">Sugestão: {sugText} <span className="muted" style={{ fontWeight: 400 }}>(só uma sugestão; você define a carga)</span></p> : null}
  </div>

  <section className="ex-card" aria-label={`Séries de ${ex.n}`}>
   <div className={`ex-row ex-head has-antes${kgCol ? '' : ' no-kg'}`} aria-hidden="true"><span>Série</span><span>Antes</span><span>{repsLabel(ex)}</span>{kgCol ? <span>{kgLabel(ex)}</span> : null}<span /></div>
   {list.map((s, i) => {
    const warm = s.kind === 'warm', n = warm ? i - workIdx(i) + 1 : workIdx(i) + 1;
    const name = warm ? `aquecimento ${n}` : `série ${n}`;
    const ph = s.done ? null : phOf(i);
    const prev = warm ? null : ctx.previous[workIdx(i)];
    const pr = recOf(i, s);
    return <div key={i} className="ex-set">
     <div className={`ex-row has-antes${kgCol ? '' : ' no-kg'}${s.done ? ' is-done' : ''}`}>
      <span className="ex-n num" aria-label={warm ? `Aquecimento ${n}` : undefined}>{warm ? 'A' : n}</span>
      <span className="ex-antes num" aria-label={prev ? `Antes: ${kgCol && prev.kg !== '' ? `${prev.kg.replace('.', ',')} kg, ` : ''}${prev.reps} ${ex.m === 's' ? 'segundos' : 'repetições'}` : 'Antes: sem registro'}>{antesText(prev)}</span>
      <input className="ex-input num" inputMode="decimal" enterKeyHint="next" autoComplete="off" aria-label={`${repsLabel(ex)}, ${name}`} value={s.reps} placeholder={ph ? ph.reps ?? ph.dica.reps : undefined} aria-invalid={problem !== '' && !s.done && s.reps === '' && !ph?.reps} onChange={e => setField(i, 'reps', e.target.value)} />
      {kgCol ? <input className="ex-input num" inputMode="decimal" enterKeyHint="done" autoComplete="off" aria-label={`${kgLabel(ex)}, ${name}`} value={s.kg} placeholder={ph ? (ph.kg ?? ph.dica.kg).replace('.', ',') : undefined} onChange={e => setField(i, 'kg', e.target.value)} /> : null}
      <button type="button" className={`ex-check${s.done ? ' on' : ''}`} aria-label={`${warm ? 'Aquecimento' : 'Série'} ${n} concluída`} aria-pressed={s.done} onClick={() => toggle(i)}>
       <SetCheck key={exId} done={s.done} />
      </button>
     </div>
     {pr ? <p className="ex-pr"><Glyph name="trofeu" size={16} />{recordLine(pr)}</p> : null}
    </div>;
   })}
   {hasWarm ? <p className="muted ex-tip">{WARMUP_TEXT}</p> : null}
   {problem ? <p className="ex-problem" role="alert">{problem}</p> : null}
   <p className="ex-copied" role="status">{notice?.exId === exId ? notice.text : ''}</p>
  </section>
  <button type="button" className="ex-add" onClick={addSet}><Icon name="plus" size={20} />Adicionar série</button>
  {saveError ? <p className="ex-problem" role="alert">Não foi possível salvar agora. O que você digitou continua na tela; conclua uma série ou o treino para tentar de novo.</p> : null}

  <div className="ex-spacer" aria-hidden="true" />
  <div className="ex-footer" ref={footerRef}>
   {rest ? <RestPanel rest={rest} name={restName} now={now} ended={ended} onAdjust={adjust} onClose={closeRest} /> : null}
   {!rest && askRest ? <section className="ex-sheet compact" aria-label="Descanso">
    <label htmlFor="rest-sec" className="ex-ask-label"><strong>Descanso (s)</strong> <span className="tr-meta">Este exercício não tem tempo definido.</span></label>
    <div className="ex-sheet-actions two">
     <input id="rest-sec" className="ex-input num" inputMode="numeric" value={askValue} onChange={e => setAskValue(e.target.value.replace(/\D/g, ''))} />
     <button type="button" className="button secondary" onClick={() => { const n = Number(askValue); if (n > 0) beginRest(askRest, n); }}>Iniciar</button>
     <button type="button" className="button secondary" onClick={() => setAskRest(null)}>Pular</button>
    </div>
   </section> : null}
   <button type="button" className="button block ex-finish" disabled={doneSets === 0 || busy} aria-describedby={doneSets === 0 ? 'ex-hint' : undefined} onClick={tryFinish}>Concluir treino</button>
   {doneSets === 0 ? <p id="ex-hint" className="visually-hidden">Conclua ao menos uma série para concluir o treino.</p> : null}
  </div>
  {askFinish ? <ConfirmSheet title="Concluir o treino?" destructive={false} icon="marca" confirmLabel="Concluir" cancelLabel="Continuar treinando" onCancel={() => setAskFinish(false)} onConfirm={() => { void finish(); }}>
   <p>Você registrou {touched} de {exIds.length} exercícios. Concluir mesmo assim?</p>
  </ConfirmSheet> : null}
  {open === 'ex' ? <ExercicioSheet exId={exId} onClose={() => setOpen(null)} /> : null}
  {open === 'plates' ? <AnilhasSheet initial={list.find(s => !s.done && s.kind !== 'warm')?.kg || ''} onClose={() => setOpen(null)} /> : null}
  {open === 'swap' ? <Sheet title={`Trocar ${plan.ex[original]?.n ?? ''} só hoje`} onClose={() => setOpen(null)}>
   <div className="sheet-body">{options.length === 0 ? <p>{NO_SWAP_TEXT}</p> : <ul className="sw-list">{options.filter(o => plan.ex[o]).map(o => <li key={o}><button type="button" className="button secondary block" onClick={() => void doSwap(o)}>{plan.ex[o]!.n}</button></li>)}</ul>}
    <p className="muted ev-hint">A troca vale só para hoje; o plano não muda.</p></div>
   <div className="sheet-actions">{original !== exId ? <button type="button" className="button secondary" onClick={() => void doSwap(null)}>Voltar ao original</button> : null}<button type="button" className="button secondary" onClick={() => setOpen(null)}>Fechar</button></div>
  </Sheet> : null}
 </div>;
}
