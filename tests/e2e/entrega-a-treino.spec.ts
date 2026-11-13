import { test, expect, type Locator, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';

// Dados inteiramente sintéticos; não representam backup real do usuário.
const json = (f: string) => JSON.parse(readFileSync(new URL(`../../data/${f}`, import.meta.url), 'utf8'));
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const addDays = (day: string, n: number) => { const [y, m, d] = day.split('-').map(Number); return iso(new Date(y, m - 1, d + n)); };
const today = () => iso(new Date());
const monday = (day: string) => { const [y, m, d] = day.split('-').map(Number); return addDays(day, -((new Date(y, m - 1, d).getDay() + 6) % 7)); };

interface Fixture { days?: Record<string, any>; longName?: boolean; empty?: boolean; start?: string }
function backup(f: Fixture = {}) {
 const plan = json('plan.json');
 if (f.longName) { plan.plan.sess.LONG = { name: 'Treino' + 'x'.repeat(74), sub: 'Nome muito longo para testar quebra de linha', min: '40', ex: ['supino'] }; plan.plan.order.push('LONG'); }
 if (f.empty) { plan.plan.sess.VAZIO = { name: 'Treino vazio sintético', sub: 'Sem exercícios', min: '30', ex: [] }; plan.plan.order.push('VAZIO'); }
 const state = {
  v: 3, revision: 0,
  catalog: { plan: plan.plan, diet: json('diet.json'), recipes: json('recipes.json'), revision: 0 },
  settings: { start: f.start ?? monday(today()), sched: plan.sched, theme: 'auto' },
  history: { days: f.days ?? {}, measurements: {} }, snapshots: {}, recovery: {},
  meta: { initializedAt: 1, updatedAt: 1, migrationCompleted: true, migrationStatus: 'none', migrationWarnings: [], lastBackupGeneratedAt: null, lastBackupConfirmedAt: null },
 };
 return { v: 3, app: 'treino12', exportedAt: Date.now(), state };
}
async function seed(page: Page, f: Fixture = {}) {
 await page.goto('#perfil'); await page.waitForLoadState('networkidle');
 await expect(page.getByText('Salvo neste aparelho', { exact: true })).toBeVisible();
 await page.locator('#backup-cabeca').click(); // seção de backup do Perfil começa recolhida
 await page.locator('#backup-file').setInputFiles({ name: 'fixture-SINTETICO.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(backup(f))) });
 await page.getByRole('button', { name: 'Confirmar importação', exact: true }).click();
 await expect(page.getByText('Backup importado.', { exact: false })).toBeVisible();
 await page.goto('#treino');
 await expect(page.getByRole('heading', { name: 'Treino', level: 1 })).toBeVisible();
}
const noHScroll = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
async function biblioteca(page: Page) { await page.getByRole('button', { name: 'Biblioteca', exact: true }).click(); }

test.use({ viewport: { width: 360, height: 800 } });
test.beforeEach(async ({ page, context }) => {
 const errors: string[] = []; (page as any).__errors = errors;
 const monitor = (p: Page) => { p.on('pageerror', e => errors.push(e.message)); p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); }); };
 monitor(page); context.on('page', monitor);
});
test.afterEach(async ({ page }) => { expect((page as any).__errors, 'Sem exceções nem erros de console').toEqual([]); });

test('Treino: Biblioteca mostra os 4 treinos reais com duração, exercícios e último dia', async ({ page }) => {
 await seed(page);
 await biblioteca(page);
 const list = page.getByRole('list', { name: 'Treinos da biblioteca' });
 const items = list.getByRole('listitem');
 await expect(items).toHaveCount(4);
 for (const n of ['Upper A', 'Upper B', 'Lower', 'Lower B (opcional)']) await expect(list.getByRole('heading', { name: n, exact: true })).toBeVisible();
 await expect(items.first()).toContainText('10 exercícios');
 await expect(items.first()).toContainText('70 a 80 min');
 await expect(items.first()).toContainText('Ainda não feito');
 expect(await noHScroll(page)).toBe(true);
});

