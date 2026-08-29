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

function readBinary(relativePath) {
  return fs.readFileSync(path.join(root, relativePath));
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

function checkJpeg(relativePath) {
  var absolutePath = path.join(root, relativePath);
  var data;
  var offset;
  var marker;
  var segmentLength;
  var foundFrame = false;
  var foundScan = false;
  var frameMarkers = {
    0xc0: true, 0xc1: true, 0xc2: true, 0xc3: true,
    0xc5: true, 0xc6: true, 0xc7: true,
    0xc9: true, 0xca: true, 0xcb: true,
    0xcd: true, 0xce: true, 0xcf: true
  };

  if (!fs.existsSync(absolutePath)) {
    fail('sw.js: JPEG画像がありません: ' + relativePath);
    return;
  }
  data = readBinary(relativePath);
  if (data.length < 4 || data[0] !== 0xff || data[1] !== 0xd8) {
    fail(relativePath + ': JPEGの開始マーカーがありません');
    return;
  }

  offset = 2;
  while (offset < data.length) {
    if (data[offset] !== 0xff) {
      fail(relativePath + ': JPEGマーカーの前に不正なデータがあります');
      return;
    }
    while (offset < data.length && data[offset] === 0xff) offset += 1;
    if (offset >= data.length) break;
    marker = data[offset];
    offset += 1;

    if (marker === 0xd9) break;
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
    if (offset + 2 > data.length) {
      fail(relativePath + ': JPEGセグメントが途中で切れています');
      return;
    }
    segmentLength = data.readUInt16BE(offset);
    if (segmentLength < 2 || offset + segmentLength > data.length) {
      fail(relativePath + ': JPEGセグメント長が不正です');
      return;
    }
    if (frameMarkers[marker]) {
      if (segmentLength < 7 || data.readUInt16BE(offset + 3) < 1 || data.readUInt16BE(offset + 5) < 1) {
        fail(relativePath + ': JPEGの画像サイズが不正です');
        return;
      }
      foundFrame = true;
    }
    if (marker === 0xda) {
      if (!foundFrame) {
        fail(relativePath + ': JPEGの画像情報より先に画像データが始まっています');
        return;
      }
      foundScan = true;
      break;
    }
    offset += segmentLength;
  }

  if (!foundFrame || !foundScan) fail(relativePath + ': JPEGとして復号できる構造ではありません');
  if (data[data.length - 2] !== 0xff || data[data.length - 1] !== 0xd9) {
    fail(relativePath + ': JPEGの終了マーカーがありません');
  }
}

function checkCachedJpegs() {
  var source = read('sw.js');
  var pattern = /BASE \+ '([^']+\.jpe?g)'/gi;
  var match;
  while ((match = pattern.exec(source))) checkJpeg(match[1]);
}

