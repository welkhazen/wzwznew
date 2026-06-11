const CACHE = 'raw-v6';
const STATIC = [
  '/raw-logo-96.png',
  '/raw-logo-192.png',
  '/raw-logo-512.png',
  '/raw-logo-512-maskable.png',
];

// Install: pre-cache shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(STATIC)).then(() => self.skipWaiting())
  );
});

// Activate: drop old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Fetch strategy:
//  - Supabase / external APIs  → network only
//  - JS/CSS/font assets        → cache first (immutable, hashed filenames)
//  - Everything else           → network first, fall back to cache
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and cross-origin requests. Let the browser handle third-party
  // fonts/scripts directly so the worker does not trip document CSP connect-src.
  if (request.method !== 'GET') return;
  if (url.origin !== self.location.origin) return;

  // Always fetch HTML from the network so old app shells do not point at
  // hashed chunks that disappeared during a newer deployment.
  if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(fetch(request).catch(() => offlineResponse(request)));
    return;
  }

  // Cache-first for hashed static assets
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.match(request).then((hit) => hit ?? fetchAndCache(request))
    );
    return;
  }

  // Cache-first for avatars and 3D models (rarely change)
  if (url.pathname.startsWith('/avatars/') || url.pathname.startsWith('/models/')) {
    event.respondWith(
      caches.match(request).then((hit) => hit ?? fetchAndCache(request))
    );
    return;
  }

  // Network-first for everything else (HTML, API routes, icons)
  event.respondWith(
    fetch(request)
      .then((res) => {
        if (canCache(request, res)) {
          const clone = res.clone();
          caches.open(CACHE).then((c) => c.put(request, clone));
        }
        return res;
      })
      .catch(() => caches.match(request).then((hit) => hit ?? offlineResponse(request)))
  );
});

function fetchAndCache(request) {
  return fetch(request).then((res) => {
    if (canCache(request, res)) {
      const clone = res.clone();
      caches.open(CACHE).then((c) => c.put(request, clone));
    }
    return res;
  });
}

function canCache(request, response) {
  return response.ok &&
    response.status !== 206 &&
    !request.headers.has('range') &&
    !response.headers.get('content-type')?.includes('text/html');
}

function offlineResponse(request) {
  if (request.mode === 'navigate') {
    return caches.match('/').then((shell) => shell ?? new Response('Offline', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    }));
  }

  return Promise.resolve(new Response('', {
    status: 504,
    statusText: 'Gateway Timeout',
  }));
}
