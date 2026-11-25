import { useCallback, useEffect, useRef, useState } from 'react';
import { useData } from '../../app/DataProvider';
import { hrefFor } from '../../app/router';
import { storageKey } from '../../app/mode';
import { isLower, muscleGroupOf } from '../../domain/muscleGroups';
import { rirSequence } from '../../domain/calendar';
import { suggestNext } from '../../domain/progression';
import { adjustRest, restRemaining, restoreRest } from '../../domain/restTimer';
import { countDoneSets, parseNumber, sessionVolume, setsForWeek } from '../../domain/workout';
import { confirmSet, lastWorkingSession, placeholderFor, workingHistory } from '../../domain/setPlaceholder';
import type { Placeholder } from '../../domain/setPlaceholder';
import { personalRecords, recordForSet } from '../../domain/records';
import { NO_SWAP_TEXT, exercisesWithSwaps, setDaySwap, swapOptions, swapPrescription } from '../../domain/swap';
import { GENERAL_WARMUP_TEXT, WARMUP_TEXT, warmupSets } from '../../domain/warmup';
import { BARBELL_EXERCISES } from '../../domain/plates';
import { Menu } from '../../ui/Menu';
import { Sheet } from '../../ui/Sheet';
import { showToast } from '../../ui/UndoToast';
import { ComoFazerSheet, ExercicioSheet, HistoricoRapido, preloadExercicio } from './lazy';
import { AnilhasSheet } from './Anilhas';
import { recordLine } from './recordText';
import type { SetEntry } from '../../domain/workout';
import { getWorkout, overlappingExercises, upsertWorkout } from '../../domain/workoutRecord';
import type { WorkoutMeta } from '../../domain/workoutRecord';
import type { Exercise, StateV3 } from '../../application/repository';
import { notifyRestEnd } from '../../pwa/notifications';
import { recordHaptic, restEndHaptic } from '../../pwa/haptics';
import { setAnnouncement } from './announce';
import { AvisoEstagnacao } from './Estagnacao';
import { useWakeLock } from '../../pwa/wakeLock';
import { Icon } from '../../ui/icons';
import { Thumb } from '../../ui/Thumb';
import { Glyph } from './glyphs';
import { ConfirmSheet } from '../../ui/Sheet';
import { CheckDraw } from '../../ui/motion';
import { useJustTurnedOn } from './stagger';
import { FREE_SESSION_ID } from '../../domain/weekStreak';
import { GROUP_LABEL, freeExercises, firstIncomplete, formatDay, formatKg, normalize, planWeek, readCursor, todayIso, writeCursor } from './util';
import { applyDraft, draftKey, readDraft, writeDraft } from './rascunho';
import './treino.css';

// ADR 011, 1.1: no modo real a chave continua 'treino12:descanso'; na demo vira 'treino12:demo:descanso'.
const REST_KEY = storageKey('descanso');
const DEFAULT_REST = 90;

interface Rest { exId: string; endsAt: number; total: number }

