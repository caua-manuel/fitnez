import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';

// Dados inteiramente sintéticos; não representam backup real do usuário.
const json = (f: string) => JSON.parse(readFileSync(new URL(`../../data/${f}`, import.meta.url), 'utf8'));
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const today = () => iso(new Date());
const monday = (day: string) => { const [y, m, d] = day.split('-').map(Number); return iso(new Date(y, m - 1, d - ((new Date(y, m - 1, d).getDay() + 6) % 7))); };

function backup(profile?: Record<string, unknown>) {
 const plan = json('plan.json');
 const state = {
  v: 3, revision: 0,
  catalog: { plan: plan.plan, diet: json('diet.json'), recipes: json('recipes.json'), revision: 0 },
  settings: { start: monday(today()), sched: plan.sched, theme: 'auto', ...(profile ? { profile } : {}) },
  history: { days: {}, measurements: {} }, snapshots: {}, recovery: {},
  meta: { initializedAt: 1, updatedAt: 1, migrationCompleted: true, migrationStatus: 'none', migrationWarnings: [], lastBackupGeneratedAt: null, lastBackupConfirmedAt: null },
 };
 return { v: 3, app: 'treino12', exportedAt: Date.now(), state };
}
async function seed(page: Page, profile?: Record<string, unknown>) {
 await page.goto('#perfil'); await page.waitForLoadState('networkidle');
 await expect(page.getByText('Salvo neste aparelho', { exact: true })).toBeVisible();
 await page.getByRole('button', { name: /Backup e restauração/ }).click();
 await page.locator('#backup-file').setInputFiles({ name: 'fixture-SINTETICO.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(backup(profile))) });
 await page.getByRole('button', { name: 'Confirmar importação', exact: true }).click();
 await expect(page.getByText('Backup importado.', { exact: false })).toBeVisible();
 await page.goto('#dieta');
 await expect(page.getByRole('heading', { name: 'Dieta', level: 1 })).toBeVisible();
}
const noHScroll = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
const ring = (page: Page) => page.getByRole('progressbar', { name: 'Calorias consumidas' });
async function consume(page: Page, meal: string, n: number) {
 await page.goto(`#dieta/${meal}`);
 await page.locator('.dt-opt-main').nth(n).click();
 await page.getByRole('button', { name: 'Marcar como consumido' }).click();
 await expect(page.getByText('Consumido neste dia')).toBeVisible();
}
const tomorrow = () => { const d = new Date(); d.setDate(d.getDate() + 1); return iso(d); };

test.use({ viewport: { width: 360, height: 800 } });
test.beforeEach(async ({ page, context }) => {
 const errors: string[] = []; (page as any).__errors = errors;
 const monitor = (p: Page) => { p.on('pageerror', e => errors.push(e.message)); p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); }); };
 monitor(page); context.on('page', monitor);
});
test.afterEach(async ({ page }) => { expect((page as any).__errors, 'Sem exceções nem erros de console').toEqual([]); });

test('Dieta: tela inicial usa a meta do tipo de dia, avisa e cabe em 360 px', async ({ page }) => {
 await seed(page);
 await expect(page.getByText('Meta diária')).toBeVisible();
 await expect(page.getByText('0 de 5')).toBeVisible();
 await expect(page.getByRole('heading', { name: 'Refeições de hoje' })).toBeVisible();
 for (const n of ['Café da manhã', 'Almoço', 'Pré-treino ou lanche', 'Pós-treino', 'Jantar']) await expect(page.getByRole('list', { name: 'Refeições' }).getByText(n, { exact: true })).toBeVisible();
 await expect(page.getByText('Calorias e proteínas são estimativas', { exact: false })).toBeVisible();
 await expect(page.getByText('Registre seu peso e cintura em Evolução')).toBeVisible();
 await expect(page.getByText('próxima fase', { exact: false })).toHaveCount(0);
 expect(await ring(page).getAttribute('aria-valuemax')).not.toBe('2000');
 expect(await noHScroll(page)).toBe(true);
});

