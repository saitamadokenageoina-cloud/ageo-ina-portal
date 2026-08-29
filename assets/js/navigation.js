(function(){
  var THEME_KEY = 'doken_theme_v2';
  var UI_SIZE_KEY = 'doken_ui_size_v1';
  var GA_MEASUREMENT_ID = 'G-6X0MLM597Y';
  var initialTheme = localStorage.getItem(THEME_KEY) || 'light';
  document.documentElement.setAttribute('data-theme', initialTheme);
  try {
    document.documentElement.setAttribute('data-ui-size', localStorage.getItem(UI_SIZE_KEY) || 'normal');
  } catch (e) {
    document.documentElement.setAttribute('data-ui-size', 'normal');
  }

  function injectThemePolishStylesheet(){
    if (document.querySelector('link[data-theme-polish]')) return;
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'assets/css/theme-polish.css';
    link.setAttribute('data-theme-polish','true');
    document.head.appendChild(link);
  }

  function injectHomeModernAssets(){
    if (currentFile() !== 'index.html') return;
    if (!document.querySelector('link[data-home-modern]')) {
      var link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'assets/css/home-modern.css';
      link.setAttribute('data-home-modern','true');
      document.head.appendChild(link);
    }
    if (!document.querySelector('link[data-home-card-art]')) {
      var art = document.createElement('link');
      art.rel = 'stylesheet';
      art.href = 'assets/css/home-card-art.css';
      art.setAttribute('data-home-card-art','true');
      document.head.appendChild(art);
    }
    if (!document.querySelector('link[data-home-alignment-fix]')) {
      var alignment = document.createElement('link');
      alignment.rel = 'stylesheet';
      alignment.href = 'assets/css/home-alignment-fix.css';
      alignment.setAttribute('data-home-alignment-fix','true');
      document.head.appendChild(alignment);
    }
    if (!document.querySelector('script[data-home-modern]')) {
      var script = document.createElement('script');
      script.src = 'assets/js/home-modern.js?v=181';
      script.setAttribute('data-home-modern','true');
      document.body.appendChild(script);
    }
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

  function currentFile(){
    return location.pathname.split('/').pop() || 'index.html';
  }

  function injectPageStyle(id,css){
    if (document.getElementById(id)) return;
    var style = document.createElement('style');
    style.id = id;
    style.textContent = css;
    document.head.appendChild(style);
  }

  function enhanceGuildMobile(){
    if (currentFile() !== 'guild.html') return;
    injectPageStyle('guild-mobile-fix',[
      '.t-btn-copy strong,.t-btn-copy small{white-space:normal!important;overflow:visible!important;text-overflow:clip!important;word-break:keep-all!important;overflow-wrap:normal!important}',
      '.t-btn{overflow:visible!important}',
      '@media(max-width:430px){.category-filter{padding:12px!important}.tab-row{grid-template-columns:1fr!important;gap:9px!important}.t-btn{grid-template-columns:42px minmax(0,1fr) 24px!important;min-height:72px!important;padding:10px 12px!important}.t-btn-icon{width:42px!important;height:42px!important}.t-btn-copy strong{font-size:15px!important;line-height:1.35!important}.t-btn-copy small{font-size:12px!important;line-height:1.45!important}.t-btn-check{font-size:20px!important}.search-row{grid-template-columns:1fr!important}}',
      'html[data-theme="dark"] .t-btn{background:#10213A!important;border-color:#40536B!important;color:#E8EEF7!important}',
      'html[data-theme="dark"] .t-btn .t-btn-copy strong{color:#F7FAFC!important}',
      'html[data-theme="dark"] .t-btn .t-btn-copy small{color:#C9D6E5!important}',
      'html[data-theme="dark"] .t-btn.active{background:#17324D!important;border-color:#71B7E6!important;box-shadow:0 0 0 2px rgba(113,183,230,.2)!important}',
      'html[data-theme="dark"] .t-btn[data-category="jinzai"].active{background:#3A241A!important;border-color:#FF986B!important}',
      'html[data-theme="dark"] .t-btn[data-category="shizai"].active{background:#153126!important;border-color:#57C48C!important}',
      'html[data-theme="dark"] .t-btn[data-category="soudan"].active{background:#2B2040!important;border-color:#B98AFF!important}',
      'html[data-theme="dark"] .t-btn-check{color:#DDEEFF!important}'
    ].join('\n'));

    var copyMap = {
      jinzai:['仕事・応援','応援を頼む・仕事を探す'],
      shizai:['資材・道具','探す・譲る'],
      soudan:['困りごと相談','仕事・制度を相談する']
    };
    var buttons = document.querySelectorAll('.t-btn[data-category]');
    var i;
    for (i = 0; i < buttons.length; i += 1) {
      var cat = buttons[i].getAttribute('data-category');
      if (!copyMap[cat]) continue;
      var strong = buttons[i].querySelector('.t-btn-copy strong');
      var small = buttons[i].querySelector('.t-btn-copy small');
      if (strong) strong.textContent = copyMap[cat][0];
      if (small) small.textContent = copyMap[cat][1];
    }
  }

  function enhanceKyosaiCalcTabs(){
    if (currentFile() !== 'kyosai_calc.html') return;
    injectPageStyle('kyosai-tab-contrast-fix',[
      '.ky-tab{position:relative;display:flex!important;align-items:center;justify-content:center;gap:7px;padding:10px 8px!important;line-height:1.35!important}',
      '.ky-tab-state{display:none;font-size:16px;font-weight:900;line-height:1}',
      '.ky-tab.active .ky-tab-state{display:inline-block}',
      'html[data-theme="dark"] .ky-tab.active{background:#D94B20!important;color:#FFFFFF!important;border-color:#FFB197!important;box-shadow:0 0 0 2px rgba(255,177,151,.2),0 7px 18px rgba(0,0,0,.32)!important}',
      'html[data-theme="dark"] .ky-tab:not(.active){background:#10213A!important;color:#E8EEF7!important;border-color:#52657B!important}',
      '.ky-tab:focus-visible{outline:3px solid #F0B429!important;outline-offset:3px!important}',
      '@media(max-width:390px){.ky-tab{font-size:14px!important;min-height:62px!important}}'
    ].join('\n'));

    var tabs = Array.prototype.slice.call(document.querySelectorAll('.ky-tab'));
    if (!tabs.length) return;
    function sync(){
      tabs.forEach(function(tab){
        var active = tab.classList.contains('active');
        tab.setAttribute('aria-selected', active ? 'true' : 'false');
        tab.setAttribute('tabindex', active ? '0' : '-1');
        if (!tab.querySelector('.ky-tab-state')) {
          var mark = document.createElement('span');
          mark.className = 'ky-tab-state';
          mark.setAttribute('aria-hidden','true');
          mark.textContent = '✓';
          tab.insertBefore(mark,tab.firstChild);
        }
      });
    }
    tabs.forEach(function(tab,index){
      tab.setAttribute('role','tab');
      tab.addEventListener('click',function(){ window.setTimeout(sync,0); });
      tab.addEventListener('keydown',function(event){
        if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
        event.preventDefault();
        var next = event.key === 'ArrowRight' ? (index + 1) % tabs.length : (index - 1 + tabs.length) % tabs.length;
        tabs[next].focus();
        tabs[next].click();
      });
    });
    if (window.MutationObserver) {
      var observer = new MutationObserver(sync);
      tabs.forEach(function(tab){ observer.observe(tab,{attributes:true,attributeFilter:['class']}); });
    }
    sync();
  }

  function injectDisasterHomeCard(){
    if (currentFile() !== 'index.html') return;
    if (document.querySelector('a[href="disaster_support.html"]')) return;
    var grid = document.querySelector('#tetsuzuki .grid2');
    if (!grid) return;
    var card = document.createElement('a');
    card.className = 'mc service-disaster-card';
    card.href = 'disaster_support.html';
    card.style.order = '0';
    card.setAttribute('data-feature-keywords','災害 台風 大雨 浸水 強風 雹 落雷 火災 地震 車 事故 共済 罹災証明');
    card.innerHTML = '<div class="mc-top home-card-image-wrap"><img src="assets/illustrations/home-3d/disaster-v181.jpg" alt="" class="home-card-image" aria-hidden="true" width="960" height="640" decoding="async"></div><div class="mc-body"><span class="mc-badge money">もしもの時</span><p class="mc-title">災害・事故のとき</p><p class="mc-desc">火災・台風・水害・落雷・雹・地震・事故で、まずやることを確認</p></div>';
    grid.insertBefore(card,grid.firstChild);
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
    var current = currentFile();
    var links = rail.querySelectorAll('a');
    var i;
    for (i = 0; i < links.length; i += 1) {
      if ((links[i].getAttribute('href') || '') === current) links[i].setAttribute('aria-current','page');
    }
  }

  function injectThemeToggle(){
    if (document.querySelector('.theme-toggle') || isPreviewPage()) return;
    var btn = document.createElement('button');
    btn.className = 'theme-toggle';
    btn.type = 'button';
    btn.setAttribute('aria-label','ダークモードとライトモードを切り替え');
    function paint(){
      var theme = document.documentElement.getAttribute('data-theme') || 'light';
      var isDark = theme === 'dark';
      btn.innerHTML = isDark ? '<span class="theme-symbol" aria-hidden="true">☀</span>' : '<span class="theme-symbol" aria-hidden="true">☾</span>';
      btn.title = isDark ? 'ライトモードに切替' : 'ダークモードに切替';
      btn.setAttribute('aria-label', isDark ? 'ライトモードに切り替え' : 'ダークモードに切り替え');
    }
    btn.addEventListener('click', function(){
      var next = (document.documentElement.getAttribute('data-theme') || 'light') === 'dark' ? 'light' : 'dark';
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
        for (i = 0; i < targets.length; i += 1) targets[i].textContent = 'アプリ版数 v' + match[1];
      })
      .catch(function(){});
  }

  function enhanceBackButtons(){
    var buttons = document.querySelectorAll('.hdr-back,.back-btn');
    var i;
    for (i = 0; i < buttons.length; i += 1) {
      if (buttons[i].tagName.toLowerCase() === 'button' && !buttons[i].getAttribute('type')) buttons[i].setAttribute('type','button');
      if (!buttons[i].getAttribute('aria-label')) buttons[i].setAttribute('aria-label','前の画面に戻る');
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
          },0);
        },true);
      })(forms[i]);
    }
  }

  function enhanceExternalLinks(){
    var links = document.querySelectorAll('a[target="_blank"]');
    var i;
    for (i = 0; i < links.length; i += 1) {
      var rel = links[i].getAttribute('rel') || '';
      if (rel.indexOf('noopener') === -1) links[i].setAttribute('rel',(rel + ' noopener').replace(/^\s+/,''));
    }
  }

  function injectConnectionStatus(){
    if (document.querySelector('.connection-status') || isPreviewPage()) return;
    var status = document.createElement('div');
    var wasOffline = !navigator.onLine;
    status.className = 'connection-status';
    status.setAttribute('role','status');
    status.setAttribute('aria-live','polite');
    status.hidden = true;
    document.body.appendChild(status);
    function paint(){
      var offline = !navigator.onLine;
      if (offline) {
        status.hidden = false;
        status.textContent = 'オフラインです。保存済みのページを表示します。';
      } else if (wasOffline) {
        status.hidden = false;
        status.textContent = 'オンラインに戻りました。';
        window.setTimeout(function(){ status.hidden = true; status.textContent = ''; },2200);
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

  function initializeAnalytics(){
    var script;
    if (location.hostname !== 'saitamadokenageoina-cloud.github.io') return;
    if (document.querySelector('script[data-doken-analytics]')) return;
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function(){ window.dataLayer.push(arguments); };
    window.gtag('js',new Date());
    window.gtag('config',GA_MEASUREMENT_ID,{'allow_google_signals':false,'allow_ad_personalization_signals':false,'anonymize_ip':true});
    script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA_MEASUREMENT_ID);
    script.setAttribute('data-doken-analytics','true');
    document.head.appendChild(script);
  }

  function initializeCommonUi(){
    injectThemePolishStylesheet();
    injectDisasterHomeCard();
    injectHomeModernAssets();
    enhanceGuildMobile();
    enhanceKyosaiCalcTabs();
    injectContactRail();
    injectThemeToggle();
    injectConnectionStatus();
    enhanceBackButtons();
    enhanceForms();
    enhanceExternalLinks();
    updateAppVersion();
    initializeAnalytics();
  }
  window.defaultBack = defaultBack;
  if (typeof window.goBack !== 'function') window.goBack = defaultBack;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initializeCommonUi);
  else initializeCommonUi();
})();

(function () {
  if (!('serviceWorker' in navigator)) return;
  var SW_URL = '/ageo-ina-portal/sw.js';
  var SCOPE  = '/ageo-ina-portal/';
  var KEY    = 'doken_sw_reloaded_at';
  var hadController = !!navigator.serviceWorker.controller;
  function reloadOnce() {
    if (!hadController) return;
    var now = Date.now();
    var last = parseInt(sessionStorage.getItem(KEY) || '0', 10);
    if (now - last < 8000) return;
    try { sessionStorage.setItem(KEY, String(now)); } catch (e) {}
    setTimeout(function () { location.reload(); }, 300);
  }
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
        reg.update();
        activateWaiting(reg);
        reg.addEventListener('updatefound', function () {
          var worker = reg.installing;
          if (!worker) return;
          worker.addEventListener('statechange', function () {
            if (worker.state === 'installed') activateWaiting(reg);
          });
        });
      })
      .catch(function () {});
  }
  if (document.readyState === 'complete') register();
  else window.addEventListener('load', register);
})();
