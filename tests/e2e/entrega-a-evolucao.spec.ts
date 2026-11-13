import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';

// Dados inteiramente sintéticos; não representam backup real do usuário.
const json = (f: string) => JSON.parse(readFileSync(new URL(`../../data/${f}`, import.meta.url), 'utf8'));
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const addDays = (day: string, n: number) => { const [y, m, d] = day.split('-').map(Number); return iso(new Date(y, m - 1, d + n)); };
const today = () => iso(new Date());
const monday = (day: string) => { const [y, m, d] = day.split('-').map(Number); return addDays(day, -((new Date(y, m - 1, d).getDay() + 6) % 7)); };

interface Fixture { days?: Record<string, any>; measurements?: Record<string, any>; start?: string }
function backup(f: Fixture = {}) {
 const plan = json('plan.json');
 const state = {
  v: 3, revision: 0,
  catalog: { plan: plan.plan, diet: json('diet.json'), recipes: json('recipes.json'), revision: 0 },
  settings: { start: f.start ?? monday(today()), sched: plan.sched, theme: 'auto' },
  history: { days: f.days ?? {}, measurements: f.measurements ?? {} }, snapshots: {}, recovery: {},
  meta: { initializedAt: 1, updatedAt: 1, migrationCompleted: true, migrationStatus: 'none', migrationWarnings: [], lastBackupGeneratedAt: null, lastBackupConfirmedAt: null },
 };
 return { v: 3, app: 'treino12', exportedAt: Date.now(), state };
}
async function seed(page: Page, f: Fixture = {}) {
 await page.goto('#perfil'); await page.waitForLoadState('networkidle');
 await expect(page.getByText('Salvo neste aparelho', { exact: true })).toBeVisible();
 await page.getByRole('button', { name: /Backup e restauração/ }).click();
 await page.locator('#backup-file').setInputFiles({ name: 'fixture-SINTETICO.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(backup(f))) });
 await page.getByRole('button', { name: 'Confirmar importação', exact: true }).click();
 await expect(page.getByText('Backup importado.', { exact: false })).toBeVisible();
 await page.goto('#evolucao');
 await expect(page.getByRole('heading', { name: 'Evolução', level: 1 })).toBeVisible();
}
async function dbState(page: Page): Promise<any> {
 return page.evaluate(async () => {
  const dbs = await indexedDB.databases(); const name = dbs.find(d => d.name?.startsWith('treino12:'))!.name!;
  return new Promise((resolve, reject) => { const req = indexedDB.open(name); req.onerror = () => reject(req.error); req.onsuccess = () => { const db = req.result; const g = db.transaction(['state']).objectStore('state').get('active'); g.onsuccess = () => { db.close(); resolve(g.result); }; g.onerror = () => reject(g.error); }; });
 });
}
const noHScroll = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);

/** Plano iniciado há 3 semanas: semanas 1 a 3 com cargas crescentes (supino 40, 44, 48 kg) e treinos feitos. */
function populated(): Fixture {
 const start = addDays(monday(today()), -21);
 const days: Record<string, any> = {};
 [40, 44, 48].forEach((kg, w) => {
  for (const off of [1, 2, 4]) {
   const day = addDays(start, w * 7 + off);
   if (day >= today()) continue;
   days[day] = { workout: { sessionId: 'UA', startedAt: 1, finishedAt: 2, status: 'done', sets: 2, volume: 100 }, acts: { gym: true }, log: { supino: [{ kg: String(kg).replace('.', ','), reps: '8', done: true }, { kg: String(kg), reps: '8', done: true }] } };
  }
 });
 return { start, days, measurements: { [addDays(start, 1)]: { p: '82,0', c: '91', b: '33', t: '58' }, [addDays(start, 15)]: { p: '80,5', c: '89,5', b: '34', t: '57' } } };
}

test.use({ viewport: { width: 360, height: 800 } });
test.beforeEach(async ({ page, context }) => {
 const errors: string[] = []; (page as any).__errors = errors;
 const monitor = (p: Page) => { p.on('pageerror', e => errors.push(e.message)); p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); }); };
 monitor(page); context.on('page', monitor);
});
test.afterEach(async ({ page }) => { expect((page as any).__errors, 'Sem exceções nem erros de console').toEqual([]); });

