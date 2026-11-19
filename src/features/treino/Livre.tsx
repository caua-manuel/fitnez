import { useState } from 'react';
import { useData } from '../../app/DataProvider';
import { hrefFor } from '../../app/router';
import { muscleGroupOf } from '../../domain/muscleGroups';
import { FREE_SESSION_ID } from '../../domain/weekStreak';
import { Icon } from '../../ui/icons';
import { Topo } from './Topo';
import { GROUP_LABEL, freeExercises, normalize, todayIso } from './util';
import './editor.css';

/** Treino livre: escolhe exercícios da biblioteca e abre a execução. Não muda o plano nem conta na sequência de semanas. */
export function Livre() {
 const { state } = useData();
 const [q, setQ] = useState('');
 const [picked, setPicked] = useState<string[]>(() => state ? freeExercises(state, todayIso()) : []);
 if (!state) return null;
 const plan = state.catalog.plan, query = normalize(q);
 const rows = Object.keys(plan.ex).filter(id => !query || normalize(plan.ex[id]!.n).includes(query)).sort((a, b) => plan.ex[a]!.n.localeCompare(plan.ex[b]!.n, 'pt-BR'));
 const toggle = (id: string) => setPicked(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
 const go = hrefFor({ tab: 'treino', view: 'executar', id: FREE_SESSION_ID, ex: picked.join(',') });
 return <div className="tr-page tone-treino lv-page">
  <Topo title="Treino livre" back={hrefFor({ tab: 'treino', view: 'lista' })} backLabel="Voltar aos treinos" />
  <p className="ed-help">Escolha os exercícios na ordem em que vai fazer. O treino livre fica no histórico, mas não muda o plano nem conta na sequência de semanas.</p>
  <div className="tr-search ed-pick-search">
   <label htmlFor="lv-q" className="visually-hidden">Buscar exercício</label>
   <Icon name="busca" size={22} className="tr-search-icon" />
   <input id="lv-q" type="search" placeholder="Buscar exercício…" value={q} onChange={e => setQ(e.target.value)} autoComplete="off" />
  </div>
  {rows.length === 0 ? <p className="muted">Nenhum exercício encontrado.</p> :
   <ul className="ed-pick-list" aria-label="Exercícios da biblioteca">
    {rows.map(id => {
     const g = muscleGroupOf(id, plan.ex[id]!), n = picked.indexOf(id);
     return <li key={id}><button type="button" aria-pressed={n >= 0} className="lv-opt" onClick={() => toggle(id)}>
      <strong>{plan.ex[id]!.n}</strong><span>{g ? GROUP_LABEL[g] : 'Exercício'}</span>
      <span className="lv-mark num" aria-hidden="true">{n >= 0 ? n + 1 : ''}</span>
     </button></li>;
    })}
   </ul>}
  <div className="lv-footer">
   {picked.length ? <a className="button block" href={go}><Icon name="play" size={22} />Começar com {picked.length} {picked.length === 1 ? 'exercício' : 'exercícios'}</a>
    : <button type="button" className="button block" disabled aria-describedby="lv-hint">Começar</button>}
   {picked.length ? null : <p id="lv-hint" className="muted lv-hint">Escolha ao menos um exercício.</p>}
  </div>
 </div>;
}