test('Treino: filtro Inferiores mostra Lower e Lower B; busca filtra', async ({ page }) => {
 await seed(page); await biblioteca(page);
 const items = page.getByRole('list', { name: 'Treinos da biblioteca' }).getByRole('listitem');
 await page.getByRole('button', { name: 'Inferiores', exact: true }).click();
 await expect(items).toHaveCount(2);
 await expect(items.nth(0)).toContainText('Lower');
 await expect(items.nth(1)).toContainText('Lower B');
 await page.getByRole('button', { name: 'Superiores', exact: true }).click();
 await expect(items).toHaveCount(2);
 await expect(items.nth(0)).toContainText('Upper A');
 await page.getByRole('button', { name: 'Todos', exact: true }).click();
 await page.getByRole('searchbox', { name: 'Buscar treino' }).fill('upper');
 await expect(items).toHaveCount(2);
 await page.getByRole('searchbox', { name: 'Buscar treino' }).fill('zzz');
 await expect(page.getByText('Nenhum treino encontrado.')).toBeVisible();
});

test('Treino: Meu plano mostra a semana com estados concluído, parcial e pendente', async ({ page }) => {
 const mon = monday(today());
 await seed(page, { days: {
  [addDays(mon, 1)]: { workout: { sessionId: 'LW', startedAt: 1, finishedAt: 2, status: 'done', sets: 10, volume: 100 }, acts: { gym: true } },
  [addDays(mon, 2)]: { workout: { sessionId: 'UA', startedAt: 1, status: 'partial', sets: 3, volume: 30 } },
 } });
 await expect(page.getByText(/Semana 01 de 12/)).toBeVisible();
 await expect(page.getByRole('link', { name: /Lower.*Terça-feira.*Concluído/ })).toBeVisible();
 await expect(page.getByRole('link', { name: /Upper A.*Quarta-feira.*Parcial/ })).toBeVisible();
 await expect(page.getByRole('link', { name: /Upper B.*Sexta-feira.*Pendente/ })).toBeVisible();
 expect(await noHScroll(page)).toBe(true);
});

test('Treino: Detalhe de Upper A lista 10 exercícios sem histórico nem sugestão inventada', async ({ page }) => {
 await seed(page); await biblioteca(page);
 await page.getByRole('link', { name: /Upper A/ }).click();
 await expect(page).toHaveURL(/#treino\/UA$/);
 await expect(page.getByRole('heading', { name: 'Upper A', level: 2 })).toBeVisible();
 await expect(page.getByText('10 exercícios').first()).toBeVisible();
 await expect(page.getByRole('link', { name: 'Começar treino' })).toHaveAttribute('href', new RegExp(`#treino/UA/executar\\?dia=${today()}`));
 await expect(page.getByRole('tab', { name: /Exercícios/ })).toHaveAttribute('aria-selected', 'true');
 const items = page.getByRole('list', { name: 'Exercícios do treino' }).getByRole('listitem');
 await expect(items).toHaveCount(10);
 await expect(items.first()).toContainText('Supino com halteres');
 await expect(items.first()).toContainText('4 séries');
 await expect(items.first()).toContainText('5–8');
 await expect(page.getByText('Sem registro anterior')).toHaveCount(10);
 await expect(page.getByText('Sugestão')).toHaveCount(0);
 expect(await noHScroll(page)).toBe(true);
});

test('Treino: Detalhe mostra último desempenho e sugestão rotulada, sem preencher carga', async ({ page }) => {
 const past = addDays(today(), -3);
 const rows = [1, 2, 3, 4].map(() => ({ kg: '30', reps: '8', done: true }));
 await seed(page, { days: { [past]: { log: { supino: rows, orfao: rows }, workout: { sessionId: 'UA', startedAt: 1, finishedAt: 2, status: 'done', sets: 4, volume: 960 } } } });
 await page.goto('#treino/UA');
 const first = page.getByRole('list', { name: 'Exercícios do treino' }).getByRole('listitem').first();
 await expect(first).toContainText('Último desempenho');
 await expect(first).toContainText('30 kg × 8');
 await expect(first).toContainText('Sugestão');
 await expect(first).toContainText('32,5 kg');
 await expect(page.locator('input')).toHaveCount(0);
 await expect(page.getByText('Sem registro anterior')).toHaveCount(9);
 // Menu de três pontos
 await first.getByRole('button', { name: /Mais opções/ }).click();
 await expect(first.getByRole('link', { name: 'Editar exercício' })).toBeVisible();
 // Histórico: exercício que saiu do plano aparece como removido
 await page.getByRole('tab', { name: 'Histórico' }).click();
 await expect(page.getByText('Exercício removido').first()).toBeVisible();
 await page.getByRole('tab', { name: 'Detalhes' }).click();
 await expect(page.getByText(/Força: peito, costas e ombros/)).toBeVisible();
});

test('Treino: Biblioteca mostra o último dia feito', async ({ page }) => {
 const past = addDays(today(), -3);
 await seed(page, { days: { [past]: { workout: { sessionId: 'UA', startedAt: 1, finishedAt: 2, status: 'done', sets: 4, volume: 960 } } } });
 await biblioteca(page);
 await expect(page.getByRole('listitem').filter({ hasText: 'Upper A' }).first()).not.toContainText('Ainda não feito');
 await expect(page.getByRole('listitem').filter({ hasText: 'Upper A' }).first()).toContainText(/Último treino: \d{2} \w{3}/);
});

test('Treino: nome longo quebra linha sem rolagem horizontal em 360px', async ({ page }) => {
 await seed(page, { longName: true }); await biblioteca(page);
 await expect(page.getByRole('heading', { name: /^Treinoxxxx/ })).toBeVisible();
 expect(await noHScroll(page)).toBe(true);
 await page.goto('#treino/LONG');
 await expect(page.getByRole('heading', { name: /^Treinoxxxx/, level: 2 })).toBeVisible();
 expect(await noHScroll(page)).toBe(true);
});

test('Treino: rota de edição abre o editor do treino', async ({ page }) => {
 await seed(page);
 await page.goto('#treino/UA/editar');
 await expect(page.getByRole('heading', { name: 'Editar treino', level: 2 })).toBeVisible();
});

const lum = (rgb: string) => {
 const [r, g, b] = (rgb.match(/[\d.]+/g) ?? ['0', '0', '0']).slice(0, 3).map(Number).map(v => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; });
 return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a: string, b: string) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const paint = (el: Locator) => el.evaluate(node => {
 let bg = 'rgba(0, 0, 0, 0)', n: Element | null = node;
 while (n) { const c = getComputedStyle(n).backgroundColor; if (!/rgba\(.*, 0\)$/.test(c) && c !== 'transparent') { bg = c; break; } n = n.parentElement; }
 return { color: getComputedStyle(node).color, bg };
});

