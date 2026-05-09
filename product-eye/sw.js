const CACHE_NAME = 'product-eye-v1';
const CDN_CACHE = 'product-eye-cdn-v1';

const APP_FILES = [
  './',
  'index.html',
  'manifest.json',
  'css/app.css',
  'js/app.js',
  'js/router.js',
  'js/db.js',
  'js/engine/dhash.js',
  'js/engine/mobilenet-engine.js',
  'js/engine/similarity.js',
  'js/pages/home.js',
  'js/pages/identify-photo.js',
  'js/pages/product-form.js',
  'js/pages/product-list.js',
  'js/pages/result.js',
  'js/pages/scan-barcode.js',
  'js/services/barcode-service.js',
  'js/services/camera-service.js',
  'js/services/recognition-service.js',
  'js/services/tts-service.js',
  'js/utils/image-utils.js'
];

const CDN_HOSTS = ['cdn.jsdelivr.net', 'cdnjs.cloudflare.com'];

// Install — pre-cache all app files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_FILES))
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME && k !== CDN_CACHE)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // CDN resources — Cache First
  if (CDN_HOSTS.some((h) => url.hostname.includes(h))) {
    event.respondWith(
      caches.open(CDN_CACHE).then((cache) =>
        cache.match(event.request).then((cached) => {
          const fetchPromise = fetch(event.request).then((response) => {
            if (response.ok) cache.put(event.request, response.clone());
            return response;
          });
          return cached || fetchPromise;
        })
      )
    );
    return;
  }

  // Navigation — Network First with cache fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request) || caches.match('index.html'))
    );
    return;
  }

  // App files — Cache First
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
