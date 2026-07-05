// Service Worker - キャッシュ自動更新
// バージョンを変えるたびに全キャッシュが自動削除・再取得される
const CACHE_VERSION = 'v' + new Date().toISOString().slice(0,10).replace(/-/g,'');
const CACHE_NAME = 'ageo-ina-portal-' + CACHE_VERSION;

// キャッシュするファイル一覧
const CACHE_FILES = [
  '/',
  '/index.html',
  '/common.css',
  '/guide.html',
  '/kyosai.html',
  '/library.html',
  '/calendar.html',
  '/calc.html',
  '/atsusa.html',
  '/koushu.html',
  '/rodo36.html',
  '/rodo36_preview.html',
  '/anzen_check.html',
];

// インストール：新しいキャッシュを作成
self.addEventListener('install', event => {
  console.log('[SW] Install:', CACHE_NAME);
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(CACHE_FILES))
  );
  self.skipWaiting(); // 即座に有効化
});

// アクティベート：古いキャッシュを全削除
self.addEventListener('activate', event => {
  console.log('[SW] Activate:', CACHE_NAME);
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => {
          console.log('[SW] Delete old cache:', k);
          return caches.delete(k);
        })
      )
    )
  );
  self.clients.claim(); // 全タブに即適用
});

// フェッチ：Network First（常に最新を優先、失敗時のみキャッシュ）
self.addEventListener('fetch', event => {
  // GETリクエスト以外はスルー
  if (event.request.method !== 'GET') return;
  // 外部APIはスルー（Googleカレンダー等）
  const url = new URL(event.request.url);
  if (!url.origin.includes('github.io')) return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // 成功したらキャッシュも更新
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      })
      .catch(() => {
        // ネットワーク失敗時はキャッシュから返す
        return caches.match(event.request);
      })
  );
});
