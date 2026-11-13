import { Icon } from './icons';
import type { IconName } from './icons';
import { hrefFor } from '../app/router';
import type { Route } from '../app/router';

export const TABS: ReadonlyArray<{ tab: Route['tab']; label: string; icon: IconName }> = [
 { tab: 'inicio', label: 'Início', icon: 'inicio' },
 { tab: 'treino', label: 'Treino', icon: 'treino' },
 { tab: 'dieta', label: 'Dieta', icon: 'dieta' },
 { tab: 'evolucao', label: 'Evolução', icon: 'evolucao' },
 { tab: 'perfil', label: 'Perfil', icon: 'perfil' },
];

export function TabBar({ current }: { current: Route['tab'] }) {
 return <nav className="tabbar" aria-label="Navegação principal">
  {TABS.map(t => { const on = t.tab === current; return <a key={t.tab} href={t.tab === 'treino' ? '#treino' : hrefFor({ tab: t.tab } as Route)} aria-current={on ? 'page' : undefined}><Icon name={t.icon} size={24} weight={on ? 1.9 : 1.6} /><span>{t.label}</span></a>; })}
 </nav>;
}
