// Service Worker - キャッシュ制御
const CACHE_VERSION = 'v20260829-167';
const CACHE_NAME = 'ageo-ina-portal-' + CACHE_VERSION;
const BASE = '/ageo-ina-portal/';
const PDFJS_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/';

const CACHE_FILES = [
  BASE, BASE + 'index.html', BASE + 'common.css',
  BASE + 'assets/css/theme-polish.css', BASE + 'assets/css/theme-polish-base.css',
  BASE + 'assets/css/paypay-tabs.css', BASE + 'assets/css/paypay-tabs-base.css', BASE + 'assets/css/home-card-art-dark-fix.css',
  BASE + 'assets/css/home-card-art.css', BASE + 'assets/css/home-alignment-fix.css', BASE + 'assets/css/home-modern.css',
  BASE + 'assets/illustrations/home-3d/calendar-cinematic-v167.jpg', BASE + 'assets/illustrations/home-3d/doken-card.jpg', BASE + 'assets/illustrations/home-3d/guild.jpg', BASE + 'assets/illustrations/home-3d/meishi.svg', BASE + 'assets/illustrations/home-3d/job.svg', BASE + 'assets/illustrations/home-3d/worker-supply.svg', BASE + 'assets/illustrations/home-3d/home-doctor.svg',
  BASE + 'assets/illustrations/home-3d/estimate-warm.svg', BASE + 'assets/illustrations/home-3d/safety-warm.svg', BASE + 'assets/illustrations/home-3d/heat-warm.svg', BASE + 'assets/illustrations/home-3d/procedure-warm.svg', BASE + 'assets/illustrations/home-3d/health-warm.svg',
  BASE + 'assets/illustrations/home/general.svg', BASE + 'assets/illustrations/home/youtube.svg',
  BASE + 'assets/css/print.css', BASE + 'assets/js/print-util.js', BASE + 'assets/js/navigation.js', BASE + 'assets/js/home-modern.js',
  BASE + 'assets/css/tabler-icons.min.css', BASE + 'manifest.webmanifest', BASE + 'assets/img/icon-192.png', BASE + 'assets/img/icon-512.png',
  BASE + 'assets/css/doken-guild-tabs.css', BASE + 'assets/css/doken-guild-tabs-base.css', BASE + 'assets/illustrations/guild-work.svg', BASE + 'assets/illustrations/guild-tools.svg', BASE + 'assets/illustrations/guild-consult.svg',
  BASE + 'offline.html'
];

self.addEventListener('install', function(event) {
  event.waitUntil(caches.open(CACHE_NAME).then(function(cache) { return cache.addAll(CACHE_FILES); }).then(function() { return self.skipWaiting(); }));
});
self.addEventListener('activate', function(event) {
  event.waitUntil(caches.keys().then(function(keys) { return Promise.all(keys.map(function(key) { if (key !== CACHE_NAME) return caches.delete(key); })); }).then(function() { return self.clients.claim(); }));
});
self.addEventListener('fetch', function(event) {
  if (event.request.method !== 'GET') return;
  var url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).then(function(response) { var copy = response.clone(); caches.open(CACHE_NAME).then(function(cache) { cache.put(event.request, copy); }); return response; }).catch(function() { return caches.match(event.request).then(function(cached) { return cached || caches.match(BASE + 'offline.html'); }); }));
    return;
  }
  event.respondWith(caches.match(event.request).then(function(cached) {
    var network = fetch(event.request).then(function(response) { if (response && response.status === 200) { var copy = response.clone(); caches.open(CACHE_NAME).then(function(cache) { cache.put(event.request, copy); }); } return response; }).catch(function() { return cached; });
    return cached || network;
  }));
});
