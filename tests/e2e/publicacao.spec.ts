import { test, expect, type Page } from '@playwright/test';

// Primeira abertura guiada e "Apagar todos os meus dados". Nenhum dado pessoal: tudo sintético.
const stored = (page: Page) => page.evaluate(async () => {
 const name = (await indexedDB.databases()).find(d => d.name?.startsWith('treino12'))!.name!;
 const db: IDBDatabase = await new Promise((res, rej) => { const r = indexedDB.open(name); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
 const state: any = await new Promise((res, rej) => { const r = db.transaction('state').objectStore('state').get('active'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
 db.close();
 return state;
});
const noHScroll = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
const welcome = (page: Page) => page.locator('.as[role=dialog]');

test.use({ viewport: { width: 360, height: 800 } });
test.beforeEach(async ({ page }) => {
 const errors: string[] = []; (page as any).__errors = errors;
 page.on('pageerror', e => errors.push(e.message));
 page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
});
test.afterEach(async ({ page }) => { expect((page as any).__errors, 'Sem erros de console').toEqual([]); });

test('Primeira abertura: usuário novo vê o assistente de início', async ({ page }) => {
 await page.goto('./');
 const dialog = welcome(page);
 await expect(dialog).toBeVisible();
 await expect(dialog.getByRole('heading', { level: 1, name: 'Vamos montar seu plano' })).toBeFocused();
 await expect(dialog.getByRole('button', { name: 'Montar meu plano' })).toBeVisible();
 await expect(dialog.getByRole('button', { name: 'Usar o plano de exemplo' })).toBeVisible();
 await expect(dialog.getByText('não substitui nutricionista, médico ou educador físico', { exact: false })).toBeVisible();
 expect((await stored(page)).settings.startConfirmed).toBe(false);
 expect(await noHScroll(page)).toBe(true);
});

test('Primeira abertura: plano de exemplo mantém a segunda-feira sugerida e não reaparece', async ({ page }) => {
 await page.goto('./');
 await expect(welcome(page)).toBeVisible();
 const before = (await stored(page)).settings.start;
 await welcome(page).getByRole('button', { name: 'Usar o plano de exemplo' }).click();
 await expect(welcome(page).getByRole('radio').first()).toBeChecked();
 await welcome(page).getByRole('button', { name: 'Usar o plano de exemplo' }).click();
 await expect(welcome(page)).toHaveCount(0);
 await expect.poll(async () => (await stored(page)).settings.startConfirmed).toBe(true);
 expect((await stored(page)).settings.start).toBe(before);
 await page.evaluate(() => sessionStorage.clear());
 await page.reload();
 await expect(page.getByRole('heading', { name: 'Início', level: 1 })).toBeAttached();
 await expect(page.getByText('Salvo neste aparelho', { exact: true })).toBeVisible();
 await expect(welcome(page)).toHaveCount(0);
});

test('Primeira abertura: plano de exemplo com outra data usa a segunda da semana', async ({ page }) => {
 await page.goto('./');
 await welcome(page).getByRole('button', { name: 'Usar o plano de exemplo' }).click();
 await welcome(page).getByText('Outra data', { exact: true }).click();
 await page.getByLabel('Data de início').fill('2030-03-13');
 await welcome(page).getByRole('button', { name: 'Usar o plano de exemplo' }).click();
 await expect(welcome(page)).toHaveCount(0);
 await expect.poll(async () => (await stored(page)).settings.startConfirmed).toBe(true);
 expect((await stored(page)).settings.start).toBe('2030-03-11');
 await page.evaluate(() => sessionStorage.clear());
 await page.reload();
 await expect(page.getByText('Salvo neste aparelho', { exact: true })).toBeVisible();
 await expect(welcome(page)).toHaveCount(0);
});

test('Primeira abertura: decidir depois mantém sem confirmar e não insiste na mesma sessão', async ({ page }) => {
 await page.goto('./');
 await welcome(page).getByRole('button', { name: 'Decidir depois' }).click();
 await expect(welcome(page)).toHaveCount(0);
 expect((await stored(page)).settings.startConfirmed).toBe(false);
 await page.reload();
 await expect(page.getByText('Salvo neste aparelho', { exact: true })).toBeVisible();
 await expect(welcome(page)).toHaveCount(0);
});

test.describe('Apagar todos os meus dados', () => {
 async function prepare(page: Page) {
  await page.goto('#perfil');
  await expect(page.getByText('Salvo neste aparelho', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Editar perfil' }).click();
  await page.getByLabel('Seu nome').fill('Teste Sintético');
  await page.getByRole('button', { name: 'Salvar', exact: true }).click();
  await expect.poll(async () => (await stored(page)).settings.profile?.name).toBe('Teste Sintético');
  await page.evaluate(() => sessionStorage.setItem('treino12:cursor:x:y', '1'));
 }
 const open = (page: Page) => page.getByRole('button', { name: 'Apagar todos os meus dados' }).click();
 const first = (page: Page) => page.getByRole('dialog', { name: 'Apagar todos os meus dados?' });
 const last = (page: Page) => page.getByRole('dialog', { name: 'Apagar tudo agora?' });

 test('a área de risco fica no fim do Perfil, discreta, e a primeira folha explica o que será apagado', async ({ page }) => {
  await prepare(page);
  const section = page.getByRole('region', { name: 'Zona de risco' });
  await expect(section).toBeVisible();
  await open(page);
  const d = first(page);
  await expect(d).toBeVisible();
  for (const t of ['treinos e registros', 'dieta e refeições', 'medidas', 'perfil', 'configurações']) await expect(d.getByText(t, { exact: true })).toBeVisible();
  await expect(d.getByText('O cache do app não é afetado', { exact: false })).toBeVisible();
  await expect(d.getByText('Não há como desfazer.', { exact: false })).toBeVisible();
  expect(await noHScroll(page)).toBe(true);
 });

 test('Baixar backup antes gera o arquivo e mantém os dados', async ({ page }) => {
  await prepare(page);
  await open(page);
  const pending = page.waitForEvent('download');
  await first(page).getByRole('button', { name: 'Baixar backup antes' }).click();
  expect((await pending).suggestedFilename()).toMatch(/^treino12-backup-.*\.json$/);
  await expect(first(page).getByText('Backup baixado.', { exact: false })).toBeVisible();
  expect((await stored(page)).settings.profile.name).toBe('Teste Sintético');
 });

 test('cancelar em qualquer etapa não apaga nada', async ({ page }) => {
  await prepare(page);
  await open(page);
  await first(page).getByRole('button', { name: 'Cancelar' }).click();
  await expect(first(page)).toHaveCount(0);
  await open(page);
  await first(page).getByRole('button', { name: 'Continuar' }).click();
  await expect(last(page)).toBeVisible();
  await expect(last(page).getByRole('button', { name: 'Cancelar' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(last(page)).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Apagar todos os meus dados' })).toBeFocused();
  const s = await stored(page);
  expect(s.settings.profile.name).toBe('Teste Sintético');
 });

 test('confirmar apaga tudo e volta ao estado de primeira abertura', async ({ page }) => {
  await prepare(page);
  const before = await stored(page);
  await open(page);
  await first(page).getByRole('button', { name: 'Continuar' }).click();
  await last(page).getByRole('button', { name: 'Apagar tudo' }).click();
  // O app recarrega em Início e, sem data de início escolhida, oferece a escolha de novo.
  await expect(welcome(page)).toBeVisible();
  const after = await stored(page);
  expect(after.settings.profile ?? null).toBeNull();
  expect(after.settings.startConfirmed).toBe(false);
  expect(after.revision).toBeGreaterThan(before.revision);
  expect(await page.evaluate(() => sessionStorage.getItem('treino12:cursor:x:y'))).toBeNull();
  await welcome(page).getByRole('button', { name: 'Decidir depois' }).click();
  await page.getByRole('navigation', { name: 'Navegação principal' }).getByRole('link', { name: 'Perfil', exact: true }).click();
  await expect(page.getByText('Seu nome', { exact: true }).first()).toBeVisible();
 });
});
