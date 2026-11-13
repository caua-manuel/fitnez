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
const reps = (page: Page, n: number) => page.getByLabel(`Repetições, série ${n}`);
const done = (page: Page, n: number) => page.getByRole('button', { name: `Concluir série ${n}` });

async function start(page: Page, days: Record<string, any> = {}) {
 await seed(page, days);
 await page.clock.pauseAt(new Date(Date.now() + 60_000));
 await page.getByRole('link', { name: /Começar treino|Continuar treino/ }).click();
 await expect(page).toHaveURL(/#treino\/UA\/executar\?dia=/);
 await expect(page.getByRole('heading', { name: 'Supino com halteres', level: 2 })).toBeVisible();
}

test('Executar: série 1 inicia o descanso de 150 s e +15, −15 e Pular funcionam', async ({ page }) => {
 await start(page);
 await expect(page.getByText('Exercício 1 de 10')).toBeVisible();
 await expect(page.getByText('Sem registro anterior')).toBeVisible();
 await expect(kg(page, 1)).toHaveAttribute('inputmode', 'decimal');
 await expect(reps(page, 1)).toHaveAttribute('inputmode', 'decimal');
 await kg(page, 1).fill('30'); await reps(page, 1).fill('8');
 await done(page, 1).click();
 const timer = page.getByRole('timer');
 await expect(timer).toHaveText(/2:30/);
 await page.getByRole('button', { name: '+15 s' }).click();
 await expect(timer).toHaveText(/2:45/);
 await page.getByRole('button', { name: '−15 s' }).click();
 await page.getByRole('button', { name: '−15 s' }).click();
 await expect(timer).toHaveText(/2:15/);
 await page.clock.runFor(5_000);
 await expect(timer).toHaveText(/2:10/);
 await page.getByRole('button', { name: 'Pular' }).click();
 await expect(page.getByRole('timer')).toHaveCount(0);
 expect(await noHScroll(page)).toBe(true);
});

test('Executar: série 2 com campos vazios herda os valores da anterior em um toque', async ({ page }) => {
 await start(page);
 await kg(page, 1).fill('30'); await reps(page, 1).fill('8');
 await done(page, 1).click();
 await page.getByRole('button', { name: 'Pular' }).click();
 await expect(kg(page, 2)).toHaveValue('');
 await done(page, 2).click();
 await expect(kg(page, 2)).toHaveValue('30');
 await expect(reps(page, 2)).toHaveValue('8');
 await expect(page.getByRole('button', { name: 'Reabrir série 2' })).toBeVisible();
});

test('Executar: sair no meio e voltar mostra Continuar treino com tudo preservado', async ({ page }) => {
 await start(page, { [today()]: { over: 'UA' } }); // força Upper A hoje, para o Início oferecer o treino
 await kg(page, 1).fill('30'); await reps(page, 1).fill('8');
 await done(page, 1).click();
 await expect(page.getByRole('timer')).toBeVisible();
 await page.getByRole('link', { name: /Voltar/ }).first().click();
 await expect(page).toHaveURL(/#treino\/UA$/);
 await expect.poll(async () => (await dayRecord(page))?.workout?.status).toBe('partial');
 await page.goto('#inicio');
 await page.getByRole('link', { name: 'Continuar treino' }).click();
 await expect(kg(page, 1)).toHaveValue('30');
 await expect(reps(page, 1)).toHaveValue('8');
 await expect(page.getByRole('button', { name: 'Reabrir série 1' })).toBeVisible();
 const rec = await dayRecord(page);
 expect(rec.log.supino[0]).toMatchObject({ kg: '30', reps: '8', done: true });
});

test('Executar: recarregar durante o descanso retoma o tempo restante', async ({ page }) => {
 await start(page);
 await kg(page, 1).fill('30'); await reps(page, 1).fill('8');
 await done(page, 1).click();
 await expect(page.getByRole('timer')).toHaveText(/2:30/);
 await page.clock.runFor(30_000);
 await expect(page.getByRole('timer')).toHaveText(/2:00/);
 await expect.poll(async () => (await dayRecord(page))?.workout?.status).toBe('partial');
 await page.clock.runFor(20_000);
 await page.reload();
 await expect(page.getByRole('heading', { name: 'Supino com halteres', level: 2 })).toBeVisible();
 const text = (await page.getByRole('timer').textContent()) ?? '';
 const [m, s] = text.match(/(\d+):(\d{2})/)!.slice(1).map(Number);
 expect(m * 60 + s).toBeLessThanOrEqual(100);
 expect(m * 60 + s).toBeGreaterThan(60);
});

test('Executar: Adicionar série cria uma série extra', async ({ page }) => {
 await start(page);
 await expect(page.getByRole('button', { name: /Concluir série \d/ })).toHaveCount(4);
 await page.getByRole('button', { name: 'Adicionar série' }).click();
 await expect(page.getByRole('button', { name: /Concluir série \d/ })).toHaveCount(5);
 await expect(kg(page, 5)).toBeVisible();
});

test('Executar: Concluir treino grava os campos e mostra o resumo real', async ({ page }) => {
 await start(page);
 await kg(page, 1).fill('30'); await reps(page, 1).fill('8');
 await done(page, 1).click();
 await done(page, 2).click();
 await page.getByRole('button', { name: 'Pular' }).click();
 await page.getByRole('button', { name: 'Próximo exercício' }).click();
 await expect(page.getByText('Exercício 2 de 10')).toBeVisible();
 await kg(page, 1).fill('20'); await reps(page, 1).fill('10,5');
 await done(page, 1).click();
 await page.getByRole('button', { name: 'Concluir treino' }).click();
 await page.getByRole('dialog', { name: 'Concluir o treino?' }).getByRole('button', { name: 'Concluir', exact: true }).click();
 await expect(page).toHaveURL(/#treino\/UA\/concluido\?dia=/);
 await expect(page.getByRole('heading', { name: 'Treino concluído!' })).toBeVisible();
 const stats = page.getByRole('list', { name: 'Resumo do treino' });
 await expect(stats).toContainText(/2\s*Exercícios/);
 await expect(stats).toContainText(/3\s*Séries/);
 await expect(stats).toContainText('Duração');
 await expect(page.getByText('Volume')).toBeVisible();
 await expect(page.getByText(/(?:^|\D)690\s*kg/)).toBeVisible();
 const rec = await dayRecord(page);
 expect(rec.workout).toMatchObject({ sessionId: 'UA', status: 'done', sets: 3, volume: 690 });
 expect(typeof rec.workout.finishedAt).toBe('number');
 expect(rec.acts.gym).toBe(true);
 expect(rec.log.supino[1]).toMatchObject({ kg: '30', reps: '8', done: true });
 expect(await noHScroll(page)).toBe(true);
 await expect(page.getByRole('link', { name: 'Voltar ao início' })).toBeVisible();
 await expect(page.getByRole('link', { name: 'Ver resultado' })).toBeVisible();
});

test('Executar: retomar abre no primeiro exercício incompleto', async ({ page }) => {
 const rows = [1, 2, 3, 4].map(() => ({ kg: '30', reps: '8', done: true }));
 await seed(page, { [today()]: { over: 'UA', workout: { sessionId: 'UA', startedAt: 1, status: 'partial', sets: 4, volume: 960 }, log: { supino: rows } } });
 await page.clock.pauseAt(new Date(Date.now() + 60_000));
 await page.getByRole('link', { name: 'Continuar treino' }).click();
 await expect(page.getByText('Exercício 2 de 10')).toBeVisible();
 await expect(page.getByRole('heading', { name: 'Remada curvada ou apoiada no banco', level: 2 })).toBeVisible();
});

test('Executar: série concluída com campos vazios mostra o que foi copiado', async ({ page }) => {
 await start(page);
 await kg(page, 1).fill('70'); await reps(page, 1).fill('8');
 await done(page, 1).click();
 await page.getByRole('button', { name: 'Pular' }).click();
 await done(page, 2).click();
 await expect(page.getByText('Usei 70 kg × 8 da série anterior.')).toBeVisible();
 await expect(kg(page, 2)).toHaveAttribute('data-suggested', 'true');
});

test('Executar: Concluir treino com exercícios intocados pede confirmação', async ({ page }) => {
 await start(page);
 await kg(page, 1).fill('30'); await reps(page, 1).fill('8');
 await done(page, 1).click();
 await page.getByRole('button', { name: 'Concluir treino' }).click();
 const dialog = page.getByRole('dialog', { name: 'Concluir o treino?' });
 await expect(dialog).toContainText('Você registrou 1 de 10 exercícios. Concluir mesmo assim?');
 await dialog.getByRole('button', { name: 'Continuar treinando' }).click();
 await expect(dialog).toHaveCount(0);
 await expect(page).toHaveURL(/executar/);
 await page.getByRole('button', { name: 'Concluir treino' }).click();
 await page.getByRole('dialog').getByRole('button', { name: 'Concluir', exact: true }).click();
 await expect(page).toHaveURL(/#treino\/UA\/concluido\?dia=/);
});
