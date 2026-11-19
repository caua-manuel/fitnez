import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';

// "Hoje" em 3 segundos, treino livre, atalhos do PWA, voltar no assistente e assistente offline. Dados sintéticos.
const json = (f: string) => JSON.parse(readFileSync(new URL(`../../data/${f}`, import.meta.url), 'utf8'));
const START = '2026-10-19'; // segunda; 2026-11-11 (quarta) = semana 4 (leve), dia de Upper A
const backupFull = (days: Record<string, any>, settings: Record<string, any> = {}) => {
 const plan = json('plan.json');
 return { v: 3, app: 'treino12', exportedAt: Date.now(), state: {
  v: 3, revision: 0,
  catalog: { plan: plan.plan, diet: json('diet.json'), recipes: json('recipes.json'), revision: 0 },
  settings: { start: START, startConfirmed: true, sched: plan.sched, theme: 'auto', ...settings },
  history: { days, measurements: {} }, snapshots: {}, recovery: {},
  meta: { initializedAt: 1, updatedAt: 1, migrationCompleted: true, migrationStatus: 'none', migrationWarnings: [], lastBackupGeneratedAt: null, lastBackupConfirmedAt: null },
 } };
};
async function state(page: Page): Promise<any> {
 return page.evaluate(async () => {
  const name = (await indexedDB.databases()).find(d => d.name?.startsWith('treino12:'))!.name!;
  const db: IDBDatabase = await new Promise((res, rej) => { const r = indexedDB.open(name); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
  const s: any = await new Promise((res, rej) => { const r = db.transaction('state').objectStore('state').get('active'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
  db.close(); return s;
 });
}
async function seed(page: Page, full: object) {
 await page.goto('#perfil');
 await expect(page.getByText('Salvo neste aparelho', { exact: true })).toBeVisible();
 await page.locator('#backup-cabeca').click();
 await page.locator('#backup-file').setInputFiles({ name: 'fixture-SINTETICO.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(full)) });
 await page.getByRole('button', { name: 'Confirmar importação', exact: true }).click();
 await expect(page.getByText('Backup importado.', { exact: false })).toBeVisible();
 await page.goto('#inicio'); await page.reload();
 await expect(page.getByRole('heading', { name: 'Início', level: 1 })).toBeVisible();
}
const wiz = (page: Page) => page.locator('.as[role=dialog]');
// Atrasa de forma determinística a gravação do estado no IndexedDB (a transação segue viva com leituras encadeadas).
const slowWrites = (page: Page, ms: number) => page.addInitScript(delay => {
 const orig = IDBObjectStore.prototype.put;
 (IDBObjectStore.prototype as any).put = function (this: IDBObjectStore, ...a: any[]) {
  if (this.name !== 'state') return (orig as any).apply(this, a);
  const store = this; const end = performance.now() + delay;
  const spin = () => { if (performance.now() >= end) { (orig as any).apply(store, a); return; } store.get('active').onsuccess = spin; };
  spin(); return {} as any;
 };
}, ms);
// A série 1 do supino de 2026-11-11 já está gravada como concluída?
const serieGravada = async (page: Page) => (await state(page)).history?.days?.['2026-11-11']?.log?.supino?.[0]?.done === true;

test.use({ viewport: { width: 360, height: 800 } });
test.beforeEach(async ({ page }) => {
 const errors: string[] = []; (page as any).__errors = errors;
 page.on('pageerror', e => errors.push(e.message));
 page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
});
test.afterEach(async ({ page }) => { expect((page as any).__errors, 'Sem erros de console').toEqual([]); });

test('Hoje: o cartão mostra o 1º exercício com a carga sugerida do domínio e Começar treino', async ({ page }) => {
 await page.clock.setFixedTime(new Date('2026-11-11T12:00:00'));
 // Semana anterior: supino 30 kg × 8 em todas as séries; a carga sugerida vem de placeholderFor + suggestNext.
 const sets = Array.from({ length: 4 }, () => ({ kg: '30', reps: '8', done: true }));
 await page.goto('./');
 await seed(page, backupFull({ '2026-11-04': { workouts: { UA: { sessionId: 'UA', startedAt: 1, finishedAt: 2, status: 'done', sets: 4, volume: 960 } }, log: { supino: sets } } }));
 const card = page.getByRole('region', { name: 'Hoje' });
 await expect(card.getByText('1º exercício')).toBeVisible();
 await expect(card.getByText('Supino com halteres')).toBeVisible();
 await expect(card.locator('.in-hero')).toHaveText('Carga sugerida: 30kg'); // semana leve: mantém a carga, sem seta
 await expect(card.getByRole('link', { name: 'Começar treino' })).toHaveAttribute('href', /#treino\/UA\/executar/);
});

test('Hoje: dia de esporte mostra amanhã e a semana; o menu do dia guarda as funções', async ({ page }) => {
 await page.clock.setFixedTime(new Date('2026-11-12T12:00:00')); // quinta: aula na rotina de exemplo
 await page.goto('./'); await seed(page, backupFull({}));
 await expect(page.getByRole('heading', { name: 'Aula de jiu-jitsu', level: 2 })).toBeVisible();
 await expect(page.getByText(/^Amanhã:/)).toBeVisible();
 await expect(page.getByRole('list', { name: 'Sua semana' })).toBeVisible();
 await page.getByRole('button', { name: 'Fiz a aula' }).click();
 await expect(page.getByLabel(/Observações/)).toBeVisible();
 await page.getByRole('button', { name: 'Mais opções do dia' }).click();
 await expect(page.getByRole('menuitem', { name: 'Registrar outro dia' })).toBeVisible();
 await expect(page.getByRole('menuitem', { name: 'Trocar treino' })).toBeVisible();
 await expect(page.getByRole('menuitem', { name: 'Treino livre' })).toHaveAttribute('href', '#treino/livre');
});

test('Hoje: com hideDietNumbers, a linha da dieta e as opções da refeição não mostram kcal', async ({ page }) => {
 await page.clock.setFixedTime(new Date('2026-11-11T12:00:00'));
 await page.goto('./'); await seed(page, backupFull({}, { onboarding: { v: 1, appliedOn: '2026-10-18', dietTargetsDisabled: false, hideDietNumbers: true, answers: { goal: 'saude', experience: 'nunca', daysPerWeek: 3, duration: 'medio', place: 'academia', activities: [] } } }));
 const line = page.locator('a.in-dieta');
 await expect(line).toContainText('0 de 5 refeições');
 await expect(line).not.toContainText('kcal');
 await line.click();
 await expect(page.locator('.dt-options')).toBeVisible();
 await expect(page.locator('.dt-options')).not.toContainText('kcal');
});

test('Treino livre: escolher da biblioteca, registrar, concluir; não marca o dia nem a sequência', async ({ page }) => {
 await page.clock.setFixedTime(new Date('2026-11-11T12:00:00'));
 await page.goto('./'); await seed(page, backupFull({}));
 await page.goto('#treino');
 await page.getByRole('link', { name: /Treino livre/ }).click();
 await expect(page.getByRole('heading', { name: 'Treino livre', level: 2 })).toBeVisible();
 await expect(page.getByRole('button', { name: 'Começar' })).toBeDisabled();
 await page.getByLabel('Buscar exercício').fill('supino');
 await page.getByRole('button', { name: /^Supino com halteres/ }).click();
 await expect(page.getByRole('button', { name: /^Supino com halteres/ })).toHaveAttribute('aria-pressed', 'true');
 await page.getByRole('link', { name: 'Começar com 1 exercício' }).click();
 await expect(page).toHaveURL(/#treino\/livre\/executar\?ex=supino/);
 await expect(page.getByText('Treino livre', { exact: true })).toBeVisible();
 await page.getByLabel('Repetições, série 1').fill('8');
 await page.getByLabel('Carga (kg), série 1').fill('20');
 await page.getByRole('button', { name: 'Série 1 concluída' }).click();
 await expect(page.getByRole('button', { name: 'Série 1 concluída' })).toHaveAttribute('aria-pressed', 'true');
 // Recarregar não perde a escolha (fica na URL) nem a série, depois de a gravação no IndexedDB concluir
 // (regressão do CI, run 44598078875: o reload caiu 3,4 ms depois do clique, antes da gravação assíncrona).
 await expect.poll(() => serieGravada(page), { message: 'série gravada no IndexedDB antes do reload' }).toBe(true);
 await page.reload();
 await expect(page.getByRole('button', { name: 'Série 1 concluída' })).toHaveAttribute('aria-pressed', 'true');
 await page.getByRole('button', { name: 'Concluir treino' }).click();
 const dlg = page.getByRole('dialog', { name: 'Concluir o treino?' });
 if (await dlg.isVisible().catch(() => false)) await dlg.getByRole('button', { name: 'Concluir' }).click();
 await expect(page.getByRole('heading', { name: 'Treino concluído!' })).toBeVisible();
 await expect(page.getByText('Treino livre · salvo neste aparelho')).toBeVisible();
 const day = (await state(page)).history.days['2026-11-11'];
 expect(day.workouts.livre.status).toBe('done');
 expect(day.log.supino[0]).toMatchObject({ kg: '20', reps: '8', done: true });
 expect(day.acts?.gym).toBeUndefined();
 // O treino do plano de hoje continua pendente no Início, e o livre aparece entre os outros treinos.
 await page.goto('#inicio');
 await expect(page.getByRole('link', { name: 'Começar treino' })).toBeVisible();
 await expect(page.locator('.in-others')).toContainText('Treino livre');
});

// Regressão do CI (run 44598078875): com a gravação lenta, a série só sobrevive ao reload depois de gravada, e o app a mantém depois disso.
test('Treino livre: série concluída sobrevive ao reload quando a gravação é lenta, desde que concluída', async ({ page }) => {
 await page.clock.setFixedTime(new Date('2026-11-11T12:00:00'));
 await page.goto('./'); await seed(page, backupFull({}));
 await slowWrites(page, 800);
 await page.goto('#treino/livre/executar?ex=supino'); await page.reload();
 await page.getByLabel('Repetições, série 1').fill('8');
 await page.getByLabel('Carga (kg), série 1').fill('20');
 await page.getByRole('button', { name: 'Série 1 concluída' }).click();
 await expect(page.getByRole('button', { name: 'Série 1 concluída' })).toHaveAttribute('aria-pressed', 'true');
 await expect.poll(() => serieGravada(page), { timeout: 8000 }).toBe(true);
 await page.reload();
 await expect(page.getByRole('button', { name: 'Série 1 concluída' })).toHaveAttribute('aria-pressed', 'true');
});

test('PWA: o manifesto tem os atalhos Treino de hoje, Registrar peso e Dieta, apontando para rotas que abrem', async ({ page, baseURL }) => {
 await page.goto('./'); await seed(page, backupFull({}));
 const manifest = await (await page.request.get(`${baseURL}manifest.webmanifest`)).json();
 const base = new URL(baseURL!).pathname;
 const names = manifest.shortcuts.map((s: any) => s.name);
 expect(names).toEqual(['Treino de hoje', 'Registrar peso', 'Dieta']);
 const h1: Record<string, string> = { 'Treino de hoje': 'Início', 'Registrar peso': 'Evolução', Dieta: 'Dieta' };
 for (const s of manifest.shortcuts) {
  expect(s.url.startsWith(base)).toBe(true);
  await page.goto(new URL(s.url, baseURL).toString());
  await expect(page.getByRole('heading', { name: h1[s.name], level: 1 })).toBeAttached();
 }
});

test('Assistente: o voltar do celular recua um passo, sem guardar as respostas de saúde', async ({ page }) => {
 await page.goto('./');
 await wiz(page).getByRole('button', { name: 'Montar meu plano' }).click();
 await expect(wiz(page).getByText('Passo 1 de 9')).toBeVisible();
 await wiz(page).getByText('Nenhuma dessas').click();
 await wiz(page).getByRole('button', { name: 'Continuar' }).click();
 await expect(wiz(page).getByText('Passo 2 de 9')).toBeVisible();
 await page.goBack();
 await expect(wiz(page).getByText('Passo 1 de 9')).toBeVisible();
 // A resposta continua na memória da tela; nada foi para o histórico nem para o armazenamento.
 await expect(wiz(page).getByRole('checkbox', { name: /Nenhuma dessas/ })).toBeChecked();
 const leaked = await page.evaluate(() => JSON.stringify([history.state, { ...sessionStorage }, { ...localStorage }]));
 expect(leaked).not.toMatch(/nenhum|safety|seguran/i);
 await page.goBack();
 await expect(wiz(page).getByRole('button', { name: 'Montar meu plano' })).toBeVisible();
 await expect(page).toHaveURL(/\/Projeto-Treino\/|#inicio|\/$/);
});

test('Assistente offline: com o service worker pronto, o chunk do assistente vem do precache', async ({ page, context }) => {
 await page.goto('#perfil');
 await page.waitForLoadState('networkidle');
 await expect(page.getByText('Salvo neste aparelho', { exact: true })).toBeVisible();
 await page.evaluate(async () => {
  await navigator.serviceWorker.ready;
  if (!navigator.serviceWorker.controller) await new Promise<void>(r => navigator.serviceWorker.addEventListener('controllerchange', () => r(), { once: true }));
 });
 await expect(page.getByText('Disponível offline', { exact: true })).toBeAttached();
 // O chunk ainda não foi carregado nesta página: nenhum script do assistente no documento.
 expect(await page.evaluate(() => performance.getEntriesByType('resource').some(e => /Assistente-/.test(e.name)))).toBe(false);
 await context.setOffline(true);
 await page.getByRole('button', { name: /Refazer meu plano/ }).click();
 await expect(wiz(page).getByText('Passo 1 de 9')).toBeVisible();
 await expect(wiz(page).getByRole('heading', { level: 1 })).toBeVisible();
 await context.setOffline(false);
});
