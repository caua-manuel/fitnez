import { useEffect, useRef, useState } from 'react';
import { useData } from './DataProvider';
import { hrefFor, parseRoute } from './router';
import type { Route } from './router';
import { Logo } from '../ui/Logo';
import { Icon } from '../ui/icons';
import { TabBar } from '../ui/TabBar';
import { PageTransition } from '../ui/motion';
import { Inicio } from '../features/inicio/Inicio';
import { Perfil } from '../features/perfil/Perfil';
import { Evolucao } from '../features/evolucao/Evolucao';
import { Treino } from '../features/treino/Treino';
import { Dieta } from '../features/dieta/Dieta';
import { MEAL_NAME } from '../features/dieta/dietData';
import { usePwa } from '../pwa/usePwa';
import { Sheet } from '../ui/Sheet';
import { ToastHost } from '../ui/UndoToast';
import { shouldShowBackupReminder } from '../domain/userData';
import { isStartConfirmed, localDayOf } from '../domain/planStart';
import { DataInicioSheet } from '../features/perfil/DataInicioSheet';

/** Tempo em que o aviso de sucesso fica na tela; ele também some ao trocar de tela ou ao ser dispensado. */
const NOTICE_MS = 8000;
/** Marca da sessão: a escolha da data de início é oferecida uma vez por sessão (prefixo treino12: é limpo ao apagar tudo). */
const START_OFFER_KEY = 'treino12:inicio-oferecido';

/** Cada aba declara se mostra o título (h1) grande com subtítulo; onde a referência não mostra título, o h1 fica só para leitores de tela. */
const headings: Record<Route['tab'], { title: string; subtitle?: string }> = {
 inicio: { title: 'Início' },
 treino: { title: 'Treino' },
 dieta: { title: 'Dieta', subtitle: 'Seu plano alimentar do dia' },
 evolucao: { title: 'Evolução', subtitle: 'Acompanhe seus resultados e veja sua evolução.' },
 perfil: { title: 'Perfil' },
};
const readRoute = () => parseRoute(window.location.hash);

