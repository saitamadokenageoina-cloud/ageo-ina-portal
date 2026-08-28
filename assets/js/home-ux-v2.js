(function(){
  'use strict';

  function currentFile(){
    return location.pathname.split('/').pop() || 'index.html';
  }

  if (currentFile() !== 'index.html') return;

  function addStyle(){
    if (document.getElementById('home-ux-v2-style')) return;
    var style = document.createElement('style');
    style.id = 'home-ux-v2-style';
    style.textContent = [
      '.purpose-hub{padding:18px 16px 4px}',
      '.purpose-card-wrap{background:var(--white);border:2px solid var(--gray200);border-radius:20px;padding:16px;box-shadow:var(--shadow-md)}',
      '.purpose-kicker{display:inline-flex;align-items:center;gap:6px;margin:0 0 5px;padding:4px 9px;border-radius:99px;background:#FFF0E9;color:#A83F16;font-size:12px;font-weight:900}',
      '.purpose-title{margin:0;color:var(--navy);font-size:24px;font-weight:900;line-height:1.3;letter-spacing:0}',
      '.purpose-lead{margin:5px 0 14px;color:var(--gray600);font-size:14px;font-weight:650;line-height:1.6}',
      '.purpose-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}',
      '.purpose-link{position:relative;display:grid;grid-template-columns:48px minmax(0,1fr) 20px;align-items:center;gap:10px;min-height:88px;padding:12px;border:2px solid var(--gray200);border-radius:15px;background:var(--white);color:var(--navy);text-decoration:none;box-shadow:var(--shadow-sm);transition:transform .15s,border-color .15s,box-shadow .15s}',
      '.purpose-link:active{transform:scale(.985)}',
      '.purpose-link:hover{border-color:var(--orange);box-shadow:var(--shadow-md)}',
      '.purpose-icon{display:flex;align-items:center;justify-content:center;width:48px;height:48px;border-radius:14px;font-size:26px;line-height:1}',
      '.purpose-copy{min-width:0}',
      '.purpose-copy strong{display:block;color:var(--navy);font-size:16px;font-weight:900;line-height:1.35;word-break:keep-all}',
      '.purpose-copy small{display:block;margin-top:3px;color:var(--gray600);font-size:12px;font-weight:700;line-height:1.45}',
      '.purpose-arrow{color:var(--gray400);font-size:20px}',
      '.purpose-work .purpose-icon{background:#FFF0E9;color:#B7471C}',
      '.purpose-procedure .purpose-icon{background:#E8F0FB;color:#165FA8}',
      '.purpose-calc .purpose-icon{background:#E8F5EE;color:#1A6B42}',
      '.purpose-disaster{border-color:#D96A3A;background:linear-gradient(135deg,#FFF7F2,#FFFFFF)}',
      '.purpose-disaster .purpose-icon{background:#FDE5DB;color:#B42318}',
      '.purpose-calendar .purpose-icon{background:#E9F7F2;color:#147C62}',
      '.purpose-contact .purpose-icon{background:#F1ECFF;color:#6B21A8}',
      '.purpose-help{display:flex;align-items:center;gap:9px;margin-top:12px;padding:11px 12px;border-radius:12px;background:var(--gray50);color:var(--gray700);font-size:13px;font-weight:750;line-height:1.5}',
      '.purpose-help i{font-size:20px;color:var(--orange);flex:none}',
      '.all-features-label{display:flex;align-items:center;gap:10px;margin:20px 16px 2px;padding-top:4px}',
      '.all-features-label i{display:flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:10px;background:#E8F0FB;color:#165FA8;font-size:19px}',
      '.all-features-label strong{font-size:18px;color:var(--navy)}',
      '.all-features-label span{font-size:12px;color:var(--gray600);font-weight:700}',
      'html[data-theme="dark"] .purpose-card-wrap{background:#0F2138;border-color:#31465E}',
      'html[data-theme="dark"] .purpose-kicker{background:#3A241A;color:#FFD4BF}',
      'html[data-theme="dark"] .purpose-title,html[data-theme="dark"] .purpose-copy strong,html[data-theme="dark"] .all-features-label strong{color:#F7FAFC}',
      'html[data-theme="dark"] .purpose-lead,html[data-theme="dark"] .purpose-copy small,html[data-theme="dark"] .all-features-label span{color:#C9D6E5}',
      'html[data-theme="dark"] .purpose-link{background:#10213A;border-color:#40536B;color:#F7FAFC}',
      'html[data-theme="dark"] .purpose-link:hover{border-color:#FF9B70}',
      'html[data-theme="dark"] .purpose-disaster{background:linear-gradient(135deg,#331C17,#10213A);border-color:#D96A3A}',
      'html[data-theme="dark"] .purpose-help{background:#0A1728;color:#DDE7F1}',
      '@media(max-width:430px){.purpose-card-wrap{padding:14px}.purpose-title{font-size:22px}.purpose-grid{gap:9px}.purpose-link{grid-template-columns:44px minmax(0,1fr) 18px;min-height:84px;padding:10px}.purpose-icon{width:44px;height:44px;font-size:24px}.purpose-copy strong{font-size:15px}.purpose-copy small{font-size:11.5px}}',
      '@media(max-width:340px){.purpose-grid{grid-template-columns:1fr}.purpose-copy strong{font-size:16px}.purpose-copy small{font-size:12px}}'
    ].join('\n');
    document.head.appendChild(style);
  }

  function buildPurposeHub(){
    if (document.getElementById('purpose-hub')) return;
    var hero = document.querySelector('.hero');
    if (!hero || !hero.parentNode) return;

    var section = document.createElement('section');
    section.className = 'purpose-hub';
    section.id = 'purpose-hub';
    section.setAttribute('aria-labelledby','purpose-title');
    section.innerHTML = [
      '<div class="purpose-card-wrap">',
      '<p class="purpose-kicker"><i class="ti ti-hand-click"></i>まずここから</p>',
      '<h2 class="purpose-title" id="purpose-title">何をしたいですか？</h2>',
      '<p class="purpose-lead">制度名や機能名が分からなくても大丈夫です。やりたいことから選んでください。</p>',
      '<div class="purpose-grid">',
      '<a class="purpose-link purpose-work" href="#shigoto"><span class="purpose-icon" aria-hidden="true">👷</span><span class="purpose-copy"><strong>仕事・人手</strong><small>応援を頼む・仕事を探す</small></span><i class="ti ti-chevron-right purpose-arrow" aria-hidden="true"></i></a>',
      '<a class="purpose-link purpose-procedure" href="#tetsuzuki"><span class="purpose-icon" aria-hidden="true">📝</span><span class="purpose-copy"><strong>手続きを調べる</strong><small>共済・許可・保険など</small></span><i class="ti ti-chevron-right purpose-arrow" aria-hidden="true"></i></a>',
      '<a class="purpose-link purpose-calc" href="calc.html"><span class="purpose-icon" aria-hidden="true">🧮</span><span class="purpose-copy"><strong>計算する</strong><small>労災・国保・共済など</small></span><i class="ti ti-chevron-right purpose-arrow" aria-hidden="true"></i></a>',
      '<a class="purpose-link purpose-disaster" href="disaster_support.html"><span class="purpose-icon" aria-hidden="true">🆘</span><span class="purpose-copy"><strong>災害・事故</strong><small>今やることを確認</small></span><i class="ti ti-chevron-right purpose-arrow" aria-hidden="true"></i></a>',
      '<a class="purpose-link purpose-calendar" href="calendar.html"><span class="purpose-icon" aria-hidden="true">📅</span><span class="purpose-copy"><strong>予定を見る</strong><small>支部・分会などの予定</small></span><i class="ti ti-chevron-right purpose-arrow" aria-hidden="true"></i></a>',
      '<a class="purpose-link purpose-contact" href="tel:048-773-9863"><span class="purpose-icon" aria-hidden="true">💬</span><span class="purpose-copy"><strong>支部に相談</strong><small>分からない時はこちら</small></span><i class="ti ti-phone purpose-arrow" aria-hidden="true"></i></a>',
      '</div>',
      '<div class="purpose-help"><i class="ti ti-bulb" aria-hidden="true"></i><span>下の検索欄から「人手」「台風」「資格」など普段の言葉でも探せます。</span></div>',
      '</div>'
    ].join('');
    hero.parentNode.insertBefore(section,hero.nextSibling);
  }

  function improveSearchWords(){
    var input = document.getElementById('feature-search');
    var title = document.getElementById('home-tools-title');
    var status = document.getElementById('search-status');
    if (input) input.setAttribute('placeholder','例：人手、台風、資格、労災、健康診断');
    if (title) title.innerHTML = '<i class="ti ti-search"></i>キーワードでも探せます';
    if (status) status.textContent = '普段使う言葉で検索できます';

    var aliases = {
      'guild.html':'人手 応援 職人 仕事 空いている 仕事を探す 仕事を頼む 資材 道具 相談',
      'disaster_support.html':'災害 台風 大雨 水害 浸水 強風 雹 落雷 火災 地震 車 事故 屋根 罹災証明',
      'kyosai_calc.html':'火災 地震 共済 掛金 保険料 試算 加入口数',
      'koushu.html':'資格 講習 足場 石綿 技能講習 特別教育',
      'kensetsu_check.html':'建設業許可 許可 更新 申請',
      'calendar.html':'予定 会議 分会 支部 行事 カレンダー',
      'atsusa.html':'暑い 熱中症 WBGT 気温 現場',
      'work_log.html':'作業記録 日報 現場 記録',
      'rodo36.html':'残業 36協定 時間外 労働時間',
      'doken_card.html':'優待 割引 店 カード'
    };
    var links = document.querySelectorAll('a[href]');
    var i;
    for (i = 0; i < links.length; i += 1) {
      var href = (links[i].getAttribute('href') || '').split('#')[0];
      if (!aliases[href]) continue;
      var old = links[i].getAttribute('data-feature-keywords') || '';
      links[i].setAttribute('data-feature-keywords',(old + ' ' + aliases[href]).replace(/^\s+|\s+$/g,''));
    }
  }

  function addAllFeaturesLabel(){
    if (document.querySelector('.all-features-label')) return;
    var target = document.getElementById('shigoto');
    if (!target || !target.parentNode) return;
    var label = document.createElement('div');
    label.className = 'all-features-label';
    label.innerHTML = '<i class="ti ti-apps" aria-hidden="true"></i><div><strong>すべての機能</strong><br><span>これまでの機能は下にすべて残しています</span></div>';
    target.parentNode.insertBefore(label,target);
  }

  function init(){
    addStyle();
    buildPurposeHub();
    improveSearchWords();
    addAllFeaturesLabel();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',init);
  else init();
})();
