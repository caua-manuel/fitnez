import { useState } from 'react';
import type { ReactNode } from 'react';
import { useData } from '../../app/DataProvider';
import { hrefFor } from '../../app/router';
import { Icon } from '../../ui/icons';
import { Select } from '../../ui/Select';
import { Sheet } from '../../ui/Sheet';
import type { IconName } from '../../ui/icons';
import { localDay } from '../inicio/Inicio';
import {
 consistency, firstPlanWeek, formatNumber, formatSigned, measureDelta, measureSeries, pctOf, periodRange,
 measuresOutsidePlan, strengthChange, strengthSeries, weeklyValues,
} from '../../domain/evolution';
import type { MeasureKey, Weeks } from '../../domain/evolution';
import { MeasureForm } from './MeasureForm';
import { Bars, LineChart, MiniLine } from './Charts';
import type { ChartPoint } from './Charts';
import './evolucao.css';

type Metric = 'forca' | 'peso' | 'cintura' | 'constancia';
const PERIODS: Weeks[] = [4, 8, 12];
const signedPct = (n: number) => { const r = Math.round(n); return r === 0 ? '0%' : `${r > 0 ? '+' : '−'}${Math.abs(r)}%`; };
const pad = <T,>(list: T[], n: number, fill: T): T[] => Array.from({ length: n }, (_, i) => (i < list.length ? list[i] : fill));
const fmtKg = (n: number) => `${formatNumber(n, 1)} kg`;
const OUT_KEYS: Array<[MeasureKey, string, string]> = [['p', 'Peso', 'kg'], ['c', 'Cintura', 'cm'], ['q', 'Quadril', 'cm'], ['t', 'Coxa', 'cm'], ['b', 'Braço', 'cm']];
const fmtCm = (n: number) => `${formatNumber(n, 1)} cm`;

const PERIOD_OPTIONS = PERIODS.map(w => ({ value: w, label: `Últimas ${w} semanas` }));
function Period({ weeks, onChange }: { weeks: Weeks; onChange: (w: Weeks) => void }) {
 return <Select<Weeks> label="Período" value={weeks} options={PERIOD_OPTIONS} onChange={onChange} className="ev-period" buttonClassName="ev-period-btn"
  trigger={() => <><Icon name="calendario" size={24} /><span className="ev-period-text">Últimas <strong>{weeks}</strong> semanas</span><Icon name="chevron" size={22} className="ev-chev" /></>} />;
}

function Tile({ icon, value, label, selected, onSelect, description }: { icon: IconName; value: string; label: string; selected: boolean; onSelect: () => void; description: string }) {
 return <button type="button" className="ev-tile" aria-pressed={selected} aria-label={description} onClick={onSelect}>
  <Icon name={icon} size={28} weight={1.9} /><span className="ev-tile-value">{value}</span><span className="ev-tile-label">{label}</span>
 </button>;
}

function CardHead({ icon, title, pill }: { icon: IconName; title: string; pill?: string | null }) {
 return <div className="ev-head"><Icon name={icon} size={24} weight={1.9} /><h2>{title}</h2>{pill ? <span className="ev-pill">{pill}</span> : null}</div>;
}

function ChartEmpty({ children }: { children: ReactNode }) {
 return <div className="ev-empty-mini"><svg viewBox="0 0 120 56" width="120" height="56" aria-hidden="true" focusable="false"><path className="ev-ill-grid" d="M10 6h100M10 20h100M10 34h100M10 48h100" /><path className="ev-ill-axis" d="M10 4v46h102" /></svg><p>{children}</p></div>;
}

function Table({ caption, head, rows }: { caption: string; head: string[]; rows: string[][] }) {
 return <table className="visually-hidden"><caption>{caption}</caption><thead><tr>{head.map(h => <th key={h} scope="col">{h}</th>)}</tr></thead><tbody>{rows.map((r, i) => <tr key={i}>{r.map((c, j) => j === 0 ? <th key={j} scope="row">{c}</th> : <td key={j}>{c}</td>)}</tr>)}</tbody></table>;
}

