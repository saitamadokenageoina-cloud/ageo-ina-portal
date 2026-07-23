'use strict';

/*
 * DOKEN SMART PORTAL 公開前品質チェック
 * 外部パッケージを使わず、GitHub Actions と手元の Node.js の両方で実行する。
 */
var fs = require('fs');
var path = require('path');
var root = path.resolve(__dirname, '..');
var failures = [];
var warnings = [];

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function fail(message) {
  failures.push(message);
}

function warn(message) {
  warnings.push(message);
}

function cleanTarget(target) {
  return String(target || '').split('#')[0].split('?')[0];
}

function isLocalTarget(target) {
  return target &&
    target.charAt(0) !== '#' &&
    target.indexOf('http://') !== 0 &&
    target.indexOf('https://') !== 0 &&
    target.indexOf('mailto:') !== 0 &&
    target.indexOf('tel:') !== 0 &&
    target.indexOf('data:') !== 0 &&
    target.indexOf('blob:') !== 0 &&
    target.indexOf('javascript:') !== 0;
}

function checkTarget(htmlFile, target) {
  var cleaned = cleanTarget(target);
  var resolved;
  if (!cleaned || !isLocalTarget(cleaned)) return;
  if (cleaned.indexOf('/ageo-ina-portal/') === 0) {
    cleaned = cleaned.replace('/ageo-ina-portal/', '');
    resolved = path.join(root, cleaned);
  } else if (cleaned.charAt(0) === '/') {
    return;
  } else {
    resolved = path.resolve(path.dirname(path.join(root, htmlFile)), cleaned);
  }
  if (resolved.indexOf(root + path.sep) !== 0 && resolved !== root) return;
  if (!fs.existsSync(resolved)) fail(htmlFile + ': 参照先がありません: ' + target);
}

function checkHtml(htmlFile) {
  var source = read(htmlFile);
  var markup = source.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
  var ids = {};
  var match;
  var idPattern = /\bid\s*=\s*["']([^"']+)["']/gi;
  var assetPattern = /\b(?:href|src)\s*=\s*["']([^"']+)["']/gi;
  var imagePattern = /<img\b[^>]*>/gi;
  var scriptSrcPattern = /<script\b[^>]*\bsrc\s*=\s*["'][^"']+["'][^>]*>([\s\S]*?)<\/script>/gi;

  if (!/<html\b[^>]*\blang\s*=\s*["']ja["']/i.test(source)) fail(htmlFile + ': html lang="ja" がありません');
  if (!/<meta\b[^>]*\bname\s*=\s*["']viewport["']/i.test(source)) fail(htmlFile + ': viewport がありません');
  if (!/<title>[^<]+<\/title>/i.test(source)) fail(htmlFile + ': title がありません');
  if (/user-scalable\s*=\s*no|maximum-scale\s*=\s*1(?:\.0)?/i.test(source)) fail(htmlFile + ': 画面拡大を禁止しないでください');

  while ((match = idPattern.exec(markup))) {
    if (ids[match[1]]) fail(htmlFile + ': id が重複しています: ' + match[1]);
    ids[match[1]] = true;
  }
  while ((match = assetPattern.exec(markup))) checkTarget(htmlFile, match[1]);
  while ((match = imagePattern.exec(markup))) {
    if (!/\balt\s*=\s*["'][^"']*["']/i.test(match[0])) fail(htmlFile + ': alt のない画像があります');
  }
  while ((match = scriptSrcPattern.exec(source))) {
    if (match[1].replace(/\s+/g, '')) fail(htmlFile + ': src付きscriptタグの内側にコードがあります');
  }
  if (htmlFile !== 'rodo36_form_preview.html' && source.indexOf('assets/js/navigation.js') === -1) {
    fail(htmlFile + ': 共通JavaScript navigation.js がありません');
  }
}

function checkServiceWorker(htmlFiles) {
  var source = read('sw.js');
  var version = source.match(/CACHE_VERSION\s*=\s*['"]([^'"]+)['"]/);
  var i;
  if (!version || !/^v\d{8}-\d+$/.test(version[1])) fail('sw.js: CACHE_VERSION の形式が正しくありません');
  for (i = 0; i < htmlFiles.length; i += 1) {
    if (source.indexOf("BASE + '" + htmlFiles[i] + "'") === -1) {
      fail('sw.js: CACHE_FILES に ' + htmlFiles[i] + ' がありません');
    }
  }
}

function checkSharedJavaScript() {
  var source = read('assets/js/navigation.js');
  if (/\bconst\b|\blet\b|=>|\?\./.test(source)) {
    fail('assets/js/navigation.js: ES5以外の構文があります');
  }
}

function checkSensitiveTokens(files) {
  var tokenPattern = /(?:github_pat_[A-Za-z0-9_]{20,}|ghp_[A-Za-z0-9]{20,}|Bearer\s+[A-Za-z0-9._-]{20,})/;
  var i;
  for (i = 0; i < files.length; i += 1) {
    if (tokenPattern.test(read(files[i]))) fail(files[i] + ': 公開してはいけない認証情報らしき文字列があります');
  }
}

var htmlFiles = fs.readdirSync(root).filter(function (name) {
  return /\.html$/i.test(name) && fs.statSync(path.join(root, name)).isFile();
}).sort();
var publicTextFiles = htmlFiles.concat(['sw.js', 'assets/js/navigation.js']);
var i;

for (i = 0; i < htmlFiles.length; i += 1) checkHtml(htmlFiles[i]);
checkServiceWorker(htmlFiles);
checkSharedJavaScript();
checkSensitiveTokens(publicTextFiles);

if (warnings.length) {
  console.log('\n注意（公開を止めない項目）');
  warnings.forEach(function (message) { console.log('  - ' + message); });
}

if (failures.length) {
  console.error('\n品質チェックで ' + failures.length + ' 件の問題が見つかりました。');
  failures.forEach(function (message) { console.error('  - ' + message); });
  process.exit(1);
}

console.log('品質チェック合格: HTML ' + htmlFiles.length + 'ページ、リンク、ID、画像、共通JS、キャッシュ、認証情報を確認しました。');
