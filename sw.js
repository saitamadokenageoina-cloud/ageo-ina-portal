// Service Worker - キャッシュ制御
// ★重要★ 変更をデプロイするたびに CACHE_VERSION の末尾番号を必ず1つ上げること。
//   このファイルのバイトが変わることでブラウザが更新を検知し、
//   新SWを再インストール → 古いキャッシュを全削除 → ページ自動リロードとなる。
const CACHE_VERSION = 'v20260707-17';
const CACHE_NAME = 'ageo-ina-portal-' + CACHE_VERSION;

// GitHub Pages プロジェクトページのため、配信は /ageo-ina-portal/ 配下
const BASE = '/ageo-ina-portal/';

// 事前キャッシュするファイル一覧（オフライン用）
const CACHE_FILES = [
  BASE,
  BASE + 'index.html',
  BASE + 'common.css',
  BASE + 'guide.html',
  BASE + 'kyosai.html',
  BASE + 'calendar.html',
  BASE + 'calc.html',
  BASE + 'atsusa.html',
  BASE + 'koushu.html',
  BASE + 'rodo36.html',
  BASE + 'rodo36_preview.html',
  BASE + 'rodo36_form_preview.html',
  BASE + 'anzen_check.html',
];

// インストール：新キャッシュを作成（1ファイル失敗してもinstall全体は成功させる）
self.addEventListener('install', event => {
  console.log('[SW] Install:', CACHE_NAME);
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => Promise.allSettled(CACHE_FILES.map(f => cache.add(f))))
      .then(() => self.skipWaiting()) // 即座に有効化
  );
});

// アクティベート：古いキャッシュを全削除して全タブを掌握
self.addEventListener('activate', event => {
  console.log('[SW] Activate:', CACHE_NAME);
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => {
          console.log('[SW] Delete old cache:', k);
          return caches.delete(k);
        })
      ))
      .then(() => self.clients.claim())
  );
});

// フェッチ：Network First（常に最新を優先、ネットワーク失敗時のみキャッシュ）
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  // 外部リクエスト（Googleカレンダー・API・CDN等）はSWを介さずそのまま通す
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