function EmptyState() {
 return <section className="card ev-card ev-empty" aria-labelledby="ev-empty-title">
  <svg className="ev-ill" viewBox="0 0 240 132" aria-hidden="true" focusable="false">
   <rect className="ev-ill-frame" x="1" y="1" width="238" height="130" rx="16" />
   <path className="ev-ill-grid" d="M40 28h184M40 56h184M40 84h184M40 112h184" />
   <path className="ev-ill-axis" d="M40 22v96h188" />
   <g className="ev-ill-ticks">{[60, 90, 120, 150, 180, 210].map(x => <path key={x} d={`M${x} 118v5`} />)}</g>
   <circle className="ev-ill-badge" cx="132" cy="70" r="26" />
   <g className="ev-ill-icon" transform="translate(112 50) scale(1.667)"><path d="M2.5 10v4M5.5 7v10M18.5 7v10M21.5 10v4M5.5 12h13" /></g>
  </svg>
  <h2 id="ev-empty-title">Registre seu primeiro treino para ver sua evolução</h2>
  <p>Conclua um treino ou anote suas medidas. Os gráficos aparecem aqui, calculados só com o que você registrar.</p>
  <a className="button block" href={hrefFor({ tab: 'treino', view: 'lista' })}><Icon name="treino" size={22} />Ir para o treino</a>
 </section>;
}

const DISCLAIMER = <p className="ev-disclaimer">Calorias, cargas e metas são estimativas e não substituem nutricionista, médico ou educador físico.</p>;

