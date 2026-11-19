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
}
const noHScroll = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
const stored = (page: Page) => page.evaluate(async () => {
 const name = (await indexedDB.databases()).find(d => d.name?.startsWith('treino12'))!.name!;
 const db: IDBDatabase = await new Promise((res, rej) => { const r = indexedDB.open(name); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
 const state: any = await new Promise((res, rej) => { const r = db.transaction('state').objectStore('state').get('active'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
 db.close();
 return state;
});

test.use({ viewport: { width: 360, height: 800 } });
test.beforeEach(async ({ page, context }) => {
 const errors: string[] = []; (page as any).__errors = errors;
 const monitor = (p: Page) => { p.on('pageerror', e => errors.push(e.message)); p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); }); };
 monitor(page); context.on('page', monitor);
});
test.afterEach(async ({ page }) => { expect((page as any).__errors, 'Sem exceções nem erros de console').toEqual([]); });

async function criarTreino(page: Page, nome: string, descanso = '90') {
 await page.goto('#treino/_/novo');
 await page.getByLabel('Nome do treino').fill(nome);
 await page.getByLabel('Nome do exercício').fill('Remada de teste');
 await page.getByLabel('Descanso entre séries (segundos)').fill(descanso);
 await page.getByRole('button', { name: 'Criar treino' }).click();
 await expect(page.getByRole('heading', { name: nome, level: 2 })).toBeVisible();
}

test('Editor: criar treino com exercício de 90 s e a execução usa o timer de 90 s', async ({ page }) => {
 await seed(page);
 await criarTreino(page, 'Treino de teste');
 await page.getByRole('link', { name: 'Começar treino' }).click();
 await expect(page.getByRole('heading', { name: 'Remada de teste', level: 2 })).toBeVisible();
 await page.getByLabel('Carga (kg), série 1').fill('20'); await page.getByLabel('Repetições, série 1').fill('10');
 await page.getByRole('button', { name: 'Série 1 concluída' }).click();
 await expect(page.getByRole('timer')).toHaveText(/1:30/);
});

test('Editor: editar o descanso de um exercício existente e a execução usa o novo valor', async ({ page }) => {
 await seed(page);
 await page.goto('#treino/UA/exercicio/supino');
 await expect(page.getByLabel('Descanso entre séries (segundos)')).toHaveValue('150');
 await page.getByRole('button', { name: 'Diminuir descanso' }).click();
 await expect(page.getByLabel('Descanso entre séries (segundos)')).toHaveValue('135');
 await page.getByLabel('Descanso entre séries (segundos)').fill('45');
 await page.getByRole('button', { name: 'Salvar', exact: true }).click();
 await expect(page).toHaveURL(/#treino\/UA\/editar$/);
 await expect(page.getByRole('status').filter({ hasText: 'Exercício salvo' })).toBeVisible();
 await page.goto('#treino/UA/executar?dia=' + today());
 await page.getByLabel('Carga (kg), série 1').fill('30'); await page.getByLabel('Repetições, série 1').fill('8');
 await page.getByRole('button', { name: 'Série 1 concluída' }).click();
 await expect(page.getByRole('timer')).toHaveText(/0:45/);
});

test('Editor: validação mostra erro em português e preserva a entrada', async ({ page }) => {
 await seed(page);
 await page.goto('#treino/UA/exercicio/supino');
 await page.getByLabel('Nome do exercício').fill('');
 await page.getByLabel('Descanso entre séries (segundos)').fill('1,5');
 await page.getByRole('button', { name: 'Salvar', exact: true }).click();
 await expect(page.getByText('Informe o nome do exercício.')).toBeVisible();
 await expect(page.getByText(/Use só números inteiros/)).toBeVisible();
 await expect(page.getByLabel('Descanso entre séries (segundos)')).toHaveValue('1,5');
 await expect(page.getByLabel('Nome do exercício')).toHaveAttribute('aria-invalid', 'true');
});

test('Editor: excluir treino com confirmação e Desfazer devolve o treino', async ({ page }) => {
 await seed(page);
 await criarTreino(page, 'Treino de teste');
 await page.getByRole('link', { name: 'Editar treino' }).click();
 await page.getByRole('button', { name: 'Excluir treino' }).click();
 const dialog = page.getByRole('dialog', { name: 'Excluir Treino de teste?' });
 await expect(dialog).toContainText('histórico dos treinos já feitos continua salvo');
 await expect(dialog.getByRole('button', { name: 'Cancelar' })).toBeFocused();
 await dialog.getByRole('button', { name: 'Excluir treino' }).click();
 await expect(page).toHaveURL(/#treino$/);
 await page.getByRole('button', { name: 'Biblioteca' }).click();
 await expect(page.getByRole('heading', { name: 'Treino de teste' })).toHaveCount(0);
 await expect(page.getByRole('status').filter({ hasText: 'Treino excluído' })).toBeVisible();
 await page.getByRole('button', { name: 'Desfazer' }).click();
 await expect(page.getByRole('heading', { name: 'Treino de teste' })).toBeVisible();
 expect(Object.values((await stored(page)).catalog.plan.sess).map((s: any) => s.name)).toContain('Treino de teste');
});

test('Editor: excluir Upper A mantém o histórico e exercício sem definição aparece como removido', async ({ page }) => {
 const past = addDays(today(), -3);
 const rows = [1, 2].map(() => ({ kg: '30', reps: '8', done: true }));
 const days = { [past]: { log: { supino: rows, orfao: rows }, workout: { sessionId: 'UB', startedAt: 1, finishedAt: 2, status: 'done', sets: 4, volume: 960 } } };
 await seed(page, days);
 await page.goto('#treino/UA/editar');
 await page.getByRole('button', { name: 'Excluir treino' }).click();
 await page.getByRole('dialog').getByRole('button', { name: 'Excluir treino' }).click();
 await expect(page).toHaveURL(/#treino$/);
 const st = await stored(page);
 expect(st.catalog.plan.sess.UA).toBeUndefined();
 expect(st.catalog.plan.ex.supino).toBeTruthy();
 expect(st.history.days[past].log.supino).toHaveLength(2);
 await page.goto('#treino/UB');
 await page.getByRole('tab', { name: 'Histórico' }).click();
 await expect(page.getByText('Exercício removido').first()).toBeVisible();
});

test('Editor: remover exercício da sessão com Desfazer e reordenar por botões', async ({ page }) => {
 await seed(page);
 await page.goto('#treino/UA/editar');
 const items = page.getByRole('list', { name: 'Exercícios do treino' }).getByRole('listitem');
 await expect(items.first()).toContainText('Supino com halteres');
 await page.getByRole('button', { name: 'Descer Supino com halteres' }).click();
 await expect(items.nth(1)).toContainText('Supino com halteres');
 await expect(page.getByRole('button', { name: 'Descer Supino com halteres' })).toBeFocused();
 await page.getByRole('button', { name: 'Subir Supino com halteres' }).click();
 await expect(items.first()).toContainText('Supino com halteres');
 await items.first().getByRole('button', { name: /Mais opções/ }).click();
 await page.getByRole('menuitem', { name: 'Remover do treino' }).click();
 const confirmar = page.getByRole('dialog', { name: /Remover Supino com halteres do treino?/ });
 await expect(confirmar).toBeVisible();
 await confirmar.getByRole('button', { name: 'Cancelar' }).click();
 await expect(items).toHaveCount(10);
 await items.first().getByRole('button', { name: /Mais opções/ }).click();
 await page.getByRole('menuitem', { name: 'Remover do treino' }).click();
 await page.getByRole('dialog').getByRole('button', { name: 'Remover do treino' }).click();
 await expect(items).toHaveCount(9);
 expect((await stored(page)).catalog.plan.ex.supino).toBeTruthy();
 await page.getByRole('button', { name: 'Desfazer' }).click();
 await expect(items).toHaveCount(10);
 await expect(items.first()).toContainText('Supino com halteres');
});

test('Editor: adicionar exercício existente do catálogo', async ({ page }) => {
 await seed(page);
 await criarTreino(page, 'Treino de teste');
 await page.getByRole('link', { name: 'Editar treino' }).click();
 await page.getByRole('button', { name: 'Adicionar exercício' }).click();
 await page.getByRole('searchbox', { name: 'Buscar exercício' }).fill('face pull');
 await page.getByRole('button', { name: /Face pull na polia/ }).click();
 await expect(page.getByRole('list', { name: 'Exercícios do treino' }).getByRole('listitem')).toHaveCount(2);
 await expect(page.getByRole('button', { name: 'Adicionar exercício' })).toBeFocused();
});

test('Editor: nome de 80 caracteres não gera rolagem horizontal', async ({ page }) => {
 await seed(page);
 const nome = 'N' + 'x'.repeat(79);
 await criarTreino(page, nome);
 expect(await noHScroll(page)).toBe(true);
 await page.getByRole('link', { name: 'Editar treino' }).click();
 expect(await noHScroll(page)).toBe(true);
 await page.goto('#treino'); await page.getByRole('button', { name: 'Biblioteca' }).click();
 expect(await noHScroll(page)).toBe(true);
 await page.goto('#treino/_/novo');
 expect(await noHScroll(page)).toBe(true);
});

test('Editor: Restaurar treinos originais com confirmação preserva o histórico', async ({ page }) => {
 const past = addDays(today(), -3);
 await seed(page, { [past]: { log: { supino: [{ kg: '30', reps: '8', done: true }] }, workout: { sessionId: 'UA', startedAt: 1, finishedAt: 2, status: 'done', sets: 1, volume: 240 } } });
 await criarTreino(page, 'Treino de teste');
 await page.goto('#treino'); await page.getByRole('button', { name: 'Biblioteca' }).click();
 await page.getByRole('button', { name: 'Restaurar treinos originais' }).click();
 const dialog = page.getByRole('dialog');
 await expect(dialog).toContainText('histórico dos treinos já feitos é preservado');
 await dialog.getByRole('button', { name: 'Restaurar treinos' }).click();
 await expect(page.getByRole('heading', { name: 'Treino de teste' })).toHaveCount(0);
 await expect(page.getByRole('heading', { name: 'Upper A' })).toBeVisible();
 const st = await stored(page);
 expect(st.history.days[past].log.supino).toHaveLength(1);
});

test('Editor: treino criado orienta como usar e oferece Começar agora', async ({ page }) => {
 await seed(page);
 await criarTreino(page, 'Treino de braço');
 await expect(page.getByText(/Treino criado\. Para usá-lo num dia da semana, toque em Trocar treino, no Início\./)).toBeVisible();
 await expect(page.getByRole('link', { name: 'Começar agora' })).toBeVisible();
});

test('Editor: salvar dados do treino confirma "Treino salvo."', async ({ page }) => {
 await seed(page);
 await page.goto('#treino/UA/editar');
 await page.getByLabel('Nome do treino').fill('Upper A renomeado');
 await page.getByRole('button', { name: 'Salvar dados do treino' }).click();
 await expect(page.getByText('✓ Treino salvo.')).toBeVisible();
 await expect(page.getByRole('status').filter({ hasText: /^Treino salvo$/ })).toBeVisible();
});
