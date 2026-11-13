import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';

// Dados inteiramente sintéticos. O relógio do navegador é fixado em cada teste.
const START_SEMANA_4 = '2026-10-19'; // segunda-feira; 2026-11-11 (quarta) cai na semana 04, deload
const backup = (start: string) => ({ v: 2, start });
const json = (f: string) => JSON.parse(readFileSync(new URL(`../../data/${f}`, import.meta.url), 'utf8'));
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const addDays = (day: string, n: number) => { const [y, m, d] = day.split('-').map(Number); return iso(new Date(y, m - 1, d + n)); };
// Backup completo (v3) com dias sintéticos, para dados de várias semanas.
const backupFull = (start: string, days: Record<string, any>, settings: Record<string, any> = {}) => {
 const plan = json('plan.json');
 return { v: 3, app: 'treino12', exportedAt: Date.now(), state: {
  v: 3, revision: 0,
  catalog: { plan: plan.plan, diet: json('diet.json'), recipes: json('recipes.json'), revision: 0 },
  settings: { start, sched: plan.sched, theme: 'auto', ...settings },
  history: { days, measurements: {} }, snapshots: {}, recovery: {},
  meta: { initializedAt: 1, updatedAt: 1, migrationCompleted: true, migrationStatus: 'none', migrationWarnings: [], lastBackupGeneratedAt: null, lastBackupConfirmedAt: null },
 } };
};
const START_SEMANA_6 = '2026-10-05'; // segunda-feira; 2026-11-11 (quarta) cai na semana 6 (índice 5)
// Semanas de índice 2, 3 e 4: duas aulas de jiu-jitsu por semana e Upper A com carga estável ou subindo.
function tresSemanas(): Record<string, any> {
 const days: Record<string, any> = {};
 [[2, 40], [3, 35], [4, 42]].forEach(([w, kg]) => {
  const mon = addDays(START_SEMANA_6, w * 7);
  days[mon] = { acts: { bjj: true }, feel: 3 };
  days[addDays(mon, 3)] = { acts: { bjj: true }, feel: 3 };
  days[addDays(mon, 2)] = { acts: { gym: true }, workouts: { UA: { sessionId: 'UA', startedAt: 1, finishedAt: 2, status: 'done', sets: 1, volume: kg * 8 } }, log: { supino: [{ kg: String(kg), reps: '8', done: true }] } };
 });
 return days;
}

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
async function seed(page: Page, start: string, full?: object) {
 await page.goto('#perfil');
 await expect(page.getByText('Salvo neste aparelho', { exact: true })).toBeVisible();
 await page.locator('#backup-cabeca').click(); // seção de backup do Perfil começa recolhida
 await page.locator('#backup-file').setInputFiles({ name: 'fixture-SINTETICO.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(full ?? backup(start))) });
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
 await expect(page.getByRole('progressbar', { name: 'Semana 4 de 12: 33% do plano' })).toBeVisible();
 const seg = page.getByRole('button', { name: 'Treino', exact: true });
 await expect(seg).toHaveAttribute('aria-pressed', 'true');
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
 await page.getByRole('button', { name: 'Usar este dia' }).click();
 await expect(page.getByRole('button', { name: 'Marcar aula como feita' })).toBeVisible();
});

test('Início: pré-semana mostra a contagem de dias', async ({ page }, info) => {
 await page.clock.setFixedTime(new Date('2026-11-12T12:00:00'));
 await page.goto('./');
 await expect(page.getByText('Salvo neste aparelho', { exact: true })).toBeVisible();
 await expect(page.getByText('Seu plano começa em 4 dias')).toBeVisible();
 await expect(page.getByText('Antes do plano')).toHaveCount(0);
 // Quinta-feira é dia de jiu-jitsu na rotina: cartão do dia e, abaixo, o primeiro treino de academia.
 await expect(page.getByText('Treino de hoje · quinta-feira')).toBeVisible();
 await expect(page.getByRole('heading', { name: 'Aula de jiu-jitsu', level: 2 })).toBeVisible();
 await expect(page.getByText('Primeiro treino do plano')).toBeVisible();
 await expect(page.getByRole('button', { name: 'Começar o plano hoje' })).toBeVisible();
 await expect(page.getByRole('link', { name: 'Treinar agora (sem alterar o plano)' })).toHaveAttribute('href', /#treino\/\w+\/executar/);
 expect(await noHScroll(page)).toBe(true);
 await page.screenshot({ path: info.outputPath('inicio-pre-360.png'), fullPage: true });
 // Treinar agora não mexe na data de início.
 expect((await state(page)).settings.start).toBe('2026-11-16');
 await page.getByRole('button', { name: 'Começar o plano hoje' }).click();
 await page.getByRole('button', { name: 'Começar o plano', exact: true }).click();
 await expect(page.getByText('Semana 01 de 12', { exact: true })).toBeVisible();
 await expect.poll(async () => (await state(page)).settings.start).toBe('2026-11-09');
 await expect(page.getByText("Plano começa em 09/11").first()).toBeVisible();
});

test('Perfil: mudar a data de início grava a segunda-feira, desfaz e vale após recarregar', async ({ page }) => {
 await page.clock.setFixedTime(new Date('2026-11-12T12:00:00')); // quinta-feira
 await page.goto('./');
 await expect(page.getByText('Salvo neste aparelho', { exact: true })).toBeVisible();
 await expect(page.getByText('Seu plano começa em 4 dias')).toBeVisible();
 await page.goto('#perfil');
 await page.getByRole('button', { name: /Meu plano/ }).click();
 const dlg = page.getByRole('dialog', { name: 'Data de início do plano' });
 await expect(dlg).toBeVisible();
 await dlg.getByLabel('Data de início').fill('3000-01-01');
 await dlg.getByRole('button', { name: 'Salvar', exact: true }).click();
 await expect(dlg.getByRole('alert')).toContainText('2020 e 2100');
 await dlg.getByLabel('Data de início').fill('2026-11-25'); // quarta -> segunda 23/11
 await expect(dlg).toContainText('(23/11)');
 await dlg.getByRole('button', { name: 'Salvar', exact: true }).click();
 await expect(page.getByText("Plano começa em 23/11").first()).toBeVisible();
 await expect.poll(async () => (await state(page)).settings.start).toBe('2026-11-23');
 await page.getByRole('button', { name: 'Desfazer' }).click();
 await expect.poll(async () => (await state(page)).settings.start).toBe('2026-11-16');
 await page.getByRole('button', { name: /Meu plano/ }).click();
 await page.getByRole('button', { name: 'Começar esta semana' }).click();
 await expect.poll(async () => (await state(page)).settings.start).toBe('2026-11-09');
 await page.goto('#inicio'); await page.reload();
 await expect(page.getByText('Semana 01 de 12', { exact: true })).toBeVisible();
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
 await expect(page.locator('.ui-toast')).toContainText('Treino de hoje: Upper B');
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

test('Início: treino previsto concluído mostra Concluído hoje, Ver resultado e Fazer outro treino; lista os demais treinos do dia', async ({ page }, info) => {
 await page.clock.setFixedTime(new Date('2026-11-11T12:00:00'));
 await page.goto('./');
 const days = { '2026-11-11': { acts: { gym: true }, workouts: {
  UA: { sessionId: 'UA', startedAt: 1, finishedAt: 5, status: 'done', sets: 3, volume: 900 },
  UB: { sessionId: 'UB', startedAt: 10, status: 'partial', sets: 1, volume: 100 } } } };
 await seed(page, START_SEMANA_6, backupFull(START_SEMANA_6, days));
 await expect(page.getByText('Concluído hoje', { exact: true })).toBeVisible();
 await expect(page.getByRole('heading', { name: 'Upper A', level: 2 })).toBeVisible();
 await expect(page.getByRole('link', { name: 'Ver resultado' })).toHaveAttribute('href', /#treino\/UA\/concluido/);
 await expect(page.getByRole('link', { name: 'Começar treino' })).toHaveCount(0);
 await expect(page.getByText('Outros treinos de hoje')).toBeVisible();
 await expect(page.locator('.in-others').getByText('Em andamento')).toBeVisible();
 await expect(page.locator('.in-others').getByRole('link', { name: 'Continuar treino' })).toHaveAttribute('href', /#treino\/UB\/executar/);
 await page.screenshot({ path: info.outputPath('inicio-varios-360.png'), fullPage: true });
 await page.getByRole('button', { name: 'Fazer outro treino' }).click();
 const dlg = page.getByRole('dialog', { name: 'Fazer outro treino' });
 await expect(dlg.getByRole('link', { name: /^Lower\b/ }).first()).toHaveAttribute('href', /#treino\/LW\/executar/);
 await expect(dlg.getByRole('link', { name: 'Upper A' })).toHaveCount(0);
 await page.keyboard.press('Escape');
 await expect(dlg).toHaveCount(0);
});

test('Início: treino concluído gravado só no campo legado também aparece como Concluído hoje', async ({ page }) => {
 await page.clock.setFixedTime(new Date('2026-11-11T12:00:00'));
 await page.goto('./');
 const days = { '2026-11-11': { acts: { gym: true }, workout: { sessionId: 'UA', startedAt: 1, finishedAt: 5, status: 'done', sets: 3, volume: 900 } } };
 await seed(page, START_SEMANA_6, backupFull(START_SEMANA_6, days));
 await expect(page.getByText('Concluído hoje', { exact: true })).toBeVisible();
 await expect(page.getByRole('link', { name: 'Ver resultado' })).toBeVisible();
});

test('Início: Desmarcar aula oferece Desfazer e devolve a aula e a nota', async ({ page }) => {
 await page.clock.setFixedTime(new Date('2026-11-12T12:00:00'));
 await page.goto('./'); await seed(page, START_SEMANA_4);
 await page.getByRole('button', { name: 'Marcar aula como feita' }).click();
 await page.getByRole('button', { name: 'Nota 4 de 5' }).click();
 await expect.poll(async () => (await state(page)).history.days['2026-11-12']?.feel).toBe(4);
 await page.getByRole('button', { name: 'Desmarcar aula' }).click();
 await expect(page.getByRole('button', { name: 'Marcar aula como feita' })).toBeVisible();
 await page.locator('.ui-toast').getByRole('button', { name: 'Desfazer' }).click();
 await expect(page.getByRole('button', { name: 'Nota 4 de 5' })).toHaveAttribute('aria-pressed', 'true');
 await expect.poll(async () => { const d = (await state(page)).history.days['2026-11-12']; return [d?.acts?.bjj, d?.feel]; }).toEqual([true, 4]);
});

test('Início: o segmentado Dieta troca o cartão principal pelo resumo da dieta e os dois cartões Dieta e Evolução continuam', async ({ page }) => {
 await page.clock.setFixedTime(new Date('2026-11-11T12:00:00'));
 await page.goto('./'); await seed(page, START_SEMANA_4);
 await expect(page.locator('.in-atalho')).toHaveCount(2);
 await expect(page.locator('.in-atalho').first()).toContainText('Seu plano alimentar');
 await expect(page.locator('.in-atalho').nth(1)).toContainText('Acompanhe seus resultados');
 await page.getByRole('button', { name: 'Dieta', exact: true }).click();
 const card = page.getByRole('region', { name: 'Dieta de hoje' });
 await expect(card.getByText(/kcal/).first()).toBeVisible();
 await expect(card.getByRole('progressbar', { name: 'Proteínas' })).toBeVisible();
 await expect(card.getByRole('link', { name: 'Abrir dieta' })).toHaveAttribute('href', /#dieta/);
 await expect(page.getByRole('link', { name: 'Começar treino' })).toHaveCount(0);
 await page.getByRole('button', { name: 'Treino', exact: true }).click();
 await expect(page.getByRole('link', { name: 'Começar treino' })).toBeVisible();
});

test('Início: a 3ª aula só aparece a partir da semana 6', async ({ page }) => {
 await page.clock.setFixedTime(new Date('2026-11-11T12:00:00'));
 await page.goto('./'); await seed(page, START_SEMANA_4);
 await expect(page.getByRole('heading', { name: 'Terceira aula de jiu-jitsu' })).toHaveCount(0);
});

test('Início: 3ª aula com 3 semanas sintéticas mostra critérios, "sem dados" de sono e grava a declaração de sono', async ({ page }, info) => {
 await page.clock.setFixedTime(new Date('2026-11-11T12:00:00'));
 await page.goto('./');
 await seed(page, START_SEMANA_6, backupFull(START_SEMANA_6, tresSemanas()));
 const card = page.getByRole('region', { name: 'Terceira aula de jiu-jitsu' });
 await expect(card).toBeVisible();
 await expect(card.getByText('Aulas: atende')).toBeVisible();
 await expect(card.getByText('Cargas: atende')).toBeVisible();
 await expect(card.getByText('Sono: sem dados')).toBeVisible();
 await expect(card.getByText('Ainda não: falta sono (sem dados).')).toBeVisible();
 await expect(card.getByText('É só uma sugestão', { exact: false })).toBeVisible();
 const sw = card.getByRole('switch', { name: 'Dormi 7 h ou mais nesta semana' });
 await expect(sw).toHaveAttribute('aria-checked', 'false');
 await expect(card.getByText('Desligado', { exact: true })).toBeVisible();
 await page.screenshot({ path: info.outputPath('inicio-3a-aula-360.png'), fullPage: true });
 await sw.click();
 await expect(sw).toHaveAttribute('aria-checked', 'true');
 await expect(card.getByText('Ligado', { exact: true })).toBeVisible();
 await expect.poll(async () => (await state(page)).settings.sleepOk?.['5']).toBe(true);
 await page.reload();
 await expect(page.getByRole('switch', { name: 'Dormi 7 h ou mais nesta semana' })).toHaveAttribute('aria-checked', 'true');
 await page.getByRole('switch', { name: 'Dormi 7 h ou mais nesta semana' }).click();
 await expect.poll(async () => (await state(page)).settings.sleepOk?.['5']).toBeUndefined();
});

test('Início: 3ª aula elegível quando o sono das 3 semanas foi declarado', async ({ page }) => {
 await page.clock.setFixedTime(new Date('2026-11-11T12:00:00'));
 await page.goto('./');
 await seed(page, START_SEMANA_6, backupFull(START_SEMANA_6, tresSemanas(), { sleepOk: { '2': true, '3': true, '4': true } }));
 const card = page.getByRole('region', { name: 'Terceira aula de jiu-jitsu' });
 await expect(card.getByText('Sono: atende')).toBeVisible();
 await expect(card.getByText('Você pode considerar uma 3ª aula', { exact: false })).toBeVisible();
});

test.describe('320 x 640', () => {
 test.use({ viewport: { width: 320, height: 640 } });
 test('Início: botões quebram linha, sem rolagem horizontal nem corte', async ({ page }, info) => {
  await page.clock.setFixedTime(new Date('2026-11-11T12:00:00'));
  await page.goto('./');
  await seed(page, START_SEMANA_6, backupFull(START_SEMANA_6, tresSemanas()));
  expect(await noHScroll(page)).toBe(true);
  for (const b of await page.locator('.in-ghost').all()) expect(await b.evaluate(e => e.scrollWidth <= e.clientWidth + 1)).toBe(true);
  await page.screenshot({ path: info.outputPath('inicio-320.png'), fullPage: true });
 });
});
