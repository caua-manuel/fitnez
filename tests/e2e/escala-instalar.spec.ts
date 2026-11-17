import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';

// Dados inteiramente sintéticos. Escala "como terminou", observações da aula e instalação do app.
const START_SEMANA_4 = '2026-10-19'; // segunda-feira; 2026-11-12 (quinta) é dia de aula
const IPHONE_SAFARI = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1';
const IPHONE_CHROME = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/124.0.0.0 Mobile/15E148 Safari/604.1';
const json = (f: string) => JSON.parse(readFileSync(new URL(`../../data/${f}`, import.meta.url), 'utf8'));
const backupFull = (start: string, days: Record<string, any> = {}) => {
 const plan = json('plan.json');
 return { v: 3, app: 'treino12', exportedAt: Date.now(), state: {
  v: 3, revision: 0,
  catalog: { plan: plan.plan, diet: json('diet.json'), recipes: json('recipes.json'), revision: 0 },
  settings: { start, sched: plan.sched, theme: 'auto', startConfirmed: true },
  history: { days, measurements: {} }, snapshots: {}, recovery: {},
  meta: { initializedAt: 1, updatedAt: 1, migrationCompleted: true, migrationStatus: 'none', migrationWarnings: [], lastBackupGeneratedAt: null, lastBackupConfirmedAt: null },
 } };
};
async function state(page: Page): Promise<any> {
 return page.evaluate(async () => {
  const name = (await indexedDB.databases()).find(d => d.name?.startsWith('treino12:'))!.name!;
  return new Promise((resolve, reject) => {
   const req = indexedDB.open(name); req.onerror = () => reject(req.error);
   req.onsuccess = () => { const db = req.result; const get = db.transaction(['state']).objectStore('state').get('active'); get.onsuccess = () => { db.close(); resolve(get.result); }; get.onerror = () => reject(get.error); };
  });
 });
}
async function seed(page: Page, days: Record<string, any> = {}) {
 await page.goto('#perfil');
 await expect(page.getByText('Salvo neste aparelho', { exact: true })).toBeVisible();
 await page.locator('#backup-cabeca').click();
 await page.locator('#backup-file').setInputFiles({ name: 'fixture-SINTETICO.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(backupFull(START_SEMANA_4, days))) });
 await page.getByRole('button', { name: 'Confirmar importação', exact: true }).click();
 await expect(page.getByText('Backup importado.', { exact: false })).toBeVisible();
 await page.goto('#inicio'); await page.reload();
 await expect(page.getByRole('heading', { name: 'Início', level: 1 })).toBeVisible();
}
const noHScroll = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
const openDados = async (page: Page) => { await page.goto('#perfil'); await expect(page.getByText('Salvo neste aparelho', { exact: true })).toBeVisible(); await page.locator('#dados-cabeca').click(); };
const OBS = 'Observações (opcional)';

test.use({ viewport: { width: 390, height: 844 } });
test.beforeEach(async ({ page }) => {
 const errors: string[] = []; (page as any).__errors = errors;
 page.on('pageerror', e => errors.push(e.message));
 page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
});
test.afterEach(async ({ page }) => { expect((page as any).__errors, 'Sem erros de console').toEqual([]); });

test.describe('Como terminou e observações', () => {
 test('a escala diz 1 = leve e 5 = destruído, e os botões citam as pontas', async ({ page }, info) => {
  await page.clock.setFixedTime(new Date('2026-11-12T12:00:00'));
  await page.goto('./'); await seed(page);
  await page.getByRole('button', { name: 'Marcar aula como feita' }).click();
  const grupo = page.getByRole('group', { name: 'Como terminou' });
  await expect(grupo.getByText('(1 = leve, 5 = destruído)')).toBeVisible();
  await expect(page.getByText('exausto')).toHaveCount(0);
  await expect(grupo.getByRole('button', { name: 'Nota 1 de 5, leve' })).toBeVisible();
  await expect(grupo.getByRole('button', { name: 'Nota 5 de 5, destruído' })).toBeVisible();
  await expect(grupo.getByRole('button', { name: 'Nota 3 de 5', exact: true })).toBeVisible();
  await page.screenshot({ path: info.outputPath('escala-390.png'), fullPage: true });
 });

 test('observações são opcionais, salvam, editam, voltam ao desfazer e somem ao apagar o texto', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-12T12:00:00'));
  await page.goto('./'); await seed(page);
  await page.getByRole('button', { name: 'Marcar aula como feita' }).click();
  const campo = page.getByLabel(OBS);
  await expect(campo).toBeVisible();
  await expect(campo).toHaveAttribute('maxlength', '300');
  // Sem observação: nota e aula salvam normalmente.
  await page.getByRole('button', { name: 'Nota 2 de 5' }).click();
  await expect.poll(async () => (await state(page)).history.days['2026-11-12']?.feel).toBe(2);
  expect((await state(page)).history.days['2026-11-12'].notes).toBeUndefined();
  // Digitar e sair do campo grava.
  await campo.fill('Sparring pesado, ombro um pouco travado');
  await campo.blur();
  await expect.poll(async () => (await state(page)).history.days['2026-11-12']?.notes?.['aula-bjj']).toBe('Sparring pesado, ombro um pouco travado');
  await page.reload();
  await expect(page.getByLabel(OBS)).toHaveValue('Sparring pesado, ombro um pouco travado');
  // Editar preserva a nota e troca o texto.
  await page.getByLabel(OBS).fill('Ombro melhor');
  await page.getByLabel(OBS).blur();
  await expect.poll(async () => (await state(page)).history.days['2026-11-12']?.notes?.['aula-bjj']).toBe('Ombro melhor');
  expect((await state(page)).history.days['2026-11-12'].feel).toBe(2);
  // Desmarcar e desfazer devolvem aula, nota e observação.
  await page.getByRole('button', { name: 'Desmarcar aula' }).click();
  await expect(page.getByRole('button', { name: 'Marcar aula como feita' })).toBeVisible();
  await page.locator('.ui-toast').getByRole('button', { name: 'Desfazer' }).click();
  await expect(page.getByLabel(OBS)).toHaveValue('Ombro melhor');
  await expect(page.getByRole('button', { name: 'Nota 2 de 5' })).toHaveAttribute('aria-pressed', 'true');
  // Apagar o texto remove a chave sem deixar lixo.
  await page.getByLabel(OBS).fill('');
  await page.getByLabel(OBS).blur();
  await expect.poll(async () => (await state(page)).history.days['2026-11-12']?.notes).toBeUndefined();
 });

 test('registro antigo, sem observações, continua abrindo', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-12T12:00:00'));
  await page.goto('./');
  await seed(page, { '2026-11-12': { acts: { bjj: true }, feel: 4 } });
  await expect(page.getByLabel(OBS)).toHaveValue('');
  await expect(page.getByRole('button', { name: 'Nota 4 de 5' })).toHaveAttribute('aria-pressed', 'true');
 });

 test('a observação de um backup aparece no registro', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-12T12:00:00'));
  await page.goto('./');
  await seed(page, { '2026-11-12': { acts: { bjj: true }, feel: 3, notes: { 'aula-bjj': 'Treino de passagem' } } });
  await expect(page.getByLabel(OBS)).toHaveValue('Treino de passagem');
 });
});

