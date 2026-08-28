(function(){
  'use strict';
  if ((location.pathname.split('/').pop() || 'index.html') !== 'index.html') return;
  if (document.body.classList.contains('home-modern')) return;

  var ICONS = [
    ['calendar.html','ti-calendar-event','tone-green'],
    ['doken_card.html','ti-discount-2','tone-purple'],
    ['guild.html','ti-users-group','tone-green'],
    ['meishi.html','ti-id-badge-2','tone-blue'],
    ['estimate/','ti-file-invoice','tone-cyan'],
    ['atsusa.html','ti-temperature-sun','tone-orange'],
    ['anzen_check.html','ti-shield-check','tone-orange'],
    ['work_log.html','ti-clipboard-text','tone-green'],
    ['rodo36.html','ti-clock-hour-4','tone-blue'],
    ['lv-asses-sup.ccus.jp','ti-id','tone-blue'],
    ['kyosai_guide.html','ti-shield-heart','tone-pink'],
    ['forms.gle','ti-stethoscope','tone-green'],
    ['calc.html','ti-calculator','tone-blue'],
    ['kyosai_calc.html','ti-home-dollar','tone-pink'],
    ['disaster_support.html','ti-shield-exclamation','tone-orange'],
    ['kensetsu_check.html','ti-building','tone-gold'],
    ['hitori.html','ti-user-shield','tone-purple'],
    ['koushu.html','ti-certificate','tone-gold'],
    ['shiryo.html','ti-folders','tone-cyan'],
    ['book.html','ti-books','tone-purple'],
    ['merit.html','ti-rosette-discount-check','tone-orange'],
    ['guide.html','ti-route','tone-blue'],
    ['default','ti-apps','tone-gray']
  ];

  var SECTION_ICONS = {
    yoku:'ti-sparkles',
    shigoto:'ti-users-group',
    genba:'ti-building-construction',
    tetsuzuki:'ti-file-description',
    shiryo:'ti-books',
    sonota:'ti-dots'
  };

  function iconFor(href){
    var i;
    href = href || '';
    for (i=0;i<ICONS.length-1;i+=1) {
      if (href.indexOf(ICONS[i][0]) !== -1) return {icon:ICONS[i][1],tone:ICONS[i][2]};
    }
    return {icon:'ti-apps',tone:'tone-gray'};
  }

  function scrollToSection(id){
    var el = document.getElementById(id);
    if (!el) return;
    try { el.scrollIntoView({behavior:'smooth',block:'start'}); }
    catch(e){ el.scrollIntoView(true); }
  }

  function enhanceSectionIcons(){
    var sections = document.querySelectorAll('.section[id]');
    var i;
    for(i=0;i<sections.length;i+=1){
      var section = sections[i];
      var glyph = section.querySelector('.sec-head-glyph');
      if (glyph) glyph.innerHTML = '<i class="ti ' + (SECTION_ICONS[section.id] || 'ti-layout-grid') + '" aria-hidden="true"></i>';
    }
  }

  function enhanceCards(){
    var cards = document.querySelectorAll('.section:not(#yoku) .mc');
    var i;
    for(i=0;i<cards.length;i+=1){
      var card = cards[i];
      var top = card.querySelector('.mc-top');
      if (!top || top.querySelector('.home-card-icon')) continue;
      var info = iconFor(card.getAttribute('href') || '');
      var icon = document.createElement('span');
      icon.className = 'home-card-icon ' + info.tone;
      icon.setAttribute('aria-hidden','true');
      icon.innerHTML = '<i class="ti ' + info.icon + '"></i>';
      top.appendChild(icon);
    }
  }

  function quickItem(href,label,icon,tone,external){
    var a = document.createElement('a');
    a.className = 'home-quick-item ' + tone;
    a.href = href;
    if (external){ a.target='_blank'; a.rel='noopener noreferrer'; }
    a.innerHTML = '<span class="home-quick-icon" aria-hidden="true"><i class="ti '+icon+'"></i></span><span class="home-quick-label">'+label+'</span>';
    return a;
  }

  function buildQuickMenu(){
    var section = document.getElementById('yoku');
    if (!section || section.querySelector('.home-quick-grid')) return;
    var grid = document.createElement('div');
    grid.className = 'home-quick-grid';
    grid.setAttribute('aria-label','よく使う機能');
    grid.appendChild(quickItem('calendar.html','カレンダー','ti-calendar-event','tone-green'));
    grid.appendChild(quickItem('guild.html','DOKENギルド','ti-users-group','tone-green'));
    grid.appendChild(quickItem('calc.html','計算ツール','ti-calculator','tone-blue'));
    grid.appendChild(quickItem('guide.html','手続き','ti-route','tone-purple'));
    grid.appendChild(quickItem('https://forms.gle/uKCqkLJAw7gMjwUMA','健康診断','ti-stethoscope','tone-cyan',true));
    grid.appendChild(quickItem('kyosai_guide.html','共済','ti-shield-heart','tone-pink'));
    grid.appendChild(quickItem('koushu.html','資格・講習','ti-certificate','tone-gold'));
    var all = document.createElement('button');
    all.type = 'button';
    all.className = 'home-quick-item tone-gray';
    all.setAttribute('aria-haspopup','dialog');
    all.innerHTML = '<span class="home-quick-icon" aria-hidden="true"><i class="ti ti-apps"></i></span><span class="home-quick-label">すべて</span>';
    all.addEventListener('click',function(){ openAllTools(); });
    grid.appendChild(all);
    var oldGrid = section.querySelector('.grid2');
    if (oldGrid) section.insertBefore(grid,oldGrid);
    else section.appendChild(grid);
  }

  function updateRail(shell,grid,next){
    if (!shell || !grid || !next) return;
    var end = grid.scrollLeft + grid.clientWidth >= grid.scrollWidth - 8;
    shell.classList.toggle('is-end',end);
    next.hidden = end || grid.scrollWidth <= grid.clientWidth + 4;
  }

  function enhanceRails(){
    var sections = document.querySelectorAll('.section:not(#yoku)');
    var i;
    for(i=0;i<sections.length;i+=1){
      (function(section){
        var grid = section.querySelector('.grid2');
        var head = section.querySelector('.sec-head');
        if (!grid || !head || grid.parentNode.classList.contains('home-rail-shell')) return;

        var allBtn = document.createElement('button');
        allBtn.type = 'button';
        allBtn.className = 'home-all-btn';
        allBtn.setAttribute('aria-expanded','false');
        allBtn.innerHTML = 'すべて見る <i class="ti ti-chevron-right" aria-hidden="true"></i>';
        head.appendChild(allBtn);

        var shell = document.createElement('div');
        shell.className = 'home-rail-shell';
        grid.parentNode.insertBefore(shell,grid);
        shell.appendChild(grid);

        var fade = document.createElement('span');
        fade.className = 'home-rail-fade';
        fade.setAttribute('aria-hidden','true');
        shell.appendChild(fade);

        var next = document.createElement('button');
        next.type = 'button';
        next.className = 'home-rail-next';
        next.setAttribute('aria-label',(section.querySelector('.sec-head-label') ? section.querySelector('.sec-head-label').textContent : '機能') + 'を右へ見る');
        next.innerHTML = '<i class="ti ti-chevron-right" aria-hidden="true"></i>';
        shell.appendChild(next);

        next.addEventListener('click',function(){
          var amount = Math.max(160,Math.round(grid.clientWidth*.72));
          try { grid.scrollBy({left:amount,behavior:'smooth'}); }
          catch(e){ grid.scrollLeft += amount; }
        });
        grid.addEventListener('scroll',function(){ updateRail(shell,grid,next); },{passive:true});
        window.addEventListener('resize',function(){ updateRail(shell,grid,next); });

        allBtn.addEventListener('click',function(){
          var expanded = !section.classList.contains('is-expanded');
          section.classList.toggle('is-expanded',expanded);
          allBtn.setAttribute('aria-expanded',expanded?'true':'false');
          allBtn.innerHTML = expanded ? '横表示に戻す <i class="ti ti-arrows-horizontal" aria-hidden="true"></i>' : 'すべて見る <i class="ti ti-chevron-right" aria-hidden="true"></i>';
          if(!expanded) updateRail(shell,grid,next);
        });
        window.setTimeout(function(){ updateRail(shell,grid,next); },40);
      })(sections[i]);
    }
  }

  function collectAllTools(){
    var groups = [];
    var sections = document.querySelectorAll('.section:not(#yoku)');
    var i,j;
    for(i=0;i<sections.length;i+=1){
      var label = sections[i].querySelector('.sec-head-label');
      var cards = sections[i].querySelectorAll('.mc');
      if (!cards.length) continue;
      var items = [];
      for(j=0;j<cards.length;j+=1){
        var title = cards[j].querySelector('.mc-title');
        var href = cards[j].getAttribute('href');
        if(!title || !href) continue;
        items.push({title:title.textContent.trim(),href:href,external:cards[j].target==='_blank',icon:iconFor(href)});
      }
      groups.push({label:label ? label.textContent.trim() : '機能',items:items});
    }
    return groups;
  }

  var allOverlay = null;
  function buildAllTools(){
    if(allOverlay) return;
    allOverlay = document.createElement('div');
    allOverlay.className = 'home-menu-overlay home-all-overlay';
    allOverlay.setAttribute('role','dialog');
    allOverlay.setAttribute('aria-modal','true');
    allOverlay.setAttribute('aria-label','すべての機能');
    var sheet = document.createElement('div');
    sheet.className = 'home-menu-sheet';
    sheet.style.maxHeight = '88vh';
    sheet.style.overflowY = 'auto';
    sheet.innerHTML = '<div class="home-menu-handle"></div><div class="home-menu-title"><span>すべての機能</span><button class="home-menu-close" type="button" aria-label="閉じる"><i class="ti ti-x"></i></button></div>';
    var groups = collectAllTools();
    groups.forEach(function(group){
      var h = document.createElement('h3');
      h.style.cssText='font-size:14px;margin:17px 2px 8px;color:var(--navy);';
      h.textContent=group.label;
      sheet.appendChild(h);
      var grid=document.createElement('div');
      grid.className='home-menu-grid';
      group.items.forEach(function(item){
        var a=document.createElement('a');
        a.className='home-menu-link';
        a.href=item.href;
        if(item.external){a.target='_blank';a.rel='noopener noreferrer';}
        a.innerHTML='<i class="ti '+item.icon.icon+'" aria-hidden="true"></i><span>'+item.title+'</span>';
        grid.appendChild(a);
      });
      sheet.appendChild(grid);
    });
    allOverlay.appendChild(sheet);
    document.body.appendChild(allOverlay);
    allOverlay.querySelector('.home-menu-close').addEventListener('click',closeAllTools);
    allOverlay.addEventListener('click',function(e){if(e.target===allOverlay)closeAllTools();});
  }
  function openAllTools(){
    buildAllTools();
    allOverlay.classList.add('open');
    document.body.style.overflow='hidden';
    var close=allOverlay.querySelector('.home-menu-close');
    if(close) close.focus();
  }
  function closeAllTools(){
    if(!allOverlay)return;
    allOverlay.classList.remove('open');
    document.body.style.overflow='';
  }

  var menuOverlay = null;
  function buildMenuOverlay(){
    if(menuOverlay) return;
    menuOverlay=document.createElement('div');
    menuOverlay.className='home-menu-overlay';
    menuOverlay.setAttribute('role','dialog');
    menuOverlay.setAttribute('aria-modal','true');
    menuOverlay.setAttribute('aria-label','メニュー');
    menuOverlay.innerHTML='<div class="home-menu-sheet"><div class="home-menu-handle"></div><div class="home-menu-title"><span>メニュー</span><button class="home-menu-close" type="button" aria-label="閉じる"><i class="ti ti-x"></i></button></div><div class="home-menu-grid"><a class="home-menu-link" href="tel:048-773-9863"><i class="ti ti-phone"></i><span>支部へ電話</span></a><a class="home-menu-link" href="https://lin.ee/QqbqtCy" target="_blank" rel="noopener noreferrer"><i class="ti ti-brand-line"></i><span>LINE</span></a><a class="home-menu-link" href="https://www.google.com/maps/search/?api=1&query=%E4%B8%8A%E5%B0%BE%E5%B8%82%E8%8F%85%E8%B0%B7295" target="_blank" rel="noopener noreferrer"><i class="ti ti-map-pin"></i><span>支部の地図</span></a><a class="home-menu-link" href="app_guide.html"><i class="ti ti-help-circle"></i><span>使い方・ヘルプ</span></a></div></div>';
    document.body.appendChild(menuOverlay);
    menuOverlay.querySelector('.home-menu-close').addEventListener('click',closeMenu);
    menuOverlay.addEventListener('click',function(e){if(e.target===menuOverlay)closeMenu();});
  }
  function openMenu(){buildMenuOverlay();menuOverlay.classList.add('open');document.body.style.overflow='hidden';menuOverlay.querySelector('.home-menu-close').focus();}
  function closeMenu(){if(!menuOverlay)return;menuOverlay.classList.remove('open');document.body.style.overflow='';}

  function buildBottomNav(){
    if(document.querySelector('.home-bottom-nav'))return;
    var nav=document.createElement('nav');
    nav.className='home-bottom-nav';
    nav.setAttribute('aria-label','ホーム画面メニュー');
    nav.innerHTML='<button class="home-bottom-item active" type="button" data-target="top"><i class="ti ti-home"></i><span>ホーム</span></button><button class="home-bottom-item" type="button" data-target="shigoto"><i class="ti ti-users-group"></i><span>仕事</span></button><button class="home-bottom-item" type="button" data-target="genba"><i class="ti ti-building-construction"></i><span>現場</span></button><button class="home-bottom-item" type="button" data-target="tetsuzuki"><i class="ti ti-file-description"></i><span>手続き</span></button><button class="home-bottom-item" type="button" data-menu="true"><i class="ti ti-menu-2"></i><span>メニュー</span></button>';
    document.body.appendChild(nav);
    var buttons=nav.querySelectorAll('.home-bottom-item');
    Array.prototype.forEach.call(buttons,function(btn){
      btn.addEventListener('click',function(){
        if(btn.getAttribute('data-menu')==='true'){openMenu();return;}
        var target=btn.getAttribute('data-target');
        if(target==='top'){try{window.scrollTo({top:0,behavior:'smooth'});}catch(e){window.scrollTo(0,0);}}
        else scrollToSection(target);
        Array.prototype.forEach.call(buttons,function(b){b.classList.remove('active');});
        btn.classList.add('active');
      });
    });
  }

  function modernize(){
    document.body.classList.add('home-modern');
    enhanceSectionIcons();
    buildQuickMenu();
    enhanceCards();
    enhanceRails();
    buildBottomNav();
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',modernize);
  else modernize();
})();
