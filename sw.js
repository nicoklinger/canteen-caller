// Network first, cache as fallback: updates show up on the next load,
// and the app still opens when offline.
const CACHE = 'caller-v2';
const FILES = [
  './', 'index.html', 'display.html',
  'css/base.css', 'css/server.css', 'css/display.css',
  'js/store.js', 'js/keypad.js', 'js/sound.js', 'js/server.js', 'js/display.js', 'js/sw-register.js',
  'icon.svg', 'manifest.webmanifest',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true })),
  );
});
