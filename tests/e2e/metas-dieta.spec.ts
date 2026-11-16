import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';

// Dados inteiramente sintéticos; não representam backup real do usuário.
const json = (f: string) => JSON.parse(readFileSync(new URL(`../../data/${f}`, import.meta.url), 'utf8'));
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const monday = (day: string) => { const [y, m, d] = day.split('-').map(Number); return iso(new Date(y, m - 1, d - ((new Date(y, m - 1, d).getDay() + 6) % 7))); };

const DAYS = ['perna', 'academia', 'jiujitsu', 'volei', 'descanso'] as const;
const targets = (over: { kcal?: number; carbs?: number; waterL?: number; proteinG?: number | null } = {}) => ({
 days: Object.fromEntries(DAYS.map(d => [d, { kcal: over.kcal ?? 2300, carbs: over.carbs ?? 280 }])),
 proteinG: over.proteinG ?? null, fatG: 55, waterL: over.waterL ?? 3,
});

function backup(today: string, extra: Record<string, unknown> = {}) {
 const plan = json('plan.json');
 const state = {
  v: 3, revision: 0,
  catalog: { plan: plan.plan, diet: json('diet.json'), recipes: json('recipes.json'), revision: 0 },
  settings: { start: monday(today), sched: plan.sched, theme: 'auto', ...extra },
  history: { days: {}, measurements: {} }, snapshots: {}, recovery: {},
  meta: { initializedAt: 1, updatedAt: 1, migrationCompleted: true, migrationStatus: 'none', migrationWarnings: [], lastBackupGeneratedAt: null, lastBackupConfirmedAt: null },
 };
 return { v: 3, app: 'treino12', exportedAt: Date.now(), state };
}
async function seed(page: Page, today: string, extra: Record<string, unknown> = {}) {
 await page.goto('#perfil'); await page.waitForLoadState('networkidle');
 await expect(page.getByText('Salvo neste aparelho', { exact: true })).toBeVisible();
 await page.getByRole('button', { name: /Backup e restauração/ }).click();
 await page.locator('#backup-file').setInputFiles({ name: 'fixture-SINTETICO.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(backup(today, extra))) });
 await page.getByRole('button', { name: 'Confirmar importação', exact: true }).click();
 await expect(page.getByText('Backup importado.', { exact: false })).toBeVisible();
 await page.goto('#dieta');
 await expect(page.getByRole('heading', { name: 'Dieta', level: 1 })).toBeVisible();
}

const sheet = (page: Page) => page.getByRole('dialog', { name: 'Metas de dieta' });
const selo = (page: Page) => page.getByText('Meta de exemplo', { exact: true });
const metaDiaria = (page: Page) => page.locator('.dt-stat').first().locator('strong');
async function openSheet(page: Page) {
 await page.getByRole('button', { name: 'Ajustar metas' }).click();
 await expect(sheet(page)).toBeVisible();
}
async function fillAll(page: Page, label: string, value: string) {
 const inputs = sheet(page).getByLabel(label, { exact: true });
 const n = await inputs.count();
 for (let i = 0; i < n; i++) await inputs.nth(i).fill(value);
}

test.use({ viewport: { width: 390, height: 844 } });
test.beforeEach(async ({ page, context }) => {
 const errors: string[] = []; (page as any).__errors = errors;
 const monitor = (p: Page) => { p.on('pageerror', e => errors.push(e.message)); p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); }); };
 monitor(page); context.on('page', monitor);
});
test.afterEach(async ({ page }) => { expect((page as any).__errors, 'Sem exceções nem erros de console').toEqual([]); });

test('Metas: quem já usa o app vê "Meta de exemplo" e "Usar esta meta" remove o selo', async ({ page }) => {
 await seed(page, iso(new Date()));
 await expect(selo(page)).toBeVisible();
 await expect(page.getByText('Valores de exemplo do plano. Ajuste para o seu caso.')).toBeVisible();
 await expect(page.getByText('Metas de exemplo, para ajustar ao seu perfil.')).toHaveCount(0);
 await page.getByRole('button', { name: 'Usar esta meta' }).click();
 await expect(page.getByText('Meta confirmada').first()).toBeVisible();
 await expect(selo(page)).toHaveCount(0);
 await expect(page.getByRole('button', { name: 'Ajustar metas' })).toBeVisible();
 await page.reload();
 await expect(page.getByRole('heading', { name: 'Dieta', level: 1 })).toBeVisible();
 await expect(selo(page)).toHaveCount(0);
});

