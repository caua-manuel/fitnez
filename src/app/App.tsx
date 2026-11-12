import { useEffect, useRef, useState } from 'react';
import { useData } from './DataProvider';
import { Icon } from '../ui/components';
import { FoundationPages } from '../features/FoundationPages';
import { More } from '../features/More';
import { usePwa } from '../pwa/usePwa';

const routes = [['hoje','Hoje'],['calendario','Agenda'],['treinos','Treinos'],['dieta','Dieta'],['progresso','Evolução'],['mais','Mais']] as const;
function route() { const hash = window.location.hash.slice(1); return routes.some(([id]) => id === hash) ? hash : 'hoje'; }
export function App() {
 const data = useData(); const [page, setPage] = useState(route); const heading = useRef<HTMLHeadingElement>(null);
 const pwa = usePwa();
 useEffect(() => { const change = () => setPage(route()); window.addEventListener('hashchange', change); return () => window.removeEventListener('hashchange', change); }, []);
 useEffect(() => { heading.current?.focus({ preventScroll: true }); window.scrollTo(0,0); }, [page]);
 const theme = data.state?.settings.theme ?? 'auto';
 useEffect(() => {
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  const apply = () => { document.documentElement.dataset.theme = theme === 'auto' ? (media.matches ? 'dark' : 'light') : theme; };
  apply(); media.addEventListener('change', apply); return () => media.removeEventListener('change', apply);
 }, [theme]);
 const title = routes.find(([id]) => id === page)![1];
 return <>
  <a className="skip" href="#conteudo" onClick={e => { e.preventDefault(); document.getElementById('conteudo')?.focus(); }}>Pular para o conteúdo</a>
  <header className="app-header"><a className="brand" href="#hoje">Treino <span>12 semanas</span></a><span className="phase-label">Fundação do app</span></header>
  <div className="system-status"><span>{pwa.development ? 'Prévia local · offline disponível no build' : pwa.ready ? (pwa.online ? 'Disponível offline' : 'Sem conexão · disponível offline') : pwa.error ? 'Acesso offline indisponível' : pwa.online ? 'Preparando acesso offline…' : 'Sem conexão · acesso offline não confirmado'}</span><span role="status">{data.saving ? 'Salvando…' : data.state && !data.error ? 'Salvo neste aparelho' : ''}</span></div>
  {pwa.updateAvailable ? <aside className="update-banner"><p>Uma nova versão está pronta.</p><div className="actions"><button disabled={data.busy || data.saving} onClick={pwa.applyUpdate}>Atualizar agora</button><button className="secondary" onClick={pwa.deferUpdate}>Depois</button></div>{data.busy ? <p>Aguarde a conclusão da operação.</p> : null}</aside> : null}
  <main id="conteudo" tabIndex={-1}>
   <div className="page-heading"><h1 ref={heading} tabIndex={-1}>{title}</h1><span className="page-detail">Treino, rotina e cuidado com seus dados.</span></div>
   {data.error ? <div className="error" role="alert"><strong>Não foi possível concluir</strong><p>{data.error}</p><button className="secondary" disabled={data.busy} onClick={() => void data.run(data.refresh, 'Dados relidos neste aparelho.')}>Reler dados e tentar novamente</button></div> : null}
   {data.notice ? <p className="success" role="status">{data.notice}</p> : null}
   {data.loading ? <p className="loading" role="status">Abrindo seus dados…</p> : data.state ? <>
    {data.initialization?.status === 'ready' && data.initialization.warnings.length ? <aside className="warning"><strong>Atenção à recuperação</strong>{data.initialization.warnings.map((w,i)=><p key={i}>{w}</p>)}</aside> : null}
    {data.initialization?.status === 'migration-conflict' && page !== 'mais' ? <aside className="warning"><strong>Encontramos duas fontes diferentes</strong><p>Escolha em Mais qual histórico será usado. As fontes originais continuam preservadas.</p><a href="#mais">Escolher origem dos dados</a></aside> : null}
    {page === 'mais' ? <More /> : <FoundationPages page={page} />}
   </> : <p>Seus dados não foram abertos. Use a ação acima para tentar novamente.</p>}
   {pwa.error ? <p className="warning">{pwa.error}</p> : null}
  </main>
  <nav className="navigation" aria-label="Navegação principal">{routes.map(([id,label])=><a key={id} href={`#${id}`} aria-current={id === page ? 'page' : undefined}><Icon name={id}/><span>{label}</span></a>)}</nav>
 </>;
}
