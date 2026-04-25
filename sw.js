const CACHE_NAME = 'fin-binder-v2';

// Cache-first: card images (never change for a given URL)
const IMAGE_CACHE = 'fin-images-v2';

// Resources to pre-cache on install
const PRECACHE = [
  './',
  './index.html'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Clean old caches if cache version changes (drops v1, etc.)
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME && k !== IMAGE_CACHE)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Card images: cache-first (they never change)
  if (url.hostname === 'cards.scryfall.io' || url.hostname.endsWith('.scryfall.io')) {
    event.respondWith(
      caches.open(IMAGE_CACHE).then((cache) =>
        cache.match(event.request).then((cached) => {
          if (cached) return cached;
          return fetch(event.request).then((response) => {
            if (response.ok) cache.put(event.request, response.clone());
            return response;
          });
        })
      )
    );
    return;
  }

  // Google Fonts CSS + font files: cache-first
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) =>
        cache.match(event.request).then((cached) => {
          if (cached) return cached;
          return fetch(event.request).then((response) => {
            if (response.ok) cache.put(event.request, response.clone());
            return response;
          });
        })
      )
    );
    return;
  }

  // Tesseract.js + WASM data: cache-first
  if (url.hostname === 'cdn.jsdelivr.net' || url.hostname === 'tessdata.projectnaptha.com') {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) =>
        cache.match(event.request).then((cached) => {
          if (cached) return cached;
          return fetch(event.request).then((response) => {
            if (response.ok) cache.put(event.request, response.clone());
            return response;
          });
        })
      )
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
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  // Same-origin (index.html): network-first with cache fallback
  if (url.origin === self.location.origin) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }
});

// ── Background Sync: flush pending Gist push ─────────────────────────────────
// Reads `fin-pending-push` from idb-keyval's default DB ('keyval-store').
// Page stores `{ token, gistId, payload }` then registers sync tag 'fin-gist-push'.
const idbReadDelete = (key) =>
  new Promise((resolve, reject) => {
    const req = indexedDB.open('keyval-store', 1);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => {
      const db = req.result;
      const tx = db.transaction('keyval', 'readwrite');
      const store = tx.objectStore('keyval');
      const getReq = store.get(key);
      getReq.onsuccess = () => {
        const val = getReq.result;
        if (val !== undefined) store.delete(key);
        tx.oncomplete = () => resolve(val);
        tx.onerror = () => reject(tx.error);
      };
    };
  });

const flushPendingPush = async () => {
  const entry = await idbReadDelete('fin-pending-push');
  if (!entry) return;
  const { token, gistId, payload } = entry;
  if (!token || !gistId || !payload) {
    throw new Error('fin-pending-push missing token/gistId/payload');
  }
  const response = await fetch(`https://api.github.com/gists/${gistId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    // Re-stash so the next retry has data to work with.
    throw new Error(`Gist push failed: ${response.status}`);
  }
};

self.addEventListener('sync', (event) => {
  if (event.tag === 'fin-gist-push') {
    event.waitUntil(flushPendingPush());
  }
});

self.addEventListener('message', (event) => {
  const data = event.data;
  if (data && data.type === 'flush-pending-push') {
    event.waitUntil(flushPendingPush());
  }
});
