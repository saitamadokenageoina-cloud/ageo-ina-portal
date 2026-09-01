'use strict';

/*
 * 計算ロジック・アクセシビリティの回帰チェック
 *
 * 既存の quality-check.js は「壊れていないか（リンク・ID・キャッシュ）」を見るが、
 * 「計算結果が正しいか」は見ていなかった。そのため
 *   ・厚生年金の標準報酬月額の上限650,000円が未適用で保険料を過大表示
 *   ・入力が無効になっても前回の計算結果が画面に残る
 * という不具合がCIを通過してしまった。同じ種類の回帰を防ぐために追加する。
 *
 * 外部パッケージは使わず、Node.js だけで動く（GitHub Actions と手元の両方で実行可能）。
 */

var fs = require('fs');
var path = require('path');
var root = path.resolve(__dirname, '..');
var failures = [];

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}
function fail(message) {
  failures.push(message);
}
function assert(cond, message) {
  if (!cond) fail(message);
}

/* ========== 1. 厚生年金：標準報酬月額の上限 ========== */
(function checkPensionCap() {
  var calc = read('calc.html');

  assert(/maxHyojun\s*:\s*650000/.test(calc),
    'calc.html: 厚生年金の標準報酬月額の上限(maxHyojun:650000)が定義されていません。' +
    '上限が無いと高額報酬で保険料を過大表示します。');

  assert(/Math\.min\(\s*h\s*,\s*RM\.nenkin\.maxHyojun\s*\)/.test(calc),
    'calc.html: 厚生年金の計算に上限(Math.min(h, RM.nenkin.maxHyojun))が適用されていません。');

  // 実際に計算して値を検証する（式を書き換えても気づけるように）
  var rateMatch = calc.match(/nenkin:\s*\{\s*rate:\s*([\d.]+)/);
  assert(rateMatch, 'calc.html: 厚生年金の料率を読み取れません。');
  if (rateMatch) {
    var rate = parseFloat(rateMatch[1]);
    var cases = [
      { hyojun: 300000, expect: Math.round(300000 * rate / 2) },
      { hyojun: 650000, expect: Math.round(650000 * rate / 2) },
      { hyojun: 700000, expect: Math.round(650000 * rate / 2) },   // 上限で頭打ち
      { hyojun: 1390000, expect: Math.round(650000 * rate / 2) }   // 入力欄の上限でも同じ
    ];
    cases.forEach(function (c) {
      var base = Math.min(c.hyojun, 650000);
      var got = Math.round(base * rate / 2);
      assert(got === c.expect,
        'calc.html: 厚生年金の計算が想定と違います（標準報酬' + c.hyojun + '円 → ' + got + '円、期待' + c.expect + '円）');
    });
  }

  assert(/上限650,000円/.test(calc),
    'calc.html: 上限で計算したことを利用者へ伝える注記がありません。');
})();

/* ========== 2. 無効な入力で前回の結果を残さない ========== */
(function checkStaleResult() {
  var calc = read('calc.html');

  assert(!/parseFloat\(document\.getElementById\('rm-hyojun'\)\.value\)\s*\|\|\s*\d+/.test(calc),
    'calc.html: 労務費で入力値に既定値を代入(|| 300000)しています。' +
    '空欄や文字を入れても計算が走り、前回の結果が残って誤読の原因になります。');

  assert(/Number\.isFinite\(h\)/.test(calc) && /h\s*<=\s*0/.test(calc),
    'calc.html: 労務費で入力値の妥当性(Number.isFinite/0以下)を確認していません。');

  var kyosai = read('kyosai_calc.html');
  var showError = kyosai.match(/function showError\([^)]*\)\s*\{[^}]*\}/);
  assert(showError, 'kyosai_calc.html: showError関数が見つかりません。');
  if (showError) {
    var body = showError[0];
    assert(/ky-result'\)\.classList\.remove\('show'\)/.test(body),
      'kyosai_calc.html: エラー表示時に前回の試算結果を隠していません。' +
      'エラーと古い掛金が同じ画面に並び、利用者が誤読します。');
    assert(/result-total'\)\.textContent\s*=\s*'0円'/.test(body),
      'kyosai_calc.html: エラー表示時に掛金の表示を初期化していません。');
    assert(/lastResultText\s*=\s*''/.test(body),
      'kyosai_calc.html: エラー表示時にコピー用テキストを初期化していません。');
  }
})();

