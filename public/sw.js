const CACHE_NAME = 'bartender-ia-v1';
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

// Fetch: Network First para API, Cache First para estáticos
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Las peticiones a la API siempre van a la red
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Para todo lo demás: intenta red, cae en caché
  event.respondWith(
    fetch(event.request)
      .then((res) => {
        // Guardar en caché si es una respuesta válida
        if (res && res.status === 200 && res.type === 'basic') {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});
