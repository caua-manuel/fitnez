import { test, expect, type Page } from '@playwright/test';
import { addDays, backupFile, importBackup, readDb, today, watchErrors } from './support/adr011';

// ADR 011: 1.4 (cartão de instalar no primeiro treino) e Fase 2 (2.1 a 2.4) na execução. Dados sintéticos.

let errors: string[] = [];
test.beforeEach(async ({ page }) => { errors = watchErrors(page); await page.clock.install({ time: new Date() }); });
test.afterEach(() => { expect(errors, 'Sem exceções nem erros de console').toEqual([]); });

const kg = (page: Page, n: number) => page.getByLabel(`Carga (kg), série ${n}`);
const reps = (page: Page, n: number) => page.getByLabel(`Repetições, série ${n}`);
const done = (page: Page, n: number) => page.getByRole('button', { name: `Série ${n} concluída` });
const timer = (page: Page) => page.getByRole('timer');
/** Registra a série n com carga e repetições (série sem repetições não conclui). */
async function logSet(page: Page, n: number, k = '30', r = '8') { await kg(page, n).fill(k); await reps(page, n).fill(r); await done(page, n).click(); }

async function start(page: Page, days: Record<string, any> = {}, sess = 'UA', first = 'Supino com halteres', pause = true) {
 await importBackup(page, backupFile(days));
 await page.goto(`#treino/${sess}`);
 // Relógio parado só quando o teste controla o tempo; parado, as animações de entrada também ficam paradas.
 if (pause) await page.clock.pauseAt(new Date(Date.now() + 60_000));
 await page.getByRole('link', { name: /Começar treino|Continuar treino/ }).click();
 await expect(page).toHaveURL(new RegExp(`#treino/${sess}/executar\\?dia=`));
 await expect(page.getByRole('heading', { name: first, level: 2 })).toBeVisible();
}
async function conclude(page: Page) {
 await page.getByRole('button', { name: 'Concluir treino' }).click();
 const dialog = page.getByRole('dialog', { name: 'Concluir o treino?' });
 // Com exercícios intocados, o app pede confirmação.
 await expect(dialog).toBeVisible();
 await dialog.getByRole('button', { name: 'Concluir', exact: true }).click();
 await expect(page).toHaveURL(/\/concluido\?dia=/);
 await expect(page.getByText('Treino concluído!')).toBeAttached();
}
/** Simula a aba ficar oculta ou visível (o navegador real não deixa o Playwright esconder a aba). */
async function setVisibility(page: Page, state: 'hidden' | 'visible') {
 await page.evaluate(s => { (window as any).__qaVis = s; document.dispatchEvent(new Event('visibilitychange')); }, state);
}
const visibilityStub = () => {
 (window as any).__qaVis = 'visible';
 Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => (window as any).__qaVis });
 Object.defineProperty(document, 'hidden', { configurable: true, get: () => (window as any).__qaVis === 'hidden' });
};

