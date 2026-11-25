import assert from 'node:assert/strict';
import { test } from 'node:test';
import { gerarGaleria, atualizarReadme } from './docs-galeria.ts';

test('monta seis colunas, usa o nome do plano e informa GIFs ausentes', () => {
 const catalogo = Object.fromEntries(Array.from({ length: 8 }, (_, i) => [`ex${i}`, { n: `Exercício ${i}` }]));
 const gifs = new Set(['comum', 'ex1', 'ex2', 'ex3', 'ex4', 'ex5', 'ex6']);
 const { html, ausentes } = gerarGaleria(catalogo, { ex0: 'comum' }, gifs);
 assert.deepEqual(ausentes, ['ex7']);
 assert.equal((html.match(/<td>/g) ?? []).length, 12);
 assert.equal((html.match(/<tr>/g) ?? []).length, 2);
 assert.match(html, /src="docs\/galeria\/comum.gif" width="120" alt="Exercício 0"/);
 assert.equal(atualizarReadme(atualizarReadme('# Fitnez\n', html), html), atualizarReadme('# Fitnez\n', html));
});
