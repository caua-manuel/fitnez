import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';

// Resumo da semana e cartão (ADR 011, 2.5). Dados inteiramente sintéticos.
const json = (f: string) => JSON.parse(readFileSync(new URL(`../../data/${f}`, import.meta.url), 'utf8'));
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const addDays = (day: string, n: number) => { const [y, m, d] = day.split('-').map(Number); return iso(new Date(y, m - 1, d + n)); };
const today = () => iso(new Date());
const monday = (day: string) => { const [y, m, d] = day.split('-').map(Number); return addDays(day, -((new Date(y, m - 1, d).getDay() + 6) % 7)); };

/** Plano iniciado há 2 semanas, supino subindo (40, 44, 48 kg) e medidas em todas as semanas. */
function backup() {
 const plan = json('plan.json');
 const start = addDays(monday(today()), -14);
 const days: Record<string, unknown> = {};
 const measurements: Record<string, unknown> = {};
 [40, 44, 48].forEach((kg, w) => {
  measurements[addDays(start, w * 7)] = { p: String(80 - w).replace('.', ','), c: String(90 - w) };
  for (const off of [1, 2, 4]) {
   const day = addDays(start, w * 7 + off);
   if (day >= today()) continue;
   days[day] = { workout: { sessionId: 'UA', startedAt: 1, finishedAt: 2, status: 'done', sets: 2, volume: 100 }, acts: { gym: true }, log: { supino: [{ kg: String(kg), reps: '8', done: true }, { kg: String(kg), reps: '8', done: true }] } };
  }
 });
 const state = {
  v: 3, revision: 0,
  catalog: { plan: plan.plan, diet: json('diet.json'), recipes: json('recipes.json'), revision: 0 },
  settings: { start, sched: plan.sched, theme: 'auto' },
  history: { days, measurements }, snapshots: {}, recovery: {},
  meta: { initializedAt: 1, updatedAt: 1, migrationCompleted: true, migrationStatus: 'none', migrationWarnings: [], lastBackupGeneratedAt: null, lastBackupConfirmedAt: null },
 };
 return { v: 3, app: 'treino12', exportedAt: Date.now(), state };
}
async function seed(page: Page) {
 await page.goto('#perfil'); await page.waitForLoadState('networkidle');
 await expect(page.getByText('Salvo neste aparelho', { exact: true })).toBeVisible();
 await page.getByRole('button', { name: /Backup e restauração/ }).click();
 await page.locator('#backup-file').setInputFiles({ name: 'fixture-SINTETICO.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(backup())) });
 await page.getByRole('button', { name: 'Confirmar importação', exact: true }).click();
 await expect(page.getByText('Backup importado.', { exact: false })).toBeVisible();
 await page.goto('#evolucao');
 await expect(page.getByRole('heading', { name: 'Evolução', level: 1 })).toBeVisible();
}

test.use({ viewport: { width: 390, height: 844 }, acceptDownloads: true });

test('gera o cartão da semana e, sem Web Share, cai no download de um PNG 1080 × 1350', async ({ page }) => {
 const errors: string[] = [];
 page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
 // Sem Web Share: remove share e canShare antes do app carregar.
 await page.addInitScript(() => {
  for (const k of ['share', 'canShare']) { try { Object.defineProperty(Navigator.prototype, k, { value: undefined, configurable: true }); } catch { /* ignora */ } }
 });
 await seed(page);

 const entry = page.getByRole('button', { name: /Resumo da semana/ });
 await entry.click();
 const sheet = page.getByRole('dialog', { name: 'Resumo da semana' });
 await expect(sheet).toBeVisible();
 await expect(sheet.getByRole('heading', { name: /Semana 3 de 12/ })).toBeVisible();
 await expect(sheet.getByRole('button', { name: 'Esta semana' })).toHaveAttribute('aria-pressed', 'true');
 // Privacidade por padrão: sem peso nem cintura no texto até marcar a opção.
 await expect(sheet.locator('.rs-text')).not.toContainText(/Peso|Cintura/);
 await expect(sheet.locator('canvas.rs-card.is-ready')).toBeVisible();

 const button = sheet.getByRole('button', { name: 'Baixar imagem' });
 const [download] = await Promise.all([page.waitForEvent('download'), button.click()]);
 expect(download.suggestedFilename()).toBe('fitnez-semana-3.png');
 const png = readFileSync(await download.path());
 expect(png.subarray(1, 4).toString('ascii')).toBe('PNG');
 expect(png.readUInt32BE(16)).toBe(1080);
 expect(png.readUInt32BE(20)).toBe(1350);
 await expect(sheet.getByRole('status')).toHaveText('Imagem salva: fitnez-semana-3.png');

 // Semana passada: outro arquivo; a opção de peso e cintura mostra a variação.
 await sheet.getByRole('button', { name: 'Semana passada' }).click();
 await expect(sheet.getByRole('heading', { name: /Semana 2 de 12/ })).toBeVisible();
 await sheet.getByRole('checkbox', { name: /peso e cintura/ }).check();
 await expect(sheet.locator('.rs-stats')).toContainText('Peso');
 await expect(sheet.locator('.rs-stats')).toContainText('−1 kg');
 await expect(sheet.locator('canvas.rs-card.is-ready')).toBeVisible();
 const [second] = await Promise.all([page.waitForEvent('download'), sheet.getByRole('button', { name: 'Baixar imagem' }).click()]);
 expect(second.suggestedFilename()).toBe('fitnez-semana-2.png');

 // Fecha com Escape, o foco volta à entrada e a opção não fica lembrada.
 await page.keyboard.press('Escape');
 await expect(sheet).toBeHidden();
 await expect(entry).toBeFocused();
 await entry.click();
 await expect(page.getByRole('checkbox', { name: /peso e cintura/ })).not.toBeChecked();
 expect(errors).toEqual([]);
});
