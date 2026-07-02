(function(){
  const THEME_KEY = 'doken_theme';
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
  window.defaultBack = defaultBack;
  if (typeof window.goBack !== 'function') {
    window.goBack = defaultBack;
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function(){
      injectContactRail();
      injectThemeToggle();
    });
  } else {
    injectContactRail();
    injectThemeToggle();
  }
})();
