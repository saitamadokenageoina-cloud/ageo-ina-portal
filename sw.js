// Service Worker - キャッシュ制御
// ★重要★ 変更をデプロイするたびに CACHE_VERSION の末尾番号を必ず1つ上げること。
//   このファイルのバイトが変わることでブラウザが更新を検知し、
//   新SWを再インストール → 古いキャッシュを全削除 → ページ自動リロードとなる。
const CACHE_VERSION = 'v20260718-76';
const CACHE_NAME = 'ageo-ina-portal-' + CACHE_VERSION;

// GitHub Pages プロジェクトページのため、配信は /ageo-ina-portal/ 配下
const BASE = '/ageo-ina-portal/';
const PDFJS_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/';

// 事前キャッシュするファイル一覧（オフライン用）
const CACHE_FILES = [
  BASE,
  BASE + 'index.html',
  BASE + 'manifest.webmanifest',
  BASE + 'common.css',
  BASE + 'assets/css/print.css',
  BASE + 'assets/js/print-util.js',
  BASE + 'assets/js/navigation.js',
  BASE + 'assets/js/calendar-config.js',
  BASE + 'assets/js/calendar-upcoming.js',
  BASE + 'assets/js/guild-config.js',
  BASE + 'assets/js/bookshelf.js',
  BASE + 'assets/js/meishi.js',
  BASE + 'assets/js/qrcode-generator.js',
  BASE + 'assets/css/meishi.css',
  BASE + 'assets/css/tabler-icons.min.css',
  BASE + 'assets/fonts/tabler-icons/tabler-icons.woff2',
  BASE + 'assets/icons/app-icon-192.png',
  BASE + 'assets/icons/app-icon-512.png',
  BASE + 'assets/icons/apple-touch-icon.png',
  BASE + 'assets/icons/favicon-16.png',
  BASE + 'assets/icons/favicon-32.png',
  PDFJS_CDN + 'pdf.min.js',
  PDFJS_CDN + 'pdf.worker.min.js',
  BASE + 'assets/pdfs/forms/rodo36-general.pdf',
  BASE + 'assets/pdfs/forms/rodo36-special.pdf',
  BASE + 'guide.html',
  BASE + 'calendar.html',
  BASE + 'calc.html',
  BASE + 'atsusa.html',
  BASE + 'koushu.html',
  BASE + 'rodo36.html',
  BASE + 'rodo36_form_preview.html',
  BASE + 'anzen_check.html',
  BASE + 'work_log.html',
  BASE + 'doken_card.html',
  BASE + 'kyokyu.html',
  BASE + 'hitori.html',
  BASE + 'alert_settings.html',
  BASE + 'merit.html',
  BASE + 'shiryo.html',
  BASE + 'book.html',
  BASE + 'guild.html',
  BASE + 'kensetsu_check.html',
  BASE + 'kyosai_guide.html',
  BASE + 'app_guide.html',
  BASE + 'meishi.html',
];

// インストール：新キャッシュを作成（1ファイル失敗してもinstall全体は成功させる）
// ページ側から「すぐ切り替えて」と言われたら待機せず即有効化
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

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
      .then(() => self.clients.matchAll({type: 'window'}))
      .then(clients => {
        // 開いている全ページに「更新した」と通知 → ページ側で自動リロード
        clients.forEach(c => c.postMessage({type: 'SW_UPDATED', version: CACHE_VERSION}));
      })
  );
});

// フェッチ：Network First（常に最新を優先、ネットワーク失敗時のみキャッシュ）
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  // PDF.jsが必要に応じて取得するCMap・標準フォントだけは、
  // 一度表示した資料をオフラインでも再表示できるよう実行時キャッシュする。
  const isPdfJsAsset = url.hostname === 'cdnjs.cloudflare.com'
    && url.pathname.startsWith('/ajax/libs/pdf.js/3.11.174/');
  if (url.origin !== self.location.origin && !isPdfJsAsset) return;

  event.respondWith(
    fetch(event.request.mode === 'navigate'
            ? new Request(event.request, {cache: 'no-store'})  // HTMLページは常に最新を取得
            : event.request)
      .then(response => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
