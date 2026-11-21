// Orçamento de peso em três medidas e isolamento da demonstração.
// Fonte dos números e das regras: docs/decisoes/011-pronto-para-amigos-e-ferramentas-da-academia.md,
// seção "Orçamento de peso (revisão do ADR 006)". Estourar qualquer número exige nova revisão
// registrada no ADR; não se sobe o limite só aqui.
import { posix } from 'node:path';

export const LIMITES = {
  total: { js: 250, css: 32 },
  inicial: { js: 205, css: 26 },
  chunk: { js: 20, css: 4 },
} as const;

type Tipo = 'js' | 'css';
export interface Medidas {
  total: Record<Tipo, number>;
  inicial: Record<Tipo, number>;
  chunks: Array<{ arquivo: string; tipo: Tipo; kb: number }>;
}

const tipoDe = (arquivo: string): Tipo | null =>
  arquivo.endsWith('.js') ? 'js' : arquivo.endsWith('.css') ? 'css' : null;

function atributo(tag: string, nome: string): string | null {
  const achado = tag.match(new RegExp(`\\b${nome}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i'));
  return achado ? (achado[1] ?? achado[2] ?? achado[3]) : null;
}

/** Arquivos de assets/ baixados na abertura: script src, link modulepreload e link stylesheet. */
export function arquivosIniciais(html: string, base: string): string[] {
  const urls: string[] = [];
  for (const [tag] of html.matchAll(/<script\b[^>]*>/gi)) {
    const src = atributo(tag, 'src');
    if (src) urls.push(src);
  }
  for (const [tag] of html.matchAll(/<link\b[^>]*>/gi)) {
    const rel = (atributo(tag, 'rel') ?? '').toLowerCase().split(/\s+/);
    const href = atributo(tag, 'href');
    if (href && (rel.includes('modulepreload') || rel.includes('stylesheet'))) urls.push(href);
  }
  const relativos = urls.map(url => (url.startsWith(base) ? url.slice(base.length) : url));
  return [...new Set(relativos.filter(arquivo => arquivo.startsWith('assets/') && tipoDe(arquivo)))];
}

/** Recebe o tamanho gzip em bytes de cada arquivo de assets/ e devolve as três medidas em KB. */
export function medir(tamanhos: Record<string, number>, iniciais: string[]): Medidas {
  const medidas: Medidas = { total: { js: 0, css: 0 }, inicial: { js: 0, css: 0 }, chunks: [] };
  for (const [arquivo, bytes] of Object.entries(tamanhos)) {
    const tipo = tipoDe(arquivo);
    if (!arquivo.startsWith('assets/') || !tipo) continue;
    const kb = bytes / 1024;
    medidas.total[tipo] += kb;
    if (iniciais.includes(arquivo)) medidas.inicial[tipo] += kb;
    else medidas.chunks.push({ arquivo, tipo, kb });
  }
  medidas.chunks.sort((a, b) => b.kb - a.kb);
  return medidas;
}

export const fmtKb = (n: number) => n.toFixed(1).replace('.', ',');

export function verificarOrcamento(medidas: Medidas, limites = LIMITES): string[] {
  const falhas: string[] = [];
  const nome = { js: 'JavaScript', css: 'CSS' };
  for (const tipo of ['js', 'css'] as const) {
    if (medidas.total[tipo] > limites.total[tipo]) {
      falhas.push(`${nome[tipo]} total acima do orçamento: ${fmtKb(medidas.total[tipo])} KB (gzip) para ${limites.total[tipo]} KB.`);
    }
    if (medidas.inicial[tipo] > limites.inicial[tipo]) {
      falhas.push(`${nome[tipo]} da carga inicial acima do orçamento: ${fmtKb(medidas.inicial[tipo])} KB (gzip) para ${limites.inicial[tipo]} KB. Leve código para import() sob demanda.`);
    }
  }
  for (const chunk of medidas.chunks) {
    if (chunk.kb > limites.chunk[chunk.tipo]) {
      falhas.push(`Chunk sob demanda acima do orçamento: ${chunk.arquivo} com ${fmtKb(chunk.kb)} KB (gzip) para ${limites.chunk[chunk.tipo]} KB. Divida o módulo.`);
    }
  }
  return falhas;
}

export function resumoOrcamento(medidas: Medidas, limites = LIMITES): string[] {
  const maior = (tipo: Tipo) => medidas.chunks.find(c => c.tipo === tipo);
  const descreve = (tipo: Tipo) => {
    const c = maior(tipo);
    return c ? `${c.arquivo} ${fmtKb(c.kb)} KB` : 'nenhum';
  };
  return [
    `Carga inicial (gzip): JavaScript ${fmtKb(medidas.inicial.js)} KB de ${limites.inicial.js} KB; CSS ${fmtKb(medidas.inicial.css)} KB de ${limites.inicial.css} KB.`,
    `Total (gzip): JavaScript ${fmtKb(medidas.total.js)} KB de ${limites.total.js} KB; CSS ${fmtKb(medidas.total.css)} KB de ${limites.total.css} KB.`,
    `Maior chunk sob demanda (gzip): JavaScript ${descreve('js')} de ${limites.chunk.js} KB; CSS ${descreve('css')} de ${limites.chunk.css} KB; ${medidas.chunks.length} chunks.`,
  ];
}

// ---- Isolamento da demonstração (src/demo/) ----

const DEMO = 'src/demo/';

function semComentarios(codigo: string): string {
  return codigo.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:'"`\\])\/\/[^\n]*/g, '$1');
}

