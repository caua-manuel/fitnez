import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';

// Estado salvo inválido e sintético (histórico nulo, que a leitura tolerante do perfil não cobre) derruba a interface;
// a tela de recuperação precisa aparecer, baixar um backup válido e apagar tudo.
async function corromper(page: Page) {
 await page.goto('#perfil');
 await expect(page.getByText('Salvo neste aparelho', { exact: true })).toBeVisible();
 await page.evaluate(async () => {
  const name = (await indexedDB.databases()).find(d => d.name?.startsWith('treino12:'))!.name!;
  await new Promise<void>((resolve, reject) => {
   const req = indexedDB.open(name);
   req.onerror = () => reject(req.error);
   req.onsuccess = () => {
    const db = req.result; const tx = db.transaction(['state'], 'readwrite'); const store = tx.objectStore('state');
    const get = store.get('active');
    get.onsuccess = () => { const s = get.result; s.settings.profile = { name: 'Teste', goal: 'SINTETICO' }; s.history.days = null; store.put(s, 'active'); };
    tx.oncomplete = () => { db.close(); resolve(); }; tx.onerror = () => reject(tx.error);
   };
  });
 });
 await page.goto('#perfil'); await page.reload();
 await expect(page.getByRole('heading', { name: 'O Fitnez encontrou um problema ao abrir seus dados' })).toBeVisible();
}

test('erro de renderização mostra a tela de recuperação, com foco no título', async ({ page }) => {
 const errors: string[] = []; page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
 await corromper(page);
 await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
 await expect(page.getByText('Seus dados continuam guardados neste aparelho.')).toBeVisible();
 for (const n of ['Tentar de novo', 'Baixar backup dos meus dados', 'Apagar tudo e recomeçar']) await expect(page.getByRole('button', { name: n })).toBeVisible();
 expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
 expect(errors.some(e => e.includes('SINTETICO'))).toBe(false);
});

test('baixar backup gera JSON válido com os dados guardados', async ({ page }) => {
 await corromper(page);
 const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Baixar backup dos meus dados' }).click()]);
 expect(download.suggestedFilename()).toMatch(/^treino12-backup-recuperacao-\d{4}-\d{2}-\d{2}\.json$/);
 const parsed = JSON.parse(readFileSync(await download.path(), 'utf8'));
 expect(parsed.app).toBe('treino12');
 expect(parsed.state.settings.profile.goal).toBe('SINTETICO');
 expect(parsed.state.history).toBeTruthy();
 await expect(page.getByRole('status')).toContainText('Backup baixado');
});

test('apagar tudo e recomeçar leva a um app em primeira abertura', async ({ page }) => {
 await corromper(page);
 await page.getByRole('button', { name: 'Apagar tudo e recomeçar' }).click();
 await expect(page.getByText('não tem volta')).toBeVisible();
 await Promise.all([page.waitForEvent('load'), page.getByRole('button', { name: 'Sim, apagar tudo' }).click()]);
 await page.goto('#perfil');
 await expect(page.getByText('Seu nome', { exact: true }).first()).toBeVisible();
 await expect(page.getByRole('heading', { name: 'O Fitnez encontrou um problema' })).toHaveCount(0);
});

test('aviso sobre o backup aparece no Perfil', async ({ page }) => {
 await page.goto('#perfil');
 await page.locator('#backup-cabeca').click();
 await expect(page.getByText('O backup é um arquivo de texto com todos os seus dados de saúde. Guarde em lugar seguro.')).toBeVisible();
});

test('capturas da tela de recuperação', async ({ page }) => {
 await page.setViewportSize({ width: 390, height: 844 });
 for (const scheme of ['light', 'dark'] as const) {
  await page.emulateMedia({ colorScheme: scheme });
  await corromper(page);
  await page.screenshot({ path: `capturas/recuperacao-${scheme}.png` });
  await page.getByRole('button', { name: 'Apagar tudo e recomeçar' }).click();
  await page.screenshot({ path: `capturas/recuperacao-${scheme}-confirmar.png` });
  await Promise.all([page.waitForEvent('load'), page.getByRole('button', { name: 'Sim, apagar tudo' }).click()]);
  await page.goto('#perfil'); await expect(page.getByText('Salvo neste aparelho', { exact: true })).toBeVisible();
 }
});
