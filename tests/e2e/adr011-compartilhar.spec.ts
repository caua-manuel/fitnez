import { test, expect, type Page, type BrowserContext } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { addDays, backupFile, importBackup, readDb, today, watchErrors } from './support/adr011';

// ADR 011, 1.3: compartilhar plano entre dois contextos do navegador (dois "aparelhos"). Dados sintéticos.

const errorsOf = new Map<Page, string[]>();
const watch = (p: Page) => { errorsOf.set(p, watchErrors(p)); return p; };
test.afterEach(() => { for (const [, e] of errorsOf) expect(e, 'Sem exceções nem erros de console').toEqual([]); errorsOf.clear(); });

// Sem Web Share: o app cai no download (caminho determinístico no Chromium de teste).
const noShare = () => { for (const k of ['share', 'canShare']) Object.defineProperty(navigator, k, { configurable: true, value: undefined }); };
async function newDevice(context: BrowserContext) { await context.addInitScript(noShare); return watch(await context.newPage()); }
async function openShare(page: Page) {
 await page.goto('#perfil/compartilhar');
 await expect(page.getByRole('heading', { name: 'Enviar meu plano' })).toBeVisible();
}
const NAME = 'Plano QA Sintético';
const ALLOWED_TOP = ['app', 'v', 'name', 'plan', 'sched'];

