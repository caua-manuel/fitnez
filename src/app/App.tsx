import { useEffect, useRef, useState } from 'react';
import { useData } from './DataProvider';
import { hrefFor, parseRoute } from './router';
import type { Route } from './router';
import { Logo } from '../ui/Logo';
import { Icon } from '../ui/icons';
import { TabBar } from '../ui/TabBar';
import { Inicio } from '../features/inicio/Inicio';
import { FoundationPages } from '../features/FoundationPages';
import { Perfil } from '../features/perfil/Perfil';
import { Evolucao } from '../features/evolucao/Evolucao';
import { Treino } from '../features/treino/Treino';
import { Dieta } from '../features/dieta/Dieta';
import { MEAL_NAME } from '../features/dieta/dietData';
import { usePwa } from '../pwa/usePwa';

/** Cada aba declara se mostra o título (h1) grande com subtítulo; onde a referência não mostra título, o h1 fica só para leitores de tela. */
const headings: Record<Route['tab'], { title: string; subtitle?: string }> = {
 inicio: { title: 'Início' },
 treino: { title: 'Treino' },
 dieta: { title: 'Dieta', subtitle: 'Seu plano alimentar do dia' },
 evolucao: { title: 'Evolução', subtitle: 'Acompanhe seus resultados e veja sua evolução.' },
 perfil: { title: 'Perfil' },
};
const readRoute = () => parseRoute(window.location.hash);

function Placeholder({ text }: { text: string }) {
 return <section className="card"><p className="muted">{text}</p></section>;
}

export function App() {
 const data = useData(); const [route, setRoute] = useState<Route>(readRoute); const heading = useRef<HTMLHeadingElement>(null);
 const pwa = usePwa();
 useEffect(() => { const change = () => setRoute(readRoute()); window.addEventListener('hashchange', change); return () => window.removeEventListener('hashchange', change); }, []);
 const routeKey = hrefFor(route);
 useEffect(() => { heading.current?.focus({ preventScroll: true }); window.scrollTo(0, 0); }, [routeKey]);
 const theme = data.state?.settings.theme ?? 'auto';
 useEffect(() => {
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  const apply = () => { document.documentElement.dataset.theme = theme === 'auto' ? (media.matches ? 'dark' : 'light') : theme; };
  apply(); media.addEventListener('change', apply); return () => media.removeEventListener('change', apply);
 }, [theme]);
 const [flash, setFlash] = useState(false); const wasSaving = useRef(false);
 useEffect(() => {
  if (data.saving) { wasSaving.current = true; setFlash(true); return; }
  if (!wasSaving.current) return;
  wasSaving.current = false; setFlash(true);
  const t = window.setTimeout(() => setFlash(false), 3000); return () => window.clearTimeout(t);
 }, [data.saving]);
 const offlineText = pwa.development ? 'Prévia local · offline disponível no build' : pwa.ready ? (pwa.online ? 'Disponível offline' : 'Sem conexão · disponível offline') : pwa.error ? 'Acesso offline indisponível' : pwa.online ? 'Preparando acesso offline…' : 'Sem conexão · acesso offline não confirmado';
 const mealRoute = route.tab === 'dieta' && route.meal ? route.meal : null;
 const { title: baseTitle, subtitle } = headings[route.tab];
 const title = mealRoute ? MEAL_NAME[mealRoute] : baseTitle;
 const showTitle = Boolean(subtitle) && !mealRoute;
 const executing = route.tab === 'treino' && route.view === 'executar';
 const name = (data.state?.settings.profile?.name as string | undefined)?.trim();
 return <>
  <a className="skip" href="#conteudo" onClick={e => { e.preventDefault(); document.getElementById('conteudo')?.focus(); }}>Pular para o conteúdo</a>
  {executing || mealRoute ? null : <header className="app-header">
   <a className="brand" href={hrefFor({ tab: 'inicio' })} aria-label="Fitnez, ir para o início"><Logo size={34} withTagline /></a>
   <div className="header-actions">
    <a className="icon-button" href={hrefFor({ tab: 'perfil' })} aria-label={pwa.updateAvailable ? 'Avisos: há uma nova versão' : 'Notificações e lembretes'}><Icon name="sino" />{pwa.updateAvailable ? <span className="bell-dot" aria-hidden="true" /> : null}</a>
    <a className="icon-button avatar" href={hrefFor({ tab: 'perfil' })} aria-label="Abrir perfil">{name ? name.charAt(0).toUpperCase() : <Icon name="perfil" />}</a>
   </div>
  </header>}
  {pwa.updateAvailable ? <aside className="update-banner"><p>Uma nova versão está pronta.</p><div className="actions"><button disabled={data.busy || data.saving} onClick={pwa.applyUpdate}>Atualizar agora</button><button className="secondary" onClick={pwa.deferUpdate}>Depois</button></div>{data.busy ? <p>Aguarde a conclusão da operação.</p> : null}</aside> : null}
  <main id="conteudo" tabIndex={-1}>
   <div className={showTitle ? 'page-heading' : undefined}><h1 ref={heading} tabIndex={-1} className={showTitle ? undefined : 'visually-hidden'}>{title}</h1>{subtitle && showTitle ? <p className="page-detail">{subtitle}</p> : null}</div>
   {data.error ? <div className="error" role="alert"><strong>Não foi possível concluir</strong><p>{data.error}</p><button className="secondary" disabled={data.busy} onClick={() => void data.run(data.refresh, 'Dados relidos neste aparelho.')}>Reler dados e tentar novamente</button></div> : null}
   {data.notice ? <p className="success" role="status">{data.notice}</p> : null}
   {data.loading ? <p className="loading" role="status">Abrindo seus dados…</p> : data.state ? <>
    {data.initialization?.status === 'ready' && data.initialization.warnings.length ? <aside className="warning"><strong>Atenção à recuperação</strong>{data.initialization.warnings.map((w, i) => <p key={i}>{w}</p>)}</aside> : null}
    {data.initialization?.status === 'migration-conflict' && route.tab !== 'perfil' ? <aside className="warning"><strong>Encontramos duas fontes diferentes</strong><p>Escolha no Perfil qual histórico será usado. As fontes originais continuam preservadas.</p><a href={hrefFor({ tab: 'perfil' })}>Escolher origem dos dados</a></aside> : null}
    {route.tab === 'perfil' ? <Perfil />
     : route.tab === 'dieta' ? <Dieta route={route} />
     : route.tab === 'evolucao' ? <Evolucao />
     : route.tab === 'treino' ? <Treino route={route} />
     : <Inicio />}
   </> : <p>Seus dados não foram abertos. Use a ação acima para tentar novamente.</p>}
   {pwa.error ? <p className="warning">{pwa.error}</p> : null}
   <p className={flash ? 'save-status' : 'visually-hidden'} role="status">{data.saving ? 'Salvando…' : data.state && !data.error ? 'Salvo neste aparelho' : ''}</p>
   <p className="visually-hidden" role="status">{offlineText}</p>
  </main>
  {executing ? null : <TabBar current={route.tab} />}
 </>;
}