for (const scheme of ['light', 'dark'] as const) {
 test(`Treino: item Excluir treino do menu ⋮ tem contraste AA (${scheme})`, async ({ page }) => {
  await page.emulateMedia({ colorScheme: scheme });
  await seed(page); await biblioteca(page);
  await page.getByRole('button', { name: 'Mais opções de Upper A' }).click();
  const item = page.getByRole('button', { name: 'Excluir treino', exact: true });
  await expect(item).toBeVisible();
  const { color, bg } = await paint(item);
  expect(color).not.toBe(bg);
  expect(ratio(color, bg)).toBeGreaterThanOrEqual(4.5);
 });
}

test('Treino: Remover do treino no detalhe tem contraste AA', async ({ page }) => {
 await seed(page); await page.goto('#treino/UA');
 await page.getByRole('button', { name: 'Mais opções de Supino com halteres' }).click();
 const item = page.getByRole('button', { name: 'Remover do treino', exact: true });
 const { color, bg } = await paint(item);
 expect(ratio(color, bg)).toBeGreaterThanOrEqual(4.5);
});

test('Treino: busca na Biblioteca acha por nome de exercício e avisa qual', async ({ page }) => {
 await seed(page); await biblioteca(page);
 await page.getByRole('searchbox', { name: /Buscar treino/ }).fill('supino');
 const items = page.getByRole('list', { name: 'Treinos da biblioteca' }).getByRole('listitem');
 await expect(items.first()).toContainText('Upper A');
 await expect(items.first()).toContainText('Tem Supino com halteres');
});

test('Treino: detalhe sem tabela editável, meta em texto e sem "por lado repetições"', async ({ page }) => {
 await seed(page); await page.goto('#treino/UA');
 await expect(page.locator('table')).toHaveCount(0);
 await expect(page.getByText(/Meta: 4 séries/).first()).toBeVisible();
 await expect(page.getByText(/por lado repetições|\ds repetições/)).toHaveCount(0);
 await page.getByRole('tab', { name: 'Detalhes' }).click();
 await expect(page.getByText('Meta da Semana 1 de 12')).toBeVisible();
});

