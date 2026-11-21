import { describe, expect, it } from 'vitest';
import { foundation } from '../../src/data/migration';
import { validateState } from '../../src/data/validation';
import { databaseName, modeKeyName } from '../../src/data/names';
import { readMode, storageKey, appMode } from '../../src/app/mode';

// ADR 011, base: nomes por modo e campos opcionais novos (meta.usage, meta.prompts, settings.planImport).
const state = () => foundation(Date.UTC(2026, 10, 20, 12));

describe('nomes por modo', () => {
 it('banco real inalterado e banco da demo separado', () => {
  expect(databaseName('/Projeto-Treino/')).toBe('treino12:%2FProjeto-Treino%2F');
  expect(databaseName('/Projeto-Treino/', 'demo')).toBe('treino12:demo:%2FProjeto-Treino%2F');
  expect(modeKeyName('/x/')).toBe('treino12:%2Fx%2F:modo');
 });
 it('readMode: só "demo" liga a demo; falha de acesso = real', () => {
  const st = (v: string | null) => ({ getItem: (k: string) => (k === modeKeyName('/b/') ? v : null) });
  expect(readMode(st('demo'), '/b/')).toBe('demo');
  expect(readMode(st('real'), '/b/')).toBe('real');
  expect(readMode(st(null), '/b/')).toBe('real');
  expect(readMode(null, '/b/')).toBe('real');
  expect(readMode({ getItem: () => { throw new Error('bloqueado'); } }, '/b/')).toBe('real');
 });
 it('sem localStorage (ambiente de teste) o modo é real e as chaves seguem o padrão antigo', () => {
  expect(appMode()).toBe('real');
  expect(storageKey('descanso')).toBe('treino12:descanso');
 });
});

describe('validação dos campos novos', () => {
 it('estado sem os campos novos continua válido (backups v3 antigos)', () => { expect(() => validateState(state())).not.toThrow(); });
 it('aceita meta.usage, meta.prompts e settings.planImport válidos', () => {
  const s = state();
  s.meta.usage = { lastDay: '2026-11-20', daysSinceBackup: 7 };
  s.meta.prompts = { persistAskedAt: 1, installShownAt: 2, backupSnoozedOn: '2026-11-20' };
  s.settings.planImport = { v: 1, appliedOn: '2026-11-20', name: 'Plano do amigo', undoKey: 'plan-import-undo:1' };
  expect(() => validateState(s)).not.toThrow();
  s.meta.prompts = {}; expect(() => validateState(s)).not.toThrow();
 });
 it.each([
  ['usage não objeto', (s: any) => { s.meta.usage = 3; }],
  ['usage dia inválido', (s: any) => { s.meta.usage = { lastDay: '2026-02-30', daysSinceBackup: 1 }; }],
  ['usage negativo', (s: any) => { s.meta.usage = { lastDay: '2026-11-20', daysSinceBackup: -1 }; }],
  ['usage fracionário', (s: any) => { s.meta.usage = { lastDay: '2026-11-20', daysSinceBackup: 1.5 }; }],
  ['usage acima do teto', (s: any) => { s.meta.usage = { lastDay: '2026-11-20', daysSinceBackup: 100001 }; }],
  ['prompts texto', (s: any) => { s.meta.prompts = { installShownAt: 'ontem' }; }],
  ['prompts negativo', (s: any) => { s.meta.prompts = { persistAskedAt: -1 }; }],
  ['snooze inválido', (s: any) => { s.meta.prompts = { backupSnoozedOn: 'hoje' }; }],
  ['planImport versão', (s: any) => { s.settings.planImport = { v: 2, appliedOn: '2026-11-20', name: 'x' }; }],
  ['planImport sem nome', (s: any) => { s.settings.planImport = { v: 1, appliedOn: '2026-11-20' }; }],
 ])('recusa %s', (_n, bad) => { const s = state(); bad(s); expect(() => validateState(s)).toThrow(); });
 it('limite do usage: aceita 100000', () => { const s = state(); s.meta.usage = { lastDay: '2026-11-20', daysSinceBackup: 100000 }; expect(() => validateState(s)).not.toThrow(); });
});
