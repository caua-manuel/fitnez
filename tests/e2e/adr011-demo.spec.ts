import { test, expect, type Page } from '@playwright/test';
import { dbNames, readDb, watchErrors } from './support/adr011';
import { resolveBasePath } from '../../scripts/base-path.ts';

// ADR 011, 1.1: modo demonstração. Entrar, navegar, offline, sair e voltar ao estado vazio real com o banco real intacto.

let errors: string[] = [];
test.beforeEach(async ({ page }) => { errors = watchErrors(page); });
test.afterEach(() => { expect(errors, 'Sem exceções nem erros de console').toEqual([]); });

// Mesma base do playwright.config.ts: no CI é /<repo>/, localmente /Projeto-Treino/.
const BASE = encodeURIComponent(resolveBasePath({ VITE_BASE_PATH: process.env.VITE_BASE_PATH }));
const REAL_DB = `treino12:${BASE}`;
const DEMO_DB = `treino12:demo:${BASE}`;
const MODE_KEY = `treino12:${BASE}:modo`;
const banner = (page: Page) => page.getByRole('region', { name: 'Modo demonstração' });
const nav = (page: Page, label: string) => page.getByRole('navigation', { name: 'Navegação principal' }).getByRole('link', { name: label, exact: true });
// Começa fora do Início: a demo abre nele, e tocar na aba atual não muda a rota.
const routes: [string, string][] = [['treino', 'Treino'], ['dieta', 'Dieta'], ['evolucao', 'Evolução'], ['inicio', 'Início'], ['perfil', 'Perfil']];

async function realBaseline(page: Page) {
 await page.goto('#perfil'); await page.waitForLoadState('networkidle');
 await expect(page.getByText('Salvo neste aparelho', { exact: true })).toBeAttached();
 // Uma gravação real que não é "dado do usuário" (o botão da demo só aparece sem dados do usuário).
 await page.getByRole('button', { name: 'Escuro', exact: true }).click();
 await expect.poll(async () => (await readDb(page))?.settings.theme).toBe('dark');
 return JSON.stringify(await readDb(page));
}
async function enter(page: Page) {
 await page.goto('#inicio');
 await page.getByRole('button', { name: 'Ver com dados de exemplo' }).first().click();
 await expect(banner(page)).toBeVisible({ timeout: 15000 });
}

