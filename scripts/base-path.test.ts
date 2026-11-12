import assert from 'node:assert/strict';
import { test } from 'node:test';
import { resolveBasePath } from './base-path.ts';

test('base padrão e override explícito normalizado', () => {
  assert.equal(resolveBasePath({}), '/Projeto-Treino/');
  assert.equal(resolveBasePath({ VITE_BASE_PATH: '/' }), '/');
  assert.equal(resolveBasePath({ VITE_BASE_PATH: '/app' }), '/app/');
  assert.equal(resolveBasePath({ VITE_BASE_PATH: '/app/', CI: 'true', GITHUB_REPOSITORY: 'dono/outro' }), '/app/');
});

test('base real do repositório no CI e Pages da raiz', () => {
  assert.equal(resolveBasePath({ CI: 'true', GITHUB_REPOSITORY: 'dono/meu-app' }), '/meu-app/');
  assert.equal(resolveBasePath({ CI: 'true', GITHUB_REPOSITORY: 'dono/dono.github.io' }), '/');
});

test('recusa caminhos perigosos, vazios e repositório malformado', () => {
  for (const base of ['', 'app', '//site/', '/a//b/', '/a/../b/', '/./', '/app?x=1', '/app#rota', '/a\\b/', '/%2e%2e/']) {
    assert.throws(() => resolveBasePath({ VITE_BASE_PATH: base }));
  }
  assert.throws(() => resolveBasePath({ CI: 'true', GITHUB_REPOSITORY: 'dono/repo/outro' }));
});
