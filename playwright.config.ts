import { defineConfig } from '@playwright/test';

export default defineConfig({
 testDir: './tests/e2e', fullyParallel: false, workers: 1,
 timeout: 45000, expect: { timeout: 10000 },
 reporter: [['list'], ['html', { open: 'never' }]],
 use: { baseURL: 'http://127.0.0.1:4173/Projeto-Treino/', browserName: 'chromium', locale: 'pt-BR', trace: 'retain-on-failure', screenshot: 'only-on-failure' },
 webServer: { command: 'npm.cmd run preview', url: 'http://127.0.0.1:4173/Projeto-Treino/', reuseExistingServer: true },
});
