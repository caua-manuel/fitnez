export type NotifySupport = 'granted' | 'denied' | 'default' | 'unsupported';

type NotifyEnv = { Notification?: { permission: NotificationPermission }; serviceWorker?: unknown };

function defaultEnv(): NotifyEnv {
 const g = globalThis as { Notification?: { permission: NotificationPermission }; navigator?: { serviceWorker?: unknown } };
 return { Notification: g.Notification, serviceWorker: g.navigator?.serviceWorker };
}

/** Estado das notificações. Sem a API (ex.: iPhone fora da tela inicial), 'unsupported'. */
export function notifySupport(env: NotifyEnv = defaultEnv()): NotifySupport {
 const permission = env.Notification?.permission;
 if (!env.Notification || !permission) return 'unsupported';
 return permission === 'granted' || permission === 'denied' ? permission : 'default';
}

/** Pede a permissão ao usuário (chamar a partir de um toque). Nunca lança. */
export async function enableNotifications(): Promise<NotifySupport> {
 try {
  if (notifySupport() === 'unsupported') return 'unsupported';
  const api = (globalThis as { Notification?: { requestPermission: () => Promise<NotificationPermission> } }).Notification;
  await api?.requestPermission();
 } catch {
  // Falha ao pedir permissão: apenas devolve o estado atual.
 }
 return notifySupport();
}

/** Aviso local de fim de descanso via service worker. Sem permissão ou suporte, não faz nada. */
export async function notifyRestEnd(exerciseName: string): Promise<void> {
 try {
  if (notifySupport() !== 'granted') return;
  const container = (globalThis as { navigator?: { serviceWorker?: { getRegistration?: () => Promise<{ showNotification: (title: string, options?: object) => Promise<void> } | undefined> } } }).navigator?.serviceWorker;
  const registration = await container?.getRegistration?.();
  if (!registration) return;
  const url = (globalThis as { location?: { href?: string } }).location?.href;
  await registration.showNotification('Descanso terminado', {
   body: exerciseName,
   tag: 'fim-de-descanso',
   data: { url },
  });
 } catch {
  // Notificação é opcional: nunca interrompe o treino.
 }
}
