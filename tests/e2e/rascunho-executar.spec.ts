import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';

// Dados inteiramente sintéticos; não representam backup real do usuário.
const json = (f: string) => JSON.parse(readFileSync(new URL(`../../data/${f}`, import.meta.url), 'utf8'));
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const addDays = (day: string, n: number) => { const [y, m, d] = day.split('-').map(Number); return iso(new Date(y, m - 1, d + n)); };
const today = () => iso(new Date());
const monday = (day: string) => { const [y, m, d] = day.split('-').map(Number); return addDays(day, -((new Date(y, m - 1, d).getDay() + 6) % 7)); };

function backup(days: Record<string, any> = {}) {
 const plan = json('plan.json');
 const state = {
  v: 3, revision: 0,
  catalog: { plan: plan.plan, diet: json('diet.json'), recipes: json('recipes.json'), revision: 0 },
  settings: { start: monday(today()), sched: plan.sched, theme: 'auto' },
  history: { days, measurements: {} }, snapshots: {}, recovery: {},
  meta: { initializedAt: 1, updatedAt: 1, migrationCompleted: true, migrationStatus: 'none', migrationWarnings: [], lastBackupGeneratedAt: null, lastBackupConfirmedAt: null },
 };
 return { v: 3, app: 'treino12', exportedAt: Date.now(), state };
}
async function seed(page: Page, days: Record<string, any> = {}) {
 await page.goto('#perfil'); await page.waitForLoadState('networkidle');
 await expect(page.getByText('Salvo neste aparelho', { exact: true })).toBeVisible();
 await page.locator('#backup-cabeca').click(); // seção de backup do Perfil começa recolhida
 await page.locator('#backup-file').setInputFiles({ name: 'fixture-SINTETICO.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(backup(days))) });
 await page.getByRole('button', { name: 'Confirmar importação', exact: true }).click();
 await expect(page.getByText('Backup importado.', { exact: false })).toBeVisible();
 await page.goto('#treino/UA');
 await expect(page.getByRole('heading', { name: 'Upper A', level: 2 })).toBeVisible();
}
const noHScroll = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
const dayRecord = (page: Page) => page.evaluate(async (day) => {
 const name = (await indexedDB.databases()).find(d => d.name?.startsWith('treino12'))!.name!;
 const db: IDBDatabase = await new Promise((res, rej) => { const r = indexedDB.open(name); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
 const state: any = await new Promise((res, rej) => { const r = db.transaction('state').objectStore('state').get('active'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
 db.close();
 return state?.history?.days?.[day] ?? null;
}, today());

test.use({ viewport: { width: 360, height: 800 } });
test.beforeEach(async ({ page, context }) => {
 const errors: string[] = []; (page as any).__errors = errors;
 const monitor = (p: Page) => { p.on('pageerror', e => errors.push(e.message)); p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); }); };
 monitor(page); context.on('page', monitor);
 await page.clock.install({ time: new Date() });
});
test.afterEach(async ({ page }) => { expect((page as any).__errors, 'Sem exceções nem erros de console').toEqual([]); });

const kg = (page: Page, n: number) => page.getByLabel(`Carga (kg), série ${n}`);

test.use({ viewport: { width: 390, height: 844 } });
for (const scheme of ['light', 'dark'] as const) {
 test(`rascunho: carga digitada sobrevive ao recarregar e não vira série (${scheme})`, async ({ page }) => {
  await page.emulateMedia({ colorScheme: scheme });
  await seed(page);
  await page.goto(`#treino/UA/executar?dia=${today()}`);
  await kg(page, 1).fill('37,5');
  // Espera o rascunho chegar ao localStorage em vez de um tempo fixo.
  await expect.poll(() => page.evaluate(() => Object.keys(localStorage).filter(k => k.includes(':rascunho:')).map(k => localStorage.getItem(k)).join())).toContain('37,5');
  await page.reload();
  await expect(kg(page, 1)).toHaveValue('37,5');
  await expect(page.getByRole('button', { name: 'Série 1 concluída' })).toHaveAttribute('aria-pressed', 'false');
  expect(await dayRecord(page)).toBeNull();
  expect(await noHScroll(page)).toBe(true);
  // Rascunho é só da tela: não entra no estado do app.
  expect(JSON.stringify(await page.evaluate(() => sessionStorage))).not.toContain('37,5');
  await page.screenshot({ path: `test-results/rascunho-${scheme}.png` });
 });
}
