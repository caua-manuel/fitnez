import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { Script } from 'node:vm';
import { resolveBasePath } from './base-path.ts';
import { verificarRecursoRemoto, verificarSegurancaHtml } from './csp-check.ts';
import { arquivosIniciais, entradasDinamicasDaDemo, importsEstaticosDaDemo, medir, resumoOrcamento, verificarDemoForaDoHtml, verificarOrcamento } from './build-budget.ts';

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
// Atalhos do ícone: dentro da base do Pages, apontando para uma rota com hash, ícones no precache.
assert.ok(Array.isArray(manifest.shortcuts) && manifest.shortcuts.length >= 3, 'Manifesto sem atalhos.');
for (const s of manifest.shortcuts) {
  assert.match(String(s.url), new RegExp(`^${base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}#[a-z]+(?:/[a-z_]+)*$`), `Atalho fora da base: ${s.url}`);
}
// O atalho "Treino de hoje" abre a execução do dia (rota que resolve o treino), não só o Início.
assert.ok(manifest.shortcuts.some((s: { name?: string; url?: unknown }) => s.name === 'Treino de hoje' && String(s.url) === `${base}#treino/_/hoje`), 'Atalho "Treino de hoje" sem a rota da execução.');
for (const s of manifest.shortcuts) {
  for (const icon of s.icons ?? []) assert.ok(urls.includes(icon.src), `Ícone de atalho sem precache: ${icon.src}`);
}
const html = await readFile('dist/index.html', 'utf8');
assert.ok(html.includes(`href="${base}manifest.webmanifest"`));
const falhas = verificarSegurancaHtml(html);
for (const file of artifact.filter(file => /\.(?:css|webmanifest)$/.test(file))) {
  falhas.push(...verificarRecursoRemoto(file, await readFile(join('dist', file), 'utf8')));
}
assert.equal(falhas.length, 0, `Verificação de segurança do build falhou:\n- ${falhas.join('\n- ')}`);
assert.doesNotMatch(html, /<script\b(?![^>]*\bsrc=)[^>]*>[\s\S]*?<\/script>/i);
// Orçamento de peso em três medidas (carga inicial, total e cada chunk sob demanda), em gzip.
// Números e regras: docs/decisoes/011-pronto-para-amigos-e-ferramentas-da-academia.md,
// seção "Orçamento de peso (revisão do ADR 006)". Estourar exige nova revisão no ADR, não só aqui.
const iniciais = arquivosIniciais(html, base);
assert.ok(iniciais.some(file => file.endsWith('.js')), 'Nenhum script de assets/ citado no index.html.');
for (const file of iniciais) assert.ok(artifact.includes(file), `index.html cita arquivo ausente: ${file}`);
const tamanhos: Record<string, number> = {};
for (const file of artifact.filter(file => /^assets\/[^/]+\.(?:js|css)$/.test(file))) {
  tamanhos[file] = gzipSync(await readFile(join('dist', file))).length;
}
const medidas = medir(tamanhos, iniciais);
const falhasOrcamento = verificarOrcamento(medidas);
for (const linha of resumoOrcamento(medidas)) console.log(linha);
assert.equal(falhasOrcamento.length, 0, `Orçamento de peso estourado (ADR 011):\n- ${falhasOrcamento.join('\n- ')}`);
// Isolamento da demonstração (ADR 011): fora de src/demo/ só import() dinâmico, e nenhum chunk
// do gerador aparece no index.html. Passa também enquanto src/demo/ não existe.
const fontes = (await files('src')).filter(file => /\.(?:[cm]?[jt]sx?)$/.test(file)).map(file => `src/${file}`);
const falhasDemo: string[] = [];
const entradasDemo: string[] = [];
for (const file of fontes) {
  const codigo = await readFile(file, 'utf8');
  for (const especificador of importsEstaticosDaDemo(file, codigo)) {
    falhasDemo.push(`${file} importa estaticamente ${especificador}; use import() dinâmico.`);
  }
  entradasDemo.push(...entradasDinamicasDaDemo(file, codigo));
}
falhasDemo.push(...verificarDemoForaDoHtml(entradasDemo, iniciais));
assert.equal(falhasDemo.length, 0, `Isolamento da demo falhou (ADR 011):\n- ${falhasDemo.join('\n- ')}`);
console.log(`Demo isolada: ${entradasDemo.length} import() dinâmico(s) para src/demo/; nenhum import estático; nada no index.html.`);
console.log(`Artefato verificado: base ${base}; ${artifact.length} arquivos; ${urls.length} URLs de precache; CSP de produção.`);
