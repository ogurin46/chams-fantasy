'use strict';

const CACHE = 'chams-tantei-v2';

// オフライン動作に必要な全アセット
const PRECACHE_ASSETS = [
  './',
  './index.html',
  './style.css',
  './manifest.json',
  './js/data.js',
  './js/game.js',
  './img/heroine.png',
  './img/heroine_face.png',
  './img/heroine_thinking.png',
  './img/riku.png',
  './img/paku.png',
  './img/mimi.png',
  './img/icon-192.png',
  './img/icon-512.png',
  './img/enemy_slime.png',
  './img/enemy_mushroom.png',
  './img/enemy_leafBug.png',
  './img/enemy_darkSlime.png',
  './img/enemy_bat.png',
  './img/enemy_spider.png',
  './img/enemy_skeleton.png',
  './img/enemy_giantSpider.png',
  './img/enemy_crab.png',
  './img/enemy_jellyfish.png',
  './img/enemy_fishKnight.png',
  './img/enemy_seaKing.png',
  './img/enemy_stormBird.png',
  './img/enemy_darkCloud.png',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(cache => cache.addAll(PRECACHE_ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ネットワーク優先（更新がすぐ届く）。オフライン時はキャッシュから
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.open(CACHE).then(async cache => {
      try {
        const res = await fetch(e.request);
        if (res.ok) cache.put(e.request, res.clone());
        return res;
      } catch {
        const cached = await cache.match(e.request, { ignoreSearch: true });
        if (cached) return cached;
        throw new Error('offline & not cached');
      }
    })
  );
});
