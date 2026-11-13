import { describe, expect, it } from 'vitest';
import { hasUserData, shouldShowBackupReminder } from '../../src/domain/userData';

const vazio = () => ({ history: { days: {}, measurements: {} }, catalog: { revision: 0 }, settings: {} as any });

describe('hasUserData', () => {
 it('estado de fábrica não tem dados do usuário', () => { expect(hasUserData(vazio())).toBe(false); expect(hasUserData(null)).toBe(false); });
 it('dias, medidas, catálogo editado ou perfil contam', () => {
  expect(hasUserData({ ...vazio(), history: { days: { '2026-01-01': {} }, measurements: {} } })).toBe(true);
  expect(hasUserData({ ...vazio(), history: { days: {}, measurements: { '2026-01-01': { p: '80' } } } })).toBe(true);
  expect(hasUserData({ ...vazio(), catalog: { revision: 1 } })).toBe(true);
  expect(hasUserData({ ...vazio(), settings: { profile: { name: ' Ana ' } } })).toBe(true);
  expect(hasUserData({ ...vazio(), settings: { profile: { name: '  ', goal: '' } } })).toBe(false);
 });
 it('aviso só com dados e backup pendente', () => {
  const com = { ...vazio(), catalog: { revision: 2 } };
  expect(shouldShowBackupReminder(com, true)).toBe(true);
  expect(shouldShowBackupReminder(com, false)).toBe(false);
  expect(shouldShowBackupReminder(com, undefined)).toBe(false);
  expect(shouldShowBackupReminder(vazio(), true)).toBe(false);
 });
});
