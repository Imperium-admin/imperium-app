// ─────────────────────────────────────────────
// IMPERIUM MMA — Service Worker
// Handles app caching and background updates
// Version is updated automatically on each deploy
// ─────────────────────────────────────────────

var CACHE_NAME = 'imperium-mma-v1';
var ASSETS = [
  '/imperium-app/',
  '/imperium-app/index.html',
];

// ── INSTALL: cache app files ──
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(ASSETS);
    })
  );
});

// ── ACTIVATE: clean up old caches ──
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(key) {
          return key !== CACHE_NAME;
        }).map(function(key) {
          return caches.delete(key);
        })
      );
    })
  );
  return self.clients.claim();
});

// ── FETCH: serve from cache, update in background ──
self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.match(event.request).then(function(cached) {
        // Fetch fresh copy from network in background
        var networked = fetch(event.request).then(function(response) {
          // Update cache with fresh copy
          if (response.ok) cache.put(event.request, response.clone());
          return response;
        }).catch(function() {
          // Network failed — serve cached version
          return cached;
        });
        // Return cached version immediately (fast), update happens behind the scenes
        return cached || networked;
      });
    })
  );
});

// ── MESSAGE: allow app to trigger immediate update ──
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
