import { test, expect, type Page } from '@playwright/test';

// ADR 013, etapa 3 (frontend): telas A e B do assistente, prévia do cardápio no resumo, Dieta com o cardápio gerado,
// "Trocar este alimento" com desfazer e um desfazer só para plano e cardápio. Dados sintéticos; nada pessoal.
// SHOTS=1 grava as capturas em docs/antes-depois/depois/cardapio-*.png.
const stored = (page: Page) => page.evaluate(async () => {
 const name = (await indexedDB.databases()).find(d => d.name?.startsWith('treino12'))!.name!;
 const db: IDBDatabase = await new Promise((res, rej) => { const r = indexedDB.open(name); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
 const state: any = await new Promise((res, rej) => { const r = db.transaction('state').objectStore('state').get('active'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
 db.close();
 return state;
});
const wiz = (page: Page) => page.locator('.as[role=dialog]');
const next = (page: Page) => wiz(page).getByRole('button', { name: 'Continuar' }).click();
const shots = process.env.SHOTS === '1';
const shot = async (page: Page, name: string) => { if (shots) await page.screenshot({ path: `docs/antes-depois/depois/cardapio-${name}.png`, fullPage: true }); };

test.use({ viewport: { width: 390, height: 844 } });
test.beforeEach(async ({ page }) => {
 const errors: string[] = []; (page as any).__errors = errors;
 page.on('pageerror', e => errors.push(e.message));
 page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
});
test.afterEach(async ({ page }) => { expect((page as any).__errors, 'Sem erros de console').toEqual([]); });

interface Run { safety: string; goal: string; sex: string; age: string; h: string; w: string; style?: string; allergy?: string; meals?: string; dedication?: string; theme?: string }
async function answer(page: Page, r: Run) {
 await page.goto('./');
 await wiz(page).getByRole('button', { name: 'Montar meu plano' }).click();
 await expect(wiz(page).getByText('Passo 1 de 10')).toBeVisible();
 await wiz(page).getByText(r.safety, { exact: true }).click(); await next(page);
 await wiz(page).getByText(r.goal, { exact: true }).click(); await next(page);
 await wiz(page).getByText('Treino há 1 ano ou mais').click(); await next(page);
 await next(page);
 await expect(wiz(page).getByRole('heading', { level: 1, name: 'Tempo e local do treino' })).toBeVisible();
 await expect(wiz(page).getByRole('group', { name: 'Quanto tempo você tem por treino?' })).toBeVisible();
 await expect(wiz(page).getByRole('group', { name: 'Onde você vai treinar?' })).toBeVisible();
 await next(page);
 await wiz(page).getByRole('button', { name: 'Pular' }).click();
 await wiz(page).getByText(r.sex, { exact: true }).click();
 await page.getByLabel('Idade').fill(r.age); await page.getByLabel('Altura (cm)').fill(r.h); await page.getByLabel('Peso (kg)').fill(r.w);
 await next(page);
 await expect(wiz(page).getByRole('heading', { level: 1, name: 'Como você come?' })).toBeFocused();
 await expect(wiz(page).getByText('Passo 8 de 10')).toBeVisible();
 if (r.style) await wiz(page).getByText(r.style, { exact: true }).click();
 if (r.allergy) await wiz(page).getByText(r.allergy, { exact: true }).click();
 if (r.theme) await shot(page, `tela-a-${r.theme}`);
 await next(page);
 await expect(wiz(page).getByRole('heading', { level: 1, name: 'Quanto você quer seguir?' })).toBeFocused();
 if (r.meals) await wiz(page).getByRole('radio', { name: `${r.meals} refeições` }).check();
 if (r.dedication) await wiz(page).getByText(r.dedication, { exact: true }).click();
 if (r.theme) await shot(page, `tela-b-${r.theme}`);
 await next(page);
 await expect(wiz(page).getByText('Passo 10 de 10')).toBeVisible();
 await next(page);
 await expect(wiz(page).getByRole('heading', { level: 1, name: 'Seu plano' })).toBeVisible();
 await expect(wiz(page).getByText('Montando o cardápio…')).toHaveCount(0);
}

for (const theme of ['claro', 'escuro'] as const) {
 test(`onívoro, 4 refeições, ganhar massa: cardápio, troca, desfazer e desfazer o assistente (${theme})`, async ({ page }) => {
  await page.emulateMedia({ colorScheme: theme === 'escuro' ? 'dark' : 'light' });
  await answer(page, { safety: 'Nenhuma dessas', goal: 'Ganhar massa muscular', sex: 'Masculino', age: '30', h: '180', w: '80', allergy: 'Alergia a amendoim ou castanhas', meals: '4', theme });
  const card = wiz(page).getByRole('region', { name: 'Cardápio' });
  await expect(card.getByText('4 refeições por dia', { exact: false })).toBeVisible();
  await expect(card.getByText('Confira os rótulos.', { exact: false })).toBeVisible();
  await card.scrollIntoViewIfNeeded();
  await shot(page, `resumo-${theme}`);
  const before = await stored(page);
  await wiz(page).getByRole('button', { name: 'Começar o plano' }).click();
  await expect(wiz(page)).toHaveCount(0);
  await expect.poll(async () => (await stored(page)).catalog.diet.almoco?.[0]?.foods?.length ?? 0).toBeGreaterThan(0);
  const s = await stored(page);
  expect(s.catalog.diet.pos).toEqual([]);
  expect(s.settings.onboarding.answers.food.mealsPerDay).toBe(4);

  await page.goto('./#dieta');
  const meals = page.getByRole('list', { name: 'Refeições' }).getByRole('listitem');
  await expect(meals).toHaveCount(4);
  await expect(page.getByText('Pós-treino')).toHaveCount(0);
  await expect(page.getByText('Confira os rótulos.', { exact: false })).toBeVisible();
  await page.goto('./#dieta/almoco');
  await expect(page.getByText('Dia de treino').first()).toBeVisible();
  await shot(page, `dieta-${theme}`);
  const first = page.getByRole('button', { name: /^Trocar este alimento/ }).first();
  const label = await first.getAttribute('aria-label');
  await first.click();
  await expect(page.getByRole('status').filter({ hasText: 'Alimento trocado' })).toHaveCount(1);
  await expect.poll(async () => JSON.stringify((await stored(page)).catalog.diet.almoco)).not.toBe(JSON.stringify(s.catalog.diet.almoco));
  await expect(page.getByRole('button', { name: label! })).toHaveCount(0);
  await page.getByRole('button', { name: 'Desfazer' }).click();
  await expect.poll(async () => JSON.stringify((await stored(page)).catalog.diet.almoco)).toBe(JSON.stringify(s.catalog.diet.almoco));

  // Um desfazer só: plano e cardápio voltam juntos.
  await page.goto('./#perfil');
  await page.getByRole('button', { name: /Voltar ao plano anterior/ }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Voltar ao plano anterior' }).click();
  await expect.poll(async () => JSON.stringify((await stored(page)).catalog.diet)).toBe(JSON.stringify(before.catalog.diet));
  expect((await stored(page)).settings.onboarding).toBeUndefined();
 });
}

test('vegetariana, 3 refeições: só café, almoço e jantar', async ({ page }) => {
 await answer(page, { safety: 'Nenhuma dessas', goal: 'Perder gordura', sex: 'Feminino', age: '25', h: '165', w: '62', style: 'Vegetariano (como ovo e laticínios)', meals: '3' });
 await expect(wiz(page).getByText('3 refeições por dia', { exact: false })).toBeVisible();
 await wiz(page).getByRole('button', { name: 'Começar o plano' }).click();
 await expect.poll(async () => (await stored(page)).catalog.diet.jantar?.[0]?.foods?.length ?? 0).toBeGreaterThan(0);
 await page.goto('./#dieta');
 await expect(page.getByRole('list', { name: 'Refeições' }).getByRole('listitem')).toHaveCount(3);
 const ids = JSON.stringify((await stored(page)).catalog.diet);
 for (const id of ['frango_peito', 'patinho_moido', 'tilapia', 'atum_agua']) expect(ids).not.toContain(id);
});

test('menor de 18: sem cardápio, Dieta com o plano padrão', async ({ page }) => {
 await answer(page, { safety: 'Tenho menos de 18 anos', goal: 'Ganhar massa muscular', sex: 'Masculino', age: '16', h: '170', w: '60' });
 await expect(wiz(page).getByText('Para o seu caso, o ideal é montar a alimentação com nutricionista ou médico.', { exact: false })).toBeVisible();
 const before = JSON.stringify((await stored(page)).catalog.diet);
 await wiz(page).getByRole('button', { name: 'Começar o plano' }).click();
 await expect(wiz(page)).toHaveCount(0);
 // Espera a gravação do plano antes de comparar (senão compara o estado anterior e passa à toa).
 await expect.poll(async () => (await stored(page)).settings.onboarding?.v).toBe(1);
 expect(JSON.stringify((await stored(page)).catalog.diet)).toBe(before);
 await page.goto('./#dieta');
 await expect(page.getByRole('list', { name: 'Refeições' }).getByRole('listitem')).toHaveCount(5);
 await expect(page.getByRole('button', { name: /Trocar este alimento/ })).toHaveCount(0);
});

test('só bater a proteína: só metas, sem cardápio', async ({ page }) => {
 await answer(page, { safety: 'Nenhuma dessas', goal: 'Perder gordura e ganhar massa', sex: 'Masculino', age: '28', h: '175', w: '75', dedication: 'Só bater a proteína' });
 await expect(wiz(page).getByText('Coma do seu jeito.', { exact: false })).toBeVisible();
 await expect(wiz(page).getByText('Proteína:', { exact: false })).toBeVisible();
 const before = JSON.stringify((await stored(page)).catalog.diet);
 await wiz(page).getByRole('button', { name: 'Começar o plano' }).click();
 await expect(wiz(page)).toHaveCount(0);
 await expect.poll(async () => (await stored(page)).settings.onboarding?.answers.food?.dedication).toBe('proteina');
 expect(JSON.stringify((await stored(page)).catalog.diet)).toBe(before);
});
