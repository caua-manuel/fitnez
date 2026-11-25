import { test, expect, type Page } from '@playwright/test';

// Instalar antes de montar o plano: no iPhone o app da tela de início não vê os dados do Safari. Dados sintéticos.
const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
const ANDROID = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36';
const wiz = (page: Page) => page.locator('.as[role=dialog]');
const passo = (page: Page) => wiz(page).getByRole('heading', { level: 1, name: 'Instale o app primeiro' });
const boasVindas = (page: Page) => wiz(page).getByRole('heading', { level: 1, name: 'Vamos montar seu plano' });
const AVISO = 'O app instalado começa sem os dados deste navegador';
// display-mode: standalone, como o app aberto pelo ícone (sem navigator.standalone).
const standalone = (page: Page) => page.addInitScript(() => {
 const original = window.matchMedia.bind(window);
 window.matchMedia = (q: string) => (/display-mode:\s*standalone/.test(q) ? { matches: true, media: q, onchange: null, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent: () => false } as MediaQueryList : original(q));
});
const fakePrompt = (page: Page, outcome: 'accepted' | 'dismissed') => page.evaluate(o => {
 const e: any = new Event('beforeinstallprompt', { cancelable: true });
 (window as any).__prompts = 0;
 e.prompt = () => { (window as any).__prompts++; return Promise.resolve(); };
 e.userChoice = Promise.resolve({ outcome: o });
 window.dispatchEvent(e);
}, outcome);

let errors: string[] = [];
test.use({ viewport: { width: 390, height: 844 } });
test.beforeEach(async ({ page }) => {
 errors = [];
 page.on('pageerror', e => errors.push(e.message));
 page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
});
test.afterEach(() => { expect(errors, 'Sem erros de console').toEqual([]); });

test.describe('iPhone no Safari', () => {
 test.use({ userAgent: IPHONE, hasTouch: true, isMobile: true });

 test('no navegador, o primeiro passo é instalar o app', async ({ page }, info) => {
  await page.goto('./');
  await expect(passo(page)).toBeFocused();
  await expect(wiz(page).getByText('No iPhone, o plano montado no navegador não passa para o app instalado.')).toBeVisible();
  const principal = wiz(page).getByRole('button', { name: 'Adicionar à tela de início' });
  await expect(principal).toHaveClass(/\bbutton\b/);
  await expect(wiz(page).getByRole('button', { name: 'Montar meu plano' })).toHaveCount(0);
  const box = (await principal.boundingBox())!;
  expect(box.height).toBeGreaterThanOrEqual(48);
  expect(box.y + box.height).toBeLessThanOrEqual(844);
  const cont = (await wiz(page).getByRole('button', { name: 'Continuar no navegador' }).boundingBox())!;
  expect(cont.height).toBeGreaterThanOrEqual(44);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath('instalar-primeiro-claro.png') });
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.screenshot({ path: info.outputPath('instalar-primeiro-escuro.png') });
  // O botão abre os 3 passos do Safari; sem dados no navegador, sem aviso.
  await principal.click();
  const sheet = page.getByRole('dialog', { name: 'Instalar na tela inicial' });
  await expect(sheet.locator('.ia-steps li')).toHaveCount(3);
  await expect(sheet.getByText(AVISO, { exact: false })).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(sheet).toBeHidden();
  await expect(passo(page)).toBeVisible();
  // Nada foi gravado: numa nova sessão, o passo volta.
  await page.evaluate(() => sessionStorage.clear());
  await page.reload();
  await expect(passo(page)).toBeVisible();
 });

 test('"Continuar no navegador" leva às boas-vindas, com "Montar meu plano" em destaque', async ({ page }, info) => {
  await page.goto('./');
  await wiz(page).getByRole('button', { name: 'Continuar no navegador' }).click();
  await expect(boasVindas(page)).toBeFocused();
  await expect(wiz(page).getByRole('button', { name: 'Montar meu plano' })).toHaveClass(/\bbutton\b/);
  await expect(wiz(page).getByRole('button', { name: 'Usar o plano padrão' })).not.toHaveClass(/\bbutton\b/);
  await expect(wiz(page).getByRole('button', { name: 'Adicionar à tela de início' })).toBeVisible();
  await page.screenshot({ path: info.outputPath('boas-vindas-navegador.png'), fullPage: true });
  // Ida e volta no assistente não traz o passo de instalar de novo.
  await wiz(page).getByRole('button', { name: 'Montar meu plano' }).click();
  await wiz(page).getByRole('button', { name: 'Voltar' }).click();
  await expect(boasVindas(page)).toBeVisible();
 });

 test('instalado (display-mode: standalone): abre direto nas boas-vindas', async ({ page }, info) => {
  await standalone(page);
  await page.goto('./');
  await expect(boasVindas(page)).toBeFocused();
  await expect(wiz(page).getByRole('heading', { name: 'Instale o app primeiro' })).toHaveCount(0);
  await expect(wiz(page).getByRole('button', { name: 'Adicionar à tela de início' })).toHaveCount(0);
  await expect(wiz(page).getByRole('button', { name: 'Montar meu plano' })).toHaveClass(/\bbutton\b/);
  await expect(wiz(page).getByRole('button', { name: 'Usar o plano padrão' })).not.toHaveClass(/\bbutton\b/);
  await page.screenshot({ path: info.outputPath('boas-vindas-instalado.png'), fullPage: true });
 });

 test('Início: com plano escolhido no navegador, avisa antes de instalar', async ({ page }, info) => {
  await page.goto('./');
  await wiz(page).getByRole('button', { name: 'Continuar no navegador' }).click();
  await wiz(page).getByRole('button', { name: 'Usar o plano padrão' }).click();
  await wiz(page).getByRole('button', { name: 'Usar o plano padrão' }).click();
  await expect(wiz(page)).toHaveCount(0);
  await page.locator('.in-instalar').click();
  const sheet = page.getByRole('dialog', { name: 'Instalar na tela inicial' });
  await expect(sheet.getByRole('note').filter({ hasText: AVISO })).toBeVisible();
  await expect(sheet.getByText('restaure um backup', { exact: false })).toBeVisible();
  await expect(sheet.locator('.ia-steps li')).toHaveCount(3);
  await page.screenshot({ path: info.outputPath('aviso-dados-iphone.png') });
  await page.keyboard.press('Escape');
  await expect(sheet).toBeHidden();
 });

 test('demonstração: sem passo de instalar', async ({ page }) => {
  await page.goto('./');
  await wiz(page).getByRole('button', { name: 'Continuar no navegador' }).click();
  await wiz(page).getByRole('button', { name: 'Ver com dados de exemplo' }).click();
  await expect(page.getByRole('region', { name: 'Modo demonstração' })).toBeVisible({ timeout: 15000 });
  await page.evaluate(() => sessionStorage.clear());
  await page.reload();
  await expect(page.getByRole('region', { name: 'Modo demonstração' })).toBeVisible({ timeout: 15000 });
  await expect(page.getByRole('heading', { name: 'Instale o app primeiro' })).toHaveCount(0);
 });
});

