/* ============================================================
   MyLabourRights — Service Worker v3
   App shell: stale-while-revalidate (fast load, never stuck on old build).
   Static assets: cache-first. Google Fonts: stale-while-revalidate.
   AI/payment API: network-only with graceful offline fallback.
   Bump CACHE_VERSION whenever you deploy a new build.
   ============================================================ */

const CACHE_VERSION = 'mlr-v3';
const SHELL_CACHE   = CACHE_VERSION + '-shell';
const FONT_CACHE    = CACHE_VERSION + '-fonts';
const DATA_CACHE    = CACHE_VERSION + '-data';

const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-192.png',
  './icons/icon-maskable-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => !k.startsWith(CACHE_VERSION)).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

/* Allow the page to trigger an immediate update */
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting' || event.data === 'SKIP_WAITING') self.skipWaiting();
});

const isShell = (url) =>
  url.origin === location.origin &&
  (url.pathname === '/' || url.pathname.endsWith('/index.html'));

const isFont = (url) =>
  url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com');

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  /* ── Netlify functions (AI / payment / auth) — network-only ── */
  if (url.pathname.startsWith('/.netlify/functions/')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        /* Graceful offline response for AI calls */
        if (url.pathname.includes('/ai')) {
          return new Response(
            JSON.stringify({
              text: "You're offline. Lee is running in offline mode — your case guidance continues using the built-in system.",
              followUp: null, evidence: [], successRate: null,
              validity: null, escalate: null, offline: true,
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );
        }
        return new Response(
          JSON.stringify({ error: 'offline', message: "You're offline. This action needs a connection." }),
          { status: 503, headers: { 'Content-Type': 'application/json' } }
        );
      })
    );
    return;
  }

  if (event.request.method !== 'GET') return;

  /* ── Google Fonts — stale-while-revalidate ────────────────── */
  if (isFont(url)) {
    event.respondWith(
      caches.open(FONT_CACHE).then((cache) =>
        cache.match(event.request).then((cached) => {
          const fresh = fetch(event.request).then((res) => {
            if (res && res.status === 200) cache.put(event.request, res.clone());
            return res;
          }).catch(() => cached);
          return cached || fresh;
        })
      )
    );
    return;
  }

  /* ── App shell — stale-while-revalidate ───────────────────── */
  if (isShell(url) || event.request.mode === 'navigate') {
    event.respondWith(
      caches.open(SHELL_CACHE).then(async (cache) => {
        const cached  = await cache.match('./index.html');
        const network = fetch('./index.html').then((response) => {
          if (response && response.status === 200) {
            cache.put('./index.html', response.clone());
            /* Notify open tabs that a new version is ready */
            self.clients.matchAll().then((cs) =>
              cs.forEach((c) => c.postMessage({ type: 'sw-updated' }))
            );
          }
          return response;
        }).catch(() => cached);
        return cached || network;
      })
    );
    return;
  }

  /* ── Static assets — cache-first, then network ───────────── */
  event.respondWith(
    caches.open(DATA_CACHE).then((cache) =>
      cache.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (response && response.status === 200) {
            cache.put(event.request, response.clone());
          }
          return response;
        }).catch(() => {
          if (event.request.mode === 'navigate') return caches.match('./index.html');
        });
      })
    )
  );
});
