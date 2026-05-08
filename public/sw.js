const CACHE_NAME = 'bartender-ia-v2';
const STATIC_ASSETS = [
  '/',
  '/logo-borrachos.jpg',
  '/default-cocktail.jpg',
  '/manifest.json',
];

// Instalación: precachear assets estáticos
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activación: limpiar caches viejos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: ignorar completamente rutas API y externas — el navegador las maneja solo
// CRÍTICO: llamar event.respondWith() en rutas SSE/stream rompe la conexión
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // NO interceptar: API routes, peticiones externas, datos POST
  if (
    url.pathname.startsWith('/api/') ||
    url.origin !== self.location.origin ||
    event.request.method !== 'GET'
  ) {
    return; // dejar que el navegador maneje directamente, sin SW
  }

  // Solo cachear assets estáticos GET del mismo origen
  event.respondWith(
    fetch(event.request)
      .then((res) => {
        if (res && res.status === 200 && res.type === 'basic') {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});