function checkHomeCardImages() {
  var indexSource = read('index.html');
  var homeScript = read('assets/js/home-modern-legacy-v177.js');
  var navigationSource = read('assets/js/navigation.js');
  var artCss = read('assets/css/home-card-art.css');
  var homeCss = read('assets/css/home-modern.css');
  var themeCss = read('assets/css/theme-polish.css');
  var imagePattern = /<img\b[^>]*\bclass=["'][^"']*\bhome-card-image\b[^"']*["'][^>]*>/gi;
  var sourcePattern = /\bsrc=["']([^"']+)["']/i;
  var cardPattern = /<a\b[^>]*\bclass=["'][^"']*\bmc\b[^"']*["'][^>]*>/gi;
  var images = indexSource.match(imagePattern) || [];
  var cards = indexSource.match(cardPattern) || [];
  var match;
  var i;

  if (images.length !== cards.length) {
    fail('index.html: 機能カード ' + cards.length + '枚に対して直接画像が ' + images.length + '枚です');
  }
  for (i = 0; i < images.length; i += 1) {
    match = images[i].match(sourcePattern);
    if (!match || !/^assets\/illustrations\/home-3d\/.+-v\d+\.jpg$/i.test(match[1])) {
      fail('index.html: カード画像はバージョン付き個別JPEGを直接参照してください');
    } else {
      checkJpeg(match[1]);
    }
    if (!/\bwidth=["']960["']/i.test(images[i]) || !/\bheight=["']640["']/i.test(images[i])) {
      fail('index.html: カード画像のwidth/heightは960×640にしてください');
    }
  }
  if (homeScript.indexOf("doken-card-v180.jpg") === -1) {
    fail('home-modern-legacy-v177.js: DOKENカード画像が生成時HTMLにありません');
  }
  if (!/href=["']meishi\.html["'][\s\S]*?<img\b[^>]*src=["']assets\/illustrations\/home-3d\/meishi-v181\.jpg["']/i.test(indexSource)) {
    fail('index.html: AI名刺作成カードに名刺専用画像がありません');
  }
  if (navigationSource.indexOf("disaster-v181.jpg") === -1 || navigationSource.indexOf('class="home-card-image"') === -1) {
    fail('navigation.js: 災害・事故カードに直接画像がありません');
  } else {
    checkJpeg('assets/illustrations/home-3d/disaster-v181.jpg');
  }
  if (/service-disaster-card[\s\S]{0,1200}linear-gradient/.test(navigationSource)) {
    fail('navigation.js: 災害・事故カードに旧gradient描画が残っています');
  }
  if (/\bART\s*=|home-card-art-direct|artFor\s*\(/.test(homeScript)) {
    fail('home-modern-legacy-v177.js: 旧sprite描画処理が残っています');
  }
  if (/--home-card-art|background-image/.test(artCss)) {
    fail('home-card-art.css: 旧background-image方式が残っています');
  }
  if (indexSource.indexOf('class="home-tools-title home-tools-trigger"') === -1) {
    fail('index.html: 機能検索の見出しが操作できるボタンではありません');
  }
  if (indexSource.indexOf("classList.add('search-hidden')") === -1 || indexSource.indexOf('.mc.search-hidden{display:none!important') === -1) {
    fail('index.html: 検索対象外カードを確実に隠す処理がありません');
  }
  if (/cards\[i\]\.style\.display\s*=/.test(indexSource)) {
    fail('index.html: !importantに負ける旧検索非表示処理が残っています');
  }
  if (homeScript.indexOf("window.addEventListener('pageshow',queueRailReset,false)") === -1 || homeScript.indexOf('scrollLeft=0') === -1) {
    fail('home-modern-legacy-v177.js: 再表示時の横レール初期化がありません');
  }
  if (homeCss.indexOf('scroll-padding-left:16px') === -1) {
    fail('home-modern.css: 横レールの先頭位置が統一されていません');
  }
  if (homeScript.indexOf("['youtube.com',['YouTube','チャンネル']]") === -1 || homeCss.indexOf('.mc-title-line') === -1) {
    fail('ホームカード: 意味の切れ目で見出しを改行する処理がありません');
  }
  if (/a\[href=["']guild\.html["']\] \.mc-desc::after/.test(homeCss + themeCss + homeScript)) {
    fail('ホームカード: DOKENギルドだけ説明文サイズを変える旧処理が残っています');
  }
}

function checkEs5JavaScript(relativePath) {
  var source = read(relativePath);
  if (/\bconst\b|\blet\b|=>|\?\./.test(source)) {
    fail(relativePath + ': ES5以外の構文があります');
  }
}

function checkSharedJavaScript() {
  checkEs5JavaScript('assets/js/navigation.js');
  checkEs5JavaScript('assets/js/home-modern.js');
  checkEs5JavaScript('assets/js/home-modern-legacy-v177.js');
}

function checkHomeAssetVersions() {
  var serviceWorker = read('sw.js');
  var indexSource = read('index.html');
  var navigationSource = read('assets/js/navigation.js');
  var wrapperSource = read('assets/js/home-modern.js');
  var match = serviceWorker.match(/CACHE_VERSION\s*=\s*['"]v\d{8}-(\d+)['"]/);
  var release;
  var checks;
  var i;
  if (!match) return;
  release = match[1];
  checks = [
    [indexSource, 'assets/js/navigation.js?v=' + release, 'index.html: navigation.js'],
    [navigationSource, 'assets/css/theme-polish.css?v=' + release, 'navigation.js: theme-polish.css'],
    [navigationSource, 'assets/css/home-modern.css?v=' + release, 'navigation.js: home-modern.css'],
    [navigationSource, 'assets/css/home-card-art.css?v=' + release, 'navigation.js: home-card-art.css'],
    [navigationSource, 'assets/css/home-alignment-fix.css?v=' + release, 'navigation.js: home-alignment-fix.css'],
    [navigationSource, 'assets/js/home-modern.js?v=' + release, 'navigation.js: home-modern.js'],
    [wrapperSource, 'assets/js/home-modern-legacy-v177.js?v=' + release, 'home-modern.js: legacy script']
  ];
  for (i = 0; i < checks.length; i += 1) {
    if (checks[i][0].indexOf(checks[i][1]) === -1) {
      fail(checks[i][2] + ' のキャッシュ版数がService Workerと一致しません');
    }
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
checkCachedJpegs();
checkHomeCardImages();
checkSharedJavaScript();
checkHomeAssetVersions();
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

console.log('品質チェック合格: HTML ' + htmlFiles.length + 'ページ、リンク、ID、画像データ、共通JS、キャッシュ、認証情報を確認しました。');
