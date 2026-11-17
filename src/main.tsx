import { createRoot } from 'react-dom/client';
import { createRepository } from './data';
import { App } from './app/App';
import { DataProvider } from './app/DataProvider';
import { ErrorBoundary } from './ui/ErrorBoundary';
import './ui/styles.css';

const repository = createRepository({ basePath: import.meta.env.BASE_URL });
createRoot(document.getElementById('root')!).render(<ErrorBoundary><DataProvider repository={repository}><App /></DataProvider></ErrorBoundary>);
