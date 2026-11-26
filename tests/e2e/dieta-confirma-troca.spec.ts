import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { generateMeals } from '../../src/domain/mealPlan';
import type { GeneratedOption } from '../../src/domain/mealPlan';
import { buildDietTargetsFromAnswers, storedAnswersOf } from '../../src/domain/onboarding';
import type { OnboardingAnswers } from '../../src/domain/onboarding';
import type { StateV3 } from '../../src/application/repository';

const day = '2026-11-23';
const now = new Date(2026, 10, 23, 12).getTime();
const manual = 'Item escolhido à mão';
const warning = 'Trocar vai refazer a lista desta opção e descartar a sua edição. Você pode desfazer logo depois.';
const answers: OnboardingAnswers = {
 safety: ['nenhum'], goal: 'massa', experience: 'iniciante', daysPerWeek: 3, duration: 'medio',
 place: 'academia', activities: [], body: { sex: 'm', age: 30, heightCm: 180, weightKg: 80, lifestyle: 'moderado' },
 food: { style: 'tudo', restrictions: [], mealsPerDay: 4, dedication: 'cardapio', dislikes: [], whey: false },
};

test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

async function seed(page: Page) {
 const json = (path: string) => JSON.parse(readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8'));
 const plan = json('data/plan.json');
 const targets = buildDietTargetsFromAnswers(answers);
 if (targets.kind !== 'targets') throw new Error('Metas sintéticas inválidas');
 const { meals } = generateMeals(answers, targets.targets, json('src/data/foods/foods.json').foods, json('src/data/foods/templates.json'));
 const state: StateV3 = {
  v: 3, revision: 0, catalog: { plan: plan.plan, diet: meals, recipes: json('data/recipes.json'), revision: 0 },
  settings: { start: day, startConfirmed: true, sched: plan.sched, theme: 'auto',
   onboarding: { v: 1, appliedOn: day, answers: storedAnswersOf(answers), dietTargetsDisabled: false, hideDietNumbers: false, undoKey: 'onboarding-undo:teste' } },
  history: { days: {}, measurements: {} }, snapshots: {}, recovery: {},
  meta: { initializedAt: now, updatedAt: now, migrationCompleted: true, migrationStatus: 'none', migrationWarnings: [], lastBackupGeneratedAt: null, lastBackupConfirmedAt: null },
 };
 await page.goto('#perfil');
 await page.getByRole('button', { name: /Backup e restauração/ }).click();
 await page.locator('#backup-file').setInputFiles({
  name: 'cardapio-sintetico.json', mimeType: 'application/json',
  buffer: Buffer.from(JSON.stringify({ v: 3, app: 'treino12', exportedAt: now, state })),
 });
 await page.getByRole('button', { name: 'Confirmar importação' }).click();
 await expect(page.getByText('Backup importado.', { exact: false })).toBeVisible();
 await page.goto('#dieta/almoco/gerenciar');
}

const storedOptions = (page: Page) => page.evaluate(async () => {
 const name = (await indexedDB.databases()).find(d => d.name?.startsWith('treino12'))!.name!;
 const db = await new Promise<IDBDatabase>((resolve, reject) => {
  const request = indexedDB.open(name);
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error);
 });
 try {
  return await new Promise<(GeneratedOption & { edited?: boolean })[]>((resolve, reject) => {
   const request = db.transaction('state').objectStore('state').get('active');
   request.onsuccess = () => resolve(request.result.catalog.diet.almoco);
   request.onerror = () => reject(request.error);
  });
 } finally {
  db.close();
 }
});

const menuAction = async (page: Page, name: string) => {
 await page.getByRole('button', { name: /^Mais ações da opção 1,/ }).click();
 await page.getByRole('menuitem', { name }).click();
};
const firstSwap = (page: Page) => page.getByRole('button', { name: /^Trocar este alimento/ }).first();

test('salvar sem mudanças mantém a opção e permite trocar direto', async ({ page }) => {
 await seed(page);
 const before = (await storedOptions(page))[0];
 await menuAction(page, 'Editar');
 await page.getByRole('button', { name: 'Salvar opção' }).click();
 await expect(page.getByRole('dialog')).toHaveCount(0);
 expect((await storedOptions(page))[0]).toEqual(before);
 expect(before).not.toHaveProperty('edited');

 await page.getByRole('link', { name: 'Opções do dia' }).click();
 await firstSwap(page).tap();
 await expect(page.getByRole('status').filter({ hasText: 'Alimento trocado' })).toHaveCount(1);
 await expect(page.getByRole('dialog')).toHaveCount(0);
 expect((await storedOptions(page))[0].foods).not.toEqual(before.foods);
});

for (const [theme, colorScheme] of [['claro', 'light'], ['escuro', 'dark']] as const) {
 test(`protege a edição manual e restaura a opção completa ao desfazer (${theme})`, async ({ page }) => {
  await page.emulateMedia({ colorScheme });
  await seed(page);
  const original = (await storedOptions(page))[0];
  await menuAction(page, 'Editar');
  await page.getByLabel('Itens (um por linha)', { exact: true }).fill([manual, ...original.items.slice(1)].join('\n'));
  await page.getByRole('button', { name: 'Salvar opção' }).click();
  await expect.poll(async () => (await storedOptions(page))[0].items[0]).toBe(manual);
  const edited = (await storedOptions(page))[0];
  expect.soft(edited.edited).toBe(true);
  expect(edited.foods).toEqual(original.foods);
  await menuAction(page, 'Duplicar');
  await expect.poll(async () => (await storedOptions(page))[1].name).toBe(`${edited.name} (cópia)`);
  const copy = (await storedOptions(page))[1];
  expect.soft(copy.edited).toBe(true);

  await page.getByRole('link', { name: 'Opções do dia' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', colorScheme);
  const swap = firstSwap(page);
  const dialog = page.getByRole('dialog', { name: 'Trocar alimento?' });
  const cancel = dialog.getByRole('button', { name: 'Cancelar' });
  const confirm = dialog.getByRole('button', { name: 'Trocar mesmo' });
  await swap.tap();
  await expect(dialog.getByText(warning)).toBeVisible();
  await expect(cancel).toBeFocused();
  for (const button of [cancel, confirm]) {
   const box = await button.boundingBox();
   expect(box?.height).toBeGreaterThanOrEqual(44);
   expect(box?.width).toBeGreaterThanOrEqual(44);
  }
  await page.keyboard.press('Tab');
  await expect(confirm).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(cancel).toBeFocused();
  if (process.env.SHOTS === '1') {
   await page.screenshot({ path: `capturas/dieta/confirma-troca-${theme}.png`, animations: 'disabled' });
  }
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(swap).toBeFocused();
  expect((await storedOptions(page))[0]).toEqual(edited);

  await swap.tap();
  await cancel.tap();
  await expect(dialog).toHaveCount(0);
  await expect(swap).toBeFocused();
  expect((await storedOptions(page))[0]).toEqual(edited);

  await swap.tap();
  await confirm.tap();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole('status').filter({ hasText: 'Alimento trocado' })).toHaveCount(1);
  await expect(swap).toBeFocused();
  const swapped = (await storedOptions(page))[0];
  expect(swapped).not.toHaveProperty('edited');
  expect(swapped.foods).not.toEqual(edited.foods);
  expect(swapped.items).not.toContain(manual);
  expect((await storedOptions(page))[1]).toEqual(copy);

  await page.getByRole('button', { name: 'Desfazer' }).tap();
  await expect.poll(async () => (await storedOptions(page))[0]).toEqual(edited);
  await swap.tap();
  await expect(dialog).toBeVisible();
 });
}