test('Metas: ajustar muda os números da Dieta e da água', async ({ page }) => {
 await seed(page, iso(new Date()));
 await openSheet(page);
 await fillAll(page, 'Calorias (kcal)', '2300');
 await fillAll(page, 'Carboidrato (g)', '280');
 await sheet(page).getByRole('switch', { name: 'Calcular pelo peso' }).click();
 await sheet(page).getByLabel('Proteína (g)', { exact: true }).fill('200');
 await sheet(page).getByLabel('Água (L)', { exact: true }).fill('3,5');
 await sheet(page).getByRole('button', { name: 'Salvar metas' }).click();
 await expect(sheet(page)).toHaveCount(0);
 await expect(page.getByText('Metas salvas').first()).toBeVisible();
 await expect(selo(page)).toHaveCount(0);
 await expect(metaDiaria(page)).toHaveText(/2\.300 kcal/);
 await expect(page.getByText(/de 200 g/)).toBeVisible();
 await expect(page.locator('.dt-water-head p')).toHaveText(/de 3,5 L/);
 await expect(page.getByRole('group', { name: 'Copos de 500 ml' }).getByRole('button')).toHaveCount(7);
 // Perfil: resumo e texto da proteína manual
 await page.goto('#perfil');
 await expect(page.getByRole('button', { name: /^Metas de dieta/ })).toContainText('Metas personalizadas');
});

test('Metas: valor fora do limite bloqueia o salvamento e mostra o erro junto ao campo', async ({ page }) => {
 await seed(page, iso(new Date()));
 await openSheet(page);
 const kcal = sheet(page).getByLabel('Calorias (kcal)', { exact: true }).first();
 await kcal.fill('999');
 await sheet(page).getByRole('button', { name: 'Salvar metas' }).click();
 await expect(sheet(page)).toBeVisible();
 await expect(sheet(page).getByText('Calorias: informe um valor entre 1.000 e 6.000 kcal.')).toBeVisible();
 await expect(sheet(page).getByRole('alert').filter({ hasText: 'Corrija os campos destacados para salvar.' })).toBeVisible();
 await expect(kcal).toHaveAttribute('aria-invalid', 'true');
 await expect(kcal).toBeFocused();
 await expect(page.getByText('Metas salvas')).toHaveCount(0);
 // corrigir libera o salvamento
 await kcal.fill('2600');
 await sheet(page).getByRole('button', { name: 'Salvar metas' }).click();
 await expect(sheet(page)).toHaveCount(0);
});

test('Metas: água fora de 0,5 em 0,5 L bloqueia', async ({ page }) => {
 await seed(page, iso(new Date()));
 await openSheet(page);
 await sheet(page).getByLabel('Água (L)', { exact: true }).fill('2,75');
 await sheet(page).getByRole('button', { name: 'Salvar metas' }).click();
 await expect(sheet(page).getByText('Água: use valores de 0,5 em 0,5 L. Exemplo: 3 ou 3,5.')).toBeVisible();
 await expect(sheet(page)).toBeVisible();
});

test('Metas: macros incoerentes só avisam e deixam salvar', async ({ page }) => {
 await seed(page, iso(new Date()));
 await openSheet(page);
 await sheet(page).getByLabel('Calorias (kcal)', { exact: true }).first().fill('2000');
 await expect(sheet(page).getByText(/Proteína, carboidrato e gordura somam cerca de 2\.595 kcal, diferente das calorias informadas \(2\.000 kcal\)\. Você pode salvar assim\./)).toBeVisible();
 await sheet(page).getByRole('button', { name: 'Salvar metas' }).click();
 await expect(sheet(page)).toHaveCount(0);
 await expect(page.getByText('Metas salvas').first()).toBeVisible();
});

