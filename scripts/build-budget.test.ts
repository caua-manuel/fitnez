import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  LIMITES, arquivosIniciais, entradasDinamicasDaDemo, importsEstaticosDaDemo, medir, nomeDoChunk,
  resumoOrcamento, verificarDemoForaDoHtml, verificarOrcamento,
} from './build-budget.ts';

const BASE = '/Projeto-Treino/';
const HTML = `<head>
<script type="module" crossorigin src="/Projeto-Treino/assets/index-AAA.js"></script>
<link rel="modulepreload" crossorigin href="/Projeto-Treino/assets/vendor-BBB.js">
<link rel="stylesheet" crossorigin href="/Projeto-Treino/assets/index-CCC.css">
<link rel="manifest" href="/Projeto-Treino/manifest.webmanifest">
<link rel="icon" href="/Projeto-Treino/icon-192.png">
<link rel="preload" as="font" href="/Projeto-Treino/fonts/f.woff2">
</head>`;
const KB = 1024;

test('carga inicial lê script src, modulepreload e stylesheet; ignora manifest, ícone e preload', () => {
  assert.deepEqual(arquivosIniciais(HTML, BASE), ['assets/index-AAA.js', 'assets/vendor-BBB.js', 'assets/index-CCC.css']);
});

test('as três medidas separam carga inicial, total e chunks sob demanda', () => {
  const m = medir({
    'assets/index-AAA.js': 150 * KB, 'assets/vendor-BBB.js': 40 * KB, 'assets/index-CCC.css': 20 * KB,
    'assets/Assistente-DDD.js': 6 * KB, 'assets/Assistente-EEE.css': 1 * KB,
  }, arquivosIniciais(HTML, BASE));
  assert.deepEqual(m.inicial, { js: 190, css: 20 });
  assert.deepEqual(m.total, { js: 196, css: 21 });
  assert.deepEqual(m.chunks.map(c => c.arquivo), ['assets/Assistente-DDD.js', 'assets/Assistente-EEE.css']);
  assert.deepEqual(verificarOrcamento(m), []);
  assert.equal(resumoOrcamento(m).length, 3);
  assert.match(resumoOrcamento(m)[0], /Carga inicial .*190,0 KB de 205 KB/);
});

test('limites do ADR 011', () => {
  assert.deepEqual(LIMITES, { total: { js: 300, css: 32 }, inicial: { js: 205, css: 26 }, chunk: { js: 20, css: 4 } });
});

test('falha quando a carga inicial passa do limite mesmo com o total dentro', () => {
  const m = medir({ 'assets/index-AAA.js': 206 * KB }, ['assets/index-AAA.js']);
  assert.ok(verificarOrcamento(m).some(f => /JavaScript da carga inicial/.test(f)));
  assert.ok(!verificarOrcamento(m).some(f => /total/.test(f)));
  const c = medir({ 'assets/index-CCC.css': 26.5 * KB }, ['assets/index-CCC.css']);
  assert.ok(verificarOrcamento(c).some(f => /CSS da carga inicial/.test(f)));
});

test('falha quando o total passa do limite somando chunks sob demanda', () => {
  const tamanhos: Record<string, number> = { 'assets/index-AAA.js': 200 * KB };
  for (let i = 0; i < 6; i++) tamanhos[`assets/c${i}-X.js`] = 19 * KB;
  const falhas = verificarOrcamento(medir(tamanhos, ['assets/index-AAA.js']));
  assert.equal(falhas.length, 1);
  assert.match(falhas[0], /JavaScript total/);
});

test('falha quando um chunk sob demanda passa de 20 KB (JS) ou 4 KB (CSS)', () => {
  const falhas = verificarOrcamento(medir({
    'assets/index-AAA.js': 100 * KB, 'assets/grande-X.js': 21 * KB, 'assets/grande-Y.css': 4.5 * KB, 'assets/ok-Z.js': 20 * KB,
  }, ['assets/index-AAA.js']));
  assert.equal(falhas.length, 2);
  assert.ok(falhas.some(f => f.includes('grande-X.js')));
  assert.ok(falhas.some(f => f.includes('grande-Y.css')));
});

test('import estático de src/demo/ fora da demo é detectado em todas as formas', () => {
  const casos = [
    "import { gerar } from '../demo/gerador';",
    "import gerar from '../../demo/gerador.ts'",
    "import '../demo/efeito';",
    "export { gerar } from '../demo';",
    "export * from '../demo/gerador';",
    "import {\n  gerar,\n  outro,\n} from '../demo/gerador';",
    "import { type Demo, gerar } from '../demo/gerador';",
  ];
  for (const codigo of casos) {
    const arquivo = codigo.includes('../../') ? 'src/features/x/Tela.tsx' : 'src/app/App.tsx';
    assert.equal(importsEstaticosDaDemo(arquivo, codigo).length, 1, codigo);
  }
  assert.equal(importsEstaticosDaDemo('src\\features\\x\\Tela.tsx', "import a from '../../demo/a';").length, 1);
});

test('import() dinâmico, import type, comentários e a própria demo não contam', () => {
  const ok = [
    "const Demo = lazy(() => import('../demo/Gerador'));",
    "const m = await import('../demo/gerador');",
    "import type { Demo } from '../demo/tipos';",
    "export type { Demo } from '../demo/tipos';",
    "// import { gerar } from '../demo/gerador';",
    "/* import x from '../demo/x' */",
    "import { x } from '../domain/demonstracao';",
    "import { y } from './demo-local';",
  ];
  for (const codigo of ok) assert.deepEqual(importsEstaticosDaDemo('src/app/App.tsx', codigo), [], codigo);
  assert.deepEqual(importsEstaticosDaDemo('src/demo/gerador.ts', "import { a } from './dados';"), []);
});

test('entradas dinâmicas da demo e nome do chunk', () => {
  const codigo = "const D = lazy(() => import('../demo/Gerador'));\nimport('../features/assistente/Assistente');";
  assert.deepEqual(entradasDinamicasDaDemo('src/app/App.tsx', codigo), ['src/demo/Gerador']);
  assert.equal(nomeDoChunk('src/demo/Gerador'), 'Gerador');
  assert.equal(nomeDoChunk('src/demo/gerador.ts'), 'gerador');
  assert.equal(nomeDoChunk('src/demo'), 'index');
});

test('chunk da demo citado no index.html falha; fora dele passa; sem demo passa', () => {
  const iniciais = ['assets/index-AAA.js', 'assets/Gerador-BBB.js'];
  assert.equal(verificarDemoForaDoHtml(['src/demo/Gerador'], iniciais).length, 1);
  assert.deepEqual(verificarDemoForaDoHtml(['src/demo/Gerador'], ['assets/index-AAA.js']), []);
  assert.deepEqual(verificarDemoForaDoHtml([], iniciais), []);
  assert.equal(verificarDemoForaDoHtml(['src/demo/index'], ['assets/index-AAA.js']).length, 1, 'entrada index é ambígua');
});
