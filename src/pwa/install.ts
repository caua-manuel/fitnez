import { useSyncExternalStore } from 'react';

/** Detecção de instalação do app (funções puras, testáveis com user agents sintéticos) e o estado do `beforeinstallprompt`. */

export interface NavigatorLike { userAgent: string; platform?: string; maxTouchPoints?: number; standalone?: boolean }

/** iPhone, iPad e iPod; o iPadOS recente se identifica como Mac, mas tem tela de toque. */
export function isIos(nav: NavigatorLike): boolean {
 if (/iPhone|iPad|iPod/.test(nav.userAgent)) return true;
 return (nav.platform === 'MacIntel' || /Macintosh/.test(nav.userAgent)) && (nav.maxTouchPoints ?? 0) > 1;
}

/** No iOS, só o Safari adiciona o app à tela inicial; os outros navegadores trazem marcas próprias no user agent. */
export function isIosSafari(nav: NavigatorLike): boolean {
 return isIos(nav) && !/CriOS|FxiOS|EdgiOS|OPiOS|OPT\/|GSA\/|DuckDuckGo|YaBrowser|Brave/i.test(nav.userAgent);
}

/** App aberto pelo ícone da tela inicial: `display-mode: standalone` (ou fullscreen/minimal-ui) ou `navigator.standalone` no iOS. */
export function isStandalone(nav: NavigatorLike, matches: (query: string) => boolean): boolean {
 if (nav.standalone === true) return true;
 return ['standalone', 'fullscreen', 'minimal-ui'].some(mode => matches(`(display-mode: ${mode})`));
}

export type InstallMode = 'installed' | 'prompt' | 'ios-safari' | 'ios-other' | 'manual';

export function installMode(input: { nav: NavigatorLike; matches: (query: string) => boolean; hasPrompt: boolean }): InstallMode {
 if (isStandalone(input.nav, input.matches)) return 'installed';
 if (input.hasPrompt) return 'prompt';
 if (isIos(input.nav)) return isIosSafari(input.nav) ? 'ios-safari' : 'ios-other';
 return 'manual';
}

/** Evento não padronizado, só em navegadores baseados no Chromium. */
export interface InstallPromptEvent extends Event { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> }

let deferred: InstallPromptEvent | null = null;
let installed = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach(l => l());

if (typeof window !== 'undefined') {
 window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferred = e as InstallPromptEvent; emit(); });
 window.addEventListener('appinstalled', () => { deferred = null; installed = true; emit(); });
}

function subscribe(cb: () => void) { listeners.add(cb); return () => { listeners.delete(cb); }; }
const hasPrompt = () => deferred !== null;
const wasInstalled = () => installed;

export function currentInstallMode(): InstallMode {
 const nav = navigator as Navigator & { standalone?: boolean };
 if (installed) return 'installed';
 return installMode({ nav, matches: q => window.matchMedia?.(q).matches === true, hasPrompt: deferred !== null });
}

/** Dispara o diálogo nativo de instalação; devolve o resultado ou `null` se não havia evento guardado. */
export async function promptInstall(): Promise<'accepted' | 'dismissed' | null> {
 const event = deferred;
 if (!event) return null;
 deferred = null; emit();
 try { await event.prompt(); return (await event.userChoice).outcome; } catch { return 'dismissed'; }
}

export function useInstall() {
 useSyncExternalStore(subscribe, hasPrompt);
 useSyncExternalStore(subscribe, wasInstalled);
 return { mode: currentInstallMode(), prompt: promptInstall };
}
