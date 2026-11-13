/* Capturas de conferência visual. Uso:
 *   node scripts/capturas.cjs <pasta-de-saida> <hash> [<hash> ...] [--url=http://localhost:4190/Projeto-Treino/]
 * Ex.: node scripts/capturas.cjs capturas/r1 "#inicio" "#treino" "#treino/UA" "#dieta"
 * Viewport 390x844 @2x, relógio fixo em 2026-11-18T10:00:00. */
const { createRequire } = require('node:module');
const path = require('node:path');
const fs = require('node:fs');
const req = createRequire(path.join(process.cwd(), 'package.json'));
const { chromium } = req('@playwright/test');

const args = process.argv.slice(2);
const urlArg = args.find(a => a.startsWith('--url='));
const url = urlArg ? urlArg.slice(6) : 'http://localhost:4180/Projeto-Treino/';
const dark = args.includes('--dark');
const rest = args.filter(a => !a.startsWith('--url=') && a !== '--dark');
const [out, ...hashes] = rest;
if (!out || hashes.length === 0) { console.error('Uso: node scripts/capturas.cjs <pasta> <hash>... [--url=...] [--dark]'); process.exit(1); }
fs.mkdirSync(out, { recursive: true });

(async () => {
  const browser = await chromium.launch();
  for (const raw of hashes) {
    const hash = raw.startsWith('#') ? raw : `#${raw}`;
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: 'pt-BR', colorScheme: dark ? 'dark' : 'light', serviceWorkers: 'block' });
    const page = await context.newPage();
    await page.clock.install({ time: new Date('2026-11-18T10:00:00') });
    await page.goto(url + hash);
    await page.waitForSelector('main h1', { state: 'attached' });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(600);
    const name = hash.slice(1).replace(/[^a-zA-Z0-9]+/g, '-') || 'inicio';
    await page.screenshot({ path: path.join(out, `${name}.png`) });
    await page.screenshot({ path: path.join(out, `${name}-completo.png`), fullPage: true });
    await context.close();
    console.log('ok', hash);
  }
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