test('Dieta: marcar refeição atualiza anel e totais na hora; trocar opção atualiza de novo', async ({ page }) => {
 await seed(page);
 await consume(page, 'cafe', 0);
 await page.getByRole('link', { name: 'Voltar para a Dieta' }).click();
 await expect(ring(page)).toHaveAttribute('aria-valuenow', '495');
 await expect(page.getByText('1 de 5')).toBeVisible();
 await page.goto('#dieta/cafe');
 await page.locator('.dt-opt-main').nth(1).click();
 await page.getByRole('link', { name: 'Voltar para a Dieta' }).click();
 await expect(ring(page)).toHaveAttribute('aria-valuenow', '501');
 await page.getByRole('button', { name: 'Café da manhã consumido' }).click();
 await expect(page.getByText('0 de 5')).toBeVisible();
 await expect(ring(page)).toHaveAttribute('aria-valuenow', '0');
 expect(await noHScroll(page)).toBe(true);
});

test('Dieta: check da lista sem opção abre a refeição; com opção marca direto', async ({ page }) => {
 await seed(page);
 await page.getByRole('button', { name: 'Escolher opção de Almoço' }).click();
 await expect(page).toHaveURL(/#dieta\/almoco/);
 await page.locator('.dt-opt-main').first().click();
 await page.getByRole('link', { name: 'Voltar para a Dieta' }).click();
 await page.getByRole('button', { name: 'Almoço consumido' }).click();
 await expect(ring(page)).toHaveAttribute('aria-valuenow', '759');
});

test('Dieta: água em copos e creatina persistem após recarregar', async ({ page }) => {
 await seed(page);
 await page.getByRole('button', { name: /^Copo 3 de/ }).click();
 await expect(page.getByText('1,5 L de 3,0 L')).toBeVisible();
 await page.getByRole('button', { name: /^Copo 3 de/ }).click();
 await expect(page.getByText('1,0 L de 3,0 L')).toBeVisible();
 await page.getByRole('button', { name: 'Creatina tomada' }).click();
 await expect(page.getByRole('button', { name: 'Creatina tomada', pressed: true })).toBeVisible();
 await page.waitForTimeout(600);
 await page.reload();
 await expect(page.getByRole('button', { name: 'Creatina tomada', pressed: true })).toBeVisible();
});

test('Dieta: editar opção vale para todos os dias e não altera dia já registrado', async ({ page }) => {
 await seed(page);
 await consume(page, 'cafe', 0);
 await page.getByRole('link', { name: 'Gerenciar opções' }).click();
 await page.getByRole('button', { name: /^Mais ações da opção 1/ }).click();
 await page.getByRole('menuitem', { name: 'Editar' }).click();
 await page.getByLabel('Nome', { exact: true }).fill('Café editado');
 await page.getByLabel('Calorias (kcal)').fill('100,5');
 await page.getByRole('button', { name: 'Salvar opção' }).click();
 await expect(page.getByText('Café editado')).toBeVisible();
 await page.getByRole('link', { name: 'Voltar para a Dieta' }).click();
 await expect(ring(page)).toHaveAttribute('aria-valuenow', '495');
 await expect(page.getByText('Opção 1 · Ovos, pão e leite')).toBeVisible();
 await page.goto(`#dieta/cafe?dia=${tomorrow()}`);
 await expect(page.getByText('Café editado')).toBeVisible();
 await expect(page.getByText('101 kcal')).toBeVisible();
});

test('Dieta: adicionar opção valida, preserva a entrada e aceita vírgula', async ({ page }) => {
 await seed(page);
 await page.goto('#dieta/jantar/gerenciar');
 await page.getByRole('button', { name: 'Adicionar nova opção' }).click();
 await page.getByLabel('Nome', { exact: true }).fill('Sopa de legumes');
 await page.getByLabel('Calorias (kcal)').fill('abc');
 await page.getByRole('button', { name: 'Salvar opção' }).click();
 await expect(page.getByText('Informe pelo menos um item', { exact: false })).toBeVisible();
 await expect(page.getByText('use só números', { exact: false })).toBeVisible();
 await expect(page.getByLabel('Nome', { exact: true })).toHaveValue('Sopa de legumes');
 await page.getByLabel('Itens (um por linha)').fill('Legumes 300 g\nFrango 100 g');
 await page.getByLabel('Calorias (kcal)').fill('320,5');
 await page.getByLabel('Proteína (g)').fill('28,5');
 await page.getByLabel('Carboidrato (g)').fill('30');
 await page.getByLabel('Gordura (g)').fill('8');
 await page.getByRole('button', { name: 'Salvar opção' }).click();
 const list = page.getByRole('list', { name: /^Opções de/ });
 await expect(list.getByRole('listitem')).toHaveCount(4);
 await expect(list.getByText('Sopa de legumes')).toBeVisible();
 await expect(list.getByText('Opção 4')).toBeVisible();
 expect(await noHScroll(page)).toBe(true);
});

test('Dieta: excluir pede confirmação e Desfazer restaura a opção', async ({ page }) => {
 await seed(page);
 await page.goto('#dieta/lanche/gerenciar');
 const list = page.getByRole('list', { name: /^Opções de/ });
 await expect(list.getByRole('listitem')).toHaveCount(3);
 await page.getByRole('button', { name: /^Mais ações da opção 2/ }).click();
 await page.getByRole('menuitem', { name: 'Excluir' }).click();
 const dialog = page.getByRole('dialog');
 await expect(dialog).toContainText('Excluir');
 await expect(dialog.getByRole('button', { name: 'Cancelar' })).toBeFocused();
 await dialog.getByRole('button', { name: 'Excluir opção' }).click();
 await expect(list.getByRole('listitem')).toHaveCount(2);
 await page.getByRole('button', { name: 'Desfazer' }).click();
 await expect(list.getByRole('listitem')).toHaveCount(3);
 await expect(list.getByText('Sanduíche de peru e queijo')).toBeVisible();
});

test('Dieta: receita aparece com ingredientes e passos', async ({ page }) => {
 await seed(page);
 await page.goto('#dieta/lanche');
 await page.getByText('Ver receita').first().click();
 await expect(page.getByText('Ingredientes').first()).toBeVisible();
 await expect(page.getByText('Modo de preparo').first()).toBeVisible();
});

test('Dieta: tema escuro sem rolagem horizontal nas três telas', async ({ page }) => {
 await page.emulateMedia({ colorScheme: 'dark' });
 await seed(page);
 for (const h of ['#dieta', '#dieta/almoco', '#dieta/almoco/gerenciar']) { await page.goto(h); await expect(page.locator('main')).toBeVisible(); expect(await noHScroll(page)).toBe(true); }
});

test('Dieta: círculo marca e desmarca direto com aviso e Desfazer; sem opção abre a refeição', async ({ page }) => {
 await seed(page);
 await expect(page.getByRole('button', { name: 'Escolher opção de Café da manhã' })).toBeVisible();
 await page.goto('#dieta/cafe');
 await page.locator('.dt-opt-main').first().click();
 await page.getByRole('link', { name: 'Voltar para a Dieta' }).click();
 await page.getByRole('button', { name: 'Café da manhã consumido' }).click();
 await expect(page.getByRole('status').filter({ hasText: 'Café da manhã marcado como consumido' })).toBeVisible();
 await expect(ring(page)).toHaveAttribute('aria-valuenow', '495');
 await page.getByRole('button', { name: 'Desfazer' }).click();
 await expect(ring(page)).toHaveAttribute('aria-valuenow', '0');
 await page.getByRole('button', { name: 'Café da manhã consumido' }).click();
 await page.getByRole('button', { name: 'Café da manhã consumido' }).click();
 await expect(page.getByRole('status').filter({ hasText: 'Café da manhã desmarcado' })).toBeVisible();
 await expect(ring(page)).toHaveAttribute('aria-valuenow', '0');
});

test('Dieta: salvar, duplicar e excluir opção mostram confirmação em região de status', async ({ page }) => {
 await seed(page);
 await page.goto('#dieta/jantar/gerenciar');
 await page.getByRole('button', { name: /^Mais ações da opção 1/ }).click();
 await page.getByRole('menuitem', { name: 'Duplicar' }).click();
 await expect(page.getByRole('status').filter({ hasText: 'Opção duplicada' })).toBeVisible();
 await page.getByRole('button', { name: /^Mais ações da opção 1/ }).click();
 await page.getByRole('menuitem', { name: 'Editar' }).click();
 await page.getByLabel('Nome', { exact: true }).fill('Jantar novo');
 await page.getByRole('button', { name: 'Salvar opção' }).click();
 await expect(page.getByRole('status').filter({ hasText: 'Opção salva' })).toBeVisible();
});

test('Dieta: textos destrutivos legíveis (contraste AA) nos dois temas', async ({ page }) => {
 for (const scheme of ['light', 'dark'] as const) {
  await page.emulateMedia({ colorScheme: scheme });
  await seed(page);
  await page.goto('#dieta/lanche/gerenciar');
  await page.getByRole('button', { name: /^Mais ações da opção 2/ }).click();
  const lum = (c: string) => { const [r, g, b] = c.match(/[\d.]+/g)!.slice(0, 3).map(Number).map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
  const ratio = async (loc: ReturnType<Page['locator']>) => loc.evaluate(el => {
   let bg = ''; let n: Element | null = el;
   while (n) { const c = getComputedStyle(n).backgroundColor; if (c && !/rgba\(.*, 0\)|transparent/.test(c)) { bg = c; break; } n = n.parentElement; }
   return { fg: getComputedStyle(el).color, bg };
  });
  const item = page.getByRole('menuitem', { name: 'Excluir' });
  const a = await ratio(item); const l1 = lum(a.fg), l2 = lum(a.bg);
  expect((Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05), scheme + ' menu').toBeGreaterThanOrEqual(4.5);
  await item.click();
  const btn = page.getByRole('dialog').getByRole('button', { name: 'Excluir opção' });
  const b = await ratio(btn); const m1 = lum(b.fg), m2 = lum(b.bg);
  expect((Math.max(m1, m2) + 0.05) / (Math.min(m1, m2) + 0.05), scheme + ' confirmar').toBeGreaterThanOrEqual(4.5);
 }
});

test('Dieta: meta de proteína acompanha o peso do perfil (80 kg → 192 g; sem perfil → 185 g)', async ({ page }) => {
 await seed(page);
 await expect(page.getByText('0 g / 185 g').first()).toBeVisible();
 await seed(page, { name: 'Perfil sintético', goal: 'recomposicao', weightKg: 80 });
 await expect(page.getByText('0 g / 192 g')).toBeVisible();
});

test('Dieta: dia futuro não quebra a tela', async ({ page }) => {
 await seed(page);
 await page.goto(`#dieta?dia=${tomorrow()}`);
 await expect(page.getByRole('list', { name: 'Refeições' })).toBeVisible();
 expect(await noHScroll(page)).toBe(true);
});

test('Dieta: trocar opção de refeição já consumida avisa e Desfazer restaura a cópia consumida', async ({ page }) => {
 await seed(page);
 await consume(page, 'almoco', 0);
 await page.locator('.dt-opt-main').nth(1).click();
 await expect(page.getByRole('status').filter({ hasText: 'Opção trocada: Almoço opção 2' })).toHaveCount(1);
 await page.getByRole('button', { name: 'Desfazer' }).click();
 await page.getByRole('link', { name: 'Voltar para a Dieta' }).click();
 await expect(page.getByText('Opção 1 · ', { exact: false }).first()).toBeVisible();
 await expect(ring(page)).toHaveAttribute('aria-valuenow', '759');
});

test('Dieta: Desmarcar consumo tem Desfazer e a barra fixa é compacta', async ({ page }) => {
 await seed(page);
 await consume(page, 'cafe', 0);
 const bar = await page.locator('.dt-sticky').boundingBox();
 expect(bar!.height).toBeLessThanOrEqual(60);
 await page.getByRole('button', { name: 'Desmarcar consumo' }).click();
 await expect(page.getByRole('button', { name: 'Marcar como consumido' })).toBeVisible();
 await page.getByRole('button', { name: 'Desfazer' }).click();
 await expect(page.getByText('Consumido neste dia')).toBeVisible();
});

test('Dieta: menu das opções usa teclado (setas, Escape e retorno de foco)', async ({ page }) => {
 await seed(page);
 await page.goto('#dieta/lanche/gerenciar');
 const trigger = page.getByRole('button', { name: /^Mais ações da opção 1/ });
 await trigger.focus(); await page.keyboard.press('Enter');
 await expect(page.getByRole('menuitem', { name: 'Editar' })).toBeFocused();
 await page.keyboard.press('ArrowDown');
 await expect(page.getByRole('menuitem', { name: 'Duplicar' })).toBeFocused();
 await page.keyboard.press('Escape');
 await expect(trigger).toBeFocused();
});

test('Dieta: cartões de indicador não quebram "2.450 kcal" em 1280 px', async ({ page }) => {
 await page.setViewportSize({ width: 1280, height: 800 });
 await seed(page);
 const h = await page.locator('.dt-stat strong').first().evaluate(el => el.getBoundingClientRect().height);
 expect(h).toBeLessThan(26);
});
