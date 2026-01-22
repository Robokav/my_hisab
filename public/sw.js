
const CACHE_NAME = 'hisab-pro-v5';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
  'https://cdn-icons-png.flaticon.com/512/2933/2933116.png'
];

// On install, cache the core app shell
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('SW: Pre-caching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate and clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(key => {
        if (key !== CACHE_NAME) {
          console.log('SW: Removing old cache', key);
          return caches.delete(key);
        }
      })
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // CRITICAL: Skip Service Worker for ALL development requests
  // This includes Vite's HMR scripts and the WebSocket connection.
  if (
    url.hostname === 'localhost' || 
    url.hostname === '127.0.0.1' || 
    url.port === '5173' ||
    url.pathname.includes('@vite') || 
    url.pathname.includes('__vite')
  ) {
    return;
  }

  // Skip unsupported schemes (chrome-extension, etc.)
  if (!['http:', 'https:'].includes(url.protocol)) return;

  // Strategy: Stale-While-Revalidate for other assets
  event.respondWith(
    caches.open(CACHE_NAME).then(cache => {
      return cache.match(event.request).then(cachedResponse => {
        const fetchPromise = fetch(event.request).then(networkResponse => {
          if (networkResponse && networkResponse.status === 200) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(() => {
          return cachedResponse;
        });

        return cachedResponse || fetchPromise;
      });
    })
  );
});
