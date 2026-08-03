(function(){
  var THEME_KEY = 'doken_theme_v2';
  var UI_SIZE_KEY = 'doken_ui_size_v1';
  // 既定はダーク。（旧キーに残るlight設定は無視して確実にダーク既定にする）
  var initialTheme = localStorage.getItem(THEME_KEY) || 'dark';
  document.documentElement.setAttribute('data-theme', initialTheme);
  try {
    document.documentElement.setAttribute('data-ui-size', localStorage.getItem(UI_SIZE_KEY) || 'normal');
  } catch (e) {
    document.documentElement.setAttribute('data-ui-size', 'normal');
  }

  function defaultBack(fallback){
    var fallbackUrl = fallback || 'index.html';
    var ref = document.referrer || '';
    var sameSite = ref && ref.indexOf(location.origin) === 0;
    if (history.length > 1 && sameSite) {
      history.back();
      return;
    }
    location.href = fallbackUrl;
  }

  function isPreviewPage(){
    var file = location.pathname.split('/').pop() || '';
    return /preview/i.test(file);
  }

  function injectContactRail(){
    if (document.querySelector('.doken-contact-rail') || isPreviewPage()) return;
    var rail = document.createElement('nav');
    rail.className = 'doken-contact-rail';
    rail.setAttribute('aria-label','支部への連絡');
    rail.innerHTML = [
      '<a href="tel:048-773-9863"><i class="ti ti-phone"></i><span>電話</span></a>',
      '<a href="https://lin.ee/QqbqtCy" target="_blank" rel="noopener"><i class="ti ti-brand-line"></i><span>LINE</span></a>',
      '<a href="https://www.google.com/maps/search/?api=1&query=%E4%B8%8A%E5%B0%BE%E5%B8%82%E8%8F%85%E8%B0%B7295" target="_blank" rel="noopener"><i class="ti ti-map-pin"></i><span>地図</span></a>',
      '<a href="guide.html"><i class="ti ti-file-check"></i><span>ガイド</span></a>'
    ].join('');
    document.body.appendChild(rail);
    var current = location.pathname.split('/').pop() || 'index.html';
    var links = rail.querySelectorAll('a');
    var i;
    for (i = 0; i < links.length; i += 1) {
      if ((links[i].getAttribute('href') || '') === current) {
        links[i].setAttribute('aria-current','page');
      }
    }
  }

  function injectThemeToggle(){
    if (document.querySelector('.theme-toggle') || isPreviewPage()) return;
    var btn = document.createElement('button');
    btn.className = 'theme-toggle';
    btn.type = 'button';
    btn.setAttribute('aria-label','ダークモードとライトモードを切り替え');
    function paint(){
      var theme = document.documentElement.getAttribute('data-theme') || 'dark';
      var isDark = theme === 'dark';
      btn.innerHTML = isDark ? '<span class="theme-symbol" aria-hidden="true">☀</span>' : '<span class="theme-symbol" aria-hidden="true">☾</span>';
      btn.title = isDark ? 'ライトモードに切替' : 'ダークモードに切替';
      btn.setAttribute('aria-label', isDark ? 'ライトモードに切り替え' : 'ダークモードに切り替え');
    }
    btn.addEventListener('click', function(){
      var next = (document.documentElement.getAttribute('data-theme') || 'dark') === 'dark' ? 'light' : 'dark';
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
        var i;
        for (i = 0; i < targets.length; i += 1) {
          targets[i].textContent = 'アプリ版数 v' + match[1];
        }
      })
      .catch(function(){ /* 取得できない場合は初期表示のまま継続 */ });
  }

  function enhanceBackButtons(){
    var buttons = document.querySelectorAll('.hdr-back,.back-btn');
    var i;
    for (i = 0; i < buttons.length; i += 1) {
      if (buttons[i].tagName.toLowerCase() === 'button' && !buttons[i].getAttribute('type')) {
        buttons[i].setAttribute('type','button');
      }
      if (!buttons[i].getAttribute('aria-label')) {
        buttons[i].setAttribute('aria-label','前の画面に戻る');
      }
    }
  }

  function clearFieldError(control){
    var errorId = control.getAttribute('data-field-error-id');
    var error = errorId ? document.getElementById(errorId) : null;
    control.removeAttribute('aria-invalid');
    control.classList.remove('is-invalid');
    if (error && error.parentNode) error.parentNode.removeChild(error);
    control.removeAttribute('data-field-error-id');
    if (control.getAttribute('aria-describedby') === errorId) control.removeAttribute('aria-describedby');
  }

  function showFieldError(control,index){
    if (!control || control.disabled || control.type === 'hidden') return;
    clearFieldError(control);
    var id = control.id ? control.id + '-error' : 'field-error-' + index;
    var error = document.createElement('p');
    error.className = 'field-error';
    error.id = id;
    error.setAttribute('role','alert');
    error.textContent = control.validationMessage || '入力内容を確認してください。';
    control.setAttribute('aria-invalid','true');
    control.setAttribute('aria-describedby',id);
    control.setAttribute('data-field-error-id',id);
    if (control.parentNode) control.parentNode.insertBefore(error,control.nextSibling);
  }

  function enhanceForms(){
    var controls = document.querySelectorAll('input,select,textarea');
    var forms = document.querySelectorAll('form');
    var i;
    for (i = 0; i < controls.length; i += 1) {
      (function(control,index){
        if (control.required) control.setAttribute('aria-required','true');
        control.addEventListener('invalid',function(){ showFieldError(control,index); });
        control.addEventListener('input',function(){ if (control.validity.valid) clearFieldError(control); });
        control.addEventListener('change',function(){ if (control.validity.valid) clearFieldError(control); });
      })(controls[i],i);
    }
    for (i = 0; i < forms.length; i += 1) {
      (function(form){
        var guiding = false;
        form.addEventListener('invalid',function(event){
          if (guiding || !event.target) return;
          guiding = true;
          window.setTimeout(function(){
            var target = form.querySelector(':invalid');
            if (target) {
              if (typeof target.scrollIntoView === 'function') {
                try { target.scrollIntoView({behavior:'smooth',block:'center'}); }
                catch (e) { target.scrollIntoView(true); }
              }
              try { target.focus({preventScroll:true}); }
              catch (e2) { target.focus(); }
            }
            guiding = false;
          },80);
        },true);
      })(forms[i]);
    }
  }

  function enhanceExternalLinks(){
    var links = document.querySelectorAll('a[target="_blank"]');
    var i;
    for (i = 0; i < links.length; i += 1) {
      var rel = links[i].getAttribute('rel') || '';
      if (rel.indexOf('noopener') === -1) rel += ' noopener';
      if (rel.indexOf('noreferrer') === -1) rel += ' noreferrer';
      links[i].setAttribute('rel',rel.replace(/^\s+|\s+$/g,''));
    }
  }

  function injectConnectionStatus(){
    if (isPreviewPage() || document.querySelector('.connection-status')) return;
    var status = document.createElement('div');
    status.className = 'connection-status';
    status.setAttribute('role','status');
    status.setAttribute('aria-live','polite');
    status.hidden = true;
    document.body.appendChild(status);
    var wasOffline = navigator.onLine === false;
    var hideTimer = null;
    function paint(event){
      var offline = navigator.onLine === false;
      if (hideTimer) window.clearTimeout(hideTimer);
      status.classList.remove('is-online');
      if (offline) {
        status.hidden = false;
        status.textContent = '現在オフラインです。保存済みの内容を表示しています。';
      } else if (wasOffline && event) {
        status.hidden = false;
        status.classList.add('is-online');
        status.textContent = '通信が戻りました。最新の内容を読み込めます。';
        hideTimer = window.setTimeout(function(){ status.hidden = true; },3000);
      } else {
        status.hidden = true;
        status.textContent = '';
      }
      wasOffline = offline;
    }
    window.addEventListener('online',paint);
    window.addEventListener('offline',paint);
    paint();
  }

  function initializeCommonUi(){
    loadUsageAnalytics();
    injectContactRail();
    injectThemeToggle();
    injectConnectionStatus();
    enhanceBackButtons();
    enhanceForms();
    enhanceExternalLinks();
    updateAppVersion();
  }

  function loadUsageAnalytics(){
    var existing = document.querySelector('script[data-doken-usage]');
    var script;
    if (existing || isPreviewPage()) return;
    script = document.createElement('script');
    script.src = '/ageo-ina-portal/assets/js/usage-analytics.js';
    script.async = true;
    script.setAttribute('data-doken-usage','true');
    document.head.appendChild(script);
  }
  window.defaultBack = defaultBack;
  if (typeof window.goBack !== 'function') {
    window.goBack = defaultBack;
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeCommonUi);
  } else {
    initializeCommonUi();
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
