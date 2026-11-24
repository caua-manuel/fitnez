import { test, expect, type Page } from '@playwright/test';

// Opção "Adicionar à tela de início" nas boas-vindas do assistente. Dados sintéticos.
const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
const wiz = (page: Page) => page.locator('.as[role=dialog]');
const opcao = (page: Page) => page.getByRole('button', { name: 'Adicionar à tela de início' });

test.use({ viewport: { width: 390, height: 844 } });

test('aparece nas boas-vindas, abaixo das ações, como link secundário de 48 px', async ({ page }) => {
 await page.goto('./');
 await expect(wiz(page).getByRole('heading', { name: 'Vamos montar seu plano' })).toBeVisible();
 await expect(opcao(page)).toBeVisible();
 const box = (await opcao(page).boundingBox())!;
 expect(box.height).toBeGreaterThanOrEqual(48);
 const montar = (await wiz(page).getByRole('button', { name: 'Montar meu plano' }).boundingBox())!;
 expect(box.y).toBeGreaterThan(montar.y);
});

test.describe('iPhone', () => {
 test.use({ userAgent: IPHONE });
 test('abre a folha com os passos do Safari; Escape fecha e devolve o foco', async ({ page }) => {
  await page.goto('./');
  await opcao(page).click();
  const sheet = page.getByRole('dialog', { name: 'Instalar na tela inicial' });
  await expect(sheet).toBeVisible();
  await expect(sheet.getByText('Compartilhar')).toBeVisible();
  await expect(sheet.getByText('Adicionar à Tela de Início')).toBeVisible();
  await expect(sheet.locator('.ia-steps li')).toHaveCount(3);
  await page.keyboard.press('Escape');
  await expect(sheet).toBeHidden();
  await expect(wiz(page).getByRole('heading', { name: 'Vamos montar seu plano' })).toBeVisible();
 });
});

test('não aparece quando o app já está instalado (standalone)', async ({ page }) => {
 await page.addInitScript(() => { Object.defineProperty(navigator, 'standalone', { value: true }); });
 await page.goto('./');
 await expect(wiz(page).getByRole('heading', { name: 'Vamos montar seu plano' })).toBeVisible();
 await expect(opcao(page)).toHaveCount(0);
});

// Botão no fim da tela Início (abaixo da faixa da semana).
async function abrirInicio(page: Page) {
 await page.goto('./');
 await wiz(page).getByRole('button', { name: 'Decidir depois' }).click();
 await expect(wiz(page)).toHaveCount(0);
 await expect(page.getByRole('heading', { name: 'Início', level: 1 })).toBeVisible();
}
const botaoInicio = (page: Page) => page.locator('.in-instalar');

test('Início: botão secundário de largura total no fim da tela', async ({ page }) => {
 await abrirInicio(page);
 await expect(botaoInicio(page)).toBeVisible();
 await expect(botaoInicio(page)).toHaveAccessibleName('Adicionar à tela de início');
 const box = (await botaoInicio(page).boundingBox())!;
 expect(box.height).toBeGreaterThanOrEqual(48);
 const faixa = page.locator('.in-page > *').filter({ has: page.locator('.in-instalar') });
 expect(await faixa.count()).toBe(0); // fica fora dos cartões
});

test.describe('Início no iPhone', () => {
 test.use({ userAgent: IPHONE });
 test('abre a folha com os 3 passos do Safari', async ({ page }) => {
  await abrirInicio(page);
  await botaoInicio(page).click();
  const sheet = page.getByRole('dialog', { name: 'Instalar na tela inicial' });
  await expect(sheet).toBeVisible();
  await expect(sheet.locator('.ia-steps li')).toHaveCount(3);
  await page.keyboard.press('Escape');
  await expect(sheet).toBeHidden();
 });
});

test('Início: some em standalone', async ({ page }) => {
 await page.addInitScript(() => { Object.defineProperty(navigator, 'standalone', { value: true }); });
 await abrirInicio(page);
 await expect(botaoInicio(page)).toHaveCount(0);
});
