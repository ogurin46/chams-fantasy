'use strict';

const CACHE = 'chams-tantei-v4';

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
  './img/animal_rabbit.png',
  './img/animal_squirrel.png',
  './img/animal_bear.png',
  './img/animal_bird.png',
  './img/animal_fox.png',
  './img/animal_owl.png',
  './img/animal_penguin.png',
  './img/animal_dolphin.png',
  './img/animal_turtle.png',
  './img/animal_cat.png',
  './img/animal_dog.png',
  './img/animal_panda.png',
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
