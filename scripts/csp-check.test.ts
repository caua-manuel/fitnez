import assert from 'node:assert/strict';
import { test } from 'node:test';
import { verificarRecursoRemoto, verificarSegurancaHtml } from './csp-check.ts';

const CSP_BOA = "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; font-src 'self'; connect-src 'self'; worker-src 'self'; manifest-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'";
const html = (csp: string, corpo = '<script type="module" src="/app/assets/a.js"></script><link rel="stylesheet" href="/app/assets/a.css">') =>
  `<!doctype html><html><head><meta http-equiv="Content-Security-Policy" content="${csp}">${corpo}</head><body></body></html>`;

test('HTML com a CSP de produção passa', () => {
  assert.deepEqual(verificarSegurancaHtml(html(CSP_BOA)), []);
});

test('aceita aspas codificadas como entidade (saída do Vite)', () => {
  assert.deepEqual(verificarSegurancaHtml(html(CSP_BOA.replaceAll("'", '&#39;'))), []);
  assert.ok(verificarSegurancaHtml(html(CSP_BOA.replace("script-src 'self'", "script-src 'self' 'unsafe-eval'").replaceAll("'", '&#39;'))).length > 0);
});

test('falha sem a meta de CSP', () => {
  assert.match(verificarSegurancaHtml('<html><head></head></html>')[0], /CSP ausente/);
});

test('falha quando uma diretiva perigosa é injetada', () => {
  const casos: Array<[string, RegExp]> = [
    [CSP_BOA.replace("script-src 'self'", "script-src 'self' 'unsafe-inline'"), /unsafe-inline/],
    [CSP_BOA.replace("script-src 'self'", "script-src 'self' 'unsafe-eval'"), /unsafe-eval/],
    [CSP_BOA.replace("default-src 'self'; ", ''), /default-src/],
    [CSP_BOA.replace("default-src 'self'", "default-src *"), /default-src/],
    [CSP_BOA.replace("object-src 'none'", "object-src 'self'"), /object-src/],
    [CSP_BOA.replace("base-uri 'none'", "base-uri 'self'"), /base-uri/],
    [CSP_BOA.replace("; form-action 'none'", ''), /form-action/],
    [CSP_BOA.replace("connect-src 'self'", "connect-src 'self' https://api.exemplo.test"), /connect-src/],
    [CSP_BOA.replace("script-src 'self'", "script-src 'self' https://cdn.exemplo.test"), /script-src/],
  ];
  for (const [csp, esperado] of casos) {
    const erros = verificarSegurancaHtml(html(csp));
    assert.ok(erros.some(e => esperado.test(e)), `Esperava erro ${esperado} para: ${csp}\nobtido: ${erros.join(' | ')}`);
  }
});

test('falha com URL remota em script, estilo, imagem ou fonte', () => {
  for (const corpo of [
    '<script src="https://cdn.exemplo.test/x.js"></script>',
    '<link rel="stylesheet" href="//cdn.exemplo.test/x.css">',
    '<img src="http://exemplo.test/x.png">',
    '<link rel="preload" as="font" href="https://fonts.exemplo.test/f.woff2">',
    '<style>body{color:red}</style>',
  ]) {
    assert.ok(verificarSegurancaHtml(html(CSP_BOA, corpo)).length > 0, corpo);
  }
});

test('falha com URL remota dentro do CSS', () => {
  assert.equal(verificarRecursoRemoto('a.css', 'a{background:url(/img/a.jpg)}').length, 0);
  assert.equal(verificarRecursoRemoto('a.css', "@font-face{src:url('https://fonts.exemplo.test/f.woff2')}").length, 1);
  assert.equal(verificarRecursoRemoto('a.css', '@import "https://exemplo.test/x.css";').length, 1);
});

