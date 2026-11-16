import { useState } from 'react';
import { useData } from '../../app/DataProvider';
import { Sheet } from '../../ui/Sheet';
import { showToast } from '../../ui/UndoToast';
import { mondayOf } from '../../domain/calendar';
import type { DayIso } from '../../domain/calendar';
import type { StateV3 } from '../../application/repository';

const ISO = /^\d{4}-\d{2}-\d{2}$/;
const ddmm = (day: DayIso) => `${day.slice(8, 10)}/${day.slice(5, 7)}`;

/** Valida uma data civil entre 2020 e 2100; devolve a mensagem de erro ou ''. */
export function validateStartDay(v: string): string {
 if (!ISO.test(v)) return 'Informe uma data válida.';
 const [y, m, d] = v.split('-').map(Number);
 const dt = new Date(Date.UTC(y, m - 1, d));
 if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return 'Informe uma data válida.';
 if (y < 2020 || y > 2100) return 'Escolha uma data entre 2020 e 2100.';
 return '';
}

/** Grava a segunda-feira da semana de `day` como início do plano; não mexe no histórico. */
export function useSetPlanStart() {
 const { state, commit } = useData();
 return async (day: DayIso): Promise<boolean> => {
  if (!state) return false;
  const monday = mondayOf(day);
  const before = state.settings.start;
  const ok = await commit((s: StateV3) => { s.settings.start = monday; s.settings.startConfirmed = true; return s; });
  if (ok) showToast(`Plano começa em ${ddmm(monday)}`, () => void commit((s: StateV3) => { s.settings.start = before; return s; }));
  return ok;
 };
}

/**
 * Primeira abertura: a data padrão (segunda-feira da semana de hoje) ainda não foi escolhida.
 * Mostra o texto de boas-vindas e o botão que mantém a data sugerida, gravando só `startConfirmed`.
 */
export function DataInicioSheet({ today, onClose, title = 'Data de início do plano', firstRun = false }: { today: DayIso; onClose: () => void; title?: string; firstRun?: boolean }) {
 const { state, busy, commit } = useData();
 const setStart = useSetPlanStart();
 const current = mondayOf(state?.settings.start ?? today);
 const [value, setValue] = useState<string>(current);
 const [error, setError] = useState('');
 const valid = validateStartDay(value) === '';
 const monday = valid ? mondayOf(value) : null;

 const keep = async () => {
  const ok = await commit((s: StateV3) => { s.settings.startConfirmed = true; return s; });
  if (ok) { showToast(`Plano começa em ${ddmm(current)}`); onClose(); }
 };

 const apply = async (day: DayIso) => {
  const err = validateStartDay(day);
  if (err) { setError(err); return; }
  if (await setStart(day)) onClose();
 };

 return <Sheet title={title} onClose={onClose} initialFocus="#data-inicio" className="in-dia">
  {firstRun ? <p>O plano de exemplo começa na segunda-feira sugerida, {ddmm(current)}. Se preferir outra data, escolha abaixo; dá para trocar depois em Perfil.</p> : null}
  <label htmlFor="data-inicio">Data de início</label>
  <input id="data-inicio" type="date" min="2020-01-01" max="2100-12-31" value={value} aria-describedby="data-inicio-ajuda" aria-invalid={error ? true : undefined}
   onChange={e => { setValue(e.target.value); setError(''); }} />
  <p id="data-inicio-ajuda" className="muted">O plano sempre começa numa segunda-feira: usamos a segunda-feira da semana escolhida{monday ? ` (${ddmm(monday)})` : ''}.</p>
  <p className="muted">Seus registros não são apagados: o histórico de cada data continua guardado.</p>
  {error ? <p className="in-error" role="alert">{error}</p> : null}
  <div className={firstRun ? 'sheet-actions stack' : 'sheet-actions'}>
   <button type="button" className="button block" disabled={busy} onClick={() => void apply(value)}>Salvar</button>
   {firstRun ? <button type="button" className="button secondary block" disabled={busy} onClick={() => void keep()}>Manter a segunda-feira sugerida</button>
    : <button type="button" className="button secondary block" disabled={busy} onClick={() => void apply(today)}>Começar esta semana</button>}
   <button type="button" className="button secondary block" onClick={onClose}>{firstRun ? 'Decidir depois' : 'Cancelar'}</button>
  </div>
 </Sheet>;
}
