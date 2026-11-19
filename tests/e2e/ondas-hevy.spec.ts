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

const prev = (n = 3, kg = '30', reps = '8') => Array.from({ length: n }, () => ({ kg, reps, done: true }));
const lastWeek = () => addDays(today(), -7);
const histUA = () => ({ [lastWeek()]: { over: 'UA', workout: { sessionId: 'UA', startedAt: 1, finishedAt: 2, status: 'done', sets: 3, volume: 720 }, log: { supino: prev() } } });
async function open(page: Page, days: Record<string, any>) {
 await seed(page, days);
 await page.clock.pauseAt(new Date(Date.now() + 60_000));
 await page.getByRole('link', { name: /Começar treino|Continuar treino/ }).click();
 await expect(page.getByRole('heading', { name: 'Supino com halteres', level: 2 })).toBeVisible();
}
const done = (page: Page, n: number) => page.getByRole('button', { name: `Série ${n} concluída` });

test('Ondas: placeholder com "Antes", ✓ sem digitar e Desfazer; aquecimento A fora do volume', async ({ page }) => {
 await open(page, histUA());
 await expect(page.getByLabel('Antes: 30 kg, 8 repetições').first()).toBeVisible();
 const kg1 = page.getByLabel('Carga (kg), série 1');
 await expect(kg1).toHaveValue('');
 expect(await kg1.getAttribute('placeholder')).toMatch(/^\d/);
 await expect(page.getByRole('button', { name: 'Aquecimento 1 concluída' })).toBeVisible();
 await expect(page.getByText('Aquecimento sugerido: séries leves para preparar o movimento. Não contam no volume.')).toBeVisible();
 await done(page, 1).click();
 await expect(done(page, 1)).toHaveAttribute('aria-pressed', 'true');
 await expect(page.locator('.ui-toast')).toContainText(/Registrado [\d,]+ kg × \d+/);
 await page.locator('.ui-toast').getByRole('button', { name: 'Desfazer' }).click();
 await expect(done(page, 1)).toHaveAttribute('aria-pressed', 'false');
 await expect.poll(async () => (await dayRecord(page))?.log?.supino?.filter((s: any) => s.done).length ?? 0).toBe(0);
 // Aquecimento: grava com kind 'warm' e não conta como série.
 await page.getByRole('button', { name: 'Aquecimento 1 concluída' }).click();
 await expect.poll(async () => (await dayRecord(page))?.log?.supino?.[0]?.kind).toBe('warm');
 await expect(page.getByRole('button', { name: 'Concluir treino' })).toBeDisabled();
 expect(await noHScroll(page)).toBe(true);
});

test('Ondas: recorde na hora e Concluído com recordes e comparação de volume', async ({ page }) => {
 await open(page, histUA());
 await page.getByLabel('Carga (kg), série 1').fill('40');
 await page.getByLabel('Repetições, série 1').fill('6');
 await done(page, 1).click();
 await expect(page.locator('.ex-pr')).toHaveText('Recorde de carga: 40 kg × 6');
 await page.getByRole('button', { name: 'Concluir treino' }).click();
 await page.getByRole('button', { name: 'Concluir', exact: true }).click();
 await expect(page.getByRole('heading', { name: 'Treino concluído!' })).toBeVisible();
 await expect(page.getByText('Recordes de hoje:')).toBeVisible();
 await expect(page.locator('.ok-pr')).toContainText('Supino com halteres 40 kg');
 await expect(page.getByText(/% em relação à última vez/)).toBeVisible();
});

test('Ondas: página do exercício com instruções, recordes, histórico e nota fixa', async ({ page }) => {
 await open(page, histUA());
 await page.getByRole('button', { name: 'Supino com halteres', exact: true }).click();
 const dlg = page.getByRole('dialog', { name: 'Supino com halteres' });
 await expect(dlg.getByRole('heading', { name: 'Como fazer' })).toBeVisible();
 await expect(dlg.getByRole('heading', { name: 'Melhores marcas' })).toBeVisible();
 await expect(dlg.getByText('30 kg × 8')).toBeVisible();
 await expect(dlg.getByRole('heading', { name: 'Histórico' })).toBeVisible();
 await dlg.getByRole('button', { name: 'Adicionar nota' }).click();
 await dlg.getByLabel('Nota fixa').fill('Banco na posição 4');
 await dlg.getByRole('button', { name: 'Salvar nota' }).click();
 await expect(dlg.getByText('Banco na posição 4')).toBeVisible();
 await dlg.getByRole('button', { name: 'Fechar' }).click();
 await expect(page.locator('.ex-name').getByText('Banco na posição 4')).toBeVisible();
});

test('Ondas: calculadora de anilhas só em exercício com barra', async ({ page }) => {
 await open(page, {});
 await page.getByRole('button', { name: 'Mais opções de Supino com halteres' }).click();
 await expect(page.getByRole('menuitem', { name: 'Calcular anilhas' })).toHaveCount(0);
 await page.keyboard.press('Escape');
 await page.getByRole('button', { name: 'Próximo exercício' }).click();
 await page.getByRole('button', { name: /^Mais opções de Remada/ }).click();
 await page.getByRole('menuitem', { name: 'Calcular anilhas' }).click();
 const dlg = page.getByRole('dialog', { name: 'Anilhas' });
 await dlg.getByLabel('Carga total (kg)').fill('62,5');
 await expect(dlg.getByRole('status')).toHaveText('Cada lado: 20 + 1,25 (barra 20 kg)');
 await dlg.getByRole('button', { name: '20 kg', exact: true }).last().click(); // desmarca a anilha de 20
 await expect(dlg.getByRole('status')).toContainText('Cada lado: 15 + 5 + 1,25');
 await dlg.getByLabel('Carga total (kg)').fill('15');
 await expect(dlg.getByRole('status')).toHaveText('Carga menor que a barra');
});

test('Ondas: trocar exercício só hoje', async ({ page }) => {
 await open(page, {});
 await page.getByRole('button', { name: 'Mais opções de Supino com halteres' }).click();
 await page.getByRole('menuitem', { name: 'Trocar exercício só hoje' }).click();
 const dlg = page.getByRole('dialog', { name: /Trocar Supino com halteres só hoje/ });
 const first = dlg.locator('.sw-list button').first();
 const name = (await first.textContent())!;
 await first.click();
 await expect(page.getByRole('heading', { name, level: 2 })).toBeVisible();
 await expect(page.getByText(/no lugar de Supino com halteres/)).toBeVisible();
 await expect.poll(async () => (await dayRecord(page))?.swaps?.supino).toBeTruthy();
});

test('Ondas: séries por grupo na semana na Evolução', async ({ page }) => {
 await seed(page, { [today()]: { over: 'UA', workout: { sessionId: 'UA', startedAt: 1, finishedAt: 2, status: 'done', sets: 3, volume: 720 }, log: { supino: prev() } } });
 await page.goto('#evolucao');
 const card = page.locator('section', { has: page.getByRole('heading', { name: /Séries por grupo na semana 1/ }) });
 await expect(card).toBeVisible();
 await expect(card.getByText('Peito')).toBeVisible();
 await expect(card.getByText('Faixa de referência para sua experiência.', { exact: false })).toBeVisible();
});
