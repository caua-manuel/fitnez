import { readFile, readdir, writeFile } from 'node:fs/promises';

const inicio = '<!-- inicio-galeria -->';
const fim = '<!-- fim-galeria -->';
const largura = 6;

function escapar(texto: string) {
 return texto.replaceAll('&', '&amp;').replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}

export function gerarGaleria(catalogo: Record<string, { n: string }>, aliases: Record<string, string>, gifs: Set<string>) {
 const celulas: string[] = [];
 const ausentes: string[] = [];
 for (const [id, exercicio] of Object.entries(catalogo)) {
  const gif = aliases[id] ?? id;
  if (!gifs.has(gif)) {
   ausentes.push(id);
   continue;
  }
  const nome = escapar(exercicio.n);
  celulas.push(`<img src="docs/galeria/${encodeURIComponent(gif)}.gif" width="120" alt="${nome}"><br>${nome}`);
 }
 const linhas = [];
 for (let i = 0; i < celulas.length; i += largura) {
  const linha = Array.from({ length: largura }, (_, coluna) => `<td>${celulas[i + coluna] ?? ''}</td>`);
  linhas.push(['<tr>', ...linha, '</tr>'].join('\n'));
 }
 return {
  html: ['<details>', '<summary>Galeria de exercícios</summary>', '', '<table>', ...linhas, '</table>', '', '</details>'].join('\n'),
  ausentes,
 };
}

export function atualizarReadme(readme: string, html: string) {
 const bloco = `${inicio}\n${html}\n${fim}`;
 if (!readme.includes(inicio)) return `${readme.trimEnd()}\n\n${bloco}\n`;
 const final = readme.indexOf(fim, readme.indexOf(inicio));
 if (final === -1) throw new Error('Marcador de fim da galeria ausente.');
 return readme.slice(0, readme.indexOf(inicio)) + bloco + readme.slice(final + fim.length);
}

if (import.meta.main) {
 const [plano, aliases, arquivos, readme] = await Promise.all([
  readFile('data/plan.json', 'utf8'),
  readFile('docs/ilustracoes/gifs-readme/aliases.json', 'utf8'),
  readdir('docs/galeria'),
  readFile('README.md', 'utf8'),
 ]);
 const gifs = new Set(arquivos.filter(nome => nome.endsWith('.gif')).map(nome => nome.slice(0, -4)));
 const { html, ausentes } = gerarGaleria(JSON.parse(plano).plan.ex, JSON.parse(aliases), gifs);
 await writeFile('README.md', atualizarReadme(readme, html));
 console.log(`Exercícios sem GIF: ${ausentes.join(', ') || 'nenhum'}.`);
}
