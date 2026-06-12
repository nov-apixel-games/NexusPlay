const CACHE_NAME = 'nexus-offline-apps-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
  // Pre-cache some main NexusPlay assets if needed, but the focus is on dynamic apps
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName.startsWith('nexus-offline')) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // For GET requests only
  if (event.request.method !== 'GET') return;

  const requestUrl = new URL(event.request.url);
  
  // Ignore Vite dev server requests and Chrome extensions
  if (
    requestUrl.protocol === 'chrome-extension:' ||
    requestUrl.pathname.startsWith('/@vite') ||
    requestUrl.pathname.startsWith('/@fs') ||
    requestUrl.pathname.startsWith('/@react-refresh') ||
    requestUrl.pathname.includes('node_modules')
  ) {
    return;
  }

  // Don't intercept API requests completely if not needed, but we'll try network first
  if (requestUrl.pathname.startsWith('/api/') || (requestUrl.origin !== location.origin && !event.request.url.includes('upload'))) {
     // Let third party through normally, but still we'll use our networkFirst block for all
  }

  event.respondWith(
    (async () => {
      try {
        // Network first
        const networkResponse = await fetch(event.request);
        
        // Cache successful responses for offline use
        if (networkResponse.ok && event.request.url.startsWith('http')) {
           const cache = await caches.open(CACHE_NAME);
           cache.put(event.request, networkResponse.clone()).catch(() => {});
        }
        
        return networkResponse;
      } catch (error) {
        // Offline: fallback to cache
        console.warn('[SW] Fetch failed, falling back to cache for', event.request.url);
        const cache = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.match(event.request);
        
        if (cachedResponse) {
          return cachedResponse;
        }

        // If it's a navigation request and we don't have it, we might return a custom offline page
        // but we'll try to serve the base index.html if we cached it.
        if (event.request.mode === 'navigate') {
          const indexFallback = await cache.match(new Request('/'));
          if (indexFallback) return indexFallback;
          
          const indexHtmlFallback = await cache.match(new Request('/index.html'));
          if (indexHtmlFallback) return indexHtmlFallback;
        }
        
        // Return 503 if still nothing
        return new Response("Offline", { status: 503 });
      }
    })()
  );
});
