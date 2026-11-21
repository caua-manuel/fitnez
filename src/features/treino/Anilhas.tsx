import { useState } from 'react';
import { useData } from '../../app/DataProvider';
import { BAR_OPTIONS, DEFAULT_PLATES, DEFAULT_PLATE_SETTINGS, platesPerSide } from '../../domain/plates';
import type { PlateSettings } from '../../domain/plates';
import { parseNumber } from '../../domain/workout';
import { Sheet } from '../../ui/Sheet';
import { formatKg } from './util';

function readPlates(v: unknown): PlateSettings {
 const p = v as Partial<PlateSettings> | undefined;
 return { bar: typeof p?.bar === 'number' ? p.bar : DEFAULT_PLATE_SETTINGS.bar, available: Array.isArray(p?.available) ? p.available : [...DEFAULT_PLATES] };
}

/**
 * Folha da calculadora de anilhas: barra e anilhas ficam salvas em settings.plates.
 * Com `onUse` (aberta da série ativa), oferece "Usar X kg" com a carga que dá para montar; só preenche o campo,
 * não conclui a série.
 */
export function AnilhasSheet({ initial, onClose, onUse, className }: { initial?: string; onClose: () => void; onUse?: (kg: string) => void; className?: string }) {
 const { state, commit } = useData();
 const [total, setTotal] = useState(initial ?? '');
 if (!state) return null;
 const cfg = readPlates(state.settings.plates);
 const save = (next: PlateSettings) => void commit(d => { d.settings.plates = next; return d; });
 const n = parseNumber(total);
 const r = n === null ? null : platesPerSide(n, cfg.bar, cfg.available);
 const barText = cfg.bar ? `barra ${formatKg(cfg.bar)} kg` : 'sem barra';
 const out = !r ? 'Digite a carga total.' : !r.ok ? (r.error === 'abaixo-da-barra' ? 'Carga menor que a barra' : 'Digite a carga total.')
  : r.perSide.length === 0 ? 'Só a barra'
  : `${r.exact ? '' : `Não fecha com essas anilhas. Mais perto: ${formatKg(r.achieved)} kg. `}Cada lado: ${r.perSide.map(formatKg).join(' + ')} (${barText})`;
 // "Usar" só quando muda algo no campo: a conta não fecha ou a carga daqui é outra que a da série.
 const start = parseNumber(initial ?? '');
 const usable = onUse && r?.ok && r.achieved > 0 && (!r.exact || start === null || Math.round(start * 100) !== Math.round(r.achieved * 100)) ? r.achieved : null;
 return <Sheet title="Anilhas" onClose={onClose} initialFocus="#anilha-total" className={className}>
  <div className="sheet-body">
   <div><label htmlFor="anilha-total">Carga total (kg)</label>
    <input id="anilha-total" className="ex-input num" inputMode="decimal" enterKeyHint="done" autoComplete="off" value={total} onChange={e => setTotal(e.target.value)} /></div>
   <p className="pl-out num" role="status">{out}</p>
   <fieldset><legend>Barra</legend><div className="segmented">
    {BAR_OPTIONS.map(b => <button key={b} type="button" aria-pressed={cfg.bar === b} onClick={() => save({ ...cfg, bar: b })}>{b ? `${b} kg` : 'Sem barra'}</button>)}
   </div></fieldset>
   <fieldset><legend>Anilhas disponíveis (kg)</legend><div className="segmented pl-seg">
    {DEFAULT_PLATES.map(p => { const on = cfg.available.includes(p); return <button key={p} type="button" aria-pressed={on} aria-label={`${formatKg(p)} kg`}
     onClick={() => save({ ...cfg, available: on ? cfg.available.filter(x => x !== p) : DEFAULT_PLATES.filter(x => x === p || cfg.available.includes(x)) })}>{formatKg(p)}</button>; })}
   </div></fieldset>
  </div>
  <div className="sheet-actions">
   <button type="button" className="button secondary" onClick={onClose}>Fechar</button>
   {usable !== null ? <button type="button" className="button" onClick={() => { onUse!(formatKg(usable)); onClose(); }}>Usar {formatKg(usable)} kg</button> : null}
  </div>
 </Sheet>;
}
