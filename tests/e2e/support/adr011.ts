import { expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';

// Apoio dos e2e do ADR 011. Só dados sintéticos. Não é spec (o Playwright só roda *.spec.ts).

/** Lê o estado ativo e o `recovery` de um banco do app. `kind` escolhe o banco real ou o da demonstração. */
export async function readDb(page: Page, kind: 'real' | 'demo' = 'real'): Promise<any> {
 return page.evaluate(async (kind) => {
  const dbs = await indexedDB.databases();
  const name = dbs.map(d => d.name ?? '').find(n => kind === 'demo' ? n.startsWith('treino12:demo:') : n.startsWith('treino12:') && !n.startsWith('treino12:demo:'));
  if (!name) return null;
  return new Promise((resolve, reject) => {
   const req = indexedDB.open(name); req.onerror = () => reject(req.error);
   req.onsuccess = () => {
    const db = req.result;
    if (!db.objectStoreNames.contains('state')) { db.close(); resolve(null); return; }
    const tx = db.transaction(['state', 'recovery']);
    const get = tx.objectStore('state').get('active'); const keys = tx.objectStore('recovery').getAllKeys(); const values = tx.objectStore('recovery').getAll();
    tx.onerror = () => reject(tx.error);
    tx.oncomplete = () => { const r = get.result ?? null; if (r) { r.recovery = { ...r.recovery }; keys.result.forEach((k, i) => { r.recovery[String(k)] = values.result[i]; }); } db.close(); resolve(r); };
   };
  });
 }, kind);
}

/** Nomes dos bancos do app presentes neste contexto. */
export async function dbNames(page: Page): Promise<string[]> {
 return page.evaluate(async () => (await indexedDB.databases()).map(d => d.name ?? '').filter(n => n.startsWith('treino12:')).sort());
}

/** Dia civil AAAA-MM-DD somando `n` dias a `first` (meio-dia local, longe da virada e do horário de verão). */
export function dayPlus(first: string, n: number): string {
 const d = new Date(`${first}T12:00:00`); d.setDate(d.getDate() + n);
 return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Simula `count` dias de USO (ADR 011, 1.2: dia com ao menos uma gravação por `repository.save`) a partir de `first`.
 * Em cada dia o relógio da página é fixado ao meio-dia e o tema é trocado no Perfil (uma gravação real pelo app).
 * Espera a gravação chegar ao banco (`meta.usage.lastDay` igual ao dia) antes de passar ao próximo.
 * A página precisa estar no Perfil. Retorna o último dia usado.
 */
export async function simulateUsageDays(page: Page, first: string, count: number): Promise<string> {
 let day = first;
 for (let i = 0; i < count; i++) {
  day = dayPlus(first, i);
  await page.clock.setFixedTime(new Date(`${day}T12:00:00`));
  const theme = i % 2 === 0 ? 'Escuro' : 'Claro';
  await page.getByRole('button', { name: theme, exact: true }).click();
  const expected = theme === 'Escuro' ? 'dark' : 'light';
  await expect.poll(async () => { const s = await readDb(page); return s && `${s.settings.theme} ${s.meta.usage?.lastDay}`; }, { message: `gravação do dia de uso ${day}` }).toBe(`${expected} ${day}`);
 }
 return day;
}

/** Registra exceções e erros de console da página (inclui violações de CSP). Conferir com `expect(errors).toEqual([])`. */
export function watchErrors(page: Page): string[] {
 const errors: string[] = [];
 page.on('pageerror', e => errors.push(e.message));
 page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
 return errors;
}

// ---------- Estado sintético por backup v3 (mesmo molde de entrega-a-executar.spec.ts) ----------
const json = (f: string) => JSON.parse(readFileSync(new URL(`../../../data/${f}`, import.meta.url), 'utf8'));
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const today = () => iso(new Date());
export const addDays = (day: string, n: number) => { const [y, m, d] = day.split('-').map(Number); return iso(new Date(y, m - 1, d + n)); };
export const monday = (day: string) => { const [y, m, d] = day.split('-').map(Number); return addDays(day, -((new Date(y, m - 1, d).getDay() + 6) % 7)); };

/** Backup v3 sintético com o plano de fábrica, início na segunda desta semana e os dias dados. */
export function backupFile(days: Record<string, any> = {}, extra: { name?: string } = {}) {
 const plan = json('plan.json');
 const state = {
  v: 3, revision: 0,
  catalog: { plan: plan.plan, diet: json('diet.json'), recipes: json('recipes.json'), revision: 0 },
  settings: { start: monday(today()), sched: plan.sched, theme: 'auto', ...(extra.name ? { profile: { name: extra.name } } : {}) },
  history: { days, measurements: {} }, snapshots: {}, recovery: {},
  meta: { initializedAt: 1, updatedAt: 1, migrationCompleted: true, migrationStatus: 'none', migrationWarnings: [], lastBackupGeneratedAt: null, lastBackupConfirmedAt: null },
 };
 return { v: 3, app: 'treino12', exportedAt: Date.now(), state };
}

/** Abre o Perfil e importa o backup sintético pela tela (caminho real do app). */
export async function importBackup(page: Page, file: unknown) {
 await page.goto('#perfil'); await page.waitForLoadState('networkidle');
 await expect(page.getByText('Salvo neste aparelho', { exact: true })).toBeVisible();
 const head = page.getByRole('button', { name: /^Backup e restauração/ }); if (await head.getAttribute('aria-expanded') !== 'true') await head.click();
 await page.locator('#backup-file').setInputFiles({ name: 'fixture-SINTETICO.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(file)) });
 await page.getByRole('button', { name: 'Confirmar importação', exact: true }).click();
 await expect(page.getByText('Backup importado.', { exact: false })).toBeVisible();
}
