/* Os marcadores são preenchidos pelo plugin nativo src/pwa/build.ts. */
const BASE = '__APP_BASE__';
const PREFIX = '__CACHE_PREFIX__';
const CACHE = '__CACHE_NAME__';
const PRECACHE = __PRECACHE_LIST__;
const PRECACHE_URLS = new Set(PRECACHE.map(path => new URL(path, self.location.origin).href));
const EXERCISE_CACHE = `${CACHE}:exercise`;
const EXERCISE_BASE = `${BASE}img/exercise/`;
const EXERCISE_LIMIT = 40;
const EXERCISE_FILE = /^[a-z0-9_-]+-[123]\.webp$/;
let exerciseJob = Promise.resolve();

async function cacheExerciseImages(files) {
 const wanted = new Set(files.filter(file => typeof file === 'string' && EXERCISE_FILE.test(file))
  .map(file => new URL(EXERCISE_BASE + file, self.location.origin).href));
 const cache = await caches.open(EXERCISE_CACHE);
 let kept = 0;
 for (const request of await cache.keys()) {
  if (wanted.has(request.url) && kept < EXERCISE_LIMIT) {
   wanted.delete(request.url);
   kept++;
  } else await cache.delete(request);
 }
 for (const url of wanted) {
  if (kept >= EXERCISE_LIMIT) break;
  const response = await fetch(url, {mode:'same-origin', redirect:'error', priority:'low'}).catch(() => null);
  if (response?.ok && response.headers.get('content-type')?.startsWith('image/webp')) {
   await cache.put(url, response);
   kept++;
  }
 }
}

self.addEventListener('install', event => {
 event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(PRECACHE)));
});
self.addEventListener('activate', event => {
 event.waitUntil((async () => {
  const keys = await caches.keys();
  await Promise.all(keys.filter(key => key.startsWith(PREFIX) && key !== CACHE && key !== EXERCISE_CACHE).map(key => caches.delete(key)));
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
 if (event.data?.type === 'CACHE_EXERCISE_IMAGES' && Array.isArray(event.data.files)
  && event.source?.url && new URL(event.source.url).pathname.startsWith(BASE)) {
  exerciseJob = exerciseJob.then(() => cacheExerciseImages(event.data.files)).catch(() => {});
  event.waitUntil(exerciseJob);
 }
});
self.addEventListener('notificationclick', event => {
 event.notification.close();
 const target = new URL(event.notification.data?.url || `${BASE}#treino`, self.location.origin);
 if(target.origin !== self.location.origin || !target.pathname.startsWith(BASE)) target.href = new URL(`${BASE}#treino`, self.location.origin).href;
 event.waitUntil((async () => {
  const windows = await self.clients.matchAll({type:'window', includeUncontrolled:true});
  const open = windows.find(client => new URL(client.url).pathname.startsWith(BASE));
  if(open) { if('navigate' in open && open.url !== target.href) await open.navigate(target.href).catch(() => {}); return open.focus(); }
  return self.clients.openWindow(target.href);
 })());
});
self.addEventListener('fetch', event => {
 const url = new URL(event.request.url);
 if(event.request.method !== 'GET' || url.origin !== self.location.origin || !url.pathname.startsWith(BASE)) return;
 if(event.request.mode === 'navigate') {
  event.respondWith(caches.open(CACHE).then(async cache => (await cache.match(BASE)) || fetch(event.request)));
  return;
 }
 if (event.request.destination === 'image' && url.pathname.startsWith(EXERCISE_BASE)
  && EXERCISE_FILE.test(url.pathname.slice(EXERCISE_BASE.length)) && !url.search) {
  event.respondWith(caches.match(url.href, {cacheName:EXERCISE_CACHE, ignoreVary:true})
   .catch(() => undefined).then(cached => cached || fetch(event.request, {mode:'same-origin', redirect:'error'})));
  return;
 }
 // Assets estáticos do build são idênticos com ou sem Origin na requisição.
 // Ignorar Vary só para URLs exatas do precache; manter origem, base e busca.
 if(PRECACHE_URLS.has(url.href)) event.respondWith(caches.open(CACHE).then(async cache => (await cache.match(url.href, {ignoreVary:true})) || fetch(event.request)));
});
