// Service Worker - キャッシュ制御
const CACHE_VERSION = 'v20260829-180';
const CACHE_NAME = 'ageo-ina-portal-' + CACHE_VERSION;
const BASE = '/ageo-ina-portal/';
const PDFJS_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/';
const CACHE_FILES = [
  BASE, BASE + 'index.html', BASE + 'manifest.webmanifest', BASE + 'common.css',
  BASE + 'assets/css/theme-polish.css', BASE + 'assets/css/theme-polish-base.css',
  BASE + 'assets/css/paypay-tabs.css', BASE + 'assets/css/paypay-tabs-base.css', BASE + 'assets/css/home-card-art-dark-fix.css',
  BASE + 'assets/css/home-card-art.css', BASE + 'assets/css/home-alignment-fix.css', BASE + 'assets/css/home-modern.css',
  BASE + 'assets/illustrations/home-3d/calendar-v179.jpg', BASE + 'assets/illustrations/home-3d/doken-card-v180.jpg',
  BASE + 'assets/illustrations/home-3d/guild-v180.jpg', BASE + 'assets/illustrations/home-3d/meishi-v180.jpg', BASE + 'assets/illustrations/home-3d/job-v180.jpg', BASE + 'assets/illustrations/home-3d/worker-supply-v180.jpg', BASE + 'assets/illustrations/home-3d/home-doctor-v180.jpg',
  BASE + 'assets/illustrations/home-3d/estimate-v180.jpg', BASE + 'assets/illustrations/home-3d/heat-v180.jpg', BASE + 'assets/illustrations/home-3d/safety-v180.jpg', BASE + 'assets/illustrations/home-3d/work-log-v180.jpg', BASE + 'assets/illustrations/home-3d/rodo36-v180.jpg', BASE + 'assets/illustrations/home-3d/ccus-v180.jpg',
  BASE + 'assets/illustrations/home-3d/kyosai-guide-v180.jpg', BASE + 'assets/illustrations/home-3d/health-v180.jpg', BASE + 'assets/illustrations/home-3d/guide-v180.jpg', BASE + 'assets/illustrations/home-3d/calc-v180.jpg', BASE + 'assets/illustrations/home-3d/permit-v180.jpg', BASE + 'assets/illustrations/home-3d/hitori-v180.jpg',
  BASE + 'assets/illustrations/home-3d/training-v180.jpg', BASE + 'assets/illustrations/home-3d/merit-v180.jpg', BASE + 'assets/illustrations/home-3d/documents-v180.jpg', BASE + 'assets/illustrations/home-3d/youtube-v180.jpg',
  BASE + 'assets/css/print.css', BASE + 'assets/js/print-util.js', BASE + 'assets/js/navigation.js', BASE + 'assets/js/home-modern.js', BASE + 'assets/js/home-modern-legacy-v177.js',
  BASE + 'assets/js/calendar-config.js', BASE + 'assets/js/calendar-upcoming.js', BASE + 'assets/js/guild-config.js', BASE + 'assets/js/bookshelf.js', BASE + 'assets/js/meishi.js', BASE + 'assets/js/qrcode-generator.js', BASE + 'assets/css/meishi.css',
  BASE + 'assets/css/tabler-icons.min.css', BASE + 'assets/fonts/tabler-icons/tabler-icons.woff2',
  BASE + 'assets/icons/app-icon-192.png', BASE + 'assets/icons/app-icon-512.png', BASE + 'assets/icons/apple-touch-icon.png', BASE + 'assets/icons/favicon-16.png', BASE + 'assets/icons/favicon-32.png',
  BASE + 'assets/illustrations/guild-all.svg', BASE + 'assets/illustrations/guild-work.svg', BASE + 'assets/illustrations/guild-tools.svg', BASE + 'assets/illustrations/guild-consult.svg',
  PDFJS_CDN + 'pdf.min.js', PDFJS_CDN + 'pdf.worker.min.js',
  BASE + 'assets/pdfs/forms/rodo36-general.pdf', BASE + 'assets/pdfs/forms/rodo36-special.pdf',
  BASE + 'guide.html', BASE + 'calendar.html', BASE + 'calc.html', BASE + 'kyosai_calc.html', BASE + 'disaster_support.html', BASE + 'atsusa.html', BASE + 'koushu.html', BASE + 'rodo36.html', BASE + 'rodo36_form_preview.html', BASE + 'anzen_check.html', BASE + 'work_log.html', BASE + 'doken_card.html', BASE + 'kyokyu.html', BASE + 'hitori.html', BASE + 'alert_settings.html', BASE + 'merit.html', BASE + 'shiryo.html', BASE + 'book.html', BASE + 'guild.html', BASE + 'kensetsu_check.html', BASE + 'kyosai_guide.html', BASE + 'app_guide.html', BASE + 'meishi.html'
];
self.addEventListener('message', event => { if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting(); });
self.addEventListener('install', event => { console.log('[SW] Install:', CACHE_NAME); event.waitUntil(caches.open(CACHE_NAME).then(cache => Promise.allSettled(CACHE_FILES.map(f => cache.add(f)))).then(() => self.skipWaiting())); });
self.addEventListener('activate', event => { console.log('[SW] Activate:', CACHE_NAME); event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))).then(() => self.clients.claim()).then(() => self.clients.matchAll({type: 'window'})).then(clients => clients.forEach(c => c.postMessage({type:'SW_UPDATED',version:CACHE_VERSION})))); });
self.addEventListener('fetch', event => { if (event.request.method !== 'GET') return; const url = new URL(event.request.url); const isPdfJsAsset = url.hostname === 'cdnjs.cloudflare.com' && url.pathname.startsWith('/ajax/libs/pdf.js/3.11.174/'); if (url.origin !== self.location.origin && !isPdfJsAsset) return; event.respondWith(fetch(event.request.mode === 'navigate' ? new Request(event.request,{cache:'no-store'}) : event.request).then(response => { const clone = response.clone(); caches.open(CACHE_NAME).then(cache => cache.put(event.request,clone)); return response; }).catch(() => caches.match(event.request))); });
