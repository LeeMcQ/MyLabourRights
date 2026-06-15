/* ============================================================
   MyLabourRights — Service Worker
   App shell: stale-while-revalidate (fast load, never stuck on old build).
   Static assets: cache-first. API: network only.
   Bump CACHE_VERSION whenever you deploy.
   ============================================================ */

const CACHE_VERSION = 'mlr-v2';
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

/* allow the page to trigger an immediate update */
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') self.skipWaiting();
});

const isShell = (url) =>
  url.origin === location.origin &&
  (url.pathname.endsWith('/') || url.pathname.endsWith('/index.html'));

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // never cache the backend API — AI/payment/auth must be live
  if (url.pathname.startsWith('/.netlify/functions/')) {
    event.respondWith(
      fetch(event.request).catch(() =>
        new Response(
          JSON.stringify({ error: 'offline', message: 'You appear to be offline. This action needs a connection.' }),
          { status: 503, headers: { 'Content-Type': 'application/json' } }
        )
      )
    );
    return;
  }

  if (event.request.method !== 'GET') return;

  // F4 — app shell: stale-while-revalidate. Serve cached instantly, fetch fresh
  // in the background, and tell open pages when a newer build is ready.
  if (isShell(url) || event.request.mode === 'navigate') {
    event.respondWith(
      caches.open(CACHE_VERSION).then(async (cache) => {
        const cached = await cache.match('./index.html');
        const network = fetch('./index.html').then((response) => {
          if (response && response.status === 200) {
            cache.put('./index.html', response.clone());
            // notify clients a fresh version is available
            self.clients.matchAll().then((cs) =>
              cs.forEach((c) => c.postMessage({ type: 'sw-updated' })));
          }
          return response;
        }).catch(() => cached);
        return cached || network;
      })
    );
    return;
  }

  // static assets: cache-first, then network (and cache the result)
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (response && response.status === 200 &&
            (url.origin === location.origin || url.host.includes('fonts.g'))) {
          const clone = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        if (event.request.mode === 'navigate') return caches.match('./index.html');
      });
    })
  );
});
