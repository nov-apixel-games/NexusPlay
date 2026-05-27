const CACHE_NAME = 'nexusplay-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://res.cloudinary.com/dpp9889/image/upload/v1/logos/nexus_logo.png'
];

// Instalar SW y pre-cachear recursos críticos
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Instalando SW...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-cacheando assets principales...');
      return cache.addAll(STATIC_ASSETS);
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

// Activar y limpiar cachés viejas
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activando SW...');
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log(`[Service Worker] Eliminando caché obsoleta: ${key}`);
            return caches.delete(key);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Estrategia de red inteligente para peticiones (Offline Ready)
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Ignorar llamadas de Supabase Realtime/websockets o API local firmada que requiere envío dinámico
  if (
    url.pathname.includes('/api/') || 
    url.hostname.includes('supabase.co') || 
    url.hostname.includes('cloudinary.com') ||
    req.method !== 'GET'
  ) {
    return; // Bypass y manejo por el navegador directo
  }

  // Si busca navegar por la App (Accept: text/html), sirve index.html en caso de caída o desconexión
  if (req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html')) {
    event.respondWith(
      fetch(req).catch(() => {
        console.log('[Service Worker] Navegación offline detectada. Sirviendo index.html de respaldo.');
        return caches.match('/index.html') || caches.match('/');
      })
    );
    return;
  }

  // Fuentes externas o de Google y librerías CSS externas: Estrategia Cache-First (alta velocidad de carga)
  if (
    url.hostname.includes('fonts.googleapis.com') || 
    url.hostname.includes('fonts.gstatic.com') ||
    url.hostname.includes('unpkg.com') ||
    url.pathname.endsWith('.woff') ||
    url.pathname.endsWith('.woff2') ||
    url.pathname.endsWith('.ttf')
  ) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(req).then((response) => {
          if (response) {
            // Devolver del cache, pero fetch en background secundario si cambian
            fetch(req).then((newResponse) => {
              if (newResponse.status === 200) cache.put(req, newResponse);
            }).catch(() => {});
            return response;
          }
          return fetch(req).then((networkResponse) => {
            if (networkResponse.status === 200) {
              cache.put(req, networkResponse.clone());
            }
            return networkResponse;
          });
        });
      })
    );
    return;
  }

  // Assets estáticos del bundle de la web (JS, CSS locales, imágenes en caché)
  // Estrategia: Stale-While-Revalidate (carga instantánea del caché con actualización por detrás)
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(req).then((cachedResponse) => {
        const fetchPromise = fetch(req).then((networkResponse) => {
          if (networkResponse.status === 200) {
            cache.put(req, networkResponse.clone());
          }
          return networkResponse;
        }).catch((err) => {
          console.warn('[Service Worker] Error de red para:', req.url, 'Sirviendo caché de respaldo.');
          // Si es una imagen rota, podríamos devolver un placeholder si lo tuviéramos
        });

        return cachedResponse || fetchPromise;
      });
    })
  );
});
