'use strict';

const CACHE = 'chams-fantasy-v1';

// オフライン動作に必要な全アセット
const PRECACHE_ASSETS = [
  './',
  './index.html',
  './style.css',
  './manifest.json',
  './js/data.js',
  './js/game.js',
  './img/bg_forest.png',
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
  './img/enemy_shadowKnight.png',
  './img/enemy_darkLord.png',
];

// インストール時に全アセットをキャッシュ
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(PRECACHE_ASSETS))
  );
  self.skipWaiting();
});

// 古いキャッシュを削除
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// キャッシュ優先（オフライン対応）、バックグラウンドで更新
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;

  e.respondWith(
    caches.open(CACHE).then(async cache => {
      const cached = await cache.match(e.request);

      // バックグラウンドで新鮮なレスポンスを取得してキャッシュ更新
      const fetchPromise = fetch(e.request).then(res => {
        if (res.ok) cache.put(e.request, res.clone());
        return res;
      }).catch(() => null);

      // キャッシュがあれば即返す（オフライン時もOK）
      return cached || fetchPromise;
    })
  );
});
