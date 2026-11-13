import { useMemo, useState } from 'react';
import { useData } from '../../app/DataProvider';
import { hrefFor } from '../../app/router';
import seedPlan from '../../../data/plan.json';
import type { Plan } from '../../application/repository';
import { restoreSeedPlan } from '../../domain/planEdit';
import { Icon } from '../../ui/icons';
import { ConfirmSheet } from '../../ui/Sheet';
import { usePlanEditor } from './planActions';
import { CartaoTreino } from './Cartao';
import { formatDay, lastDoneDay, minutesLabel, normalize, plural, sessionIds, sessionKind } from './util';
import type { SessionKind } from './util';
import './treino.css';

type Filter = 'todos' | 'superior' | 'inferior';
const FILTERS: { id: Filter; label: string }[] = [{ id: 'todos', label: 'Todos' }, { id: 'superior', label: 'Superiores' }, { id: 'inferior', label: 'Inferiores' }];

export function Biblioteca() {
 const { state } = useData();
 const [query, setQuery] = useState('');
 const [filter, setFilter] = useState<Filter>('todos');
 const [restore, setRestore] = useState(false);
 const { withUndo } = usePlanEditor();
 const rows = useMemo(() => {
  if (!state) return [];
  const plan = state.catalog.plan, q = normalize(query);
  return sessionIds(plan).map(id => {
   const s = plan.sess[id]!;
   const byName = !q || normalize(s.name).includes(q);
   const found = q && !byName ? s.ex.map(e => plan.ex[e]?.n).find(n => n && normalize(n).includes(q)) ?? null : null;
   return { id, s, kind: sessionKind(plan, id) as SessionKind, last: lastDoneDay(state, id), match: byName || found !== null, found };
  }).filter(r => (filter === 'todos' || r.kind === filter) && r.match);
 }, [state, query, filter]);
 if (!state) return null;
 return <div>
  <div className="tr-search">
   <label htmlFor="treino-busca" className="visually-hidden">Buscar treino ou exercício</label>
   <Icon name="busca" size={22} className="tr-search-icon" />
   <input id="treino-busca" type="search" placeholder="Buscar treino ou exercício…" value={query} onChange={e => setQuery(e.target.value)} autoComplete="off" />
  </div>
  <div className="tr-filters" role="group" aria-label="Filtrar por grupo">
   {FILTERS.map(f => <button key={f.id} type="button" className="chip" aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}>{f.label}</button>)}
  </div>
  {rows.length === 0 ? <div className="tr-empty">
    <p>Nenhum treino encontrado.</p>
    {query || filter !== 'todos' ? <button type="button" className="button secondary" onClick={() => { setQuery(''); setFilter('todos'); }}>Limpar busca</button> : null}
   </div> :
   <ul className="tr-stack" aria-label="Treinos da biblioteca">
    {rows.map(r => <li key={r.id}>
     <CartaoTreino id={r.id} name={r.s.name} href={hrefFor({ tab: 'treino', view: 'detalhe', id: r.id })}
      date={r.last ? `Último treino: ${formatDay(r.last)}` : 'Ainda não feito'}
      exercises={plural(r.s.ex.length, 'exercício', 'exercícios')} minutes={minutesLabel(r.s.min)} />
     {r.found ? <p className="tr-found">Tem {r.found}</p> : null}
    </li>)}
   </ul>}
  <div className="ed-restore">
   <button type="button" className="ed-linkbtn" onClick={() => setRestore(true)}>Restaurar treinos originais</button>
  </div>
  {restore ? <ConfirmSheet title="Restaurar treinos originais?" confirmLabel="Restaurar treinos" onCancel={() => setRestore(false)}
   onConfirm={() => { setRestore(false); void withUndo('Treinos originais restaurados.', p => restoreSeedPlan(p, seedPlan.plan as unknown as Plan)); }}>
   <p>Os treinos e os exercícios originais do plano voltam como estavam. Treinos que você criou saem da lista, e as mudanças que fez nos exercícios originais são desfeitas.</p>
   <p><strong>O histórico dos treinos já feitos é preservado.</strong> Você poderá desfazer por 6 segundos.</p>
  </ConfirmSheet> : null}
 </div>;
}
