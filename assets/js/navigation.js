(function(){
  const ORIGIN_PATH = location.pathname.split('/').pop() || 'index.html';

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
    return /preview/i.test(ORIGIN_PATH) || window.matchMedia('print').matches;
  }

  function activeFor(items){
    const found = items.find(item => item.files && item.files.includes(ORIGIN_PATH));
    return found ? found.key : 'home';
  }

  function injectContactRail(){
    if (document.querySelector('.doken-contact-rail') || isPreviewPage()) return;
    const rail = document.createElement('nav');
    rail.className = 'doken-contact-rail';
    rail.setAttribute('aria-label','支部問い合わせ');
    rail.innerHTML = [
      '<a href="tel:048-773-9863"><i class="ti ti-phone"></i><span>電話</span></a>',
      '<a href="https://line.me/R/" target="_blank" rel="noopener"><i class="ti ti-brand-line"></i><span>LINE</span></a>',
      '<a href="https://www.google.com/maps/search/?api=1&query=%E4%B8%8A%E5%B0%BE%E5%B8%82%E8%8F%85%E8%B0%B7295" target="_blank" rel="noopener"><i class="ti ti-map-pin"></i><span>地図</span></a>',
      '<a href="guide.html"><i class="ti ti-file-check"></i><span>書類</span></a>'
    ].join('');
    document.body.appendChild(rail);
  }

  function injectBottomNav(){
    if (document.querySelector('.doken-bottom-nav') || isPreviewPage()) return;
    const items = [
      {key:'home', label:'ホーム', icon:'ti-home', href:'index.html', files:['index.html','']},
      {key:'site', label:'現場', icon:'ti-hard-hat', href:'atsusa.html', files:['atsusa.html','anzen_check.html','guild.html','rodo36.html']},
      {key:'paper', label:'手続き', icon:'ti-clipboard-list', href:'guide.html', files:['guide.html','tetsuzuki_guide.html','kyosai.html','kanyu_merit.html']},
      {key:'calc', label:'計算', icon:'ti-calculator', href:'calc.html', files:['calc.html','kokuho_sim.html']},
      {key:'consult', label:'相談', icon:'ti-message-circle', href:'index.html#consult', files:['kensetsu_check.html','merit_check.html','app_guide.html']}
    ];
    const current = activeFor(items);
    const nav = document.createElement('nav');
    nav.className = 'doken-bottom-nav';
    nav.setAttribute('aria-label','下部ナビゲーション');
    nav.innerHTML = items.map(item => `
      <a href="${item.href}" class="${item.key === current ? 'active' : ''}">
        <i class="ti ${item.icon}"></i><span>${item.label}</span>
      </a>
    `).join('');
    document.body.appendChild(nav);
  }

  function registerServiceWorker(){
    if (!('serviceWorker' in navigator)) return;
    if (!/^https:/.test(location.protocol) && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') return;
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }

  window.defaultBack = defaultBack;
  if (typeof window.goBack !== 'function') {
    window.goBack = defaultBack;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      injectContactRail();
      injectBottomNav();
      registerServiceWorker();
    });
  } else {
    injectContactRail();
    injectBottomNav();
    registerServiceWorker();
  }
})();