export function Evolucao({ now = Date.now }: { now?: () => number }) {
 const { state } = useData();
 const [weeks, setWeeks] = useState<Weeks>(12);
 const [metric, setMetric] = useState<Metric>('forca');
 const [openMeasure, setOpenMeasure] = useState<string | null>(null);
 if (!state) return null;
 const today = localDay(now());
 const { start, sched } = state.settings;
 const range = periodRange(today, weeks, start);
 const fromWeek = firstPlanWeek(range, start);
 const n = Math.max(1, Math.min(weeks, 12 - fromWeek));
 const labels = Array.from({ length: n }, (_, i) => `S${fromWeek + i + 1}`);

 const strength = pad(strengthSeries(state.history.days, state.catalog.plan, range), n, { week: 0, avgLoadKg: null });
 const sPoints: ChartPoint[] = strength.map((p, i) => ({ label: labels[i], value: p.avgLoadKg }));
 const sChange = strengthChange(strength);
 const sFilled = sPoints.filter(p => p.value !== null);
 const strengthOne = sFilled.length === 1 ? sFilled[0].value : null; // com um só ponto: mostra o valor, sem inventar variação
 const meas = state.history.measurements;
 const series = (k: MeasureKey) => measureSeries(meas, range, k);
 const weight = series('p'), waist = series('c'), thigh = series('t'), arm = series('b'), hip = series('q');
 const weekly = (s: typeof weight): ChartPoint[] => weeklyValues(s, range, n).map((v, i) => ({ label: labels[i], value: v }));
 const wDelta = measureDelta(weight), cDelta = measureDelta(waist);
 const cons = consistency(state.history.days, sched, start, today, range);
 const consWeeks = labels.map((label, i) => { const w = cons.byWeek[i]; return { label, done: w?.done ?? 0, planned: w?.planned ?? 0, future: !w }; });
 const consPoints: ChartPoint[] = consWeeks.map(w => ({ label: w.label, value: w.future ? null : pctOf(w.done, w.planned) }));

 const outside = measuresOutsidePlan(meas, start);
 const hasAny = outside.length > 0 || strength.some(p => p.avgLoadKg !== null) || weight.length + waist.length + hip.length + thigh.length + arm.length > 0 || cons.done > 0;
 const form = <MeasureForm today={today} />;
 if (!hasAny) return <div className="evolucao"><EmptyState />{form}{DISCLAIMER}</div>;

 const lastOf = (s: typeof weight) => (s.length ? s[s.length - 1].value : null);
 const main: Record<Metric, { title: string; icon: IconName; unit: string; points: ChartPoint[]; pill: string | null; fmt: (v: number) => string; domain?: [number, number]; empty: string }> = {
  forca: { title: 'Força (carga média)', icon: 'treino', unit: 'kg', points: sPoints, pill: sChange === null ? null : signedPct(sChange), fmt: fmtKg, empty: 'Conclua séries com carga em exercícios de kg para ver a força.' },
  peso: { title: 'Peso corporal', icon: 'balanca', unit: 'kg', points: weekly(weight), pill: wDelta ? formatSigned(wDelta.abs, 'kg') : null, fmt: fmtKg, empty: 'Registre seu peso para ver a evolução.' },
  cintura: { title: 'Cintura', icon: 'fita', unit: 'cm', points: weekly(waist), pill: cDelta ? formatSigned(cDelta.abs, 'cm') : null, fmt: fmtCm, empty: 'Registre sua cintura para ver a evolução.' },
  constancia: { title: 'Constância por semana', icon: 'alvo', unit: '%', points: consPoints, pill: cons.pct === null ? null : `${cons.pct}%`, fmt: v => `${Math.round(v)}%`, domain: [0, 100], empty: 'A constância aparece depois das primeiras atividades previstas.' },
 };
 const m = main[metric];
 const filled = m.points.filter(p => p.value !== null) as Array<{ label: string; value: number }>;
 const mainLabel = filled.length === 0 ? `${m.title}: sem registros no período.`
  : filled.length === 1 ? `${m.title}: ${m.fmt(filled[0].value)} em ${filled[0].label}.`
  : `${m.title}: de ${m.fmt(filled[0].value)} em ${filled[0].label} a ${m.fmt(filled[filled.length - 1].value)} em ${filled[filled.length - 1].label}${m.pill ? `, variação de ${m.pill}` : ''}.`;

 const wLast = lastOf(weight);
 const measureRows: Array<{ label: string; s: typeof weight }> = [{ label: 'Cintura', s: waist }, { label: 'Quadril', s: hip }, { label: 'Coxa', s: thigh }, { label: 'Braço', s: arm }].filter(r => r.s.length > 0);
 const anyMeasure = measureRows.length > 0;
 const picked = measureRows.find(r => r.label === openMeasure) ?? null;
 const dayLabel = (iso: string) => iso.split('-').reverse().slice(0, 2).join('/');

 return <div className="evolucao"><>
  <Period weeks={weeks} onChange={setWeeks} />

  <div className="ev-tiles" role="group" aria-label="Indicador do gráfico principal">
   <Tile icon="treino" value={sChange !== null ? signedPct(sChange) : strengthOne !== null ? fmtKg(strengthOne) : '—'} label="Força" selected={metric === 'forca'} onSelect={() => setMetric('forca')} description={`Força: ${sChange !== null ? signedPct(sChange) : strengthOne !== null ? `${fmtKg(strengthOne)}, sem variação ainda` : 'sem variação ainda'}`} />
   <Tile icon="balanca" value={wDelta ? formatSigned(wDelta.abs, 'kg') : '—'} label="Peso" selected={metric === 'peso'} onSelect={() => setMetric('peso')} description={`Peso: ${wDelta ? formatSigned(wDelta.abs, 'kg') : 'sem variação ainda'}`} />
   <Tile icon="fita" value={cDelta ? formatSigned(cDelta.abs, 'cm') : '—'} label="Cintura" selected={metric === 'cintura'} onSelect={() => setMetric('cintura')} description={`Cintura: ${cDelta ? formatSigned(cDelta.abs, 'cm') : 'sem variação ainda'}`} />
   <Tile icon="alvo" value={cons.pct === null ? '—' : `${cons.pct}%`} label="Constância" selected={metric === 'constancia'} onSelect={() => setMetric('constancia')} description={`Constância: ${cons.pct === null ? 'sem atividades previstas ainda' : `${cons.pct}%`}`} />
  </div>

  <section className="card ev-card" aria-labelledby="ev-main-title">
   <div className="ev-head"><Icon name={m.icon} size={24} weight={1.9} /><h2 id="ev-main-title">{m.title}</h2>{m.pill ? <span className="ev-pill">{m.pill}</span> : null}</div>
   <p className="visually-hidden" role="status">{mainLabel}</p>
   {filled.length === 0 ? <ChartEmpty>{m.empty}</ChartEmpty> : <>
    <LineChart key={`${metric}-${weeks}`} points={m.points} unit={m.unit} domain={m.domain} label={mainLabel} />
    {filled.length === 1 ? <p className="ev-hint ev-single">{m.fmt(filled[0].value)} em {filled[0].label}. Sem variação ainda: registre de novo para ver a evolução.</p> : null}
    <Table caption={`${m.title}, valores por semana`} head={['Semana', m.unit === '%' ? 'Constância' : m.title]} rows={m.points.map(p => [p.label, p.value === null ? 'sem registro' : m.fmt(p.value)])} />
   </>}
  </section>

  <div className="ev-duo">
   <section className="card ev-card" aria-labelledby="ev-peso-title">
    <div className="ev-head"><Icon name="balanca" size={22} weight={1.9} /><h2 id="ev-peso-title">Peso corporal</h2></div>
    {wLast === null ? <p className="ev-none">Sem peso registrado neste período.</p> : <>
     <p className="ev-big">{fmtKg(wLast)}</p>
     {wDelta ? <p className="ev-delta">{formatSigned(wDelta.abs, 'kg')} ({wDelta.pct > 0 ? '+' : wDelta.pct < 0 ? '−' : ''}{formatNumber(Math.abs(wDelta.pct), 1)}%)</p> : <p className="ev-none">Uma pesagem: registre outra para ver a variação.</p>}
     <MiniLine values={weight.map(p => p.value)} label={`Peso: ${weight.length === 1 ? `${fmtKg(wLast)} em ${dayLabel(weight[0].day)}` : `de ${fmtKg(weight[0].value)} a ${fmtKg(wLast)}`}.`} />
     <Table caption="Peso corporal, registros" head={['Dia', 'Peso']} rows={weight.map(p => [dayLabel(p.day), fmtKg(p.value)])} />
    </>}
   </section>

   <section className="card ev-card" aria-labelledby="ev-med-title">
    <div className="ev-head"><Icon name="fita" size={22} weight={1.9} /><h2 id="ev-med-title">Medidas</h2></div>
    {!anyMeasure ? <p className="ev-none">Sem medidas registradas neste período.</p> : <>
     <ul className="ev-rows" aria-label="Medidas em centímetros">{measureRows.map(r => { const d = measureDelta(r.s); const last = lastOf(r.s)!; return <li key={r.label}>
      <button type="button" className="ev-row ev-row-measure" aria-haspopup="dialog" aria-label={`${r.label}: ${fmtCm(last)}${d ? `, ${formatSigned(d.abs, 'cm')}` : ''}. Ver gráfico`} onClick={() => setOpenMeasure(r.label)}>
       <span className="ev-row-label">{r.label}</span><span className="ev-row-value">{fmtCm(last)}</span>
       {d ? <span className="ev-chip badge done">{formatSigned(d.abs, 'cm')}</span> : <span className="ev-chip-empty" aria-hidden="true" />}
      </button></li>; })}</ul>
     <p className="ev-hint ev-tap">Toque em uma medida para ver o gráfico.</p>
    </>}
   </section>
  </div>

  {outside.length ? <section className="card ev-card" aria-labelledby="ev-out-title">
   <div className="ev-head"><Icon name="calendario" size={22} weight={1.9} /><h2 id="ev-out-title">Medidas fora do plano</h2></div>
   <p className="ev-hint">Salvas em datas antes ou depois das 12 semanas do plano, por isso não entram nos gráficos.</p>
   <ul className="ev-out">{outside.map(o => <li key={o.day}>
    <span className="ev-out-day">{o.day.split('-').reverse().join('/')}<span className="ev-chip badge">{o.when === 'antes' ? 'Antes do plano' : 'Depois do plano'}</span></span>
    <span className="ev-out-vals">{OUT_KEYS.filter(([k]) => o.values[k] !== undefined).map(([k, label, unit]) => `${label} ${formatNumber(o.values[k]!, 1)} ${unit}`).join(' · ')}</span>
   </li>)}</ul>
  </section> : null}

  <section className="card ev-card" aria-labelledby="ev-cons-title">
   <div className="ev-head"><Icon name="calendario" size={24} weight={1.9} /><h2 id="ev-cons-title">Constância de treinos</h2>{cons.pct === null ? null : <span className="ev-pill">{cons.pct}%</span>}</div>
   {cons.planned === 0 ? <ChartEmpty>Ainda não há atividades previstas no período.</ChartEmpty> : <>
    <Bars weeks={consWeeks} label={`Constância: ${cons.done} de ${cons.planned} atividades previstas feitas, ${cons.pct}%.`} />
    <p className="ev-legend"><span className="ev-key done" aria-hidden="true" />Feito <span className="ev-key" aria-hidden="true" />Previsto</p>
    <Table caption="Constância por semana" head={['Semana', 'Feitas', 'Previstas']} rows={consWeeks.map(w => [w.label, String(w.done), String(w.planned)])} />
   </>}
  </section>

 </>{form}{DISCLAIMER}
  {picked ? <Sheet title={picked.label} onClose={() => setOpenMeasure(null)}>
   <div className="sheet-body">
    <p className="ev-big">{fmtCm(lastOf(picked.s)!)}</p>
    {measureDelta(picked.s) ? <p className="ev-delta">{formatSigned(measureDelta(picked.s)!.abs, 'cm')} no período</p> : <p className="ev-none">Uma medida: registre outra para ver a variação.</p>}
    <LineChart points={picked.s.map(p => ({ label: dayLabel(p.day), value: p.value }))} unit="cm" label={`${picked.label}: ${picked.s.length === 1 ? `${fmtCm(picked.s[0].value)} em ${dayLabel(picked.s[0].day)}` : `de ${fmtCm(picked.s[0].value)} em ${dayLabel(picked.s[0].day)} a ${fmtCm(picked.s[picked.s.length - 1].value)} em ${dayLabel(picked.s[picked.s.length - 1].day)}`}.`} />
    <Table caption={`${picked.label}, registros`} head={['Dia', picked.label]} rows={picked.s.map(p => [dayLabel(p.day), fmtCm(p.value)])} />
   </div>
   <div className="sheet-actions"><button type="button" className="button secondary block" onClick={() => setOpenMeasure(null)}>Fechar</button></div>
  </Sheet> : null}
 </div>;
}
