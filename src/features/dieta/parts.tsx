import { useRef } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { Icon } from '../../ui/icons';
import { Thumb } from '../../ui/Thumb';
import { addDays } from '../../domain/calendar';
import type { DayIso } from '../../domain/calendar';
import type { MealKey } from '../../domain/diet';
import { CheckDraw, CountUp } from '../../ui/motion';
import { useJustTurnedOn } from '../treino/stagger';
import { dayLabel, fmt } from './dietData';

/** Seletor de dia: anterior, rótulo (abre o calendário do aparelho) e próximo. */
export function DayNav({ day, today, onChange }: { day: DayIso; today: DayIso; onChange: (d: DayIso) => void }) {
 const input = useRef<HTMLInputElement>(null);
 const open = () => { const el = input.current; if (!el) return; try { el.showPicker(); } catch { el.focus(); el.click(); } };
 return <div className="dt-daynav-wrap"><div className="dt-daynav" role="group" aria-label="Dia da dieta">
  <button type="button" className="dt-daynav-step" aria-label="Dia anterior" onClick={() => onChange(addDays(day, -1))}><Icon name="seta" size={22} className="flip" /></button>
  <button type="button" className="dt-daynav-label" onClick={open} aria-label={`${dayLabel(day, today)}. Escolher outro dia`}>
   <Icon name="calendario" size={22} />
   <span>{dayLabel(day, today)}</span>
  </button>
  <input ref={input} className="dt-daynav-input" type="date" tabIndex={-1} aria-hidden="true" value={day} onChange={e => { if (/^\d{4}-\d{2}-\d{2}$/.test(e.target.value)) onChange(e.target.value); }} />
  <button type="button" className="dt-daynav-step" aria-label="Próximo dia" onClick={() => onChange(addDays(day, 1))}><Icon name="seta" size={22} /></button>
  </div>
  {day !== today ? <button type="button" className="dt-today-link" onClick={() => onChange(today)}>Voltar para hoje</button> : null}
 </div>;
}

/** Anel de calorias em SVG: começa no topo, sentido horário. Excedido fica em aviso, com texto. */
export function KcalRing({ kcal, target }: { kcal: number; target: number }) {
 const size = 112, stroke = 8, r = (size - stroke) / 2, c = 2 * Math.PI * r;
 const ratio = target > 0 ? Math.min(1, kcal / target) : 0;
 const over = target > 0 && kcal > target;
 return <div className="dt-ring" role="progressbar" aria-label="Calorias consumidas" aria-valuemin={0} aria-valuemax={target} aria-valuenow={Math.min(Math.round(kcal), target)} aria-valuetext={`${fmt(kcal)} de ${fmt(target)} quilocalorias`}>
  <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} aria-hidden="true" focusable="false">
   <circle className="ring-svg-track" cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} />
   {ratio > 0 ? <circle className={`ring-svg-fill${over ? ' over' : ''}`} cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} strokeDasharray={`${c * ratio} ${c}`} style={{ '--dt-c': c } as CSSProperties} transform={`rotate(-90 ${size / 2} ${size / 2})`} /> : null}
  </svg>
  <div className="dt-ring-text"><strong><CountUp value={Math.round(kcal)} duration={350} /></strong><span>de {fmt(target)} kcal</span></div>
 </div>;
}

/** Miniatura da refeição: foto em public/img/meal/<refeição>[-<opção>].jpg ou tile minimalista. */
export function MealThumb({ meal, option, size = 56 }: { meal: MealKey; option?: string; size?: number }) {
 return <Thumb kind="meal" id={option ? `${meal}-${option}` : meal} size={size} />;
}

export function Cup({ filled }: { filled: boolean }) {
 return <svg viewBox="0 0 24 30" width="22" height="28" aria-hidden="true" focusable="false" className={`dt-cup${filled ? ' on' : ''}`}>
  <path className="dt-cup-body" d="M4 4h16l-1.8 20.4A3 3 0 0 1 15.2 27H8.8a3 3 0 0 1-3-2.6Z" />
  {filled ? <path className="dt-cup-water" d="M5.1 12h13.8l-.9 12.2a2 2 0 0 1-2 1.8H8a2 2 0 0 1-2-1.8Z" /> : null}
 </svg>;
}

/** Marca de consumido: círculo azul com ícone de marca, ou vazio. Botão de 44px. */
export function CheckButton({ on, label, onClick, choose }: { on: boolean; label: string; onClick: () => void; choose?: boolean }) {
 const fresh = useJustTurnedOn(on);
 return <button type="button" className={`dt-check${on ? ' on' : ''}${choose ? ' choose' : ''}`} aria-pressed={choose ? undefined : on} aria-label={label} title={label} onClick={onClick}>
  <span className="dt-check-dot" aria-hidden="true">{on ? <CheckDraw play={fresh} size={16} /> : choose ? <Icon name="plus" size={16} weight={2.2} /> : null}</span>
 </button>;
}

export function Notice({ icon, children }: { icon?: ReactNode; children: ReactNode }) {
 return <p className="dt-note">{icon}{children}</p>;
}
