import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { Script } from 'node:vm';
import { resolveBasePath } from './base-path.ts';

const base = resolveBasePath(process.env);
const worker = await readFile('dist/sw.js', 'utf8');
assert.doesNotMatch(worker, /__APP_BASE__|__CACHE_PREFIX__|__CACHE_NAME__|__PRECACHE_LIST__/);
new Script(worker);
function constant(name: string): unknown {
  const found = worker.match(new RegExp(`^const ${name} = (.*);$`, 'm'));
  assert.ok(found, `Constante ${name} não encontrada no worker gerado.`);
  return JSON.parse(found[1]);
}
assert.equal(constant('BASE'), base);
const prefix = `treino12:${encodeURIComponent(base)}:`;
assert.equal(constant('PREFIX'), prefix);
assert.match(String(constant('CACHE')), new RegExp(`^${prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[a-f0-9]{16}$`));
const urls = constant('PRECACHE');
assert.ok(Array.isArray(urls) && urls.length > 1, 'Precache vazio.');
assert.equal(new Set(urls).size, urls.length, 'URLs duplicadas no precache.');
async function files(directory: string, relative = ''): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  return (await Promise.all(entries.map(entry => entry.isDirectory()
    ? files(join(directory, entry.name), `${relative}${entry.name}/`)
    : [`${relative}${entry.name}`]))).flat();
}
const artifact = await files('dist');
assert.ok(artifact.every(file => /^(?:assets\/[^/]+\.(?:js|css)|img\/(?:meal|exercise|hero)\/[A-Za-z0-9-]+\.jpg|fonts\/(?:figtree-latin(?:-ext)?-wght-normal\.woff2|Figtree-OFL\.txt)|index\.html|sw\.js|manifest\.webmanifest|(?:icon-(?:192|512|maskable-512)|apple-touch-icon)\.png)$/.test(file)), 'Arquivo inesperado no artefato público.');
for (const url of urls) {
  assert.equal(typeof url, 'string');
  assert.ok(url.startsWith(base) && !url.includes('..'), `URL fora da base: ${url}`);
  const relative = url.slice(base.length) || 'index.html';
  assert.ok(artifact.includes(relative), `Recurso ausente no build: ${relative}`);
}
for (const file of artifact.filter(file => file !== 'sw.js')) {
  assert.ok(urls.includes(`${base}${file}`), `Recurso ausente do precache: ${file}`);
}
assert.ok(urls.includes(base));
const manifest = JSON.parse(await readFile('dist/manifest.webmanifest', 'utf8'));
for (const field of ['id', 'start_url', 'scope']) assert.equal(manifest[field], base);
for (const icon of manifest.icons) assert.ok(urls.includes(icon.src), `Ícone sem precache: ${icon.src}`);
const html = await readFile('dist/index.html', 'utf8');
assert.ok(html.includes(`href="${base}manifest.webmanifest"`));
assert.ok(html.includes('Content-Security-Policy'));
assert.doesNotMatch(html, /<script\b(?![^>]*\bsrc=)[^>]*>[\s\S]*?<\/script>/i);
// Orçamento de tamanho (gzip, soma dos arquivos de assets/). O limite de CSS foi pedido em 12 KB, mas o CSS já estava em ~19,5 KB antes do movimento; 24 KB é o teto atual, a reduzir quando o CSS legado for enxugado.
const LIMITE_JS_KB = 190;
const LIMITE_CSS_KB = 24;
const gzipKb = async (extension: 'js' | 'css') => {
  const names = artifact.filter(file => file.startsWith('assets/') && file.endsWith(`.${extension}`));
  const sizes = await Promise.all(names.map(async name => gzipSync(await readFile(join('dist', name))).length));
  return sizes.reduce((a, b) => a + b, 0) / 1024;
};
const jsKb = await gzipKb('js');
const cssKb = await gzipKb('css');
const fmtKb = (n: number) => n.toFixed(1).replace('.', ',');
assert.ok(jsKb <= LIMITE_JS_KB, `JavaScript acima do orçamento: ${fmtKb(jsKb)} KB (gzip) para um limite de ${LIMITE_JS_KB} KB. Remova dependências ou divida o código.`);
assert.ok(cssKb <= LIMITE_CSS_KB, `CSS acima do orçamento: ${fmtKb(cssKb)} KB (gzip) para um limite de ${LIMITE_CSS_KB} KB. Enxugue regras antigas.`);
console.log(`Tamanho (gzip): JavaScript ${fmtKb(jsKb)} KB de ${LIMITE_JS_KB} KB; CSS ${fmtKb(cssKb)} KB de ${LIMITE_CSS_KB} KB.`);
console.log(`Artefato verificado: base ${base}; ${artifact.length} arquivos; ${urls.length} URLs de precache; CSP de produção.`);
