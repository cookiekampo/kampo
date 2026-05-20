const CACHE_NAME = 'kampo-v11';
const HTML_FALLBACK = './index.html';
const PRECACHE_ASSETS = [
  './index.html',
  './manifest.json?v=11',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;

  if (isHtmlRequest(e.request)) {
    e.respondWith(networkFirstHtml(e.request));
    return;
  }

  e.respondWith(cacheFirstAsset(e.request));
});

function isHtmlRequest(request) {
  return request.mode === 'navigate' ||
    (request.headers.get('accept') || '').includes('text/html');
}

function networkFirstHtml(request) {
  return fetch(request)
    .then(response => {
      if (response.ok) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(HTML_FALLBACK, copy));
      }
      return response;
    })
    .catch(() =>
      caches.match(request).then(cached => cached || caches.match(HTML_FALLBACK))
    );
}

function cacheFirstAsset(request) {
  return caches.match(request).then(cached => {
    if (cached) return cached;

    return fetch(request).then(response => {
      if (response.ok) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
      }
      return response;
    });
  });
}
