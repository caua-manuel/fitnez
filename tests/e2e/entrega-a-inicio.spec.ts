import { test, expect, type Page } from '@playwright/test';

// Dados inteiramente sintéticos. O relógio do navegador é fixado em cada teste.
const START_SEMANA_4 = '2026-10-19'; // segunda-feira; 2026-11-11 (quarta) cai na semana 04, deload
const backup = (start: string) => ({ v: 2, start });

async function state(page: Page): Promise<any> {
 return page.evaluate(async () => {
  const dbs = await indexedDB.databases();
  const name = dbs.find(d => d.name?.startsWith('treino12:'))!.name!;
  return new Promise((resolve, reject) => {
   const req = indexedDB.open(name);
   req.onerror = () => reject(req.error);
   req.onsuccess = () => {
    const db = req.result; const get = db.transaction(['state']).objectStore('state').get('active');
    get.onsuccess = () => { db.close(); resolve(get.result); }; get.onerror = () => reject(get.error);
   };
  });
 });
}
async function seed(page: Page, start: string) {
 await page.goto('#perfil');
 await expect(page.getByText('Salvo neste aparelho', { exact: true })).toBeVisible();
 await page.locator('#backup-cabeca').click(); // seção de backup do Perfil começa recolhida
 await page.locator('#backup-file').setInputFiles({ name: 'fixture-SINTETICO.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(backup(start))) });
 await page.getByRole('button', { name: 'Confirmar importação', exact: true }).click();
 await expect(page.getByText('Backup importado.', { exact: false })).toBeVisible();
 await page.goto('#inicio'); await page.reload();
 await expect(page.getByRole('heading', { name: 'Início', level: 1 })).toBeVisible();
}
const noHScroll = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);

test.use({ viewport: { width: 360, height: 800 } });
test.beforeEach(async ({ page }) => {
 const errors: string[] = []; (page as any).__errors = errors;
 page.on('pageerror', e => errors.push(e.message));
 page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
});
test.afterEach(async ({ page }) => { expect((page as any).__errors, 'Sem erros de console').toEqual([]); });

test('Início: dia de academia mostra semana, treino da rotina e Começar treino', async ({ page }, info) => {
 await page.clock.setFixedTime(new Date('2026-11-11T12:00:00'));
 await page.goto('./'); await seed(page, START_SEMANA_4);
 await expect(page.getByText('Semana 04 de 12', { exact: true })).toBeVisible();
 await expect(page.getByText('Olá!', { exact: true })).toBeVisible();
 await expect(page.getByText('RIR 4', { exact: false })).toBeVisible();
 await expect(page.getByText('Deload', { exact: false }).first()).toBeVisible();
 await expect(page.getByRole('heading', { name: 'Upper A', level: 2 })).toBeVisible();
 await expect(page.getByText('10 exercícios')).toBeVisible();
 const start = page.getByRole('link', { name: 'Começar treino' });
 await expect(start).toBeVisible();
 await expect(start).toHaveAttribute('href', /#treino\/UA\/executar/);
 await expect(page.getByRole('link', { name: /Dieta/ }).first()).toBeVisible();
 await expect(page.getByRole('link', { name: /Evolução/ }).first()).toBeVisible();
 const body = await page.locator('main').innerText();
 expect(body).not.toContain('João'); expect(body).not.toContain('1.850');
 const top = async (t: string) => (await page.getByText(t, { exact: true }).first().boundingBox())!.y;
 expect(await top('Olá!')).toBeLessThan(await top('Semana 04 de 12'));
 expect(await top('Semana 04 de 12')).toBeLessThan(200);
 await expect(page.locator('.system-status')).toHaveCount(0);
 await expect(page.getByRole('progressbar', { name: 'Semana 4 de 12, 33%' })).toBeVisible();
 const seg = page.getByRole('link', { name: 'Treino', exact: true }).first();
 await expect(seg).toHaveAttribute('aria-current', 'page');
 expect(await seg.evaluate(e => getComputedStyle(e).backgroundColor)).toBe('rgb(10, 88, 240)');
 expect(await noHScroll(page)).toBe(true);
 await page.screenshot({ path: info.outputPath('inicio-academia-360.png'), fullPage: true });
});

test('Início: dia de aula grava acts.bjj e feel', async ({ page }, info) => {
 await page.clock.setFixedTime(new Date('2026-11-12T12:00:00'));
 await page.goto('./'); await seed(page, START_SEMANA_4);
 await page.getByRole('button', { name: 'Marcar aula como feita' }).click();
 await page.getByRole('button', { name: 'Nota 4 de 5' }).click();
 await expect(page.getByRole('button', { name: 'Nota 4 de 5' })).toHaveAttribute('aria-pressed', 'true');
 await expect.poll(async () => (await state(page)).history.days['2026-11-12']?.feel).toBe(4);
 const day = (await state(page)).history.days['2026-11-12'];
 expect(day.acts.bjj).toBe(true);
 await page.reload();
 await expect(page.getByRole('button', { name: 'Nota 4 de 5' })).toHaveAttribute('aria-pressed', 'true');
 expect(await noHScroll(page)).toBe(true);
 await page.screenshot({ path: info.outputPath('inicio-bjj-360.png'), fullPage: true });
});

test('Início: trocar treino de hoje grava over e Registrar outro dia abre outra data', async ({ page }) => {
 await page.clock.setFixedTime(new Date('2026-11-11T12:00:00'));
 await page.goto('./'); await seed(page, START_SEMANA_4);
 await page.getByRole('button', { name: 'Trocar treino', exact: true }).click();
 await page.getByRole('button', { name: /^Lower\b/ }).first().click();
 await expect(page.getByRole('heading', { name: 'Lower', level: 2 })).toBeVisible();
 await expect.poll(async () => (await state(page)).history.days['2026-11-11']?.over).toBe('LW');
 await page.getByRole('button', { name: 'Registrar outro dia' }).click();
 await page.getByLabel('Dia do registro').fill('2026-11-09');
 await expect(page.getByRole('button', { name: 'Marcar aula como feita' })).toBeVisible();
});

test('Início: pré-semana mostra a contagem de dias', async ({ page }, info) => {
 await page.clock.setFixedTime(new Date('2026-11-12T12:00:00'));
 await page.goto('./');
 await expect(page.getByText('Salvo neste aparelho', { exact: true })).toBeVisible();
 await expect(page.getByText('Seu plano começa em 4 dias')).toBeVisible();
 expect(await noHScroll(page)).toBe(true);
 await page.screenshot({ path: info.outputPath('inicio-pre-360.png'), fullPage: true });
});

test('Início: descanso mostra o checklist do condomínio e grava', async ({ page }) => {
 await page.clock.setFixedTime(new Date('2026-11-15T12:00:00')); // domingo
 await page.goto('./'); await seed(page, START_SEMANA_4);
 const first = page.getByRole('button', { name: /^Mobilidade: 90\/90/ });
 await first.click();
 await expect(first).toHaveAttribute('aria-pressed', 'true');
 await expect.poll(async () => (await state(page)).history.days['2026-11-15']?.cond?.['0']).toBe(true);
});

test('Início: Trocar treino abre uma folha acessível, confirma a troca e devolve o foco', async ({ page }) => {
 await page.clock.setFixedTime(new Date('2026-11-11T12:00:00'));
 await page.goto('./'); await seed(page, START_SEMANA_4);
 const trigger = page.getByRole('button', { name: 'Trocar treino', exact: true });
 await trigger.click();
 const dlg = page.getByRole('dialog', { name: 'Escolha o treino do dia' });
 await expect(dlg).toBeVisible();
 await expect.poll(async () => { const b = (await dlg.boundingBox())!; return b.y >= 0 && b.y + b.height <= 801; }).toBe(true); // espera a animação de subida
 const box = (await dlg.boundingBox())!;
 // acima da barra inferior: o ponto sobre a folha é da folha
 expect(await page.evaluate(([x, y]) => !!document.elementFromPoint(x, y)?.closest('[role=dialog]'), [box.x + 20, 800 - 20])).toBe(true);
 await expect(dlg.getByRole('button').first()).toBeFocused();
 await expect(dlg.getByText('Atual')).toBeVisible();
 // Escape fecha e devolve o foco
 await page.keyboard.press('Escape');
 await expect(dlg).toHaveCount(0);
 await expect(trigger).toBeFocused();
 await trigger.click();
 await dlg.getByRole('button', { name: /^Upper B\b/ }).click();
 await expect(dlg).toHaveCount(0);
 await expect(page.getByRole('status').filter({ hasText: 'Treino de hoje: Upper B' })).toBeVisible();
 await expect(page.getByRole('heading', { name: 'Upper B', level: 2 })).toBeVisible();
 await expect(trigger).toBeFocused();
 expect((await state(page)).history.days['2026-11-11'].over).toBe('UB');
});

test('Início: Registrar outro dia abre folha, recusa data futura e usa o dia escolhido', async ({ page }) => {
 await page.clock.setFixedTime(new Date('2026-11-11T12:00:00'));
 await page.goto('./'); await seed(page, START_SEMANA_4);
 await page.getByRole('button', { name: 'Registrar outro dia' }).click();
 const dlg = page.getByRole('dialog', { name: 'Registrar outro dia' });
 await expect(dlg.getByLabel('Dia do registro')).toBeFocused();
 await dlg.getByLabel('Dia do registro').fill('2026-11-12');
 await expect(dlg.getByRole('alert')).toContainText('Escolha hoje ou um dia anterior');
 await dlg.getByLabel('Dia do registro').fill('2026-11-09');
 await dlg.getByRole('button', { name: 'Usar este dia' }).click();
 await expect(dlg).toHaveCount(0);
 await expect(page.getByText('Registrando:', { exact: false }).first()).toBeVisible();
});
