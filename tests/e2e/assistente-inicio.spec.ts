import { test, expect, type Page } from '@playwright/test';

// Assistente de início (ADR 008). Dados sintéticos; nada pessoal.
const stored = (page: Page) => page.evaluate(async () => {
 const name = (await indexedDB.databases()).find(d => d.name?.startsWith('treino12'))!.name!;
 const db: IDBDatabase = await new Promise((res, rej) => { const r = indexedDB.open(name); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
 const state: any = await new Promise((res, rej) => { const r = db.transaction('state').objectStore('state').get('active'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
 db.close();
 return state;
});
const wiz = (page: Page) => page.locator('.as[role=dialog]');
const next = (page: Page) => wiz(page).getByRole('button', { name: 'Continuar' }).click();
const noHScroll = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);

test.use({ viewport: { width: 360, height: 800 } });
test.beforeEach(async ({ page }) => {
 const errors: string[] = []; (page as any).__errors = errors;
 page.on('pageerror', e => errors.push(e.message));
 page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
});
test.afterEach(async ({ page }) => { expect((page as any).__errors, 'Sem erros de console').toEqual([]); });

async function answer(page: Page, opts: { safety: string; sport?: boolean; body?: boolean }) {
 await page.goto('./');
 await wiz(page).getByRole('button', { name: 'Montar meu plano' }).click();
 await expect(wiz(page).getByRole('heading', { level: 1 })).toBeFocused();
 await expect(wiz(page).getByText('Passo 1 de 9')).toBeVisible();
 // Nada pré-marcado no passo de segurança.
 for (const c of await wiz(page).getByRole('checkbox').all()) await expect(c).not.toBeChecked();
 await expect(wiz(page).getByRole('button', { name: 'Continuar' })).toHaveAttribute('aria-disabled', 'true');
 await expect(wiz(page).getByText('Marque uma opção para continuar.')).toBeVisible();
 await wiz(page).getByText(opts.safety, { exact: false }).click();
 await next(page);
 await wiz(page).getByText('Perder gordura').click(); await next(page);
 await wiz(page).getByText('Nunca treinei').click(); await next(page);
 await next(page); await next(page); await next(page);
 await expect(wiz(page).getByText('Passo 7 de 9')).toBeVisible();
 if (opts.sport) {
  await wiz(page).getByText('Esporte', { exact: true }).click();
  await page.getByLabel('Qual esporte?').fill('Futebol');
  await wiz(page).getByText('Sáb', { exact: true }).click();
  await next(page);
 } else await wiz(page).getByRole('button', { name: 'Pular' }).click();
 if (opts.body) {
  await wiz(page).getByText('Masculino').click();
  await page.getByLabel('Idade').fill('30'); await page.getByLabel('Altura (cm)').fill('175'); await page.getByLabel('Peso (kg)').fill('80');
  await next(page);
 } else await wiz(page).getByRole('button', { name: 'Pular' }).click();
 await expect(wiz(page).getByRole('heading', { level: 1, name: 'Começar quando?' })).toBeFocused();
 await page.keyboard.press('Enter');
 await expect(wiz(page).getByRole('heading', { level: 1, name: 'Seu plano' })).toBeVisible();
 expect(await noHScroll(page)).toBe(true);
}

test('montar o plano grava, mostra o esporte e permite desfazer', async ({ page }) => {
 await answer(page, { safety: 'Nenhuma dessas', sport: true, body: true });
 await expect(wiz(page).getByText('Meta de calorias: de', { exact: false })).toBeVisible();
 await expect(wiz(page).getByText('Futebol')).toBeVisible();
 // Escape volta um passo; Alterar volta ao resumo.
 await page.keyboard.press('Escape');
 await expect(wiz(page).getByRole('heading', { level: 1, name: 'Começar quando?' })).toBeVisible();
 await next(page);
 await wiz(page).getByRole('button', { name: 'Alterar dados da dieta' }).click();
 await wiz(page).getByRole('button', { name: 'Voltar ao resumo' }).click();
 await wiz(page).getByRole('button', { name: 'Começar o plano' }).click();
 await expect(wiz(page)).toHaveCount(0);
 await expect.poll(async () => (await stored(page)).settings.onboarding?.v).toBe(1);
 const s = await stored(page);
 expect(s.settings.startConfirmed).toBe(true);
 expect(s.settings.sched.some((d: any) => d.k === 'esporte' && d.label === 'Futebol')).toBe(true);
 expect(JSON.stringify(s.settings)).not.toContain('"sex"');
 await page.goto('./#treino');
 await expect(page.getByText('Futebol').first()).toBeVisible();
 // Perfil: voltar ao plano anterior.
 await page.goto('./#perfil');
 await page.getByRole('button', { name: /Voltar ao plano anterior/ }).click();
 await page.getByRole('dialog').getByRole('button', { name: 'Voltar ao plano anterior' }).click();
 await expect.poll(async () => (await stored(page)).settings.sched.some((d: any) => d.k === 'esporte')).toBe(false);
});

test('segurança: sem metas calculadas e aviso no resumo', async ({ page }) => {
 await answer(page, { safety: 'transtorno alimentar', body: true });
 await expect(wiz(page).getByText('O app não vai calcular calorias', { exact: false })).toBeVisible();
 await expect(wiz(page).getByText('Meta de calorias: de', { exact: false })).toHaveCount(0);
 await wiz(page).getByRole('button', { name: 'Começar o plano' }).click();
 await expect.poll(async () => (await stored(page)).settings.onboarding?.hideDietNumbers).toBe(true);
 await page.goto('./#dieta');
 await expect(page.getByText('sem números de metas', { exact: false })).toBeVisible();
 await expect(page.getByText('Meta diária')).toHaveCount(0);
});

test('refazer abre preenchido, nunca sozinho, e o toast desfaz', async ({ page }) => {
 await answer(page, { safety: 'Nenhuma dessas' });
 await wiz(page).getByRole('button', { name: 'Começar o plano' }).click();
 await expect.poll(async () => (await stored(page)).settings.onboarding?.v).toBe(1);
 await page.evaluate(() => sessionStorage.clear());
 await page.reload();
 await expect(page.getByText('Salvo neste aparelho', { exact: true })).toBeVisible();
 await expect(wiz(page)).toHaveCount(0);
 await page.goto('./#perfil');
 await page.getByRole('button', { name: /Refazer meu plano/ }).click();
 await expect(wiz(page).getByText('Passo 1 de 9')).toBeVisible();
 await wiz(page).getByText('Nenhuma dessas').click(); await next(page);
 await expect(wiz(page).getByRole('radio', { name: 'Perder gordura' })).toBeChecked();
 for (let i = 0; i < 5; i++) await next(page);
 await wiz(page).getByRole('button', { name: 'Pular' }).click();
 await wiz(page).getByRole('button', { name: 'Pular' }).click();
 await expect(wiz(page).getByText('Passo 9 de 9')).toBeVisible();
 await expect(wiz(page).getByRole('radio', { name: /Manter a data atual/ })).toBeChecked();
 await next(page);
 await expect(wiz(page).getByText('Seus registros, notas e medidas continuam salvos', { exact: false })).toBeVisible();
 const before = (await stored(page)).revision;
 await wiz(page).getByRole('button', { name: 'Começar o plano' }).click();
 await expect.poll(async () => (await stored(page)).revision).toBeGreaterThan(before);
 const applied = (await stored(page)).revision;
 await page.getByRole('button', { name: 'Desfazer' }).click();
 await expect.poll(async () => (await stored(page)).revision).toBeGreaterThan(applied);
});
