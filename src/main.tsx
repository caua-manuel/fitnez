import { createRoot } from 'react-dom/client';
import { createRepository } from './data';
import { createDemoRepository, deleteDemoDatabase } from './data/demo';
import { App } from './app/App';
import { DataProvider } from './app/DataProvider';
import { appMode } from './app/mode';
import { exitDemo, isValidDemoState, listenModeChanges } from './app/demo';
import { ErrorBoundary } from './ui/ErrorBoundary';
import './ui/styles.css';

// ADR 011 (1.1): o modo é lido uma vez, antes de criar o repositório. Na demo o repositório real nunca é criado.
const demo = appMode() === 'demo';
const repository = demo ? createDemoRepository() : createRepository({ basePath: import.meta.env.BASE_URL });
listenModeChanges();
const render = () => createRoot(document.getElementById('root')!).render(<ErrorBoundary><DataProvider repository={repository}><App /></DataProvider></ErrorBoundary>);

if (!demo) {
 // Limpa uma saída da demo interrompida (idempotente; não espera).
 deleteDemoDatabase().catch(() => undefined);
 render();
} else {
 // Marca de demo sem um banco de demo válido (adulterada, saída interrompida, banco despejado): volta ao modo real.
 repository.initialize()
  .then(init => { if (isValidDemoState(init.state)) render(); else void exitDemo(repository); })
  .catch(() => render()); // erro de abertura: a tela mostra o erro e a faixa da demo continua visível
}
