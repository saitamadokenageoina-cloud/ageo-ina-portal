'use strict';

/*
 * 計算ロジック・アクセシビリティの回帰チェック
 * 外部パッケージは使わず Node.js だけで実行する。
 */

var fs = require('fs');
var path = require('path');
var root = path.resolve(__dirname, '..');
var failures = [];

function read(rel) { return fs.readFileSync(path.join(root, rel), 'utf8'); }
function fail(message) { failures.push(message); }
function assert(cond, message) { if (!cond) fail(message); }

/* ========== 1. 厚生年金：料率・上下限・代表値を固定値で検証 ========== */
(function checkPensionCap() {
  var calc = read('calc.html');

  assert(/maxHyojun\s*:\s*650000/.test(calc),
    'calc.html: 厚生年金の標準報酬月額上限650,000円が定義されていません。');
  assert(/Math\.min\(\s*h\s*,\s*RM\.nenkin\.maxHyojun\s*\)/.test(calc),
    'calc.html: 厚生年金の計算に650,000円上限が適用されていません。');
  assert(/min\s*:\s*16104/.test(calc),
    'calc.html: 厚生年金の下限（88,000円×18.3%=16,104円）が定義されていません。');

  var rateMatch = calc.match(/nenkin:\s*\{\s*rate:\s*([\d.]+)/);
  assert(rateMatch, 'calc.html: 厚生年金の料率を読み取れません。');
  if (rateMatch) {
    var rate = parseFloat(rateMatch[1]);
    // 期待値を実装側のrateから生成すると、誤った料率へ変更してもテストが通るため固定値で検証する。
    assert(Math.abs(rate - 0.183) < 0.0000001,
      'calc.html: 厚生年金保険料率が18.3%ではありません。制度改定時は公式資料確認後にテストも更新してください。');
    var cases = [
      { hyojun: 58000, expect: 8052 },
      { hyojun: 88000, expect: 8052 },
      { hyojun: 300000, expect: 27450 },
      { hyojun: 650000, expect: 59475 },
      { hyojun: 700000, expect: 59475 },
      { hyojun: 1390000, expect: 59475 }
    ];
    cases.forEach(function (c) {
      var base = Math.min(c.hyojun, 650000);
      var got = Math.round(Math.max(base * rate / 2, 16104 / 2));
      assert(got === c.expect,
        'calc.html: 厚生年金の代表値が不正です（入力' + c.hyojun + '円 → ' + got + '円、期待' + c.expect + '円）');
    });
  }

  assert(/上限650,000円/.test(calc),
    'calc.html: 上限適用を利用者へ伝える注記がありません。');
})();

/* ========== 2. 無効な入力で前回の結果を残さない ========== */
(function checkStaleResult() {
  var calc = read('calc.html');
  assert(!/parseFloat\(document\.getElementById\('rm-hyojun'\)\.value\)\s*\|\|\s*\d+/.test(calc),
    'calc.html: 労務費で無効入力へ既定値を代入しています。');
  assert(/Number\.isFinite\(h\)/.test(calc) && /h\s*<=\s*0/.test(calc),
    'calc.html: 労務費で入力値の妥当性を確認していません。');

  var kyosai = read('kyosai_calc.html');
  var showError = kyosai.match(/function showError\([^)]*\)\s*\{[^}]*\}/);
  assert(showError, 'kyosai_calc.html: showError関数が見つかりません。');
  if (showError) {
    var body = showError[0];
    assert(/ky-result'\)\.classList\.remove\('show'\)/.test(body), 'kyosai_calc.html: エラー時に前回結果を隠していません。');
    assert(/result-total'\)\.textContent\s*=\s*'0円'/.test(body), 'kyosai_calc.html: エラー時に掛金を初期化していません。');
    assert(/lastResultText\s*=\s*''/.test(body), 'kyosai_calc.html: エラー時にコピー用テキストを初期化していません。');
  }
})();

/* ========== 3. 下部固定バーのコントラスト ========== */
(function checkRailContrast() {
  var css = read('common.css');
  function luminance(hex) {
    var h = hex.replace('#', '');
    var rgb = [0, 2, 4].map(function (i) { return parseInt(h.substr(i, 2), 16); });
    var f = rgb.map(function (v) { v = v / 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    return 0.2126 * f[0] + 0.7152 * f[1] + 0.0722 * f[2];
  }
  function ratioWithWhite(hex) { return 1.05 / (luminance(hex) + 0.05); }
  var labels = ['電話', 'LINE', '地図', 'ガイド'];
  for (var i = 1; i <= 4; i++) {
    var re = new RegExp('\\.doken-contact-rail a:nth-child\\(' + i + '\\)\\{background:(#[0-9A-Fa-f]{6})');
    var m = css.match(re);
    assert(m, 'common.css: 下部固定バー ' + i + '番目の背景色を読み取れません。');
    if (m) assert(ratioWithWhite(m[1]) >= 4.5,
      'common.css: 下部固定バー「' + labels[i - 1] + '」は白文字とのコントラスト4.5:1未満です。');
  }
})();

/* ========== 4. 入力欄のラベル紐付けとID重複 ========== */
(function checkLabels() {
  var files = fs.readdirSync(root).filter(function (f) { return /\.html$/.test(f); });
  files.forEach(function (file) {
    var html = read(file);
    var markup = html.replace(/<script[\s\S]*?<\/script>/gi, '');
    var ids = {}, m;
    var idRe = /\bid\s*=\s*"([^"]+)"/g;
    while ((m = idRe.exec(markup))) ids[m[1]] = true;
    var forRe = /<label[^>]*\bfor="([^"]+)"/g;
    while ((m = forRe.exec(markup))) {
      if (m[1].indexOf('${') !== -1) continue;
      assert(ids[m[1]], file + ': label for="' + m[1] + '" に対応する要素がありません。');
    }
    var seen = {};
    var dupRe = /\bid\s*=\s*"([^"]+)"/g;
    while ((m = dupRe.exec(markup))) {
      if (m[1].indexOf('${') !== -1) continue;
      assert(!seen[m[1]], file + ': id "' + m[1] + '" が重複しています。');
      seen[m[1]] = true;
    }
  });
})();

/* ========== 5. 停止済みスクリプトが復活していないか ========== */
(function checkRetiredScripts() {
  var retired = ['guild-config-v194.js','guild-v195-loader.js','guild-admin-editor-v195.js','guild-display-hotfix-v197.js'];
  var files = fs.readdirSync(root).filter(function (f) { return /\.html$/.test(f); });
  var haystack = files.map(read).join('\n') + read('sw.js');
  ['navigation.js', 'guild-config.js'].forEach(function (js) {
    var p = path.join(root, 'assets', 'js', js);
    if (fs.existsSync(p)) haystack += fs.readFileSync(p, 'utf8');
  });
  retired.forEach(function (name) {
    assert(haystack.indexOf(name) === -1,
      '停止済みスクリプトが再び読み込まれています: ' + name);
  });
})();

if (failures.length) {
  failures.forEach(function (msg) { console.error('FAIL: ' + msg); });
  process.exit(1);
}
console.log('計算・アクセシビリティ回帰チェック合格: 厚生年金18.3%・上下限・代表値、無効入力クリア、固定バー、ラベル、停止済みスクリプトを確認しました。');