export function App() {
 const data = useData(); const [route, setRoute] = useState<Route>(readRoute); const heading = useRef<HTMLHeadingElement>(null);
 const pwa = usePwa();
 useEffect(() => { const change = () => setRoute(readRoute()); window.addEventListener('hashchange', change); return () => window.removeEventListener('hashchange', change); }, []);
 const routeKey = hrefFor(route);
 const { notice, clearNotice } = data; const [avisosOpen, setAvisosOpen] = useState(false);
 useEffect(() => { clearNotice(); setAvisosOpen(false); }, [routeKey, clearNotice]);
 useEffect(() => { if (!notice) return; const t = window.setTimeout(clearNotice, NOTICE_MS); return () => window.clearTimeout(t); }, [notice, clearNotice]);
 useEffect(() => { heading.current?.focus({ preventScroll: true }); window.scrollTo(0, 0); }, [routeKey]);
 const theme = data.state?.settings.theme ?? 'auto';
 useEffect(() => {
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  const apply = () => { document.documentElement.dataset.theme = theme === 'auto' ? (media.matches ? 'dark' : 'light') : theme; };
  apply(); media.addEventListener('change', apply); return () => media.removeEventListener('change', apply);
 }, [theme]);
 const [startOffer, setStartOffer] = useState(false); const offered = useRef(false);
 // Primeira abertura: com a data de início ainda não escolhida, oferece a escolha ao abrir o app no Início.
 useEffect(() => {
  if (offered.current || !data.state || data.initialization?.status === 'migration-conflict') return;
  offered.current = true;
  if (isStartConfirmed(data.state.settings) || route.tab !== 'inicio') return;
  try { if (sessionStorage.getItem(START_OFFER_KEY)) return; sessionStorage.setItem(START_OFFER_KEY, '1'); } catch { /* sem sessionStorage: oferece mesmo assim */ }
  setStartOffer(true);
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [data.state, data.initialization]);
 const [flash, setFlash] = useState(false); const wasSaving = useRef(false);
 useEffect(() => {
  if (data.saving) { wasSaving.current = true; setFlash(true); return; }
  if (!wasSaving.current) return;
  wasSaving.current = false; setFlash(true);
  const t = window.setTimeout(() => setFlash(false), 3000); return () => window.clearTimeout(t);
 }, [data.saving]);
 const offlineText = pwa.development ? 'Prévia local · offline disponível no build' : pwa.ready ? (pwa.online ? 'Disponível offline' : 'Sem conexão · disponível offline') : pwa.error ? 'Uso offline indisponível' : pwa.online ? 'Preparando o uso offline…' : 'Sem conexão · uso offline não confirmado';
 const mealRoute = route.tab === 'dieta' && route.meal ? route.meal : null;
 const { title: baseTitle, subtitle } = headings[route.tab];
 const title = mealRoute ? MEAL_NAME[mealRoute] : baseTitle;
 const showTitle = Boolean(subtitle) && !mealRoute;
 const executing = route.tab === 'treino' && route.view === 'executar';
 const backupPending = shouldShowBackupReminder(data.state, data.protection?.backupDue);
 const hasAvisos = backupPending || pwa.updateAvailable;
 const name = (data.state?.settings.profile?.name as string | undefined)?.trim();
 return <>
  <a className="skip" href="#conteudo" onClick={e => { e.preventDefault(); document.getElementById('conteudo')?.focus(); }}>Pular para o conteúdo</a>
  {executing || mealRoute ? null : <header className="app-header">
   <a className="brand" href={hrefFor({ tab: 'inicio' })} aria-label="Fitnez, ir para o início"><Logo size={34} withTagline /></a>
   <div className="header-actions">
    <button type="button" className="icon-button" aria-label={hasAvisos ? 'Avisos, há novidades' : 'Avisos'} aria-haspopup="dialog" onClick={() => setAvisosOpen(true)}><Icon name="sino" />{hasAvisos ? <span className="bell-dot" aria-hidden="true" /> : null}</button>
    <a className="icon-button avatar" href={hrefFor({ tab: 'perfil' })} aria-label="Abrir perfil">{name ? name.charAt(0).toUpperCase() : <Icon name="perfil" />}</a>
   </div>
  </header>}
  {pwa.updateAvailable ? <aside className="update-banner"><p>Uma nova versão está pronta.</p><div className="actions"><button disabled={data.busy || data.saving} onClick={pwa.applyUpdate}>Atualizar agora</button><button className="secondary" onClick={pwa.deferUpdate}>Depois</button></div>{data.busy ? <p>Aguarde a conclusão da operação.</p> : null}</aside> : null}
  <main id="conteudo" tabIndex={-1}>
   <div className={showTitle ? 'page-heading' : undefined}><h1 ref={heading} tabIndex={-1} className={showTitle ? undefined : 'visually-hidden'}>{title}</h1>{subtitle && showTitle ? <p className="page-detail">{subtitle}</p> : null}</div>
   {data.error ? <div className="error" role="alert"><strong>Não foi possível concluir</strong><p>{data.error}</p><button className="secondary" disabled={data.busy} onClick={() => void data.run(data.refresh, 'Dados relidos neste aparelho.')}>Reler dados e tentar novamente</button></div> : null}
   <div className={notice ? "success notice-bar" : undefined}><div role="status">{notice ? <p>{notice}</p> : null}</div>{notice ? <button type="button" aria-label="Dispensar aviso" onClick={clearNotice}>Dispensar</button> : null}</div>
   {data.loading ? <p className="loading" role="status">Abrindo seus dados…</p> : data.state ? <>
    {data.initialization?.status === 'ready' && data.initialization.warnings.length ? <aside className="warning"><strong>Atenção à recuperação</strong>{data.initialization.warnings.map((w, i) => <p key={i}>{w}</p>)}</aside> : null}
    {data.initialization?.status === 'migration-conflict' && route.tab !== 'perfil' ? <aside className="warning"><strong>Encontramos duas fontes diferentes</strong><p>Escolha no Perfil qual histórico será usado. As fontes originais continuam preservadas.</p><a href={hrefFor({ tab: 'perfil' })}>Escolher origem dos dados</a></aside> : null}
    <PageTransition routeKey={routeKey}>
     {route.tab === 'perfil' ? <Perfil offlineStatus={offlineText} />
      : route.tab === 'dieta' ? <Dieta route={route} />
      : route.tab === 'evolucao' ? <Evolucao />
      : route.tab === 'treino' ? <Treino route={route} />
      : <Inicio />}
    </PageTransition>
   </> : <p>Seus dados não foram abertos. Use a ação acima para tentar novamente.</p>}
   {pwa.error ? <p className="warning">{pwa.error}</p> : null}
   <p className={flash ? 'save-status' : 'visually-hidden'} role="status">{data.saving ? 'Salvando…' : data.state && !data.error ? 'Salvo neste aparelho' : ''}</p>
   {route.tab === 'perfil' ? null : <p className="visually-hidden" role="status">{offlineText}</p>}
  </main>
  {avisosOpen ? <Sheet title="Avisos" onClose={() => setAvisosOpen(false)}>
   {hasAvisos ? <ul className="avisos">
    {backupPending ? <li className="aviso-item"><strong>Faça um backup dos seus dados</strong><p>Seu backup semanal está pendente.</p><a className="text-link" href={hrefFor({ tab: 'perfil' })} onClick={() => setAvisosOpen(false)}>Fazer backup</a></li> : null}
    {pwa.updateAvailable ? <li className="aviso-item"><strong>Nova versão pronta</strong><p>Atualize para usar a versão mais recente.</p><div className="actions"><button type="button" className="button" disabled={data.busy || data.saving} onClick={pwa.applyUpdate}>Atualizar agora</button></div></li> : null}
   </ul> : <p className="muted">Nenhum aviso no momento.</p>}
   <div className="sheet-actions"><button type="button" className="button secondary" onClick={() => setAvisosOpen(false)}>Fechar</button></div>
  </Sheet> : null}
  {startOffer ? <DataInicioSheet firstRun title="Quando o plano começa?" today={localDayOf(Date.now())} onClose={() => setStartOffer(false)} /> : null}
  <ToastHost />
  {executing ? null : <TabBar current={route.tab} />}
 </>;
}
