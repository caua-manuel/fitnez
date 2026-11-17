// Verificação das diretivas de segurança do index.html publicado. Retorna a lista de problemas (vazia = ok).

const EXIGIDAS: Record<string, string> = {
  'default-src': "'self'",
  'object-src': "'none'",
  'base-uri': "'none'",
  'form-action': "'none'",
};

export function parseCsp(content: string): Map<string, string[]> {
  const diretivas = new Map<string, string[]>();
  for (const parte of content.split(';')) {
    const [nome, ...valores] = parte.trim().split(/\s+/);
    if (nome) diretivas.set(nome.toLowerCase(), valores);
  }
  return diretivas;
}

// O navegador decodifica entidades do atributo antes de aplicar a política (o Vite emite &#39;).
function decodificar(valor: string): string {
  return valor
    .replace(/&#x([0-9a-f]+);/gi, (_, h: string) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCodePoint(Number(n)))
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
}

export function extrairCsp(html: string): string | null {
  for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
    if (!/http-equiv\s*=\s*["']?Content-Security-Policy["']?/i.test(tag)) continue;
    const conteudo = tag.match(/\bcontent\s*=\s*(?:"([^"]*)"|'([^']*)')/i);
    return conteudo ? decodificar(conteudo[1] ?? conteudo[2] ?? '') : '';
  }
  return null;
}

const REMOTA = /^\s*(?:https?:)?\/\//i;

export function verificarSegurancaHtml(html: string): string[] {
  const erros: string[] = [];
  const csp = extrairCsp(html);
  if (csp === null) return ['CSP ausente: o index.html não tem a meta Content-Security-Policy.'];
  const d = parseCsp(csp);

  for (const [nome, esperado] of Object.entries(EXIGIDAS)) {
    const valores = d.get(nome);
    if (!valores || valores.length !== 1 || valores[0] !== esperado) {
      erros.push(`CSP: a diretiva ${nome} deve ser exatamente ${nome} ${esperado} (encontrado: ${valores ? valores.join(' ') || 'vazia' : 'ausente'}).`);
    }
  }
  for (const [nome, valores] of d) {
    for (const perigoso of ["'unsafe-eval'", "'unsafe-inline'", "'unsafe-hashes'", "'wasm-unsafe-eval'"]) {
      if ((nome === 'script-src' || nome === 'script-src-elem' || nome === 'default-src') && valores.includes(perigoso)) {
        erros.push(`CSP: ${nome} não pode conter ${perigoso}.`);
      }
    }
  }
  const scriptSrc = d.get('script-src');
  if (!scriptSrc || scriptSrc.join(' ') !== "'self'") {
    erros.push(`CSP: script-src deve ser exatamente 'self' (encontrado: ${scriptSrc ? scriptSrc.join(' ') : 'ausente'}).`);
  }
  const conexao = d.get('connect-src');
  if (!conexao || conexao.some(v => v !== "'self'")) {
    erros.push(`CSP: connect-src deve permitir somente 'self', sem origens externas (encontrado: ${conexao ? conexao.join(' ') : 'ausente'}).`);
  }
  for (const [nome, valores] of d) {
    const externas = valores.filter(v => /^(?:https?:|wss?:|\*|data:|blob:)/i.test(v) || v.includes('//'));
    if (externas.length) erros.push(`CSP: ${nome} libera origem externa ou curinga: ${externas.join(' ')}.`);
  }

  // Nenhuma URL remota em recursos carregados pela página.
  for (const tag of html.match(/<(?:script|link|img|source|iframe|embed|object|audio|video)\b[^>]*>/gi) ?? []) {
    for (const atributo of tag.matchAll(/\b(?:src|href|srcset|data)\s*=\s*(?:"([^"]*)"|'([^']*)')/gi)) {
      const valor = atributo[1] ?? atributo[2] ?? '';
      if (REMOTA.test(valor)) erros.push(`HTML: recurso remoto proibido em ${tag.slice(0, 60)}... -> ${valor}`);
    }
  }
  for (const css of html.match(/<style\b[^>]*>[\s\S]*?<\/style>/gi) ?? []) erros.push(`HTML: bloco <style> embutido proibido (${css.slice(0, 40)}...).`);
  return erros;
}

/** Procura URLs remotas em CSS (url(), @import) e no manifesto. */
export function verificarRecursoRemoto(nome: string, conteudo: string): string[] {
  const erros: string[] = [];
  for (const m of conteudo.matchAll(/url\(\s*["']?\s*((?:https?:)?\/\/[^)"'\s]+)/gi)) erros.push(`${nome}: URL remota proibida em url(): ${m[1]}`);
  for (const m of conteudo.matchAll(/@import\s+(?:url\(\s*)?["']?\s*((?:https?:)?\/\/[^)"'\s;]+)/gi)) erros.push(`${nome}: @import remoto proibido: ${m[1]}`);
  return erros;
}