test('demo: entrar, navegar pelas cinco telas, sair e voltar ao vazio real com o banco real intacto', async ({ page }) => {
 const before = await realBaseline(page);
 expect(await dbNames(page)).toEqual([REAL_DB]);
 await enter(page);
 expect(await page.evaluate(k => localStorage.getItem(k), MODE_KEY)).toBe('demo');
 expect(await dbNames(page)).toContain(DEMO_DB);
 const demo = await readDb(page, 'demo');
 expect(demo.meta.demo).toBe(true);
 expect(Object.keys(demo.history.days).length).toBeGreaterThan(5);
 // O banco real não muda enquanto a demo está aberta.
 expect(JSON.stringify(await readDb(page))).toBe(before);

 for (const [hash, label] of routes) {
  await nav(page, label).click();
  await expect(page).toHaveURL(new RegExp(`#${hash}$`));
  await expect(page.getByRole('heading', { name: label, exact: true, level: 1 })).toBeFocused();
  await expect(banner(page)).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
 }
 // Na demo: sem backup, sem compartilhar, sem apagar tudo; sem lembrete de backup.
 await expect(page.getByText('Indisponível na demonstração. Saia para usar com seus dados.').first()).toBeVisible();
 await expect(page.getByRole('button', { name: 'Baixar backup' })).toHaveCount(0);
 await expect(page.getByRole('link', { name: /Compartilhar plano/ })).toHaveCount(0);
 await expect(page.getByRole('heading', { name: 'Guarde uma cópia dos seus dados' })).toHaveCount(0);

 // "Continuar vendo" mantém a demo.
 await banner(page).getByRole('button', { name: 'Sair da demonstração' }).click();
 const sheet = page.getByRole('dialog', { name: 'Sair da demonstração?' });
 await sheet.getByRole('button', { name: 'Continuar vendo' }).click();
 await expect(sheet).toHaveCount(0);
 await expect(banner(page)).toBeVisible();

 // Sair: volta ao Início real vazio, sem marca, sem banco da demo, banco real idêntico.
 await banner(page).getByRole('button', { name: 'Sair da demonstração' }).click();
 await sheet.getByRole('button', { name: 'Sair', exact: true }).click();
 await expect(banner(page)).toHaveCount(0, { timeout: 15000 });
 await expect(page).toHaveURL(/#inicio$/);
 expect(await page.evaluate(k => localStorage.getItem(k), MODE_KEY)).toBeNull();
 await expect.poll(() => dbNames(page)).toEqual([REAL_DB]);
 expect(JSON.stringify(await readDb(page))).toBe(before);
 await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
 await expect(page.getByRole('button', { name: 'Ver com dados de exemplo' }).first()).toBeVisible();
 await page.reload();
 await expect(banner(page)).toHaveCount(0);
 expect(JSON.stringify(await readDb(page))).toBe(before);
});

test('demo: depois do precache, abre offline com os dados de exemplo e a faixa', async ({ page, context }) => {
 await realBaseline(page);
 await page.evaluate(async () => { await navigator.serviceWorker.ready; if (!navigator.serviceWorker.controller) await new Promise<void>(r => navigator.serviceWorker.addEventListener('controllerchange', () => r(), { once: true })); });
 await expect(page.getByText('Disponível offline', { exact: true })).toBeAttached();
 await enter(page);
 await context.setOffline(true);
 try {
  await page.reload();
  await expect(banner(page)).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Início', exact: true, level: 1 })).toBeAttached();
  for (const [, label] of routes) { await nav(page, label).click(); await expect(page.getByRole('heading', { name: label, exact: true, level: 1 })).toBeAttached(); await expect(banner(page)).toBeVisible(); }
  expect((await readDb(page, 'demo')).meta.demo).toBe(true);
 } finally { await context.setOffline(false); }
});

test('demo: marca adulterada sem banco da demo volta ao modo real e limpa a marca', async ({ page }) => {
 const before = await realBaseline(page);
 await page.evaluate(k => localStorage.setItem(k, 'demo'), MODE_KEY);
 await page.goto('#inicio'); await page.reload();
 // O app recarrega sozinho para o modo real: espera o app real (com o assistente da primeira abertura por cima).
 await expect(page.getByRole('dialog', { name: 'Vamos montar seu plano' })).toBeVisible({ timeout: 15000 });
 await expect.poll(() => page.evaluate(k => localStorage.getItem(k), MODE_KEY).catch(() => 'navegando')).toBeNull();
 await expect(banner(page)).toHaveCount(0);
 await expect.poll(() => dbNames(page)).toEqual([REAL_DB]);
 expect(JSON.stringify(await readDb(page))).toBe(before);
});

test('demo: com dados do usuário, "Ver com dados de exemplo" não aparece', async ({ page }) => {
 await page.goto('#perfil'); await page.waitForLoadState('networkidle');
 await expect(page.getByText('Salvo neste aparelho', { exact: true })).toBeAttached();
 await page.getByRole('button', { name: 'Editar perfil' }).click();
 await page.getByLabel('Seu nome').fill('Pessoa Sintética');
 await page.getByRole('button', { name: 'Salvar', exact: true }).click();
 await expect.poll(async () => (await readDb(page))?.settings.profile?.name).toBe('Pessoa Sintética');
 await page.goto('#inicio');
 await expect(page.getByRole('heading', { name: 'Início', exact: true, level: 1 })).toBeAttached();
 await expect(page.getByRole('button', { name: 'Ver com dados de exemplo' })).toHaveCount(0);
});
