import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';

// Atalho "Treino de hoje", treino livre editável na execução e aquecimento manual. Dados sintéticos.
// Regra (qa-ci-tema-escuro.md, qa-ci-treino-livre.md): todo reload espera a gravação no IndexedDB antes.
const json = (f: string) => JSON.parse(readFileSync(new URL(`../../data/${f}`, import.meta.url), 'utf8'));
const START = '2026-10-19'; // segunda; 2026-11-11 (quarta) = semana 4 (leve), dia de Upper A
const backupFull = (days: Record<string, any>) => {
 const plan = json('plan.json');
 return { v: 3, app: 'treino12', exportedAt: Date.now(), state: {
  v: 3, revision: 0,
  catalog: { plan: plan.plan, diet: json('diet.json'), recipes: json('recipes.json'), revision: 0 },
  settings: { start: START, startConfirmed: true, sched: plan.sched, theme: 'auto' },
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
const dia = async (page: Page) => (await state(page)).history?.days?.['2026-11-11'];
const semanaPassada = { '2026-11-04': { workouts: { UA: { sessionId: 'UA', startedAt: 1, finishedAt: 2, status: 'done', sets: 4, volume: 960 } }, log: { supino: Array.from({ length: 4 }, () => ({ kg: '30', reps: '8', done: true })) } } };

test.use({ viewport: { width: 360, height: 800 } });
test.beforeEach(async ({ page }) => {
 const errors: string[] = []; (page as any).__errors = errors;
 page.on('pageerror', e => errors.push(e.message));
 page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
});
test.afterEach(async ({ page }) => { expect((page as any).__errors, 'Sem erros de console').toEqual([]); });

test('Atalho Treino de hoje: em dia de academia abre direto a execução do treino do dia', async ({ page }) => {
 await page.clock.setFixedTime(new Date('2026-11-11T12:00:00'));
 await page.goto('./'); await seed(page, backupFull({}));
 await page.goto('#treino/_/hoje');
 await expect(page).toHaveURL(/#treino\/UA\/executar\?dia=2026-11-11$/);
 await expect(page.getByRole('heading', { name: 'Supino com halteres', level: 2 })).toBeVisible();
 await expect(page.getByText('Exercício 1 de 10')).toBeVisible();
 // O redirecionamento usa replace: voltar não cai de novo no atalho.
 await page.goBack();
 await expect(page).not.toHaveURL(/#treino\/_\/hoje/);
});

test('Atalho Treino de hoje: em dia sem academia cai no Início com a explicação do dia', async ({ page }) => {
 await page.clock.setFixedTime(new Date('2026-11-12T12:00:00')); // quinta: aula de jiu-jitsu
 await page.goto('./'); await seed(page, backupFull({}));
 await page.goto('#treino/_/hoje');
 await expect(page).toHaveURL(/#inicio$/);
 await expect(page.getByRole('heading', { name: 'Aula de jiu-jitsu', level: 2 })).toBeVisible();
});

test('Treino livre: adicionar exercício na execução sem perder séries; reordenar e remover só o que não começou', async ({ page }) => {
 await page.clock.setFixedTime(new Date('2026-11-11T12:00:00'));
 await page.goto('./'); await seed(page, backupFull({}));
 await page.goto('#treino/livre/executar?ex=supino'); await page.reload();
 await page.getByLabel('Repetições, série 1').fill('8');
 await page.getByLabel('Carga (kg), série 1').fill('20');
 await page.getByRole('button', { name: 'Série 1 concluída' }).click();
 await expect.poll(async () => (await dia(page))?.log?.supino?.[0]?.done === true).toBe(true);
 // Digitado e ainda não concluído também não se perde ao adicionar.
 await page.getByLabel('Repetições, série 2').fill('7');
 // Exercício já começado: sem mover nem remover.
 await page.getByRole('button', { name: 'Mais opções de Supino com halteres' }).click();
 await expect(page.getByRole('menuitem', { name: 'Ver exercício' })).toBeVisible();
 await expect(page.getByRole('menuitem', { name: 'Remover do treino' })).toHaveCount(0);
 await page.keyboard.press('Escape');
 await page.getByRole('button', { name: 'Adicionar exercício' }).click();
 const sheet = page.getByRole('dialog', { name: 'Adicionar exercício' });
 await expect(sheet.getByLabel('Buscar exercício')).toBeFocused();
 await sheet.getByLabel('Buscar exercício').fill('agach');
 await expect(sheet.getByRole('button', { name: /^Supino com halteres/ })).toHaveCount(0);
 await sheet.getByRole('button', { name: /^Agachamento com barra/ }).click();
 await expect(page).toHaveURL(/\?ex=supino,agach$/);
 await expect(page.getByRole('heading', { name: 'Agachamento com barra', level: 2 })).toBeVisible();
 await expect(page.getByText('Exercício 2 de 2')).toBeVisible();
 await page.getByRole('button', { name: 'Adicionar exercício' }).click();
 await page.getByRole('dialog', { name: 'Adicionar exercício' }).getByLabel('Buscar exercício').fill('puxada');
 await page.getByRole('dialog', { name: 'Adicionar exercício' }).getByRole('button', { name: /^Puxada na frente/ }).click();
 await expect(page).toHaveURL(/\?ex=supino,agach,puxada$/);
 await expect(page.getByText('Exercício 3 de 3')).toBeVisible();
 // Reordenar: a puxada sobe uma posição e continua em foco.
 await page.getByRole('button', { name: 'Mais opções de Puxada na frente, pegada aberta' }).click();
 await page.getByRole('menuitem', { name: 'Mover para cima' }).click();
 await expect(page).toHaveURL(/\?ex=supino,puxada,agach$/);
 await expect(page.getByText('Exercício 2 de 3')).toBeVisible();
 await expect(page.getByRole('heading', { name: 'Puxada na frente, pegada aberta', level: 2 })).toBeVisible();
 // Remover: sai da lista e o foco vai ao vizinho.
 await page.getByRole('button', { name: 'Mais opções de Puxada na frente, pegada aberta' }).click();
 await page.getByRole('menuitem', { name: 'Remover do treino' }).click();
 await expect(page).toHaveURL(/\?ex=supino,agach$/);
 await expect(page.getByText('Exercício 2 de 2')).toBeVisible();
 // As séries do supino continuam (a concluída e a digitada), também depois de recarregar.
 await page.getByRole('button', { name: 'Exercício anterior' }).click();
 await expect(page.getByRole('button', { name: 'Série 1 concluída' })).toHaveAttribute('aria-pressed', 'true');
 await expect(page.getByLabel('Repetições, série 2')).toHaveValue('7');
 await expect.poll(async () => (await dia(page))?.log?.supino?.[1]?.reps).toBe('7');
 await page.reload();
 await expect(page.getByRole('heading', { name: 'Supino com halteres', level: 2 })).toBeVisible();
 await expect(page.getByRole('button', { name: 'Série 1 concluída' })).toHaveAttribute('aria-pressed', 'true');
 await expect(page.getByLabel('Repetições, série 2')).toHaveValue('7');
});

test('Aquecimento manual: dispensar a linha A sugerida, marcar e desmarcar uma série; fora das séries contadas', async ({ page }) => {
 await page.clock.setFixedTime(new Date('2026-11-11T12:00:00'));
 await page.goto('./'); await seed(page, backupFull(semanaPassada));
 await page.goto('#treino/UA/executar?dia=2026-11-11'); await page.reload();
 await expect(page.getByRole('heading', { name: 'Supino com halteres', level: 2 })).toBeVisible();
 // Dispensar a sugerida: some da tela e não é gravada.
 await page.getByRole('button', { name: 'Opções do aquecimento 1' }).click();
 await page.getByRole('menuitem', { name: 'Dispensar aquecimento' }).click();
 await expect(page.getByRole('button', { name: 'Aquecimento 1 concluída' })).toHaveCount(0);
 await expect.poll(async () => { const log = (await dia(page))?.log?.supino; return Array.isArray(log) && log.length > 0 && log.every((s: any) => s.kind !== 'warm' && !s.done); }).toBe(true);
 await page.reload();
 await expect(page.getByRole('button', { name: 'Série 1 concluída' })).toBeVisible();
 await expect(page.getByRole('button', { name: 'Aquecimento 1 concluída' })).toHaveCount(0);
 // Marcar a série 1 como aquecimento pelo menu da série, só com teclado.
 await page.getByRole('button', { name: 'Opções da série 1' }).focus();
 await page.keyboard.press('Enter');
 await expect(page.getByRole('menuitem', { name: 'Marcar como aquecimento' })).toBeFocused();
 await page.keyboard.press('Enter');
 await expect(page.getByRole('button', { name: 'Aquecimento 1 concluída' })).toBeVisible();
 await page.getByLabel('Repetições, aquecimento 1').fill('10');
 await page.getByLabel('Carga (kg), aquecimento 1').fill('12');
 await page.getByRole('button', { name: 'Aquecimento 1 concluída' }).click();
 await expect.poll(async () => (await dia(page))?.log?.supino?.[0]).toMatchObject({ kg: '12', reps: '10', done: true, kind: 'warm' });
 // Aquecimento não conta como série: o treino ainda não pode ser concluído.
 await expect(page.getByRole('button', { name: 'Concluir treino' })).toBeDisabled();
 expect((await dia(page)).workouts?.UA?.sets ?? 0).toBe(0);
 // Desmarcar: volta a ser a série 1 de trabalho e passa a contar.
 await page.getByRole('button', { name: 'Opções do aquecimento 1' }).click();
 await expect(page.getByRole('menuitem', { name: 'Dispensar aquecimento' })).toHaveCount(0); // já feito: não se dispensa
 await page.getByRole('menuitem', { name: 'Marcar como série de trabalho' }).click();
 await expect(page.getByRole('button', { name: 'Série 1 concluída' })).toHaveAttribute('aria-pressed', 'true');
 await expect.poll(async () => { const d = await dia(page); return [d?.log?.supino?.[0]?.kind ?? null, d?.workouts?.UA?.sets]; }).toEqual([null, 1]);
 await expect(page.getByRole('button', { name: 'Concluir treino' })).toBeEnabled();
});
