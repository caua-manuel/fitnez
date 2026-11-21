import { useEffect } from 'react';

// Tela acesa durante a execução do treino (ADR 011, 2.1). Sem suporte ou com erro: silencioso, sem aviso.

interface Sentinel { released?: boolean; release: () => Promise<void>; addEventListener?: (type: 'release', fn: () => void) => void }
interface WakeLockApi { request: (type: 'screen') => Promise<Sentinel> }

function api(): WakeLockApi | null {
 const wl = (globalThis as { navigator?: { wakeLock?: WakeLockApi } }).navigator?.wakeLock;
 return wl && typeof wl.request === 'function' ? wl : null;
}

/** O navegador permite manter a tela acesa? */
export function wakeLockSupported(): boolean { return api() !== null; }

/**
 * Mantém a tela acesa enquanto `ativo` for verdadeiro. Pede ao ativar, pede de novo quando a aba volta a ficar
 * visível (o navegador solta o bloqueio ao esconder) e solta ao desativar ou desmontar (concluir ou sair).
 */
export function useWakeLock(ativo: boolean): void {
 useEffect(() => {
  const wl = api();
  if (!ativo || !wl || typeof document === 'undefined') return;
  let sentinel: Sentinel | null = null;
  let pending = false;
  let alive = true;
  const request = async () => {
   if (!alive || pending || document.visibilityState !== 'visible' || (sentinel && !sentinel.released)) return;
   pending = true;
   try {
    const s = await wl.request('screen');
    if (!alive) { void s.release().catch(() => undefined); return; }
    sentinel = s;
    s.addEventListener?.('release', () => { if (sentinel === s) sentinel = null; });
   } catch {
    // Negado (economia de bateria, aba oculta) ou sem permissão: segue sem tela acesa.
   } finally { pending = false; }
  };
  const onVisible = () => { if (document.visibilityState === 'visible') void request(); };
  void request();
  document.addEventListener('visibilitychange', onVisible);
  return () => {
   alive = false;
   document.removeEventListener('visibilitychange', onVisible);
   const s = sentinel; sentinel = null;
   if (s && !s.released) void s.release().catch(() => undefined);
  };
 }, [ativo]);
}
