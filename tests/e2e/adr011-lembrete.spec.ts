import { test, expect } from '@playwright/test';
import { backupFile, importBackup, readDb, simulateUsageDays, watchErrors } from './support/adr011';

// ADR 011, 1.2: lembrete de backup por 7 dias de USO (dias com gravação), com relógio simulado. Dados sintéticos.

let errors: string[] = [];
test.beforeEach(async ({ page }) => { errors = watchErrors(page); });
test.afterEach(() => { expect(errors, 'Sem exceções nem erros de console').toEqual([]); });

const reminder = (page: import('@playwright/test').Page) => page.getByRole('complementary', { name: /^(Guarde uma cópia dos seus dados|Backup pendente|Guardou o arquivo\?)$/ });
// No Início o lembrete é a linha compacta .backup-line (título "Backup pendente"); o Perfil mantém o cartão completo.
async function reopen(page: import('@playwright/test').Page, hash: string) {
 await page.goto(`#${hash}`); await page.reload(); await page.waitForLoadState('networkidle');
 await expect(page.getByText('Salvo neste aparelho', { exact: true })).toBeAttached();
}

test('lembrete: conta dias de uso, não de calendário; "Agora não" adia só hoje; confirmar zera', async ({ page }) => {
 await page.clock.setFixedTime(new Date('2026-11-20T12:00:00'));
 const file = backupFile({ '2026-11-16': { log: { supino: [{ kg: '30', reps: '8', done: true }] } } });
 await importBackup(page, file);
 // Importar não é dia de uso: com dados, mas sem lembrete.
 await expect(reminder(page)).toHaveCount(0);
 await simulateUsageDays(page, '2026-11-20', 6);
 expect((await readDb(page)).meta.usage).toEqual({ lastDay: '2026-11-25', daysSinceBackup: 6 });

 // 36 dias de calendário sem abrir: abrir sem gravar não conta, e o calendário sozinho não dispara.
 await page.clock.setFixedTime(new Date('2026-12-31T12:00:00'));
 await reopen(page, 'inicio');
 await expect(page.getByRole('heading', { name: 'Início', level: 1 })).toBeFocused();
 await expect(reminder(page)).toHaveCount(0);
 expect((await readDb(page)).meta.usage.daysSinceBackup).toBe(6);

 // 7º dia de uso: aparece no Início.
 await reopen(page, 'perfil');
 await simulateUsageDays(page, '2026-12-31', 1);
 await reopen(page, 'inicio');
 await expect(reminder(page)).toBeVisible();
 await expect(reminder(page)).toHaveAccessibleName('Backup pendente');

 // "Agora não": some hoje (mesmo recarregando) e volta amanhã.
 await reminder(page).getByRole('button', { name: 'Agora não' }).click();
 await expect(page.locator('.ui-toast-text')).toHaveText('Lembramos de novo amanhã.');
 await expect(reminder(page)).toHaveCount(0);
 expect((await readDb(page)).meta.prompts.backupSnoozedOn).toBe('2026-12-31');
 await reopen(page, 'inicio');
 await expect(reminder(page)).toHaveCount(0);
 await page.clock.setFixedTime(new Date('2027-01-01T09:00:00'));
 await reopen(page, 'inicio');
 await expect(reminder(page)).toBeVisible();

 // "Fazer backup agora" gera o arquivo e pergunta; "Ainda não" não confirma.
 let pending = page.waitForEvent('download');
 await reminder(page).getByRole('button', { name: 'Fazer backup agora' }).click();
 expect((await pending).suggestedFilename()).toMatch(/^treino12-backup-.*\.json$/);
 await expect(reminder(page)).toHaveAccessibleName('Guardou o arquivo?');
 await expect(reminder(page).getByText('Guardou o arquivo?', { exact: true })).toBeFocused();
 await reminder(page).getByRole('button', { name: 'Ainda não' }).click();
 await expect(reminder(page)).toHaveAccessibleName('Backup pendente');
 expect((await readDb(page)).meta.lastBackupConfirmedAt).toBeNull();

 // "Sim, guardei": confirma, zera a contagem e o lembrete some de vez.
 pending = page.waitForEvent('download');
 await reminder(page).getByRole('button', { name: 'Fazer backup agora' }).click();
 await pending;
 await reminder(page).getByRole('button', { name: 'Sim, guardei' }).click();
 await expect(page.locator('.ui-toast-text')).toHaveText('Backup confirmado.');
 await expect(reminder(page)).toHaveCount(0);
 const after = await readDb(page);
 expect(after.meta.usage.daysSinceBackup).toBe(0);
 expect(typeof after.meta.lastBackupConfirmedAt).toBe('number');
 expect(after.history).toEqual(file.state.history);
 await reopen(page, 'inicio');
 await expect(reminder(page)).toHaveCount(0);
});

test('lembrete: sem dados do usuário, 7 dias de uso não mostram aviso', async ({ page }) => {
 await page.clock.setFixedTime(new Date('2026-11-20T12:00:00'));
 await page.goto('#perfil'); await page.waitForLoadState('networkidle');
 await expect(page.getByText('Salvo neste aparelho', { exact: true })).toBeAttached();
 await simulateUsageDays(page, '2026-11-20', 8);
 expect((await readDb(page)).meta.usage.daysSinceBackup).toBe(8);
 await reopen(page, 'perfil');
 await expect(reminder(page)).toHaveCount(0);
 await expect(page.locator('.bell-dot')).toHaveCount(0);
});