/** Texto guardado do descanso (a leitura e a validação ficam em restoreRest, no domínio). */
function readRestRaw(): string | null { try { return localStorage.getItem(REST_KEY); } catch { return null; } }
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
/** Tempo de treino: m:ss até 1 h, depois h:mm:ss (dado secundário entre séries; ux-auditoria-fase-3.md, correção 7). */
function elapsed(ms: number): string {
 const s = Math.max(0, Math.floor(ms / 1000)), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = String(s % 60).padStart(2, '0');
 return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${m}:${sec}`;
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
 const warm = warmupSets({ exId, ex, baseKg: base === null ? null : parseNumber(base), earlier });
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

/** Botão de anilhas da série ativa (exercício com barra): mostra a carga que vai montar, digitada ou sugerida. */
function PlatesButton({ kg, name, onClick }: { kg: string; name: string; onClick: () => void }) {
 return <div className="ex-plates">
  <button type="button" className="ex-plates-btn" aria-haspopup="dialog" aria-label={kg ? `Anilhas para ${kg} kg, ${name}` : `Calcular anilhas, ${name}`} onClick={onClick}>
   <Glyph name="anilha" size={20} />
   <span>{kg ? <>Anilhas para <span className="num">{kg} kg</span></> : 'Calcular anilhas'}</span>
  </button>
 </div>;
}

function RestPanel({ rest, nextText, now, ended, onAdjust, onClose }: { rest: Rest; nextText: string; now: number; ended: boolean; onAdjust: (d: number) => void; onClose: () => void }) {
 const left = restRemaining(rest.endsAt, now);
 const pct = rest.total > 0 ? Math.min(100, Math.max(0, (left / rest.total) * 100)) : 0;
 return <section className={`ex-sheet compact${ended ? ' ended' : ''}`} aria-label="Descanso">
  <div className="ex-rest-row">
   <div className="ex-rest-time">
    <span className="ex-clock num" role="timer"><span className="visually-hidden">Descanso restante: </span>{clock(left)}</span>
    <span className="ex-rest-state" aria-hidden="true">{ended ? 'Próxima série' : 'Descanso'}</span>
   </div>
   <div className="ex-sheet-actions">
    <button type="button" className="button secondary" aria-label="Tirar 15 segundos" onClick={() => onAdjust(-15)}>−15 s</button>
    <button type="button" className="button secondary" aria-label="Somar 15 segundos" onClick={() => onAdjust(15)}>+15 s</button>
    <button type="button" className="button secondary" aria-label={ended ? 'Fechar descanso' : 'Pular descanso'} onClick={onClose}>{ended ? 'Fechar' : 'Pular'}</button>
   </div>
  </div>
  <div className="ex-bar" aria-hidden="true"><span style={{ transform: `scaleX(${pct / 100})` }} /></div>
  <p className="visually-hidden" role="status">{ended ? `Descanso terminado. ${nextText}` : ''}</p>
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
 const [leaving, setLeaving] = useState(false);
 const [notice, setNotice] = useState<{ exId: string; text: string } | null>(null);
 // Anúncio único da execução (série registrada, recorde, descanso, troca de exercício): uma região só.
 const [announce, setAnnounce] = useState('');
 const scrollActive = useRef(false);
 const [open, setOpen] = useState<'guide' | 'ex' | 'hist' | 'plates' | 'swap' | 'add' | null>(null);
 // Série que abriu a calculadora de anilhas ("Usar X kg" preenche a carga dela); null = aberta pelo menu.
 const [platesFor, setPlatesFor] = useState<number | null>(null);
 const [addQ, setAddQ] = useState('');
 // Exercícios cuja lista de séries mudou de forma (aquecimento dispensado ou marcado): grava mesmo sem valores.
 const reshaped = useRef<Set<string>>(new Set());
 const [askFinish, setAskFinish] = useState(false);
 const [overlap, setOverlap] = useState<string[]>([]);
 // Pausa do cronômetro do treino (só visual e da sessão aberta; o tempo parado não entra na duração final).
 const [pausedAt, setPausedAt] = useState<number | null>(null);
 const [pausedMs, setPausedMs] = useState(0);
 const endedFor = useRef<number>(0);
 const latest = useRef<Record<string, SetEntry[]> | null>(null);
 const week = state ? planWeek(state, todayIso()) : 0;

 // ADR 011 (2.1): retoma o descanso guardado. Ativo: segue contando; venceu há até 10 min: mostra "terminado" sem vibrar de novo.
 const restoreRef = useRef<() => void>(() => undefined);
 restoreRef.current = () => {
  const r = restoreRest(readRestRaw(), { id, day, now: Date.now() });
  if (r.kind === 'ativo') { setRest(r.rest); setEnded(false); }
  else if (r.kind === 'terminado') { endedFor.current = r.rest.endsAt; setRest(r.rest); setEnded(true); writeRest(id, day, null); }
  else writeRest(id, day, null);
 };
 useEffect(() => {
  if (!state || rows) return;
  const rec = state.history.days[day], plan0 = state.catalog.plan;
  const own = getWorkout(rec, id);
  startedRef.current = own?.startedAt ?? Date.now();
  const ids = dayExIds(state, id, day, picked);
  const init = initialRows(state, ids, day, week);
  setRows(applyDraft(init, readDraft(draftKey(import.meta.env.BASE_URL, day, id))));
  // Retoma onde a pessoa estava; sem cursor, cai no primeiro exercício incompleto.
  setIdx(readCursor(day, id, ids.length) ?? firstIncomplete(init, ids));
  restoreRef.current();
  // Aviso (sem apagar nada): séries de hoje que vieram de outro treino.
  if (!own) setOverlap(overlappingExercises(rec, plan0, id).map(e => plan0.ex[e]?.n ?? 'Exercício'));
 }, [state, rows, id, day, week, picked]);
 useEffect(() => { if (rows) writeCursor(day, id, idx); }, [rows, day, id, idx]);
 // Rascunho do que foi digitado e ainda não concluído (sobrevive a bloquear o celular, fechar o app ou Voltar).
 const dKey = draftKey(import.meta.env.BASE_URL, day, id);
 const draftOff = useRef(false);
 const flushDraft = useRef<() => void>(() => undefined);
 flushDraft.current = () => { if (!draftOff.current && rows) writeDraft(dKey, latest.current ?? rows); };
 useEffect(() => {
  if (!rows) return;
  const t = setTimeout(() => flushDraft.current(), 400);
  return () => clearTimeout(t);
 }, [rows]);
 useEffect(() => { flushDraft.current(); }, [idx]);
 useEffect(() => {
  const onHide = () => { if (document.visibilityState === 'hidden') flushDraft.current(); };
  const onPageHide = () => flushDraft.current();
  document.addEventListener('visibilitychange', onHide);
  window.addEventListener('pagehide', onPageHide);
  return () => { flushDraft.current(); document.removeEventListener('visibilitychange', onHide); window.removeEventListener('pagehide', onPageHide); };
 }, []);

 useEffect(() => {
  const tick = () => setNow(Date.now());
  const t = setInterval(tick, 500);
  // Ao voltar à aba, o intervalo pode ter ficado parado: atualiza o relógio do descanso na hora.
  const onVisible = () => { if (document.visibilityState === 'visible') { tick(); restoreRef.current(); } };
  document.addEventListener('visibilitychange', onVisible);
  return () => { clearInterval(t); document.removeEventListener('visibilitychange', onVisible); };
 }, []);
 // Tela acesa enquanto a execução está aberta; solta ao concluir (leaving) ou ao sair (desmonta).
 useWakeLock(rows !== null && !leaving);
 useEffect(preloadExercicio, []);
 // Depois de marcar, a próxima série fica acima do rodapé (que cresce com o descanso): espera o rodapé medir e rola.
 useEffect(() => {
  if (!scrollActive.current) return;
  scrollActive.current = false;
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  requestAnimationFrame(() => requestAnimationFrame(() => document.querySelector('.ex-set.is-active')?.scrollIntoView({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' })));
 });

 const plan = state?.catalog.plan;
 const free = id === FREE_SESSION_ID;
 const exIds = state ? dayExIds(state, id, day, picked) : [];
 const sess = free ? { name: 'Treino livre' } : plan?.sess[id];

 useEffect(() => {
  if (!rest || ended || restRemaining(rest.endsAt, now) > 0 || endedFor.current === rest.endsAt) return;
  endedFor.current = rest.endsAt;
  setEnded(true); writeRest(id, day, null);
  restEndHaptic();
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
    if (r.some(s => s.done || s.kg !== '' || s.reps !== '') || r.length !== planned || log[e] || reshaped.current.has(e)) log[e] = r.map(s => ({ ...s }));
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
   return { kg: w ? formatKg(w.kg) : null, reps: w ? String(w.reps) : null, podeConfirmar: !!w, falta: w ? null : 'reps', dica: { kg: 'kg', reps: 'reps' } };
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
  if (pr) recordHaptic();
  const warmRow = row.kind === 'warm', num = warmRow ? i - workIdx(i) + 1 : workIdx(i) + 1;
  const restSec = nextRow.done && typeof ex.rest === 'number' && ex.rest > 0 ? ex.rest : null;
  setAnnounce(nextRow.done ? setAnnouncement({ warm: warmRow, n: num, m: ex.m, set: nextRow, record: pr ? recordLine(pr) : null, restSec }) : `${warmRow ? 'Aquecimento' : 'Série'} ${num} desmarcad${warmRow ? 'o' : 'a'}.`);
  // O Desfazer continua no toast, mas sem falar de novo: a frase acima já disse o que foi registrado.
  if (msg) showToast(msg, () => {
   const cur = latest.current!, back = { ...cur, [exId]: (cur[exId] ?? []).map((s, k) => k === i ? row : s) };
   setRows(back); void persist(back, false); setNotice(null); closeRest(); setAnnounce('Registro desfeito.');
  }, { silent: true });
  if (nextRow.done) {
   scrollActive.current = true;
   if (restSec) beginRest(exId, restSec);
   else { setAskRest(exId); setRest(null); writeRest(id, day, null); }
  }
 };

 // Aquecimento manual: marcar, desmarcar (vira série de trabalho) e dispensar a linha "A" ainda não feita.
 const reshape = (next: SetEntry[]) => {
  reshaped.current.add(exId);
  const all2 = { ...rows, [exId]: next };
  setRows(all2); setProblem(''); setNotice(null); void persist(all2, false);
 };
 const setWarm = (i: number, on: boolean) => reshape(list.map((s, k) => {
  if (k !== i) return s;
  const { kind: _k, ...rest } = s;
  return on ? { ...rest, kind: 'warm' as const } : rest;
 }));
 const dismissWarm = (i: number) => reshape(list.filter((_, k) => k !== i));

 // Treino livre: a lista vai na URL (?ex=); grava o que já foi digitado antes de trocar a lista e mantém o exercício em foco.
 const started = (e: string) => (rows[e] ?? []).some(s => s.done || s.kg !== '' || s.reps !== '');
 const relist = async (ids: string[], focus: string) => {
  setOpen(null);
  if (exIds.some(started) && !(await persist(rows, false))) return;
  writeCursor(day, id, Math.max(0, ids.indexOf(focus)));
  window.location.replace(hrefFor({ tab: 'treino', view: 'executar', id, ...(dayParam ? { day: dayParam } : {}), ex: ids.join(',') }));
 };
 const move = (d: -1 | 1) => { const ids = [...exIds], j = idx + d; [ids[idx], ids[j]] = [ids[j]!, ids[idx]!]; void relist(ids, exId); };
 const removeEx = () => { const ids = exIds.filter(e => e !== exId); void relist(ids, ids[Math.min(idx, ids.length - 1)]!); };

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
  if (ok) { draftOff.current = true; writeDraft(dKey, null); setLeaving(true); writeRest(id, day, null); writeCursor(day, id, null); window.location.hash = hrefFor({ tab: 'treino', view: 'concluido', id, day }); }
 };

 const sug = ctx.suggestion;
 const sugText = !ctx.previous.length || sug.reason === 'sem-historico' ? null
  : sug.reason === 'reduzir' ? `reduzir a carga${weighted(ex) && sug.kg !== null ? ` (${formatKg(sug.kg)} kg)` : ''} e manter ${sug.reps}`
  : weighted(ex) && sug.kg !== null ? `${formatKg(sug.kg)} kg · ${sug.reps}${sug.reason === 'manter' ? ' (manter a carga)' : ''}` : sug.reps;
 const plannedNow = { sets: plannedSets(state, day, exId, week), reps: setsForWeek(ex, week).reps };
 // Dicas da primeira execução (ux-primeira-abertura.md, E1 a E3): somem sozinhas quando deixam de fazer sentido.
 const rirNow = rirSequence(plan)[week] ?? '';
 const firstTime = weighted(ex) && ctx.previous.length === 0;
 const neverLogged = doneSets === 0 && !Object.entries(state.history.days).some(([d, r]) => d !== day && Object.values(r.log ?? {}).some(rs => Array.isArray(rs) && rs.some(s => s?.done === true)));
 const restName = rest ? plan.ex[rest.exId]?.n ?? '' : '';
 const swaps = (state.history.days[day]?.swaps ?? {}) as Record<string, string>;
 const original = Object.keys(swaps).find(k => swaps[k] === exId) ?? exId;
 const answers = state.settings.onboarding?.answers;
 const options = open === 'swap' ? swapOptions(original, answers?.place, answers?.experience, exIds) : [];
 const note = ((state.settings.exerciseNotes ?? {}) as Record<string, string>)[exId];
 const hasWarm = list.some(s => s.kind === 'warm');
 const kgCol = hasKgField(ex);
 const barbell = BARBELL_EXERCISES.includes(exId) && weighted(ex);
 // Série ativa: a primeira série de trabalho ainda não concluída (recebe o botão de anilhas).
 const activeIdx = list.findIndex(s => !s.done && s.kind !== 'warm');
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
  { label: 'Últimas sessões', icon: 'historico' as const, onClick: () => setOpen('hist') },
  { label: 'Ver exercício', onClick: () => setOpen('ex') },
  ...(list.some(s => s.done) ? [] : [{ label: 'Trocar exercício só hoje', icon: 'troca' as const, onClick: () => setOpen('swap') }]),
  ...(barbell ? [{ label: 'Calcular anilhas', onClick: () => { setPlatesFor(null); setOpen('plates'); } }] : []),
  ...(free && !started(exId) ? [
   ...(idx > 0 ? [{ label: 'Mover para cima', onClick: () => move(-1) }] : []),
   ...(idx < exIds.length - 1 ? [{ label: 'Mover para baixo', onClick: () => move(1) }] : []),
   ...(exIds.length > 1 ? [{ label: 'Remover do treino', danger: true, onClick: removeEx }] : []),
  ] : []),
 ];
 // Série ativa = primeira linha ainda não feita (destaque, aria-current e rolagem depois de marcar).
 const nextOpen = list.findIndex(s => !s.done);
 const exDone = list.length > 0 && nextOpen < 0;
 const nextEx = idx < exIds.length - 1 ? plan.ex[exIds[idx + 1]!] : undefined;
 const restNext = nextOpen >= 0 ? `Próxima: ${list[nextOpen]!.kind === 'warm' ? `aquecimento ${nextOpen - workIdx(nextOpen) + 1}` : `série ${workIdx(nextOpen) + 1}`}.` : nextEx ? `Próximo exercício: ${nextEx.n}.` : 'Pode concluir o treino.';
 const goTo = (j: number) => {
  if (j < 0 || j >= exIds.length) return;
  setProblem(''); setIdx(j);
  setAnnounce(`${plan.ex[exIds[j]!]?.n ?? 'Exercício'}, ${j + 1}º de ${exIds.length} exercícios`);
  window.scrollTo({ top: 0 });
 };
 const platesRow = platesFor !== null ? list[platesFor] : list[activeIdx];
 const platesInitial = !platesRow ? '' : platesRow.kg !== '' ? platesRow.kg : platesFor !== null ? (phOf(platesFor).kg ?? '').replace('.', ',') : '';
 const addQuery = normalize(addQ);
 const addRows = open === 'add' ? Object.keys(plan.ex).filter(e => !exIds.includes(e) && (!addQuery || normalize(plan.ex[e]!.n).includes(addQuery))).sort((a, b) => plan.ex[a]!.n.localeCompare(plan.ex[b]!.n, 'pt-BR')) : [];

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
   <h2><button type="button" className="ex-title-btn" aria-haspopup="dialog" onClick={() => setOpen('guide')}>{ex.n}<Icon name="info" size={18} className="ex-title-ico" /></button></h2>
   {group ? <span className="ex-group">{GROUP_LABEL[group]}{original !== exId ? ` · no lugar de ${plan.ex[original]?.n ?? ''}` : ''}</span> : null}
   {note ? <span className="muted ex-tip">{note}</span> : null}
   <AvisoEstagnacao exId={exId} day={day} onSwap={list.some(s => s.done) ? undefined : () => setOpen('swap')} />
   <Menu className="ex-more" label={`Mais opções de ${ex.n}`} trigger={<Icon name="mais" size={22} weight={2} />} items={menu} />
  </div>
  <div className="ex-stage">
   <button type="button" className="icon-button ex-arrow" aria-label="Exercício anterior" disabled={idx === 0} onClick={() => goTo(idx - 1)}><Glyph name="esq" size={26} weight={2.4} /></button>
   <div className="ex-art"><Thumb kind="exercise" id={exId} group={group ?? undefined} size={144} className="ex-thumb" label={ex.n} /></div>
   <button type="button" className="icon-button ex-arrow" aria-label="Próximo exercício" disabled={idx >= exIds.length - 1} onClick={() => goTo(idx + 1)}><Glyph name="dir" size={26} weight={2.4} /></button>
  </div>
  <div className="ex-info">
   <p className="ex-plan"><strong className="num">{plannedNow.sets} {plannedNow.sets === 1 ? 'série' : 'séries'}</strong> · <span className="num">{plannedNow.reps}</span></p>
   {firstTime ? <p className="ex-tip ex-guide">Primeira vez neste exercício: escolha uma carga que dê para fazer {plannedNow.reps} repetições com boa técnica, parando com {rirNow} ainda sobrando.</p>
    : rirNow ? <p className="muted ex-tip">Pare com {rirNow} {rirNow === '1' ? 'repetição' : 'repetições'} ainda sobrando</p> : null}
   {ex.t || idx === 0 ? <details className="ex-dicas">
    <summary>Dicas do exercício<Icon name="chevron" size={18} /></summary>
    {ex.t ? <p className="muted ex-tip">{ex.t}</p> : null}
    {idx === 0 ? <p className="muted ex-tip">{GENERAL_WARMUP_TEXT}</p> : null}
   </details> : null}
   {sugText ? <p className="tr-sug"><span className="tr-sug-k">Sugestão:</span> {sugText} <span className="muted tr-sug-note">(sugestão; você decide a carga)</span></p> : null}
  </div>

  <section className="ex-card" aria-label={`Séries de ${ex.n}`}>
   {neverLogged ? <p className="ex-first-hint">Os números em cinza são a sugestão. Toque na caixa da série para registrar assim, ou digite o que fez.</p> : null}
   <div className={`ex-row ex-head has-antes${kgCol ? '' : ' no-kg'}`} aria-hidden="true"><span>Série</span><span>Anterior</span><span>{repsLabel(ex)}</span>{kgCol ? <span>{kgLabel(ex)}</span> : null}<span /></div>
   {list.map((s, i) => {
    const warm = s.kind === 'warm', n = warm ? i - workIdx(i) + 1 : workIdx(i) + 1;
    const name = warm ? `aquecimento ${n}` : `série ${n}`;
    const ph = s.done ? null : phOf(i);
    const prev = warm ? null : ctx.previous[workIdx(i)];
    const pr = recOf(i, s);
    const isActive = i === nextOpen;
    return <div key={i} className={`ex-set${isActive ? ' is-active' : ''}`} aria-current={isActive ? 'step' : undefined}>
     <div className={`ex-row has-antes${kgCol ? '' : ' no-kg'}${s.done ? ' is-done' : ''}`}>
      <Menu className="ex-n" buttonClassName="ex-n-btn num" align="left" label={`Opções ${warm ? 'do aquecimento' : 'da série'} ${n}`} trigger={warm ? 'A' : n} items={warm
       ? [{ label: 'Marcar como série de trabalho', onClick: () => setWarm(i, false) }, ...(s.done ? [] : [{ label: 'Dispensar aquecimento', danger: true, onClick: () => dismissWarm(i) }])]
       : [{ label: 'Marcar como aquecimento', onClick: () => setWarm(i, true) }]} />
      <span className="ex-antes num" aria-label={prev ? `Última vez: ${kgCol && prev.kg !== '' ? `${prev.kg.replace('.', ',')} kg, ` : ''}${prev.reps} ${ex.m === 's' ? 'segundos' : 'repetições'}` : 'Última vez: sem registro'}>{antesText(prev)}</span>
      <input className="ex-input num" inputMode="numeric" enterKeyHint="next" autoComplete="off" aria-label={`${repsLabel(ex)}, ${name}`} value={s.reps} placeholder={ph ? ph.reps ?? ph.dica.reps : undefined} aria-invalid={problem !== '' && !s.done && s.reps === '' && !ph?.reps} onChange={e => setField(i, 'reps', e.target.value)} />
      {kgCol ? <input className="ex-input num" inputMode="decimal" enterKeyHint="done" autoComplete="off" aria-label={`${kgLabel(ex)}, ${name}`} value={s.kg} placeholder={ph ? (ph.kg ?? ph.dica.kg).replace('.', ',') : undefined} onChange={e => setField(i, 'kg', e.target.value)} /> : null}
      <button type="button" className={`ex-check${s.done ? ' on' : ''}`} aria-label={`${warm ? 'Aquecimento' : 'Série'} ${n} concluída`} aria-pressed={s.done} onClick={() => toggle(i)}>
       <SetCheck key={exId} done={s.done} />
      </button>
     </div>
     {barbell && i === activeIdx ? <PlatesButton kg={s.kg !== '' ? s.kg : (ph?.kg ?? '').replace('.', ',')} name={name} onClick={() => { setPlatesFor(i); setOpen('plates'); }} /> : null}
     {pr ? <p className="ex-pr"><Glyph name="trofeu" size={16} />{recordLine(pr)}</p> : null}
    </div>;
   })}
   {hasWarm ? <p className="muted ex-tip">{WARMUP_TEXT}</p> : null}
   {problem ? <p className="ex-problem" role="alert">{problem}</p> : null}
   <p className="visually-hidden" role="status" aria-live="polite" aria-atomic="true">{announce}</p>
  </section>
  <button type="button" className="ex-add" onClick={addSet}><Icon name="plus" size={20} />Adicionar série</button>
  {free ? <button type="button" className="ex-add ex-add-ex" onClick={() => { setAddQ(''); setOpen('add'); }}><Icon name="plus" size={20} />Adicionar exercício</button> : null}
  {saveError ? <p className="ex-problem" role="alert">Não foi possível salvar agora. O que você digitou continua na tela; conclua uma série ou o treino para tentar de novo.</p> : null}

  <div className="ex-spacer" aria-hidden="true" />
  <div className="ex-footer" ref={footerRef}>
   {rest ? <RestPanel rest={rest} nextText={restNext} now={now} ended={ended} onAdjust={adjust} onClose={closeRest} /> : null}
   {!rest && askRest ? <section className="ex-sheet compact" aria-label="Descanso">
    <label htmlFor="rest-sec" className="ex-ask-label"><strong>Descanso (segundos)</strong> <span className="tr-meta">Este exercício não tem tempo de descanso definido.</span></label>
    <div className="ex-sheet-actions two">
     <input id="rest-sec" className="ex-input num" inputMode="numeric" value={askValue} onChange={e => setAskValue(e.target.value.replace(/\D/g, ''))} />
     <button type="button" className="button secondary" onClick={() => { const n = Number(askValue); if (n > 0) beginRest(askRest, n); }}>Iniciar</button>
     <button type="button" className="button secondary" onClick={() => setAskRest(null)}>Pular</button>
    </div>
   </section> : null}
   {exDone && nextEx ? <button type="button" className="button secondary block ex-next" onClick={() => goTo(idx + 1)}><span>Próximo: {nextEx.n}</span><Icon name="seta" size={20} /></button> : null}
   {doneSets === 0 ? <p id="ex-hint" className="ex-finish-hint">Conclua ao menos uma série para concluir o treino.</p> : null}
   <button type="button" className="button block ex-finish" disabled={doneSets === 0 || busy} aria-describedby={doneSets === 0 ? 'ex-hint' : undefined} onClick={tryFinish}>Concluir treino</button>
  </div>
  {askFinish ? <ConfirmSheet title="Concluir o treino?" destructive={false} icon="marca" confirmLabel="Concluir" cancelLabel="Continuar treinando" onCancel={() => setAskFinish(false)} onConfirm={() => { void finish(); }}>
   <p>Você registrou {touched} de {exIds.length} exercícios. Concluir mesmo assim?</p>
  </ConfirmSheet> : null}
  {open === 'ex' ? <ExercicioSheet exId={exId} className="ex-tap" onClose={() => setOpen(null)} /> : null}
  {open === 'guide' ? <ComoFazerSheet exId={exId} name={ex.n} group={group ?? undefined} className="ex-tap" onClose={() => setOpen(null)} /> : null}
  {open === 'hist' ? <HistoricoRapido exId={exId} day={day} onClose={() => setOpen(null)} onMore={() => { setOpen(null); setTimeout(() => setOpen('ex'), 0); }} /> : null}
  {open === 'plates' ? <AnilhasSheet className="ex-tap" initial={platesInitial} onUse={platesFor !== null ? kg => setField(platesFor, 'kg', kg) : undefined} onClose={() => { setOpen(null); setPlatesFor(null); }} /> : null}
  {open === 'add' ? <Sheet title="Adicionar exercício" className="ex-tap" initialFocus="#ex-add-q" onClose={() => setOpen(null)}>
   <div className="sheet-body">
    <div className="tr-search ed-pick-search">
     <label htmlFor="ex-add-q" className="visually-hidden">Buscar exercício</label>
     <Icon name="busca" size={22} className="tr-search-icon" />
     <input id="ex-add-q" type="search" placeholder="Buscar exercício…" value={addQ} onChange={e => setAddQ(e.target.value)} autoComplete="off" />
    </div>
    {addRows.length === 0 ? <p className="muted">Nenhum exercício encontrado.</p> : <ul className="ed-pick-list ex-pick" aria-label="Exercícios da biblioteca">
     {addRows.map(e => { const g = muscleGroupOf(e, plan.ex[e]!); return <li key={e}><button type="button" onClick={() => void relist([...exIds, e], e)}><strong>{plan.ex[e]!.n}</strong><span>{g ? GROUP_LABEL[g] : 'Exercício'}</span></button></li>; })}
    </ul>}
    <p className="muted ev-hint">Entra no fim do treino; as séries já registradas continuam salvas.</p>
   </div>
   <div className="sheet-actions"><button type="button" className="button secondary" onClick={() => setOpen(null)}>Fechar</button></div>
  </Sheet> : null}
  {open === 'swap' ? <Sheet title={`Trocar ${plan.ex[original]?.n ?? ''} só hoje`} className="ex-tap" onClose={() => setOpen(null)}>
   <div className="sheet-body">{options.length === 0 ? <p>{NO_SWAP_TEXT}</p> : <ul className="sw-list">{options.filter(o => plan.ex[o]).map(o => <li key={o}><button type="button" className="button secondary block" onClick={() => void doSwap(o)}>{plan.ex[o]!.n}</button></li>)}</ul>}
    <p className="muted ev-hint">A troca vale só para hoje; o plano não muda.</p></div>
   <div className="sheet-actions">{original !== exId ? <button type="button" className="button secondary" onClick={() => void doSwap(null)}>Voltar ao original</button> : null}<button type="button" className="button secondary" onClick={() => setOpen(null)}>Fechar</button></div>
  </Sheet> : null}
 </div>;
}
