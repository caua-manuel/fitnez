import { useEffect, useRef, useState } from 'react';
export function usePwa() {
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
 return {ready,online,error,development:import.meta.env.DEV,updateAvailable,applyUpdate:()=>{const waiting=registration.current?.waiting;if(waiting){applying.current=true;waiting.postMessage({type:'APPLY_UPDATE'});}else setError('A atualização não está mais disponível. Reabra o app para verificar.');},deferUpdate:()=>setUpdateAvailable(false)};
}
