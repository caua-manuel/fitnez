import { test, expect, type Page } from '@playwright/test';

const synthetic = { v: 2, start: '2026-11-16', log: { '2026-11-17': { orfao: [{ kg: '22,5', reps: '08', done: true }] } }, meas: {}, custom: { qa: 'SINTÉTICO' } };
async function open(page: Page, hash = 'perfil') {
  await page.goto(`#${hash}`); await page.waitForLoadState('networkidle');
  await expect(page.getByText('Salvo neste aparelho', { exact: true })).toBeVisible();
}

test('aviso de importação some ao navegar e não vaza para outras telas', async ({ page }) => {
  await open(page);
  for (const name of [/^Backup e restauração/]) { const head = page.getByRole('button', { name }); if (await head.getAttribute('aria-expanded') !== 'true') await head.click(); }
  await page.locator('#backup-file').setInputFiles({ name: 'fixture-SINTETICO.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(synthetic)) });
  await page.getByRole('button', { name: 'Confirmar importação', exact: true }).click();
  const notice = page.getByText('Backup importado.', { exact: false });
  await expect(notice).toBeVisible();
  await expect(page.getByRole('button', { name: 'Dispensar aviso' })).toBeVisible();
  await page.getByRole('navigation', { name: 'Navegação principal' }).getByRole('link', { name: 'Treino', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Treino', level: 1 })).toBeFocused();
  await expect(notice).toHaveCount(0);
});

test('aviso de importação pode ser dispensado', async ({ page }) => {
  await open(page);
  const head = page.getByRole('button', { name: /^Backup e restauração/ }); if (await head.getAttribute('aria-expanded') !== 'true') await head.click();
  await page.locator('#backup-file').setInputFiles({ name: 'fixture-SINTETICO.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(synthetic)) });
  await page.getByRole('button', { name: 'Confirmar importação', exact: true }).click();
  await expect(page.getByText('Backup importado.', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: 'Dispensar aviso' }).click();
  await expect(page.getByText('Backup importado.', { exact: false })).toHaveCount(0);
});

test('sino abre a folha Avisos (diálogo modal, fundo inerte, Escape devolve o foco)', async ({ page }) => {
  await open(page, 'inicio');
  const bell = page.getByRole('button', { name: /^Avisos/ });
  await expect(bell).toBeVisible();
  await expect(page.locator('.bell-dot')).toHaveCount(0);
  await bell.focus(); await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog', { name: 'Avisos' });
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAttribute('aria-modal', 'true');
  await expect(dialog.getByText('Nenhum aviso no momento.')).toBeVisible();
  await expect(page.locator('#root')).toHaveAttribute('inert', '');
  expect(await page.evaluate(() => document.documentElement.style.overflow)).toBe('hidden');
  // foco preso: Tab repetido nunca sai do diálogo
  for (let i = 0; i < 4; i++) { await page.keyboard.press('Tab'); expect(await page.evaluate(() => !!document.activeElement?.closest('[role=dialog]'))).toBe(true); }
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(page.locator('#root')).not.toHaveAttribute('inert', '');
  expect(await page.evaluate(() => document.documentElement.style.overflow)).toBe('');
  await expect(bell).toBeFocused();
});

test('com dados do usuário e backup pendente, o sino mostra ponto e o aviso real', async ({ page }) => {
  await open(page);
  const head = page.getByRole('button', { name: /^Backup e restauração/ }); if (await head.getAttribute('aria-expanded') !== 'true') await head.click();
  await page.locator('#backup-file').setInputFiles({ name: 'fixture-SINTETICO.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(synthetic)) });
  await page.getByRole('button', { name: 'Confirmar importação', exact: true }).click();
  await expect(page.getByText('Backup importado.', { exact: false })).toBeVisible();
  await expect(page.locator('.bell-dot')).toHaveCount(1);
  await page.getByRole('button', { name: /^Avisos/ }).click();
  const dialog = page.getByRole('dialog', { name: 'Avisos' });
  await expect(dialog.getByText('Seu backup semanal está pendente.')).toBeVisible();
  await dialog.getByRole('link', { name: 'Fazer backup' }).click();
  await expect(dialog).toHaveCount(0);
});
