// High-fidelity robust Service Worker supporting offline fallback and seamless network-first bypass
const CACHE_NAME = 'neontrade-v2';

self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  // Only handle GET requests or standard navigation/assets
  if (e.request.method !== 'GET') {
    return;
  }

  // Do not intercept hot-reload files or API queries/firebase requests
  const url = e.request.url;
  if (
    url.includes('/api/') || 
    url.includes('firestore.googleapis.com') || 
    url.includes('firebase') || 
    url.includes('localhost') || 
    url.includes('127.0.0.1')
  ) {
    return;
  }

  // Network-First with Cache fallback strategy
  e.respondWith(
    fetch(e.request)
      .then((response) => {
        // Cache valid standard page files
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, responseToCache).catch(() => {});
          });
        }
        return response;
      })
      .catch(() => {
        // Safe offline/cache response
        return caches.match(e.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Fallback to primary shell if standard navigation
          if (e.request.mode === 'navigate') {
            return caches.match('/');
          }
        });
      })
  );
});
