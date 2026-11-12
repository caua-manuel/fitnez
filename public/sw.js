/* Os marcadores são preenchidos pelo plugin nativo src/pwa/build.ts. */
const BASE = '__APP_BASE__';
const PREFIX = '__CACHE_PREFIX__';
const CACHE = '__CACHE_NAME__';
const PRECACHE = __PRECACHE_LIST__;
const PRECACHE_URLS = new Set(PRECACHE.map(path => new URL(path, self.location.origin).href));
self.addEventListener('install', event => {
 event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(PRECACHE)));
});
self.addEventListener('activate', event => {
 event.waitUntil((async () => {
  const keys = await caches.keys();
  await Promise.all(keys.filter(key => key.startsWith(PREFIX) && key !== CACHE).map(key => caches.delete(key)));
  await self.clients.claim();
  for (const client of await self.clients.matchAll()) client.postMessage({type:'PRECACHE_READY'});
 })());
});
self.addEventListener('message', event => {
 if(event.data?.type === 'APPLY_UPDATE') self.skipWaiting();
 if(event.data?.type === 'CHECK_READY') event.waitUntil((async () => {
  const cache = await caches.open(CACHE);
  if((await cache.keys()).length >= PRECACHE.length) event.source?.postMessage({type:'PRECACHE_READY'});
 })());
});
self.addEventListener('fetch', event => {
 const url = new URL(event.request.url);
 if(event.request.method !== 'GET' || url.origin !== self.location.origin || !url.pathname.startsWith(BASE)) return;
 if(event.request.mode === 'navigate') {
  event.respondWith(caches.open(CACHE).then(async cache => (await cache.match(BASE)) || (await cache.match(`${BASE}index.html`)) || fetch(event.request)));
  return;
 }
 // Assets estáticos do build são idênticos com ou sem Origin na requisição.
 // Ignorar Vary só para URLs exatas do precache; manter origem, base e busca.
 if(PRECACHE_URLS.has(url.href)) event.respondWith(caches.open(CACHE).then(async cache => (await cache.match(url.href, {ignoreVary:true})) || fetch(event.request)));
});
