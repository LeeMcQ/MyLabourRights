/* ============================================================
   MyLabourRights — Service Worker
   Offline-first caching for the PWA shell.
   Bump CACHE_VERSION whenever you deploy a new index.html.
   ============================================================ */

const CACHE_VERSION = 'mlr-v1';
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

/* Install — pre-cache the app shell */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

/* Activate — clear old caches */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

/* Fetch strategy:
   - API calls (/.netlify/functions/*) -> network only, never cached
   - Google Fonts -> cache-first (rarely change)
   - Everything else -> cache-first, fall back to network, then cache the result
*/
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

  // only handle GET requests for caching
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        // cache same-origin and font responses
        if (response && response.status === 200 &&
            (url.origin === location.origin || url.host.includes('fonts.g'))) {
          const clone = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        // offline fallback for navigation requests
        if (event.request.mode === 'navigate') return caches.match('./index.html');
      });
    })
  );
});