test('Metas: "Calcular pelo que sobra" só preenche o carboidrato', async ({ page }) => {
 await seed(page, iso(new Date()));
 await openSheet(page);
 const carbs = sheet(page).getByLabel('Carboidrato (g)', { exact: true }).nth(1);
 await carbs.fill('1');
 await sheet(page).getByRole('button', { name: /^Calcular pelo que sobra: carboidrato de academia/ }).click();
 await expect(carbs).toHaveValue('304');
 await expect(sheet(page).getByText('Carboidrato calculado: 304 g. Confira antes de salvar.')).toBeVisible();
 await sheet(page).getByRole('button', { name: 'Cancelar' }).click();
 await expect(sheet(page)).toHaveCount(0);
 await expect(selo(page)).toBeVisible();
});

test('Metas: restaurar padrão cria nova versão, avisa e permite desfazer', async ({ page }) => {
 await seed(page, iso(new Date()), { dietTargets: { schema: 1, versions: [{ from: '2026-01-05', targets: targets({ kcal: 2300, waterL: 4 }) }] } });
 await expect(selo(page)).toHaveCount(0);
 await expect(metaDiaria(page)).toHaveText(/2\.300 kcal/);
 await openSheet(page);
 await sheet(page).getByRole('button', { name: 'Restaurar padrão' }).click();
 await expect(page.getByRole('dialog', { name: 'Restaurar as metas de exemplo?' })).toBeVisible();
 await page.getByRole('button', { name: 'Restaurar', exact: true }).click();
 await expect(page.getByText('Metas restauradas').first()).toBeVisible();
 await expect(selo(page)).toBeVisible();
 await expect(metaDiaria(page)).not.toHaveText(/2\.300 kcal/);
 await page.getByRole('button', { name: 'Desfazer' }).click();
 await expect(selo(page)).toHaveCount(0);
 await expect(metaDiaria(page)).toHaveText(/2\.300 kcal/);
});

test('Metas: a meta de um dia passado preserva a versão do momento', async ({ page }) => {
 await page.clock.setFixedTime(new Date(2026, 10, 16, 12, 0, 0)); // segunda-feira, 16/11/2026
 await seed(page, '2026-11-16', { dietTargets: { schema: 1, versions: [{ from: '2026-11-13', targets: targets({ waterL: 4 }) }] } });
 const agua = page.locator('.dt-water-head p');
 await expect(agua).toHaveText(/de 4,0 L/);
 await openSheet(page);
 await sheet(page).getByLabel('Água (L)', { exact: true }).fill('3,5');
 await sheet(page).getByRole('button', { name: 'Salvar metas' }).click();
 await expect(sheet(page)).toHaveCount(0);
 await expect(agua).toHaveText(/de 3,5 L/);
 await page.goto('#dieta?dia=2026-11-15'); // véspera: ainda vale a versão de 13/11
 await expect(agua).toHaveText(/de 4,0 L/);
 await page.goto('#dieta?dia=2026-11-12'); // antes de qualquer versão: meta de exemplo
 await expect(agua).toHaveText(/de 3,0 L/);
 await page.goto('#dieta');
 await expect(agua).toHaveText(/de 3,5 L/);
});

test('Metas: Perfil abre a mesma folha e o texto de proteína acompanha a meta', async ({ page }) => {
 await seed(page, iso(new Date()), { profile: { name: '', goal: '', weightKg: 80 } });
 await page.goto('#perfil');
 const linha = page.getByRole('button', { name: /^Metas de dieta/ });
 await expect(linha).toContainText('Meta de exemplo');
 await expect(page.getByText('Meta de proteína: 192 g por dia, 2,4 g por kg')).toBeVisible();
 await linha.click();
 await expect(sheet(page)).toBeVisible();
 await expect(sheet(page).getByText('Usa 2,4 g por kg do peso do seu perfil: 192 g por dia.')).toBeVisible();
 await sheet(page).getByRole('switch', { name: 'Calcular pelo peso' }).click();
 await sheet(page).getByLabel('Proteína (g)', { exact: true }).fill('160');
 await sheet(page).getByRole('button', { name: 'Salvar metas' }).click();
 await expect(sheet(page)).toHaveCount(0);
 await expect(page.getByText('Meta de proteína: 160 g por dia (definida por você)')).toBeVisible();
 await expect(linha).toContainText('Metas personalizadas');
});
