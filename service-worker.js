// service-worker.js
// Caches the app shell so the entire game — village, mines, dungeon, shop,
// forge, auction house — can load and play fully offline. Everything is
// solo/local (no backend), so unlike a multiplayer game there's no "some
// features need a live connection" caveat here: cache the shell once and
// the whole game works offline from then on.

const CACHE_NAME = 'pixelforge-shell-v16';
const SHELL_ASSETS = [
  './',
  './index.html',
  './style.css',
  './manifest.webmanifest',
  './js/main.js',
  './js/engine.js',
  './js/world.js',
  './js/game-assets.js',
  './js/player.js',
  './js/mining.js',
  './js/inventory.js',
  './js/joystick.js',
  './js/hud.js',
  './js/menu.js',
  './js/ore-config.js',
  './js/pickaxe-config.js',
  './js/config-assets.js',
  './js/audio-config.js',
  './js/audio-manager.js',
  './js/i18n.js',
  './js/passives.js',
  './js/skills.js',
  './js/quality.js',
  './js/debug.js',
  './js/debug-ui.js',
  './js/enchant.js',
  './js/enchant-ui.js',
  './js/forging.js',
  './js/forge-ui.js',
  './js/composition.js',
  './js/combat.js',
  './js/enemy.js',
  './js/dungeon.js',
  './js/dungeon-ui.js',
  './js/economy.js',
  './js/auto-drill.js',
  './js/shop-ui.js',
  './js/drill-ui.js',
  './js/auction.js',
  './js/auction-ui.js',
  './js/achievements.js',
  './js/progress-ui.js',
  './js/quests.js',
  './js/storage.js',
  './js/dom-safe.js',
  './js/player-name.js',
  './js/orientation.js',
  './icons/icon.svg',
  './icons/icon-192.svg',
  './icons/icon-512.svg',
  // PNG icon variants — see icons/README.md for expected filenames/sizes.
  // Listed here too, but install() below caches each asset individually so
  // the whole shell doesn't fail to cache just because a PNG hasn't been
  // added yet.
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-512-maskable.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => Promise.all(
        // cache.addAll() is all-or-nothing — one missing file (e.g. a PNG
        // icon variant that hasn't been dropped into icons/ yet) would
        // abort caching for every other asset too. Cache each individually
        // instead so an optional/missing file just gets skipped.
        SHELL_ASSETS.map((asset) => cache.add(asset).catch(() => {}))
      ))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return; // never cache mutating requests

  // Only handle same-origin requests (e.g. leave the Google Fonts CDN
  // request alone — it'll just fail gracefully offline, no game feature
  // depends on it loading).
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
        }
        return res;
      }).catch(() => cached);
    })
  );
});
