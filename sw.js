const CACHE_NAME = 'markice-cache-v1.29';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './vendor/leaflet.js',
  './vendor/leaflet.css',
  // Spisak koji se učitava sam pri pokretanju — keširan da radi i offline.
  './Potvrda o stanju grla.xlsx'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      // {cache:'reload'} bypasses the browser's own HTTP cache for each asset —
      // cache.addAll() alone can silently re-pack an already-stale index.html
      // into the brand new Cache Storage bucket if the host ever sends a
      // cacheable response for it, defeating the whole CACHE_NAME bump.
      Promise.all(ASSETS.map((url) =>
        fetch(url, {cache: 'reload'}).then((response) => cache.put(url, response))
      ))
    )
  );
  // No self.skipWaiting() here on purpose: when this install is replacing an
  // already-active version, the new worker should sit in "waiting" until the
  // page's own "Osvježi" button confirms it (see the message listener below)
  // — otherwise an update could yank the app out from under someone mid-entry.
});

self.addEventListener('message', (event) => {
  if(event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
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
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) {
    return; // cross-origin requests (e.g. Google Sheets import) go straight to network, never cached
  }
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (response.ok && event.request.method === 'GET') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => cached);
    })
  );
});
