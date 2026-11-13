import { describe, expect, it, vi } from 'vitest';
import { notifyRestEnd, notifySupport } from '../../src/pwa/notifications';

describe('notificações', () => {
 it('sem API devolve unsupported', () => {
  expect(notifySupport({})).toBe('unsupported');
 });
 it('mapeia as permissões', () => {
  expect(notifySupport({ Notification: { permission: 'denied' } })).toBe('denied');
  expect(notifySupport({ Notification: { permission: 'granted' } })).toBe('granted');
  expect(notifySupport({ Notification: { permission: 'default' } })).toBe('default');
 });
 it('notifyRestEnd sem permissão não lança nem chama showNotification', async () => {
  const showNotification = vi.fn();
  const getRegistration = vi.fn(async () => ({ showNotification }));
  vi.stubGlobal('navigator', { serviceWorker: { getRegistration } });
  vi.stubGlobal('Notification', { permission: 'denied' });
  await expect(notifyRestEnd('Supino')).resolves.toBeUndefined();
  expect(showNotification).not.toHaveBeenCalled();
  vi.unstubAllGlobals();
 });
 it('com permissão mostra aviso sem dado pessoal', async () => {
  const showNotification = vi.fn(async () => undefined);
  vi.stubGlobal('navigator', { serviceWorker: { getRegistration: async () => ({ showNotification }) } });
  vi.stubGlobal('Notification', { permission: 'granted' });
  await notifyRestEnd('Supino');
  expect(showNotification).toHaveBeenCalledWith('Descanso terminado', expect.objectContaining({ body: 'Supino' }));
  vi.unstubAllGlobals();
 });
});