test('Treino: com treino parcial hoje o detalhe oferece Continuar treino', async ({ page }) => {
 await seed(page, { days: { [today()]: { workout: { sessionId: 'UA', startedAt: 1, status: 'partial', sets: 1, volume: 240 }, log: { supino: [{ kg: '30', reps: '8', done: true }] } } } });
 await page.goto('#treino/UA');
 await expect(page.getByRole('link', { name: 'Continuar treino' })).toBeVisible();
 await expect(page.getByRole('link', { name: 'Começar treino' })).toHaveCount(0);
});

const AVISO = 'Calorias, cargas e metas são estimativas e não substituem nutricionista, médico ou educador físico.';

for (const scheme of ['light', 'dark'] as const) {
 test(`Treino: estados ativos e selecionados têm contraste AA (${scheme})`, async ({ page }) => {
  await page.emulateMedia({ colorScheme: scheme });
  await seed(page);
  await page.waitForTimeout(300); // fim de qualquer transição de cor
  const alvos: Locator[] = [page.getByRole('button', { name: 'Meu plano', exact: true })];
  await biblioteca(page);
  await page.waitForTimeout(300);
  alvos.push(page.getByRole('button', { name: 'Biblioteca', exact: true }), page.getByRole('button', { name: 'Todos', exact: true }));
  await page.getByRole('button', { name: 'Superiores', exact: true }).click();
  alvos.push(page.getByRole('button', { name: 'Superiores', exact: true }));
  for (const a of alvos) {
   const pressed = await a.getAttribute('aria-pressed');
   if (pressed !== 'true') continue;
   const { color, bg } = await paint(a);
   expect(ratio(color, bg), `${await a.innerText()} ativo`).toBeGreaterThanOrEqual(4.5);
  }
  await page.goto('#treino/UA');
  await page.waitForTimeout(300);
  for (const nome of [/^Exercícios/, 'Detalhes', 'Histórico']) {
   const tab = page.getByRole('tab', { name: nome });
   await tab.click(); await page.waitForTimeout(300);
   expect(await tab.getAttribute('aria-selected')).toBe('true');
   const { color, bg } = await paint(tab);
   expect(ratio(color, bg), `aba ${nome} selecionada`).toBeGreaterThanOrEqual(4.5);
   const outra = page.getByRole('tab', { selected: false }).first();
   const o = await paint(outra);
   expect(ratio(o.color, o.bg), 'aba não selecionada').toBeGreaterThanOrEqual(4.5);
  }
 });
}

test('Treino: aviso de saúde no fim de Meu plano, Biblioteca e Detalhe', async ({ page }) => {
 await seed(page);
 await expect(page.getByText(AVISO, { exact: true })).toBeVisible();
 await biblioteca(page);
 await expect(page.getByText(AVISO, { exact: true })).toBeVisible();
 await page.goto('#treino/UA');
 await expect(page.getByText(AVISO, { exact: true })).toBeVisible();
 await page.getByRole('tab', { name: 'Histórico' }).click();
 await expect(page.getByText(AVISO, { exact: true })).toBeVisible();
});

test('Treino: treino sem exercícios mostra aviso e não deixa começar; execução explica', async ({ page }) => {
 await seed(page, { empty: true });
 await page.goto('#treino/VAZIO');
 await expect(page.getByText('Este treino ainda não tem exercícios.')).toBeVisible();
 await expect(page.getByRole('link', { name: 'Começar treino' })).toHaveAttribute('aria-disabled', 'true');
 expect(await noHScroll(page)).toBe(true);
 await page.goto(`#treino/VAZIO/executar?dia=${today()}`);
 await expect(page.getByText('Este treino não tem exercícios.')).toBeVisible();
 await expect(page.getByRole('link', { name: 'Editar treino' })).toBeVisible();
});

test('Treino: busca sem resultado mostra lista vazia com Limpar busca', async ({ page }) => {
 await seed(page); await biblioteca(page);
 await page.getByRole('searchbox', { name: /Buscar treino/ }).fill('zzzzqq');
 await expect(page.getByText('Nenhum treino encontrado.')).toBeVisible();
 await page.getByRole('button', { name: 'Limpar busca' }).click();
 await expect(page.getByRole('list', { name: 'Treinos da biblioteca' }).getByRole('listitem')).toHaveCount(4);
});
