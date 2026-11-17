import { useEffect, useRef, useState } from 'react';

export const OBS_MAX = 300;
const SAVE_DELAY_MS = 700;

/**
 * Campo opcional de observações da aula. Guarda no fim da digitação (pausa curta ou ao sair do campo), para não gravar a cada tecla.
 * `value` é o texto salvo. O pai usa `key` por dia: ao trocar de dia ou desmarcar a aula, o campo desmonta e grava o que faltava.
 */
export function ObservacaoAula({ value, onSave }: { value: string; onSave: (text: string) => void }) {
 const [draft, setDraft] = useState(value);
 const saved = useRef(value);
 const timer = useRef<number | undefined>(undefined);
 const latest = useRef({ draft, onSave });
 latest.current = { draft, onSave };
 useEffect(() => { if (value !== saved.current) { setDraft(value); saved.current = value; } }, [value]);
 const flush = () => {
  window.clearTimeout(timer.current);
  const text = latest.current.draft.trim();
  if (text === saved.current) return;
  saved.current = text; latest.current.onSave(text);
 };
 // eslint-disable-next-line react-hooks/exhaustive-deps
 useEffect(() => () => flush(), []);
 return <div className="in-obs">
  <label htmlFor="in-obs-campo"><strong>Observações</strong> <span className="muted">(opcional)</span></label>
  <textarea id="in-obs-campo" rows={2} maxLength={OBS_MAX} placeholder="Como foi o treino, sono, dores…" value={draft}
   onChange={e => { setDraft(e.target.value); latest.current.draft = e.target.value; window.clearTimeout(timer.current); timer.current = window.setTimeout(flush, SAVE_DELAY_MS); }}
   onBlur={flush} />
 </div>;
}