test.describe('Android no Chrome', () => {
 test.use({ userAgent: ANDROID, hasTouch: true, isMobile: true });

 test('com o pedido de instalação, mostra o passo e instala direto', async ({ page }) => {
  await page.goto('./');
  await expect(boasVindas(page)).toBeVisible();
  await fakePrompt(page, 'accepted');
  await expect(passo(page)).toBeVisible();
  await expect(wiz(page).getByText('No iPhone', { exact: false })).toHaveCount(0);
  await wiz(page).getByRole('button', { name: 'Adicionar à tela de início' }).click();
  await expect.poll(() => page.evaluate(() => (window as any).__prompts)).toBe(1);
  await expect(page.locator('.ui-toast')).toContainText('Instalando o app');
  await expect(boasVindas(page)).toBeVisible();
 });

 test('Início: instalação compartilha os dados, então não há aviso', async ({ page }) => {
  await page.goto('./');
  await wiz(page).getByRole('button', { name: 'Usar o plano padrão' }).click();
  await wiz(page).getByRole('button', { name: 'Usar o plano padrão' }).click();
  await expect(wiz(page)).toHaveCount(0);
  // Sem o evento (menu do navegador): a folha genérica, sem o aviso do iPhone.
  await page.locator('.in-instalar').click();
  const sheet = page.getByRole('dialog', { name: 'Instalar na tela inicial' });
  await expect(sheet).toBeVisible();
  await expect(sheet.getByText(AVISO, { exact: false })).toHaveCount(0);
 });
});

test('computador sem pedido de instalação: boas-vindas direto, como antes', async ({ page }) => {
 await page.goto('./');
 await expect(boasVindas(page)).toBeFocused();
 await expect(wiz(page).getByRole('heading', { name: 'Instale o app primeiro' })).toHaveCount(0);
});
