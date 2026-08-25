const CACHE_NAME = 'lumina-edit-pro-v1';
const ASSETS_TO_CACHE = [
  'index.html',
  'manifest.json',
  'icon.svg',
  'css/main.css',
  'css/components.css',
  'css/responsive.css',
  'js/app.js',
  'js/engine/canvas-engine.js',
  'js/engine/histogram.js',
  'js/engine/transform.js',
  'js/tools/adjustments.js',
  'js/tools/annotations.js',
  'js/tools/crop.js',
  'js/tools/filters.js',
  'js/utils/export.js',
  'js/utils/history.js',
  'js/utils/samples.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
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
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request);
    })
  );
});
