const CACHE_NAME = 'fin-binder-v1';

// Cache-first: card images (never change for a given URL)
const IMAGE_CACHE = 'fin-images-v1';

// Resources to pre-cache on install
const PRECACHE = [
  './',
  './index.html'
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(PRECACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  // Clean old caches if cache version changes
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) {
          return k !== CACHE_NAME && k !== IMAGE_CACHE;
        }).map(function(k) {
          return caches.delete(k);
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(event) {
  var url = new URL(event.request.url);

  // Card images: cache-first (they never change)
  if (url.hostname === 'cards.scryfall.io' || url.hostname.endsWith('.scryfall.io')) {
    event.respondWith(
      caches.open(IMAGE_CACHE).then(function(cache) {
        return cache.match(event.request).then(function(cached) {
          if (cached) return cached;
          return fetch(event.request).then(function(response) {
            if (response.ok) cache.put(event.request, response.clone());
            return response;
          });
        });
      })
    );
    return;
  }

  // Google Fonts CSS + font files: cache-first
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(
      caches.open(CACHE_NAME).then(function(cache) {
        return cache.match(event.request).then(function(cached) {
          if (cached) return cached;
          return fetch(event.request).then(function(response) {
            if (response.ok) cache.put(event.request, response.clone());
            return response;
          });
        });
      })
    );
    return;
  }

  // Tesseract.js + WASM data: cache-first
  if (url.hostname === 'cdn.jsdelivr.net' || url.hostname === 'tessdata.projectnaptha.com') {
    event.respondWith(
      caches.open(CACHE_NAME).then(function(cache) {
        return cache.match(event.request).then(function(cached) {
          if (cached) return cached;
          return fetch(event.request).then(function(response) {
            if (response.ok) cache.put(event.request, response.clone());
            return response;
          });
        });
      })
    );
    return;
  }

  // Sensitive APIs (auth headers / API keys): network-only, never cache
  if (url.hostname === 'api.github.com' || url.hostname === 'api.ocr.space') {
    event.respondWith(fetch(event.request));
    return;
  }

  // Public APIs (Scryfall, exchange rate): network-first with cache fallback
  if (url.hostname === 'api.scryfall.com' || url.hostname === 'open.er-api.com') {
    event.respondWith(
      fetch(event.request).catch(function() {
        return caches.match(event.request);
      })
    );
    return;
  }

  // Same-origin (index.html): network-first with cache fallback
  if (url.origin === self.location.origin) {
    event.respondWith(
      fetch(event.request).then(function(response) {
        if (response.ok) {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, clone);
          });
        }
        return response;
      }).catch(function() {
        return caches.match(event.request);
      })
    );
    return;
  }
});