// ---------- 1.4: cartão de instalar no primeiro treino, uma vez só ----------
test('1.4: primeiro treino concluído mostra "Deixe o Fitnez na tela inicial" uma vez; o segundo não', async ({ page }) => {
 await start(page);
 await logSet(page, 1);
 await conclude(page);
 const card = page.getByRole('region', { name: 'Deixe o Fitnez na tela inicial' });
 await expect(card).toBeVisible();
 await expect(card.getByRole('button', { name: 'Instalar' })).toBeVisible();
 await expect.poll(async () => typeof (await readDb(page)).meta.prompts?.installShownAt).toBe('number');
 await expect.poll(async () => typeof (await readDb(page)).meta.prompts?.persistAskedAt).toBe('number');
 const shownAt = (await readDb(page)).meta.prompts.installShownAt;
 await card.getByRole('button', { name: 'Agora não' }).click();
 await expect(card).toHaveCount(0);
 await expect(page.locator('.ui-toast-text')).toHaveText('Você pode instalar depois, em Perfil.');

 // Recarregar a tela de concluído não traz o cartão de volta.
 await page.reload();
 await expect(page.getByText('Treino concluído!')).toBeAttached();
 await page.waitForTimeout(500);
 await expect(card).toHaveCount(0);

 // Segundo treino concluído (outro treino, mesmo dia): sem cartão e sem nova marcação.
 await page.goto('#treino/UB');
 await page.getByRole('link', { name: /Começar treino|Continuar treino/ }).click();
 await expect(page).toHaveURL(/#treino\/UB\/executar/);
 await logSet(page, 1);
 await conclude(page);
 await page.waitForTimeout(500);
 await expect(card).toHaveCount(0);
 expect((await readDb(page)).meta.prompts.installShownAt).toBe(shownAt);
});

// ---------- 2.1: descanso com relógio simulado ----------
test('2.1: sair da execução, avançar o relógio e voltar mostra o tempo certo e depois "terminou"', async ({ page }) => {
 await start(page);
 await logSet(page, 1);
 await expect(timer(page)).toHaveText(/2:30/);
 // Sai para o detalhe do treino; 60 s depois, volta: faltam 90 s.
 await page.getByRole('link', { name: 'Voltar ao treino' }).click();
 await expect(page).toHaveURL(/#treino\/UA$/);
 await page.clock.runFor(60_000);
 await page.getByRole('link', { name: /Continuar treino/ }).click();
 await expect(timer(page)).toHaveText(/1:30/);
 // Sai de novo; 2 min depois (o descanso venceu há 30 s), volta: "Próxima série", sem descanso contando.
 await page.getByRole('link', { name: 'Voltar ao treino' }).click();
 await page.clock.runFor(120_000);
 await page.getByRole('link', { name: /Continuar treino/ }).click();
 await expect(page.getByRole('region', { name: 'Descanso' })).toContainText('Próxima série');
 await expect(timer(page)).toHaveText(/0:00/);
 await expect(page.getByRole('button', { name: 'Fechar descanso' })).toBeVisible();
 expect(await page.evaluate(() => localStorage.getItem('treino12:descanso'))).toBeNull();
 await page.getByRole('button', { name: 'Fechar descanso' }).click();
 await expect(timer(page)).toHaveCount(0);

 // Descanso vencido há mais de 10 min: ao voltar (recarregando), nada aparece.
 await logSet(page, 2);
 await expect(timer(page)).toHaveText(/2:30/);
 await page.clock.pauseAt(new Date((await page.evaluate(() => Date.now())) + 13 * 60_000));
 await page.reload();
 await expect(page.getByRole('heading', { name: 'Supino com halteres', level: 2 })).toBeVisible();
 await expect(timer(page)).toHaveCount(0);
});

test('2.1: ao voltar à aba, o relógio do descanso atualiza na hora (sem esperar o intervalo)', async ({ page }) => {
 await page.addInitScript(visibilityStub);
 await start(page);
 await logSet(page, 1);
 await expect(timer(page)).toHaveText(/2:30/);
 await setVisibility(page, 'hidden');
 // Relógio parado: nenhum intervalo dispara; só o visibilitychange pode atualizar a tela.
 await page.clock.setSystemTime(new Date((await page.evaluate(() => Date.now())) + 40_000));
 await expect(timer(page)).toHaveText(/2:30/);
 await setVisibility(page, 'visible');
 await expect(timer(page)).toHaveText(/1:50/);
 // Voltou depois do fim: aparece "Próxima série".
 await setVisibility(page, 'hidden');
 await page.clock.setSystemTime(new Date((await page.evaluate(() => Date.now())) + 200_000));
 await setVisibility(page, 'visible');
 await expect(page.getByRole('region', { name: 'Descanso' })).toContainText('Próxima série');
 await expect(timer(page)).toHaveText(/0:00/);
});

test('2.1: Wake Lock simulado: pede ao abrir, pede de novo ao voltar à aba e solta ao concluir', async ({ page }) => {
 await page.addInitScript(visibilityStub);
 await page.addInitScript(() => {
  const log: string[] = []; (window as any).__wl = log;
  let current: any = null;
  const make = (type: string) => {
   const listeners: (() => void)[] = [];
   const s: any = { type, released: false,
    release: async () => { if (s.released) return; s.released = true; log.push('release'); listeners.forEach(f => f()); },
    addEventListener: (t: string, f: () => void) => { if (t === 'release') listeners.push(f); },
    _auto: () => { if (s.released) return; s.released = true; log.push('auto-release'); listeners.forEach(f => f()); } };
   return s;
  };
  Object.defineProperty(navigator, 'wakeLock', { configurable: true, value: { request: async (type: string) => { log.push(`request:${type}`); current = make(type); return current; } } });
  // Como o navegador: ao esconder a aba, o bloqueio é solto sozinho (antes dos ouvintes do app).
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden' && current) current._auto(); });
 });
 const wl = () => page.evaluate(() => [...(window as any).__wl]);
 await start(page);
 await expect.poll(wl).toEqual(['request:screen']);
 await setVisibility(page, 'hidden');
 await expect.poll(wl).toEqual(['request:screen', 'auto-release']);
 await setVisibility(page, 'visible');
 await expect.poll(wl).toEqual(['request:screen', 'auto-release', 'request:screen']);
 await logSet(page, 1);
 await conclude(page);
 await expect.poll(wl).toEqual(['request:screen', 'auto-release', 'request:screen', 'release']);
});

test('2.1: sem Wake Lock no navegador, a execução segue sem erro', async ({ page }) => {
 await page.addInitScript(() => { Object.defineProperty(navigator, 'wakeLock', { configurable: true, value: undefined }); });
 await start(page);
 await logSet(page, 1);
 await expect(timer(page)).toHaveText(/2:30/);
});

// ---------- 2.2: alvos de 48 px e inputmode em 360 x 740 ----------
test.describe('2.2 em 360 x 740', () => {
 test.use({ viewport: { width: 360, height: 740 } });
 /** Caixas menores que 48 x 48 entre botões, campos e links visíveis do escopo. */
 /** Medida depois de as animações de entrada terminarem: duas leituras seguidas iguais. */
 const small = async (page: Page, scope: string) => { let last = ''; let out: string[] = []; for (let i = 0; i < 20; i++) { out = await measure(page, scope); const k = JSON.stringify(out); if (k === last) break; last = k; await page.waitForTimeout(150); } return out; };
 const measure = (page: Page, scope: string) => page.evaluate((scope) => {
  const out: string[] = [];
  for (const root of document.querySelectorAll(scope)) for (const el of root.querySelectorAll<HTMLElement>('button, input, select, textarea, a[href], [role=button], [role=switch], [role=menuitem]')) {
   const r = el.getBoundingClientRect(); const cs = getComputedStyle(el);
   if (r.width === 0 || r.height === 0 || cs.visibility === 'hidden' || el.closest('.visually-hidden') || el.classList.contains('visually-hidden')) continue;
   if (r.width < 48 || r.height < 48) out.push(`${el.tagName.toLowerCase()} "${el.getAttribute('aria-label') ?? el.textContent?.trim().slice(0, 30)}" ${Math.round(r.width)}x${Math.round(r.height)}`);
  }
  return out;
 }, scope);
 /** Espera o rodapé fixo terminar a animação de entrada (encostado no fim da tela). */
 const settle = (page: Page) => expect.poll(() => page.evaluate(() => { const f = document.querySelector('.ex-footer'); return f ? Math.round(f.getBoundingClientRect().bottom) : -1; })).toBe(740);
 /** O botão está inteiro na tela e um toque no centro dele chega nele (não fica sob o rodapé nem fora da tela)? */
 const reachable = (page: Page, name: string) => page.getByRole('button', { name, exact: true }).evaluate(el => {
  const r = el.getBoundingClientRect();
  if (r.top < 0 || r.bottom > innerHeight) return `fora da tela: y ${Math.round(r.top)} a ${Math.round(r.bottom)} de ${innerHeight}`;
  const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
  return hit && (hit === el || el.contains(hit)) ? 'ok' : `coberto por ${hit?.closest('[class]')?.className ?? hit?.tagName}`;
 });
 const inFooter = (page: Page, name: string) => page.getByRole('button', { name, exact: true }).evaluate(el => !!el.closest('.ex-footer'));
 const inputModes = (page: Page) => page.evaluate(() => [...document.querySelectorAll<HTMLInputElement>('main input:not([type=checkbox]):not([type=radio]):not([type=file])')].map(i => `${i.getAttribute('aria-label') ?? i.id}=${i.getAttribute('inputmode')}`));

 test('execução: todo botão e campo com 48 px ou mais e inputmode certo em cada exercício', async ({ page }) => {
  await start(page, {}, 'UA', 'Supino com halteres', false);
  for (let i = 0; i < 10; i++) {
   await expect(page.getByText(`Exercício ${i + 1} de 10`, { exact: true })).toBeVisible();
   expect(await small(page, 'main'), `alvos do exercício ${i + 1}`).toEqual([]);
   const modes = await inputModes(page);
   expect(modes.length, `campos do exercício ${i + 1}`).toBeGreaterThan(0);
   for (const m of modes) {
    if (/^Carga/.test(m)) expect(m).toMatch(/=decimal$/);
    else if (/^(Repetições|Segundos|Tempo)/.test(m)) expect(m).toMatch(/=numeric$/);
    else throw new Error(`campo inesperado na execução: ${m}`);
   }
   if (i < 9) await page.getByRole('button', { name: 'Próximo exercício' }).click();
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
 });

 // Achado do QA (ADR 011, 2.2): em 360 x 740, ao abrir a execução, a caixa "Série 1 concluída" fica em y 720 a 768,
 // sob o rodapé fixo (y 646) e cortada pela borda da tela: concluir a primeira série exige rolar. Falha até a correção.
 test('execução: ao abrir, a primeira série e "Concluir treino" se alcançam sem rolar', async ({ page }) => {
  await start(page, {}, 'UA', 'Supino com halteres', false);
  await settle(page);
  expect(await page.evaluate(() => scrollY)).toBe(0);
  expect(await reachable(page, 'Concluir treino'), 'Concluir treino').toBe('ok');
  expect(await reachable(page, 'Série 1 concluída'), 'Série 1 concluída').toBe('ok');
 });

 test('execução: descanso ativo, menu, Como fazer, histórico e anilhas também com 48 px', async ({ page }) => {
  await start(page, {}, 'UA', 'Supino com halteres', false);
  await logSet(page, 1);
  await expect(timer(page)).toBeVisible();
  await settle(page);
  expect(await small(page, 'main'), 'com descanso').toEqual([]);
  // Com o descanso ativo, a próxima série fica acima do rodapé, sem rolar; descanso e concluir ficam no rodapé fixo.
  for (const name of ['Série 2 concluída', 'Pular descanso', 'Concluir treino']) expect(await reachable(page, name), name).toBe('ok');
  for (const name of ['Pular descanso', 'Concluir treino']) expect(await inFooter(page, name), name).toBe(true);
  await page.getByRole('button', { name: 'Supino com halteres', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Como fazer' })).toBeVisible();
  expect(await small(page, '[role=dialog]'), 'Como fazer').toEqual([]);
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Mais opções de Supino com halteres' }).click();
  await page.getByRole('menuitem', { name: 'Últimas sessões' }).click();
  await expect(page.getByRole('dialog', { name: 'Supino com halteres' })).toBeVisible();
  expect(await small(page, '[role=dialog]'), 'histórico rápido').toEqual([]);
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Próximo exercício' }).click();
  await page.getByRole('button', { name: /^Anilhas para|^Calcular anilhas/ }).click();
  await expect(page.getByRole('dialog', { name: 'Anilhas' })).toBeVisible();
  expect(await small(page, '[role=dialog]'), 'anilhas').toEqual([]);
  expect(await page.getByRole('dialog', { name: 'Anilhas' }).getByLabel('Carga total (kg)').getAttribute('inputmode')).toBe('decimal');
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: /^Mais opções de Remada/ }).click();
  expect(await small(page, '[role=menu]'), 'menu do exercício').toEqual([]);
 });
});

// ---------- 2.3: histórico rápido preserva o digitado ----------
test('2.3: histórico rápido abre no meio da série, mostra 5 sessões sem aquecimento e preserva o digitado', async ({ page }) => {
 const days: Record<string, any> = {};
 for (let i = 1; i <= 6; i++) days[addDays(today(), -i)] = { log: { supino: [{ kind: 'warm', kg: '10', reps: '12', done: true }, { kg: String(20 + i), reps: '8', done: true }] } };
 await start(page, days);
 await logSet(page, 1);
 await expect(timer(page)).toHaveText(/2:30/);
 await kg(page, 2).fill('32,5'); await reps(page, 2).fill('7');
 const menu = page.getByRole('button', { name: 'Mais opções de Supino com halteres' });
 await menu.click();
 await page.getByRole('menuitem', { name: 'Últimas sessões' }).click();
 const sheet = page.getByRole('dialog', { name: 'Supino com halteres' });
 const list = sheet.getByRole('list', { name: 'Últimas sessões de Supino com halteres' });
 await expect(list.getByRole('listitem')).toHaveCount(5);
 // Mais recente primeiro (ontem = 21 kg); a 6ª sessão (26 kg) fica fora; aquecimento (10 × 12) nunca aparece.
 await expect(list.getByRole('listitem').first()).toContainText('ontem');
 await expect(list.getByRole('listitem').first()).toContainText('21 × 8');
 await expect(list).not.toContainText('26 × 8');
 await expect(sheet).not.toContainText('10 × 12');
 await page.clock.runFor(5_000);
 await sheet.getByRole('button', { name: 'Fechar' }).click();
 await expect(sheet).toHaveCount(0);
 await expect(menu).toBeFocused();
 await expect(page).toHaveURL(/executar/);
 await expect(kg(page, 2)).toHaveValue('32,5');
 await expect(reps(page, 2)).toHaveValue('7');
 await expect(done(page, 2)).toHaveAttribute('aria-pressed', 'false');
 await expect(timer(page)).toHaveText(/2:25/);
 // Pelo menu "Últimas sessões" também abre e fecha sem mexer no digitado.
 await page.getByRole('button', { name: 'Mais opções de Supino com halteres' }).click();
 await page.getByRole('menuitem', { name: 'Últimas sessões' }).click();
 await expect(sheet).toBeVisible();
 await page.keyboard.press('Escape');
 await expect(kg(page, 2)).toHaveValue('32,5');
});

// ---------- 2.4: anilhas na série ----------
test('2.4: anilhas da série: "Usar 42,5 kg" troca a carga e não conclui a série', async ({ page }) => {
 await start(page);
 await page.getByRole('button', { name: 'Próximo exercício' }).click();
 await expect(page.getByRole('heading', { name: /^Remada/, level: 2 })).toBeVisible();
 await kg(page, 1).fill('43'); await reps(page, 1).fill('8');
 await page.getByRole('button', { name: 'Anilhas para 43 kg, série 1' }).click();
 const dlg = page.getByRole('dialog', { name: 'Anilhas' });
 await expect(dlg.getByLabel('Carga total (kg)')).toHaveValue('43');
 await expect(dlg.getByRole('status')).toContainText('Mais perto: 42,5 kg');
 await dlg.getByRole('button', { name: 'Usar 42,5 kg' }).click();
 await expect(dlg).toHaveCount(0);
 await expect(kg(page, 1)).toHaveValue('42,5');
 await expect(reps(page, 1)).toHaveValue('8');
 await expect(done(page, 1)).toHaveAttribute('aria-pressed', 'false');
 await expect(timer(page)).toHaveCount(0);
 await page.waitForTimeout(300);
 const rec = (await readDb(page)).history.days[today()];
 expect((rec?.log?.remada_a ?? []).some((s: any) => s.done === true)).toBe(false);
 // Carga que fecha e é a mesma da série: sem "Usar".
 await kg(page, 1).fill('60');
 await page.getByRole('button', { name: 'Anilhas para 60 kg, série 1' }).click();
 await expect(dlg.getByRole('status')).toHaveText('Cada lado: 20 (barra 20 kg)');
 await expect(dlg.getByRole('button', { name: /^Usar/ })).toHaveCount(0);
});