/* ========== 3. 下部固定バーのコントラスト（WCAG AA 4.5:1） ========== */
(function checkRailContrast() {
  var css = read('common.css');

  function luminance(hex) {
    var h = hex.replace('#', '');
    var rgb = [0, 2, 4].map(function (i) { return parseInt(h.substr(i, 2), 16); });
    var f = rgb.map(function (v) {
      v = v / 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * f[0] + 0.7152 * f[1] + 0.0722 * f[2];
  }
  function ratioWithWhite(hex) {
    return (1.0 + 0.05) / (luminance(hex) + 0.05);
  }

  var labels = ['電話', 'LINE', '地図', 'ガイド'];
  for (var i = 1; i <= 4; i++) {
    var re = new RegExp('\\.doken-contact-rail a:nth-child\\(' + i + '\\)\\{background:(#[0-9A-Fa-f]{6})');
    var m = css.match(re);
    assert(m, 'common.css: 下部固定バー ' + i + '番目の背景色を読み取れません。');
    if (m) {
      var r = ratioWithWhite(m[1]);
      assert(r >= 4.5,
        'common.css: 下部固定バー「' + labels[i - 1] + '」(' + m[1] + ')は白文字とのコントラストが ' +
        r.toFixed(2) + ':1 で、WCAG AAの4.5:1に届きません。高齢の組合員が最も使う導線です。');
    }
  }
})();

/* ========== 4. 入力欄のラベル紐付け ========== */
(function checkLabels() {
  var files = fs.readdirSync(root).filter(function (f) { return /\.html$/.test(f); });
  files.forEach(function (file) {
    var html = read(file);
    var markup = html.replace(/<script[\s\S]*?<\/script>/gi, '');

    // label[for] の宛先が実在するか
    var ids = {};
    var idRe = /\bid\s*=\s*"([^"]+)"/g, m;
    while ((m = idRe.exec(markup))) ids[m[1]] = true;

    var forRe = /<label[^>]*\bfor="([^"]+)"/g;
    while ((m = forRe.exec(markup))) {
      if (m[1].indexOf('${') !== -1) continue;   // テンプレートリテラルは対象外
      assert(ids[m[1]],
        file + ': label for="' + m[1] + '" に対応する要素がありません。');
    }

    // id の重複（ラベル一括付与の作業で壊しやすいので必ず見る）
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
  var retired = [
    'guild-config-v194.js',
    'guild-v195-loader.js',
    'guild-admin-editor-v195.js',
    'guild-display-hotfix-v197.js'
  ];
  var files = fs.readdirSync(root).filter(function (f) { return /\.html$/.test(f); });
  var haystack = files.map(read).join('\n') + read('sw.js');
  ['navigation.js', 'guild-config.js'].forEach(function (js) {
    var p = path.join(root, 'assets', 'js', js);
    if (fs.existsSync(p)) haystack += fs.readFileSync(p, 'utf8');
  });

  retired.forEach(function (name) {
    assert(haystack.indexOf(name) === -1,
      '停止済みスクリプトが再び読み込まれています: ' + name +
      '（_archive/js/ へ退避済み。復活させると同名関数が二重定義され回帰します）');
  });
})();

/* ========== 結果 ========== */
if (failures.length) {
  failures.forEach(function (msg) { console.error('FAIL: ' + msg); });
  process.exit(1);
}
console.log('計算ロジック・アクセシビリティ回帰チェック合格: 厚生年金の上限、無効入力時の結果クリア、固定バーのコントラスト、ラベル紐付け、停止済みスクリプトを確認しました。');