test('Evolução sem registros: estado vazio honesto, atalho para o treino e nenhum número fictício', async ({ page }) => {
 await seed(page);
 await expect(page.getByRole('heading', { name: 'Registre seu primeiro treino para ver sua evolução' })).toBeVisible();
 await expect(page.getByRole('link', { name: 'Ir para o treino' })).toHaveAttribute('href', /#treino/);
 await expect(page.getByText(/próxima fase/i)).toHaveCount(0);
 for (const fake of ['+12%', '83%', '78,2', '−3,8']) await expect(page.getByText(fake, { exact: false })).toHaveCount(0);
 await expect(page.locator('main').getByRole('img')).toHaveCount(0);
 await expect(page.getByRole('group', { name: 'Indicador do gráfico principal' })).toHaveCount(0);
 expect(await noHScroll(page)).toBe(true);
});

test('Evolução: registrar medidas com vírgula grava em history.measurements e mostra o peso', async ({ page }) => {
 await seed(page);
 await page.getByRole('button', { name: /Registrar medidas/ }).click();
 const form = page.getByRole('dialog', { name: 'Registrar medidas' });
 await form.getByLabel('Peso').fill('78,2');
 await form.getByLabel('Cintura').fill('86');
 await form.getByLabel('Braço').fill('34,5');
 await form.getByRole('button', { name: 'Salvar medidas' }).click();
 await expect(page.getByText('Medidas de hoje salvas neste aparelho.')).toBeVisible();
 await expect(page.getByRole('region', { name: 'Peso corporal', exact: true }).locator('.ev-big')).toHaveText('78,2 kg');
 await expect(page.getByRole('region', { name: 'Medidas', exact: true }).getByText('86 cm')).toBeVisible();
 await expect(page.getByRole('region', { name: 'Medidas', exact: true }).getByText('34,5 cm')).toBeVisible();
 // Uma única medida: sem variação inventada.
 await expect(page.getByRole('group', { name: 'Indicador do gráfico principal' }).getByRole('button', { name: /Peso: sem variação/ })).toBeVisible();
 // Gravado com as chaves legadas (texto com vírgula), pela exportação do backup.
 await page.reload();
 await expect(page.getByRole('region', { name: 'Peso corporal', exact: true }).locator('.ev-big')).toHaveText('78,2 kg');
 expect(await noHScroll(page)).toBe(true);
});

test('Evolução: valor inválido mostra erro em texto e preserva o que foi digitado', async ({ page }) => {
 await seed(page);
 await page.getByRole('button', { name: /Registrar medidas/ }).click();
 const form = page.getByRole('dialog', { name: 'Registrar medidas' });
 await form.getByRole('button', { name: 'Salvar medidas' }).click();
 await expect(form.getByRole('alert')).toContainText('Preencha pelo menos uma medida.');
 await form.getByLabel('Peso').fill('abc');
 await form.getByRole('button', { name: 'Salvar medidas' }).click();
 await expect(form.getByRole('alert')).toContainText('use só números');
 await expect(form.getByLabel('Peso')).toHaveValue('abc');
});

test('Evolução com dados: indicadores, gráfico acessível, tabela equivalente e período', async ({ page }) => {
 await seed(page, populated());
 const tiles = page.getByRole('group', { name: 'Indicador do gráfico principal' });
 await expect(tiles.getByRole('button', { name: /^Força: \+20%$/ })).toHaveAttribute('aria-pressed', 'true');
 await expect(tiles.getByRole('button', { name: /^Peso: −1,5 kg$/ })).toBeVisible();
 await expect(tiles.getByRole('button', { name: /^Cintura: −1,5 cm$/ })).toBeVisible();
 await expect(tiles.getByRole('button', { name: /^Constância: \d+%$/ })).toBeVisible();
 const chart = page.getByRole('img', { name: /Força \(carga média\): de 40 kg em S1 a 48 kg em S3, variação de \+20%/ });
 await expect(chart).toBeVisible();
 await expect(page.getByRole('table', { name: 'Força (carga média), valores por semana' })).toBeAttached();
 await expect(page.getByRole('region', { name: 'Medidas', exact: true })).toContainText('Cintura');
 await expect(page.getByRole('region', { name: 'Constância de treinos' }).getByRole('img')).toHaveAttribute('aria-label', /atividades previstas feitas/);
 // Seleciona outro indicador
 await tiles.getByRole('button', { name: /^Peso:/ }).click();
 await expect(page.getByRole('img', { name: /Peso corporal: de 82 kg em S1 a 80,5 kg em S3/ })).toBeVisible();
 // Período
 const period = page.getByRole('button', { name: /Últimas 12 semanas/ });
 await period.click();
 await page.getByRole('option', { name: 'Últimas 4 semanas' }).click();
 await expect(page.getByRole('button', { name: /Últimas 4 semanas/ })).toBeVisible();
 await page.keyboard.press('Escape');
 expect(await noHScroll(page)).toBe(true);
});

test('Evolução em tema escuro e 360 px não tem rolagem horizontal', async ({ page }) => {
 await page.emulateMedia({ colorScheme: 'dark' });
 await seed(page, populated());
 await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
 await expect(page.getByRole('region', { name: 'Constância de treinos' })).toBeVisible();
 expect(await noHScroll(page)).toBe(true);
});

test('Evolução: a linha inteira abre a folha, com data de hoje, foco e Escape', async ({ page }) => {
 await seed(page);
 const row = page.getByRole('button', { name: /Registrar medidas/ });
 await row.click({ position: { x: 20, y: 20 } }); // longe do texto: a linha toda responde
 const dlg = page.getByRole('dialog', { name: 'Registrar medidas' });
 await expect(dlg).toBeVisible();
 await expect(dlg.getByLabel('Data')).toHaveValue(today());
 await expect(dlg.getByLabel('Peso')).toBeFocused();
 await expect.poll(async () => { const b = (await dlg.boundingBox())!; return b.y >= 0 && b.y + b.height <= 801; }).toBe(true); // espera a animação de subida
 await page.keyboard.press('Escape');
 await expect(dlg).toHaveCount(0);
 await expect(row).toBeFocused();
});

test('Evolução: 900 kg e data futura são recusados com mensagem e a entrada é preservada', async ({ page }) => {
 await seed(page);
 await page.getByRole('button', { name: /Registrar medidas/ }).click();
 const dlg = page.getByRole('dialog', { name: 'Registrar medidas' });
 await dlg.getByLabel('Peso').fill('900');
 await dlg.getByLabel('Cintura').fill('9');
 await dlg.getByLabel('Data').fill(addDays(today(), 1));
 await dlg.getByRole('button', { name: 'Salvar medidas' }).click();
 const alert = dlg.getByRole('alert');
 await expect(alert).toContainText('Peso: informe um valor entre 30 e 300 kg');
 await expect(alert).toContainText('Cintura: informe um valor entre 10 e 250 cm');
 await expect(alert).toContainText('não pode ser futura');
 await expect(dlg.getByLabel('Peso')).toHaveValue('900');
 await expect(dlg.getByLabel('Cintura')).toHaveValue('9');
 expect(Object.keys((await dbState(page)).history.measurements)).toHaveLength(0);
});

test('Evolução: medida de data passada grava nessa data, mostra confirmação e atualiza o gráfico', async ({ page }) => {
 const past = addDays(today(), -3);
 await seed(page, { start: addDays(monday(today()), -14) });
 await page.getByRole('button', { name: /Registrar medidas/ }).click();
 const dlg = page.getByRole('dialog', { name: 'Registrar medidas' });
 await dlg.getByLabel('Data').fill(past);
 await dlg.getByLabel('Peso').fill('81,4');
 await dlg.getByRole('button', { name: 'Salvar medidas' }).click();
 await expect(page.getByText(/Medidas de \d{2}\/\d{2}\/\d{4} salvas neste aparelho\./)).toBeVisible();
 await expect(page.getByRole('region', { name: 'Peso corporal', exact: true }).locator('.ev-big')).toHaveText('81,4 kg');
 expect((await dbState(page)).history.measurements[past].p).toBe('81,4');
});

test('Evolução: com um treino só, o tile Força mostra o valor e o gráfico não corta o eixo', async ({ page }) => {
 const start = monday(today());
 await seed(page, { start, days: { [start]: { workout: { sessionId: 'UA', startedAt: 1, finishedAt: 2, status: 'done', sets: 1, volume: 1 }, log: { supino: [{ kg: '27,5', reps: '8', done: true }] } } }, measurements: { [start]: { p: '82,5' } } });
 const tiles = page.getByRole('group', { name: 'Indicador do gráfico principal' });
 await expect(tiles.getByRole('button', { name: /^Força: 27,5 kg, sem variação ainda$/ })).toBeVisible();
 await expect(page.getByText('Sem variação ainda', { exact: false }).first()).toBeVisible();
 // Rótulos do eixo Y inteiros dentro do SVG
 const cut = await page.locator('.ev-chart svg').first().evaluate(svg => { const r = svg.getBoundingClientRect(); return Array.from(svg.querySelectorAll('text.ev-axis')).filter(t => t.getBoundingClientRect().left < r.left - 0.5).length; });
 expect(cut).toBe(0);
 // Mini-gráfico de peso completo: o ponto fica dentro da área do cartão
 const dot = await page.locator('.ev-mini circle').first().boundingBox(); const mini = await page.locator('.ev-mini').boundingBox();
 expect(dot!.x).toBeGreaterThan(mini!.x); expect(dot!.x + dot!.width).toBeLessThan(mini!.x + mini!.width);
});

test('Perfil e Evolução mostram a mesma constância para o mesmo histórico', async ({ page }) => {
 await seed(page, populated());
 const evo = await page.getByRole('group', { name: 'Indicador do gráfico principal' }).getByRole('button', { name: /^Constância: \d+%$/ }).getAttribute('aria-label');
 const pct = evo!.match(/(\d+)%/)![1];
 await page.goto('#perfil');
 await expect(page.getByRole('list', { name: 'Seus números' }).or(page.getByLabel('Seus números'))).toContainText(pct + '%');
});
