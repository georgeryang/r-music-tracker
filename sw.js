const CACHE_NAME = 'music-tracker-v3';

const STATIC_ASSETS = [
  '/r-music-tracker/',
  '/r-music-tracker/index.html',
  '/r-music-tracker/data/kpop.json',
  '/r-music-tracker/data/popheads.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Data JSON files: stale-while-revalidate (serve cached, refresh in background)
  if (url.origin === self.location.origin && url.pathname.match(/\/data\/.*\.json/)) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(request, { ignoreSearch: true });

        const fetchPromise = fetch(request).then((response) => {
          if (response.ok) {
            cache.put(request, response.clone());
          }
          return response;
        }).catch(() => cached);

        return cached || fetchPromise;
      })
    );
    return;
  }

  // Reddit fallback requests: network-only (no caching)
  if (url.hostname === 'www.reddit.com') {
    return;
  }

  // Static assets: cache-first
  if (request.method === 'GET' && url.origin === self.location.origin) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request))
    );
  }
});
