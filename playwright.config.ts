import { defineConfig } from '@playwright/test';
import { resolveBasePath } from './scripts/base-path.ts';

// Mesma base do build/preview (VITE_BASE_PATH; padrão /Projeto-Treino/).
const base = resolveBasePath({ VITE_BASE_PATH: process.env.VITE_BASE_PATH });
const port = process.env.E2E_PORT ?? '4173';
const url = `http://127.0.0.1:${port}${base}`;
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

export default defineConfig({
 testDir: './tests/e2e', fullyParallel: false, workers: 1,
 // No CI uma falha é repetida uma vez; se passar na repetição o teste sai como "flaky" (visível no log e no relatório).
 // O trace e o screenshot da primeira tentativa que falhou ficam em test-results (retain-on-failure).
 retries: process.env.CI ? 1 : 0,
 timeout: 45000, expect: { timeout: 10000 },
 reporter: [['list'], ['html', { open: 'never' }]],
 use: { baseURL: url, browserName: 'chromium', locale: 'pt-BR', trace: 'retain-on-failure', screenshot: 'only-on-failure' },
 webServer: { command: `${npm} run preview -- --port ${port}`, url, reuseExistingServer: true },
});
