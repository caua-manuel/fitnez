import { useEffect, useRef, useState } from 'react';
import type { StateV3 } from '../application/repository';
import { isStartConfirmed } from '../domain/planStart';

export function usePwa(state: StateV3 | null) {
 const [ready,setReady]=useState(false);
 const [online,setOnline]=useState(navigator.onLine);
 const [updateAvailable,setUpdateAvailable]=useState(false);
 const [error,setError]=useState('');
 const registration=useRef<ServiceWorkerRegistration|null>(null);
 const applying=useRef(false);
 useEffect(()=>{
  const connectivity=()=>setOnline(navigator.onLine);
  window.addEventListener('online',connectivity);window.addEventListener('offline',connectivity);
  if(!import.meta.env.PROD || !('serviceWorker' in navigator)) {
   setError(import.meta.env.DEV ? 'Acesso offline e instalação são verificados no build de produção em HTTPS ou localhost.' : 'Este navegador ou endereço não permite o uso offline.');
   return ()=>{window.removeEventListener('online',connectivity);window.removeEventListener('offline',connectivity);};
  }
  let active=true;
  const message=(event:MessageEvent)=>{if(event.data?.type==='PRECACHE_READY'&&active)setReady(true);};
  const change=()=>{if(applying.current)window.location.reload();else navigator.serviceWorker.controller?.postMessage({type:'CHECK_READY'});};
  navigator.serviceWorker.addEventListener('message',message);navigator.serviceWorker.addEventListener('controllerchange',change);
  navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`,{scope:import.meta.env.BASE_URL}).then(reg=>{
   if(!active)return;registration.current=reg;
   if(reg.waiting)setUpdateAvailable(true);
   if(reg.active)reg.active.postMessage({type:'CHECK_READY'});
   const watchInstalling=()=>{
    const worker=reg.installing;
    worker?.addEventListener('statechange',()=>{
     if(!active)return;
     if(worker.state==='installed') {
      if(navigator.serviceWorker.controller)setUpdateAvailable(true);
      else worker.postMessage({type:'CHECK_READY'});
     }
    });
   };
   reg.addEventListener('updatefound',watchInstalling);
   if(reg.installing)watchInstalling();
  }).catch(()=>active&&setError('Não foi possível preparar o uso offline. Reabra com conexão e tente novamente.'));
  return ()=>{active=false;window.removeEventListener('online',connectivity);window.removeEventListener('offline',connectivity);navigator.serviceWorker.removeEventListener('message',message);navigator.serviceWorker.removeEventListener('controllerchange',change);};
 },[]);
 const exerciseIds = state && isStartConfirmed(state.settings)
  ? JSON.stringify([...new Set(Object.values(state.catalog.plan.sess).flatMap(session => session.ex))])
  : null;
 useEffect(() => {
  if (!ready || !online || exerciseIds === null) return;
  let active = true;
  const prepare = () => {
   const connection = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
   if (!navigator.onLine || connection?.saveData || /2g|3g/.test(connection?.effectiveType ?? '')) return;
   void Promise.all([navigator.serviceWorker.ready, import('../domain/exerciseImages')]).then(([registration, { exerciseFrames }]) => {
    const ids: string[] = JSON.parse(exerciseIds);
    if (active) registration.active?.postMessage({ type: 'CACHE_EXERCISE_IMAGES', files: ids.flatMap(exerciseFrames) });
   }).catch(() => {});
  };
  // Safari não oferece requestIdleCallback. O atraso mantém o trabalho longe da abertura da tela.
  const idle = 'requestIdleCallback' in window;
  const task = idle ? window.requestIdleCallback(prepare) : window.setTimeout(prepare, 1500);
  return () => {
   active = false;
   if (idle) window.cancelIdleCallback(task); else window.clearTimeout(task);
  };
 }, [exerciseIds, online, ready]);
 return {ready,online,error,development:import.meta.env.DEV,updateAvailable,applyUpdate:()=>{const waiting=registration.current?.waiting;if(waiting){applying.current=true;waiting.postMessage({type:'APPLY_UPDATE'});}else setError('A atualização não está mais disponível. Reabra o app para verificar.');},deferUpdate:()=>setUpdateAvailable(false)};
}