/** Resolve um especificador relativo para um caminho a partir da raiz (src/...). */
function resolver(arquivo: string, especificador: string): string | null {
  if (!especificador.startsWith('.')) return especificador.startsWith('/src/') ? especificador.slice(1) : null;
  return posix.normalize(posix.join(posix.dirname(arquivo), especificador));
}

const apontaDemo = (destino: string | null) => destino !== null && (destino === 'src/demo' || destino.startsWith(DEMO));

/**
 * Importações estáticas de src/demo/ feitas por um arquivo fora de src/demo/.
 * `import type` e `export type` são apagados na compilação e não contam; import() dinâmico é permitido.
 */
export function importsEstaticosDaDemo(arquivo: string, codigo: string): string[] {
  const caminho = arquivo.replaceAll('\\', '/');
  if (caminho.startsWith(DEMO)) return [];
  const limpo = semComentarios(codigo);
  const achados: string[] = [];
  const estaticos = /(?:^|[;\s}])(?:import|export)\s+(type\s+)?(?:[^'"`;()]*?\s+from\s+)?(['"])([^'"]+)\2/g;
  for (const m of limpo.matchAll(estaticos)) {
    if (m[1]) continue;
    if (apontaDemo(resolver(caminho, m[3]))) achados.push(m[3]);
  }
  return achados;
}

/** Destinos de import() dinâmico que apontam para src/demo/ (pontos de entrada da demo). */
export function entradasDinamicasDaDemo(arquivo: string, codigo: string): string[] {
  const caminho = arquivo.replaceAll('\\', '/');
  if (caminho.startsWith(DEMO)) return [];
  const destinos: string[] = [];
  for (const m of semComentarios(codigo).matchAll(/\bimport\s*\(\s*(['"`])([^'"`]+)\1\s*\)/g)) {
    const destino = resolver(caminho, m[2]);
    if (apontaDemo(destino)) destinos.push(destino as string);
  }
  return destinos;
}

/** Nome-base que o Vite dá ao chunk de um ponto de entrada (arquivo sem extensão; pasta vira index). */
export function nomeDoChunk(destino: string): string {
  const semExtensao = destino.replace(/\.(?:[cm]?[jt]sx?)$/, '');
  return semExtensao === 'src/demo' ? 'index' : posix.basename(semExtensao);
}

/** Falhas se algum chunk da demo for citado no index.html. Entradas chamadas index são ambíguas e falham. */
export function verificarDemoForaDoHtml(entradas: string[], iniciais: string[]): string[] {
  const falhas: string[] = [];
  for (const nome of new Set(entradas.map(nomeDoChunk))) {
    if (nome === 'index') {
      falhas.push('Ponto de entrada da demo chamado index: dê um nome próprio (ex.: src/demo/gerador.ts) para o chunk ser identificável.');
      continue;
    }
    const padrao = new RegExp(`^assets/${nome.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}-[A-Za-z0-9_-]+\\.(?:js|css)$`);
    for (const arquivo of iniciais) if (padrao.test(arquivo)) falhas.push(`Chunk da demo na carga inicial: ${arquivo}.`);
  }
  return falhas;
}