test('compartilhar: exportar no aparelho A, importar no B, revisar, aplicar, desfazer; registros intactos', async ({ browser }) => {
 const ctxA = await browser.newContext(), ctxB = await browser.newContext();
 try {
  // Aparelho A: plano de fábrica com uma observação pessoal (não pode sair) e histórico (não pode sair).
  const a = await newDevice(ctxA);
  const fileA = backupFile({ [addDays(today(), -2)]: { log: { supino: [{ kg: '31', reps: '8', done: true }] } } }, { name: 'Pessoa A Sintética' });
  (fileA.state.settings as any).exerciseNotes = { supino: 'NOTA PESSOAL SINTÉTICA' };
  await importBackup(a, fileA);
  await openShare(a);
  await a.getByRole('button', { name: 'Baixar arquivo' }).click();
  // Sem nome: erro junto ao campo, nada baixado.
  await expect(a.getByText('Dê um nome ao plano.')).toBeVisible();
  await expect(a.getByLabel('Nome do plano')).toHaveAttribute('aria-invalid', 'true');
  await a.getByLabel('Nome do plano').fill(NAME);
  await expect(a.getByRole('checkbox', { name: /Incluir observações dos exercícios/ })).not.toBeChecked();
  await expect(a.getByRole('checkbox', { name: /Incluir minha semana de treino/ })).toBeChecked();
  const pending = a.waitForEvent('download');
  await a.getByRole('button', { name: 'Baixar arquivo' }).click();
  const dl = await pending;
  expect(dl.suggestedFilename()).toMatch(/^fitnez-plano-.*\.json$/);
  const text = await readFile((await dl.path())!, 'utf8');
  const shared = JSON.parse(text);
  expect(Object.keys(shared).every(k => ALLOWED_TOP.includes(k))).toBe(true);
  expect(shared).toMatchObject({ app: 'fitnez-plano', v: 1, name: NAME });
  for (const secret of ['Pessoa A Sintética', 'NOTA PESSOAL SINTÉTICA', '"history"', '"meta"', '"recovery"', '"profile"', '"31"']) expect(text).not.toContain(secret);
  expect(Object.values(shared.plan.ex).some((e: any) => 't' in e)).toBe(false); // observações desmarcadas por padrão

  // O "amigo" acrescenta um exercício ao Upper A (arquivo continua dentro da lista branca).
  shared.plan.ex.qa_remada = { n: 'Remada sintética QA', s: [3, 3, 3], r: ['8–10', '8–10', '8–10'], m: 'kg', rest: 90 };
  shared.plan.sess.UA.ex.push('qa_remada');
  const friendFile = { name: 'fitnez-plano-qa.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(shared)) };

  // Aparelho B: outro contexto, com registros próprios.
  const b = await newDevice(ctxB);
  const fileB = backupFile({ [addDays(today(), -1)]: { log: { remada_a: [{ kg: '40', reps: '8', done: true }] } } });
  await importBackup(b, fileB);
  const beforeB = await readDb(b);
  await openShare(b);
  await b.locator('#cp-arquivo').setInputFiles(friendFile);
  const review = b.getByRole('heading', { name: `Revisar “${NAME}”` });
  await expect(review).toBeFocused();
  await expect(b.getByText('1 exercício novo entra no seu catálogo.')).toBeVisible();
  await expect(b.getByText(/exercícios você já tem: o histórico deles continua/)).toBeVisible();
  await expect(b.getByRole('checkbox', { name: /Usar também a semana do amigo/ })).not.toBeChecked();
  await expect(b.getByRole('radio', { name: /Manter a data atual/ })).toBeChecked();
  // Revisar não grava nada.
  expect(await readDb(b)).toEqual(beforeB);

  await b.getByRole('button', { name: 'Usar este plano' }).click();
  await expect(b).toHaveURL(/#inicio$/);
  const toast = b.locator('.ui-toast');
  await expect(toast).toContainText(`Plano “${NAME}” aplicado.`);
  const applied = await readDb(b);
  expect(applied.catalog.plan.ex.qa_remada.n).toBe('Remada sintética QA');
  expect(applied.catalog.plan.sess.UA.ex).toContain('qa_remada');
  expect(applied.history).toEqual(beforeB.history);
  expect(applied.settings.sched).toEqual(beforeB.settings.sched); // semana do amigo desmarcada
  expect(applied.settings.start).toBe(beforeB.settings.start);
  expect(applied.settings.planImport).toMatchObject({ v: 1, name: NAME });
  expect(Object.keys(applied.recovery).some(k => k.startsWith('plan-import-undo:'))).toBe(true);
  expect(applied.revision).toBe(beforeB.revision + 1); // uma gravação só

  // Desfazer pelo aviso: plano e rotina idênticos aos de antes; registros intactos.
  await toast.getByRole('button', { name: 'Desfazer' }).click();
  await expect.poll(async () => (await readDb(b)).catalog.plan).toEqual(beforeB.catalog.plan);
  const undone = await readDb(b);
  expect(undone.settings.sched).toEqual(beforeB.settings.sched);
  expect(undone.history).toEqual(beforeB.history);

  // Aplicar de novo e desfazer pelo Perfil ("Voltar ao plano anterior").
  await openShare(b);
  await b.locator('#cp-arquivo').setInputFiles(friendFile);
  await b.getByRole('button', { name: 'Usar este plano' }).click();
  await expect.poll(async () => !!(await readDb(b)).catalog.plan.ex.qa_remada).toBe(true);
  await b.goto('#perfil');
  await b.getByRole('button', { name: /Voltar ao plano anterior/ }).first().click();
  await b.getByRole('dialog', { name: 'Voltar ao plano anterior?' }).getByRole('button', { name: 'Voltar', exact: true }).click();
  await expect.poll(async () => (await readDb(b)).catalog.plan).toEqual(beforeB.catalog.plan);
  expect((await readDb(b)).history).toEqual(beforeB.history);

  // O aparelho A não mudou com nada disso.
  expect((await readDb(a)).catalog.plan.ex.qa_remada).toBeUndefined();
 } finally { await ctxA.close(); await ctxB.close(); }
});

test('compartilhar: arquivo grande demais e arquivo com campo desconhecido são recusados sem mudar nada', async ({ browser }) => {
 const ctx = await browser.newContext();
 try {
  const page = await newDevice(ctx);
  await importBackup(page, backupFile());
  const before = await readDb(page);
  await openShare(page);
  await page.locator('#cp-arquivo').setInputFiles({ name: 'fitnez-plano-grande.json', mimeType: 'application/json', buffer: Buffer.alloc(300 * 1024, 0x20) });
  await expect(page.getByRole('alert')).toHaveText(/Arquivo grande demais para ser um plano \(máximo 200 KB\)\./);
  await expect(page.getByRole('heading', { name: /^Revisar/ })).toHaveCount(0);
  const bad = { app: 'fitnez-plano', v: 1, name: 'X', plan: { ex: {}, sess: {}, order: [] }, history: {} };
  await page.locator('#cp-arquivo').setInputFiles({ name: 'fitnez-plano-x.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(bad)) });
  await expect(page.getByRole('alert')).toContainText('campo desconhecido');
  await expect(page.getByRole('heading', { name: /^Revisar/ })).toHaveCount(0);
  expect(await readDb(page)).toEqual(before);
 } finally { await ctx.close(); }
});
