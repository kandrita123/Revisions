const CACHE = 'revisions-v2';
const ASSETS = [
  '/Revisions/',
  '/Revisions/index.html',
  '/Revisions/style.css',
  '/Revisions/app.js',
  '/Revisions/manifest.json',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => {
      return fetch(e.request).then(fresh => {
        caches.open(CACHE).then(c => c.put(e.request, fresh.clone()));
        return fresh;
      }).catch(() => cached);
    })
  );
});