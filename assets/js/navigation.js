(function(){
  const THEME_KEY = 'doken_theme_v2';
  // 既定はダーク。（旧キーに残るlight設定は無視して確実にダーク既定にする）
  const initialTheme = localStorage.getItem(THEME_KEY) || 'dark';
  document.documentElement.setAttribute('data-theme', initialTheme);

  function defaultBack(fallback){
    const fallbackUrl = fallback || 'index.html';
    const ref = document.referrer || '';
    const sameSite = ref && ref.indexOf(location.origin) === 0;
    if (history.length > 1 && sameSite) {
      history.back();
      return;
    }
    location.href = fallbackUrl;
  }

  function isPreviewPage(){
    const file = location.pathname.split('/').pop() || '';
    return /preview/i.test(file);
  }

  function injectContactRail(){
    if (document.querySelector('.doken-contact-rail') || isPreviewPage()) return;
    const rail = document.createElement('nav');
    rail.className = 'doken-contact-rail';
    rail.setAttribute('aria-label','支部への連絡');
    rail.innerHTML = [
      '<a href="tel:048-773-9863"><i class="ti ti-phone"></i><span>電話</span></a>',
      '<a href="https://lin.ee/QqbqtCy" target="_blank" rel="noopener"><i class="ti ti-brand-line"></i><span>LINE</span></a>',
      '<a href="https://www.google.com/maps/search/?api=1&query=%E4%B8%8A%E5%B0%BE%E5%B8%82%E8%8F%85%E8%B0%B7295" target="_blank" rel="noopener"><i class="ti ti-map-pin"></i><span>地図</span></a>',
      '<a href="guide.html"><i class="ti ti-file-check"></i><span>ガイド</span></a>'
    ].join('');
    document.body.appendChild(rail);
  }

  function injectThemeToggle(){
    if (document.querySelector('.theme-toggle') || isPreviewPage()) return;
    const btn = document.createElement('button');
    btn.className = 'theme-toggle';
    btn.type = 'button';
    btn.setAttribute('aria-label','ダークモードとライトモードを切り替え');
    function paint(){
      const theme = document.documentElement.getAttribute('data-theme') || 'dark';
      const isDark = theme === 'dark';
      btn.innerHTML = isDark ? '<span class="theme-symbol" aria-hidden="true">☀</span>' : '<span class="theme-symbol" aria-hidden="true">☾</span>';
      btn.title = isDark ? 'ライトモードに切替' : 'ダークモードに切替';
      btn.setAttribute('aria-label', isDark ? 'ライトモードに切り替え' : 'ダークモードに切り替え');
    }
    btn.addEventListener('click', function(){
      const next = (document.documentElement.getAttribute('data-theme') || 'dark') === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem(THEME_KEY, next);
      paint();
    });
    paint();
    document.body.appendChild(btn);
  }

  function updateAppVersion(){
    var targets = document.querySelectorAll('[data-app-version]');
    if (!targets.length) return;
    fetch('/ageo-ina-portal/sw.js', { cache: 'no-store' })
      .then(function(response){ return response.text(); })
      .then(function(source){
        var match = source.match(/CACHE_VERSION\s*=\s*['"][^'"]*-(\d+)['"]/);
        if (!match) return;
        targets.forEach(function(target){
          target.textContent = 'アプリ版数 v' + match[1];
        });
      })
      .catch(function(){ /* 取得できない場合は初期表示のまま継続 */ });
  }
  window.defaultBack = defaultBack;
  if (typeof window.goBack !== 'function') {
    window.goBack = defaultBack;
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function(){
      injectContactRail();
      injectThemeToggle();
      updateAppVersion();
    });
  } else {
    injectContactRail();
    injectThemeToggle();
    updateAppVersion();
  }
})();

/* =====================================================================
   自動更新（Service Worker）
   - 全ページ共通。pushして sw.js の CACHE_VERSION が変われば
     新SWをインストール → 即時有効化 → 開いているページを自動リロード。
   - 初回インストール時はリロードしない（hadController で判定）。
   - 短時間の連続リロードを防止（8秒ガード）。
   ===================================================================== */
(function () {
  if (!('serviceWorker' in navigator)) return;

  var SW_URL = '/ageo-ina-portal/sw.js';
  var SCOPE  = '/ageo-ina-portal/';
  var KEY    = 'doken_sw_reloaded_at';

  // このページ読み込み時点で既にSWに制御されていたか（初回導入時の無駄なリロード防止）
  var hadController = !!navigator.serviceWorker.controller;

  function reloadOnce() {
    if (!hadController) return;              // 初回インストールでは再読込しない
    var now = Date.now();
    var last = parseInt(sessionStorage.getItem(KEY) || '0', 10);
    if (now - last < 8000) return;           // 連続リロード防止
    try { sessionStorage.setItem(KEY, String(now)); } catch (e) {}
    setTimeout(function () { location.reload(); }, 300);
  }

  // 新SWが制御を握った / SWから更新通知が来た → 自動リロード
  navigator.serviceWorker.addEventListener('controllerchange', reloadOnce);
  navigator.serviceWorker.addEventListener('message', function (e) {
    if (e.data && e.data.type === 'SW_UPDATED') reloadOnce();
  });

  function activateWaiting(reg) {
    if (reg.waiting) reg.waiting.postMessage({ type: 'SKIP_WAITING' });
  }

  function register() {
    navigator.serviceWorker.register(SW_URL, { scope: SCOPE })
      .then(function (reg) {
        reg.update();          // 起動時に必ず更新チェック
        activateWaiting(reg);  // 待機中の新SWがあれば即適用

        reg.addEventListener('updatefound', function () {
          var nw = reg.installing;
          if (!nw) return;
          nw.addEventListener('statechange', function () {
            if (nw.state === 'installed' && navigator.serviceWorker.controller) {
              nw.postMessage({ type: 'SKIP_WAITING' });
            }
          });
        });
      })
      .catch(function () { /* 失敗しても通常表示は継続 */ });
  }

  if (document.readyState === 'complete') register();
  else window.addEventListener('load', register);

  // ホーム画面アプリを再表示したときも更新チェック
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState !== 'visible') return;
    navigator.serviceWorker.getRegistration(SCOPE).then(function (reg) {
      if (reg) { reg.update(); activateWaiting(reg); }
    }).catch(function () {});
  });
})();
