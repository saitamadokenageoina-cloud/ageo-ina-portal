(function(){
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
  window.defaultBack = defaultBack;
  if (typeof window.goBack !== 'function') {
    window.goBack = defaultBack;
  }
})();
