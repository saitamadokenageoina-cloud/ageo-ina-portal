/* =====================================================================
   共通 印刷 / プレビュー ユーティリティ（全ページ共用）
   ---------------------------------------------------------------------
   設計方針（iOS/PWA・PC・Androidで確実に動かすための要点）:
   - 印刷DOM(#print-area)は必ず <body> 直下に置く（@media print の
     `body > *:not(#print-area)` セレクタを確実に一致させるため）。
   - 印刷時は html に .printing を付け、CSS 側は
       @media print{ body>*:not(#print-area){display:none} }
     に加え、保険として JS でも #print-area 以外を隠さない設計にする。
   - window.print() は DOM 反映を待ってから（次フレーム＋微小遅延）呼ぶ。
   - プレビューはオーバーレイ + A4用紙。印刷対象と同一HTMLを共用（二重管理しない）。
   - Escキー / 外側クリックで閉じる。開いた直後の誤クローズを防ぐ。
   - フォーカストラップ・aria属性・body スクロールロックを実装。
   使い方:
     DokenPrint.output({title, sections:[{label, html}], note}, 'print'|'preview')
   ===================================================================== */
(function (global) {
  'use strict';

  var TEL = '048-773-9863';
  var ORG = '埼玉土建一般労働組合 上尾伊奈支部（組合員アプリ）';

  function pad(n){ return (n < 10 ? '0' : '') + n; }
  function today(){
    var d = new Date();
    return d.getFullYear() + '年' + (d.getMonth()+1) + '月' + d.getDate() + '日';
  }

  function header(title){
    return '<p class="pr-h1">' + esc(title) + '</p>'
      + '<p class="pr-sub">' + ORG + '　｜　' + today() + ' 出力</p>';
  }
  function footer(note){
    var n = note ? (esc(note) + '<br>') : '';
    return '<p class="pr-foot">' + n
      + '本結果はアプリによる試算・参考情報です。正式な内容は関係機関・支部（TEL ' + TEL + '）へご確認ください。</p>';
  }
  function esc(s){
    return String(s == null ? '' : s)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  // 色関連のインライン指定だけを除去（レイアウト用の display/flex/padding/margin等は保持）。
  // 画面から複製したHTMLは var(--navy) 等のテーマ変数を含む inline style を持つことがあり、
  // CSS側の !important 上書きに万一漏れがあっても文字が見えなくなることがないよう、
  // DOM レベルで色指定そのものを取り除く二重の安全策。
  var COLOR_PROPS = ['color','background','background-color','background-image',
    'background-repeat','background-position','background-size',
    '-webkit-text-fill-color','text-shadow','box-shadow','border-color'];
  function stripColorStyles(html){
    try{
      var wrap = document.createElement('div');
      wrap.innerHTML = html;
      var all = wrap.querySelectorAll('[style]');
      for (var i = 0; i < all.length; i++){
        var el = all[i];
        var decls = el.getAttribute('style').split(';');
        var kept = [];
        for (var j = 0; j < decls.length; j++){
          var d = decls[j].trim();
          if (!d) continue;
          var prop = d.split(':')[0].trim().toLowerCase();
          if (COLOR_PROPS.indexOf(prop) === -1) kept.push(d);
        }
        if (kept.length) el.setAttribute('style', kept.join(';'));
        else el.removeAttribute('style');
      }
      return wrap.innerHTML;
    }catch(e){
      console.error('[DokenPrint] stripColorStyles失敗:', e);
      return html; // 失敗時は元のHTMLをそのまま使う（CSS側の!importantが保険になる）
    }
  }

  // sections の html は「表示用に組み立て済みの安全なHTML」を渡す前提（アプリ内部生成）
  function build(data){
    if (!data || !Array.isArray(data.sections)) return null;
    var body = '';
    data.sections.forEach(function(s){
      if (!s || !s.html) return;
      body += (s.label ? '<p class="pr-sec">' + esc(s.label) + '</p>' : '')
            + '<div class="pr-body">' + stripColorStyles(s.html) + '</div>';
    });
    if (!body) return null;
    return header(data.title || '') + body + footer(data.note || '');
  }

  // #print-area を必ず body 直下に確保
  function ensurePrintArea(){
    var pa = document.getElementById('print-area');
    if (!pa) {
      pa = document.createElement('div');
      pa.id = 'print-area';
      pa.setAttribute('aria-hidden', 'true');
    }
    if (pa.parentNode !== document.body) {
      document.body.appendChild(pa);
    }
    return pa;
  }

  function doPrint(html){
    var pa = ensurePrintArea();
    pa.innerHTML = html;
    document.documentElement.classList.add('printing');

    var cleaned = false;
    function cleanup(){
      if (cleaned) return; cleaned = true;
      document.documentElement.classList.remove('printing');
      window.removeEventListener('afterprint', cleanup);
    }
    window.addEventListener('afterprint', cleanup);
    // 保険：一定時間後にも必ず解除（afterprintが来ない端末対策）
    setTimeout(cleanup, 60000);

    // DOM反映を待ってから印刷（2フレーム＋微小遅延）
    requestAnimationFrame(function(){
      requestAnimationFrame(function(){
        setTimeout(function(){
          try {
            window.print();
          } catch (e) {
            console.error('[DokenPrint] window.print() 失敗:', e);
            alert('印刷を開始できませんでした。ページを再読み込みして再度お試しください。');
            cleanup();
          }
        }, 80);
      });
    });
  }

  // ===== プレビュー =====
  var lastFocus = null;

  function buildOverlay(){
    var ov = document.getElementById('preview-overlay');
    if (ov) return ov;
    ov = document.createElement('div');
    ov.id = 'preview-overlay';
    ov.setAttribute('role', 'dialog');
    ov.setAttribute('aria-modal', 'true');
    ov.setAttribute('aria-labelledby', 'preview-title');
    ov.innerHTML =
      '<div class="pv-bar">'
      + '<span id="preview-title" class="pv-ttl">印刷プレビュー（A4）</span>'
      + '<button type="button" class="pv-print"><i class="ti ti-printer"></i>印刷 / PDF保存</button>'
      + '<button type="button" class="pv-close"><i class="ti ti-x"></i>閉じる</button>'
      + '</div>'
      + '<div class="pv-scroll"><div class="pv-sheet" id="preview-sheet"></div></div>';
    document.body.appendChild(ov);

    ov.querySelector('.pv-print').addEventListener('click', function(){
      var html = document.getElementById('preview-sheet').innerHTML;
      doPrint(html);
    });
    ov.querySelector('.pv-close').addEventListener('click', closePreview);
    // 外側クリックで閉じる（バー/用紙の内側は閉じない）
    ov.addEventListener('mousedown', function(e){
      ov._downTarget = e.target;
    });
    ov.addEventListener('click', function(e){
      // mousedownとclickが同一の“背景”で完結した時のみ閉じる（誤クローズ防止）
      var sheet = ov.querySelector('.pv-scroll');
      if (e.target === sheet && ov._downTarget === sheet) closePreview();
    });
    return ov;
  }

  function onKeydown(e){
    var ov = document.getElementById('preview-overlay');
    if (!ov || ov.style.display !== 'block') return;
    if (e.key === 'Escape') { e.preventDefault(); closePreview(); return; }
    if (e.key === 'Tab') {
      var f = ov.querySelectorAll('button');
      if (!f.length) return;
      var first = f[0], last = f[f.length-1];
      if (e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
    }
  }

  function doPreview(html){
    var ov = buildOverlay();
    document.getElementById('preview-sheet').innerHTML = html;
    lastFocus = document.activeElement;
    ov.style.display = 'block';
    document.body.classList.add('preview-lock');
    document.addEventListener('keydown', onKeydown);
    // 開いた直後の誤クローズ防止：次フレームでフォーカス移動
    requestAnimationFrame(function(){
      var btn = ov.querySelector('.pv-print');
      if (btn) btn.focus();
    });
  }

  function closePreview(){
    var ov = document.getElementById('preview-overlay');
    if (ov) ov.style.display = 'none';
    document.body.classList.remove('preview-lock');
    document.removeEventListener('keydown', onKeydown);
    if (lastFocus && typeof lastFocus.focus === 'function') {
      try { lastFocus.focus(); } catch(e){}
    }
    lastFocus = null;
  }

  // ===== 公開API =====
  var DokenPrint = {
    build: build,
    output: function(data, mode){
      var html = build(data);
      if (!html) {
        alert('出力できる内容がありません。先に入力・診断を行ってください。');
        console.error('[DokenPrint] build() が空を返しました', data);
        return false;
      }
      if (mode === 'preview') doPreview(html);
      else doPrint(html);
      return true;
    },
    print: function(data){ return this.output(data, 'print'); },
    preview: function(data){ return this.output(data, 'preview'); },
    printHtml: function(html){ if (html) doPrint(html); },
    closePreview: closePreview
  };

  global.DokenPrint = DokenPrint;
  // 後方互換（既存のonclick用）
  global.closePreview = closePreview;

})(window);