test.describe('Instalar na tela inicial', () => {
 test('botão visível no Perfil; evento guardado chama prompt() e mostra o resultado', async ({ page }, info) => {
  await page.goto('./');
  await openDados(page);
  const botao = page.getByRole('button', { name: 'Instalar na tela inicial' });
  await expect(botao).toBeVisible();
  await page.screenshot({ path: info.outputPath('perfil-instalar-390.png'), fullPage: true });
  await page.evaluate(() => {
   const e: any = new Event('beforeinstallprompt', { cancelable: true });
   (window as any).__prompts = 0;
   e.prompt = () => { (window as any).__prompts++; return Promise.resolve(); };
   e.userChoice = Promise.resolve({ outcome: 'accepted' });
   window.dispatchEvent(e);
  });
  await botao.click();
  await expect.poll(() => page.evaluate(() => (window as any).__prompts)).toBe(1);
  await expect(page.locator('.ui-toast')).toContainText('Instalando o app');
  await expect(page.getByRole('dialog')).toHaveCount(0);
 });

 test('instalação recusada mostra aviso curto', async ({ page }) => {
  await page.goto('./'); await openDados(page);
  await page.evaluate(() => {
   const e: any = new Event('beforeinstallprompt', { cancelable: true });
   e.prompt = () => Promise.resolve(); e.userChoice = Promise.resolve({ outcome: 'dismissed' });
   window.dispatchEvent(e);
  });
  await page.getByRole('button', { name: 'Instalar na tela inicial' }).click();
  await expect(page.locator('.ui-toast')).toContainText('Instalação cancelada');
 });

 test('sem suporte, a folha traz instruções genéricas', async ({ page }) => {
  await page.goto('./'); await openDados(page);
  await page.getByRole('button', { name: 'Instalar na tela inicial' }).click();
  const folha = page.getByRole('dialog', { name: 'Instalar na tela inicial' });
  await expect(folha.getByText('Instalar app', { exact: false })).toBeVisible();
  await expect(folha.getByText('Adicionar à tela inicial', { exact: false })).toBeVisible();
  await folha.getByRole('button', { name: 'Fechar' }).click();
  await expect(folha).toHaveCount(0);
 });

 test('atalho discreto no Início para quem ainda não instalou', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('dialog', { name: 'Quando o plano começa?' }).getByRole('button', { name: 'Decidir depois' }).click();
  await expect(page.getByRole('button', { name: 'Instalar na tela inicial' })).toBeVisible();
 });

 test.describe('iPhone no Safari', () => {
  test.use({ userAgent: IPHONE_SAFARI, hasTouch: true, isMobile: true });
  test('folha com os três passos', async ({ page }, info) => {
   await page.goto('./'); await openDados(page);
   await page.getByRole('button', { name: 'Instalar na tela inicial' }).click();
   const folha = page.getByRole('dialog', { name: 'Instalar na tela inicial' });
   await expect(folha.locator('ol > li')).toHaveCount(3);
   await expect(folha.getByText('Compartilhar', { exact: false })).toBeVisible();
   await expect(folha.getByText('Adicionar à Tela de Início', { exact: false })).toBeVisible();
   await expect(folha.locator('strong', { hasText: /^Adicionar$/ })).toBeVisible();
   await expect(folha.getByText('É preciso estar no Safari')).toBeVisible();
   expect(await noHScroll(page)).toBe(true);
   await page.screenshot({ path: info.outputPath('folha-iphone-390.png') });
  });
 });

 test.describe('iPhone em outro navegador', () => {
  test.use({ userAgent: IPHONE_CHROME, hasTouch: true, isMobile: true });
  test('pede para abrir no Safari', async ({ page }) => {
   await page.goto('./'); await openDados(page);
   await page.getByRole('button', { name: 'Instalar na tela inicial' }).click();
   const folha = page.getByRole('dialog', { name: 'Instalar na tela inicial' });
   await expect(folha.getByText('Abra este endereço no Safari', { exact: false })).toBeVisible();
   await expect(folha.locator('ol > li')).toHaveCount(3);
  });
 });

 test('com o app instalado (standalone) o botão some e aparece "App instalado"', async ({ page }) => {
  await page.addInitScript(() => { Object.defineProperty(navigator, 'standalone', { value: true }); });
  await page.goto('./'); await openDados(page);
  await expect(page.getByRole('button', { name: 'Instalar na tela inicial' })).toHaveCount(0);
  await expect(page.getByText('App instalado', { exact: true })).toBeVisible();
  await page.goto('#inicio');
  await expect(page.getByRole('heading', { name: 'Início', level: 1 })).toBeAttached();
  await expect(page.getByRole('button', { name: 'Instalar na tela inicial' })).toHaveCount(0);
 });
});
