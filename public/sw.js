// Test-version service worker: NO CACHING.
// Exists only to satisfy PWA installability. Requests bypass the SW
// and use the browser's normal HTTP cache.
// Any caches left over from earlier versions are wiped on activate.

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
      await self.clients.claim();
    })(),
  );
});
