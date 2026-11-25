import { expect, test, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { backupFile, importBackup } from './support/adr011';

test.use({ viewport: { width: 390, height: 844 } });

const guia: typeof import('../../data/exercise-guide.json') =
 JSON.parse(readFileSync(new URL('../../data/exercise-guide.json', import.meta.url), 'utf8'));
const examples = [
 { id: 'hip_l', route: '#treino/LW', name: 'Hip thrust com barra', count: 2 },
 { id: 'pescoco', route: '#treino/UB', name: 'Isometria de pescoço, 4 direções', count: 1 },
 { id: 'ytw', route: '#treino/livre/executar?ex=ytw', name: 'Y, T e W deitado de bruços', count: 3 },
] as const;

const sheet = (page: Page) => page.getByRole('dialog', { name: 'Como fazer' });
const frame = (page: Page) => sheet(page).locator('img[aria-hidden="false"]');
const fromImages = (url: string) => url.includes('/img/exercise/') && url.endsWith('.webp');
const waitForImage = (image: ReturnType<Page['locator']>) =>
 expect.poll(() => image.evaluate((element: HTMLImageElement) => element.naturalWidth)).toBe(1024);

test.describe('folha de exercícios', () => {
 test.use({ serviceWorkers: 'block' });

 test('carrega sob demanda, alterna os três quadros e pausa por toque', async ({ page }) => {
  await page.clock.install();
  const resources: string[] = [];
  page.on('request', request => resources.push(request.url()));
  await page.goto(examples[2].route);
  const trigger = page.getByRole('button', { name: examples[2].name, exact: true });
  await expect(trigger).toBeVisible();
  expect(resources.some(url => fromImages(url) || url.includes('/ComoFazer-'))).toBe(false);
  await trigger.press('Enter');
  await expect(sheet(page)).toContainText(guia.itens.ytw.erro);
  await expect(sheet(page).getByRole('button', { name: 'Fechar' })).toBeFocused();
  await expect(frame(page)).toHaveAttribute('alt', /formando Y/);
  await expect(frame(page)).toHaveAttribute('alt', /formando T/);
  await expect(frame(page)).toHaveAttribute('alt', /formando W/);
  await expect(frame(page)).toHaveAttribute('alt', /formando Y/);
  await sheet(page).getByRole('button', { name: 'Pausar animação' }).click();
  const paused = await frame(page).getAttribute('src');
  await page.clock.runFor(2200);
  await expect(frame(page)).toHaveAttribute('src', paused!);
  await page.keyboard.press('Escape');
  await expect(trigger).toBeFocused();
 });

 test('mostra o ícone quando falta imagem e quando o servidor devolve 404', async ({ page }) => {
  await page.goto('#treino/livre/executar?ex=rosca_elastico');
  await page.getByRole('button', { name: 'Rosca com elástico', exact: true }).click();
  await expect(sheet(page).getByRole('img', { name: 'Rosca com elástico' })).toBeVisible();
  await expect(sheet(page)).toContainText(guia.itens.rosca_elastico.erro);
  await page.keyboard.press('Escape');

  await page.route('**/hip_l-2.webp', route => route.fulfill({ status: 404 }));
  await page.goto('#treino/LB');
  await page.getByRole('button', { name: examples[0].name, exact: true }).click();
  await expect(sheet(page).locator('.thumb-fallback')).toBeVisible();
  await expect(sheet(page).locator('img')).toHaveCount(0);
 });

 for (const colorScheme of ['light', 'dark'] as const) {
  test(`quadros e capturas da folha no tema ${colorScheme}`, async ({ page }) => {
   await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' });
   for (const example of examples) {
    await page.goto(example.route);
    const trigger = page.getByRole('button', { name: example.name, exact: true });
    await trigger.click();
    await expect(sheet(page)).toContainText(guia.itens[example.id].erro);
    await expect(frame(page)).toHaveCount(example.count);
    for (let index = 0; index < example.count; index++) await waitForImage(frame(page).nth(index));
    await expect(frame(page).first()).toHaveCSS('transition-duration', '0s');
    await expect(sheet(page).getByRole('button', { name: 'Pausar animação' })).toHaveCount(0);
    if (example.count > 1) {
     const first = await frame(page).first().boundingBox();
     const last = await frame(page).last().boundingBox();
     expect(first!.x).toBeLessThan(last!.x);
     expect(first!.y).toBe(last!.y);
    }
    await expect(sheet(page).locator('.cf-art')).toHaveCSS('background-color', 'rgb(247, 247, 248)');
    await expect(frame(page).first()).toHaveCSS('filter', colorScheme === 'dark' ? 'brightness(0.9)' : 'none');
    await page.screenshot({ path: `capturas/ilustracoes/${example.id}-${colorScheme}.png`, animations: 'disabled' });
    await page.keyboard.press('Escape');
    await expect(trigger).toBeFocused();
   }
   await page.emulateMedia({ reducedMotion: 'no-preference' });
   await page.goto(examples[1].route);
   await page.getByRole('button', { name: examples[1].name, exact: true }).click();
   await waitForImage(frame(page));
   await expect(sheet(page).locator('img')).toHaveCount(1);
   await expect(sheet(page).getByRole('button', { name: 'Pausar animação' })).toHaveCount(0);
  });
 }
});

const cachedImages = (page: Page) => page.evaluate(async () => {
 const name = (await caches.keys()).find(cache => cache.endsWith(':exercise'));
 if (!name) return [];
 return (await (await caches.open(name)).keys()).map(request => new URL(request.url).pathname.split('/').at(-1));
});

test('prepara só os exercícios do plano, para no limite e abre a folha offline', async ({ page, context }) => {
 const network: string[] = [];
 context.on('request', request => network.push(request.url()));
 const file = backupFile();
 const plan = file.state.catalog.plan;
 // 21 exercícios com 2 quadros. O 21º deve ficar de fora, assim como toda a biblioteca restante.
 const skipped = new Set(['hip_l', 'hip_b', 'salto_b', 'copen_b', 'pescoco', 'prancha', 'ytw', 'rosca_elastico', 'lat_elastico']);
 const ids = ['hip_b', ...Object.keys(plan.ex).filter(id => !skipped.has(id)).slice(0, 20)];
 expect(ids).toHaveLength(21);
 plan.sess = { LW: { name: 'Lower', ex: ids } };
 plan.order = ['LW'];
 delete plan.alt;
 file.state.settings.sched = [{ k: 'gym', s: 'LW' }, ...Array.from({ length: 6 }, () => ({ k: 'rest' }))];
 await importBackup(page, file);

 const expected = ids.slice(0, 20).flatMap(id => [1, 2].map(n => `${id === 'hip_b' ? 'hip_l' : id}-${n}.webp`));
 await expect.poll(() => cachedImages(page)).toEqual(expected);
 expect(network.filter(fromImages).map(url => new URL(url).pathname.split('/').at(-1))).toEqual(expected);
 expect(network.every(url => new URL(url).origin === new URL(page.url()).origin)).toBe(true);

 // Reabertura refaz o cache quando ele foi removido e o plano já está gravado.
 await page.evaluate(async () => {
  const name = (await caches.keys()).find(key => key.endsWith(':exercise'));
  if (name) await caches.delete(name);
 });
 await page.reload();
 await expect.poll(() => cachedImages(page)).toEqual(expected);
 await context.setOffline(true);
 await page.goto('#treino/LW');
 await page.getByRole('button', { name: examples[0].name, exact: true }).click();
 await waitForImage(frame(page));
 await expect(sheet(page)).toContainText(guia.itens.hip_b.erro);
});

for (const connection of [{ saveData: true, effectiveType: '4g' }, { saveData: false, effectiveType: '3g' }]) {
 test(`pula o pré-carregamento com ${connection.saveData ? 'economia de dados' : 'conexão lenta'}`, async ({ page, context }) => {
  const downloads: string[] = [];
  context.on('request', request => { if (fromImages(request.url())) downloads.push(request.url()); });
  await page.addInitScript(value => {
   Object.defineProperty(navigator, 'connection', { value });
   const idle = window.requestIdleCallback.bind(window);
   window.requestIdleCallback = (handler, options) => idle(deadline => {
    handler(deadline);
    document.documentElement.dataset.exerciseIdle = 'checked';
   }, options);
  }, connection);
  await importBackup(page, backupFile());
  await expect(page.locator('html')).toHaveAttribute('data-exercise-idle', 'checked');
  expect(downloads).toEqual([]);
  expect(await cachedImages(page)).toEqual([]);
 });
}
