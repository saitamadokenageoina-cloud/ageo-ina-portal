/*
DOKEN Guild cloud backend template for Google Apps Script.

1. Create a Google Spreadsheet and copy its ID.
2. Open Extensions > Apps Script and paste this file.
3. Set Script Properties:
   SPREADSHEET_ID = your spreadsheet id
   ADMIN_PIN = a private deletion PIN
   ALERT_PIN = a private PIN for the weather-alert settings page
   NOTIFY_EMAIL = the branch email address that receives new-post notices
4. Deploy as Web app:
   Execute as: Me
   Who has access: Anyone
5. Copy the Web app URL into assets/js/guild-config.js as apiUrl.

このスクリプトは DOKEN ギルド（掲示板）と 天気自動アラート設定 の両方の
共有データ保存を兼ねる。シートを分けて同じスプレッドシート内で管理する。
*/

const PROPS = PropertiesService.getScriptProperties();
const SHEET_NAME = 'guild_posts';
const ALERT_SHEET_NAME = 'alert_config';
const CATEGORIES = {
  jinzai: { emoji: '👷' },
  shizai: { emoji: '🔧' },
  soudan: { emoji: '💬' }
};

function doPost(e) {
  let body;
  try {
    body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
  } catch (error) {
    return json_({ ok: false, error: 'invalid json' });
  }
  const action = safeText_(body.action, 30) || 'list';

  if (action === 'getAlertConfig') {
    return json_({ config: readAlertConfig_() });
  }

  if (action === 'saveAlertConfig') {
    if (!validPin_(body.pin, 'ALERT_PIN')) {
      return json_({ ok: false, error: 'invalid pin' });
    }
    const config = normalizeAlertConfig_(body.config);
    if (!config) return json_({ ok: false, error: 'invalid config' });
    writeAlertConfig_(config);
    return json_({ ok: true });
  }

  const sheet = getSheet_();

  if (action === 'list') {
    return json_({ posts: readPosts_(sheet) });
  }

  if (action === 'create') {
    const post = normalizePost_(body.post, false);
    if (!post) return json_({ ok: false, error: 'invalid post' });
    post.id = Date.now() * 1000 + Math.floor(Math.random() * 1000);
    post.createdAt = new Date().toISOString();
    post.time = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'M/d H:mm');
    withLock_(function () { appendPost_(sheet, post); });

    // 通知先は公開ブラウザから受け取らず、サーバー側の設定だけを使う。
    const notifyEmail = safeText_(PROPS.getProperty('NOTIFY_EMAIL'), 254);
    if (isEmail_(notifyEmail)) {
      try {
        MailApp.sendEmail({
          to: notifyEmail,
          subject: '【DOKENギルド】新しい投稿がありました',
          body: [
            'DOKENギルドに新しい投稿がありました。',
            '',
            `カテゴリ: ${post.cat}`,
            `投稿者: ${post.name}`,
            `地域: ${post.area}`,
            '',
            post.body,
            '',
            `連絡先: ${post.tel || '未入力'}`
          ].join('\n')
        });
      } catch (error) {
        console.error('Mail notification failed', error);
      }
    }
    return json_({ ok: true });
  }

  if (action === 'comment') {
    const postId = positiveInteger_(body.postId);
    const comment = normalizeComment_(body.comment);
    if (!postId || !comment) return json_({ ok: false, error: 'invalid comment' });
    withLock_(function () {
      const posts = readPosts_(sheet);
      const target = posts.find(p => String(p.id) === String(postId));
      if (!target) return;
      target.comments = (target.comments || []).concat([comment]).slice(-100);
      writePosts_(sheet, posts);
    });
    return json_({ ok: true });
  }

  if (action === 'delete') {
    if (!validPin_(body.adminPin, 'ADMIN_PIN')) {
      return json_({ ok: false, error: 'invalid admin pin' });
    }
    const postId = positiveInteger_(body.postId);
    if (!postId) return json_({ ok: false, error: 'invalid post id' });
    withLock_(function () {
      const posts = readPosts_(sheet).filter(p => String(p.id) !== String(postId));
      writePosts_(sheet, posts);
    });
    return json_({ ok: true });
  }

  return json_({ ok: false, error: 'unknown action' });
}

function getSheet_() {
  const ss = SpreadsheetApp.openById(PROPS.getProperty('SPREADSHEET_ID'));
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(['json']);
  }
  return sheet;
}

function getAlertSheet_() {
  const ss = SpreadsheetApp.openById(PROPS.getProperty('SPREADSHEET_ID'));
  let sheet = ss.getSheetByName(ALERT_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(ALERT_SHEET_NAME);
    sheet.appendRow(['json']);
  }
  return sheet;
}

function readAlertConfig_() {
  const sheet = getAlertSheet_();
  const values = sheet.getDataRange().getValues();
  if (values.length < 2 || !values[1][0]) return null;
  try { return JSON.parse(values[1][0]); } catch (e) { return null; }
}

function writeAlertConfig_(config) {
  const sheet = getAlertSheet_();
  sheet.clear();
  sheet.appendRow(['json']);
  sheet.appendRow([JSON.stringify(config)]);
}

function normalizeAlertConfig_(config) {
  if (!config || typeof config !== 'object') return null;
  const heatWarn = numberInRange_(config.heatWarn, 20, 35);
  const heatSevere = numberInRange_(config.heatSevere, 20, 35);
  const heatDanger = numberInRange_(config.heatDanger, 20, 35);
  const windSpeed = numberInRange_(config.windSpeed, 5, 25);
  const startHours = [0, 5, 6, 7, 12, 15];
  const startHour = Number(config.startHour);
  if (heatWarn === null || heatSevere === null || heatDanger === null || windSpeed === null) return null;
  if (!(heatWarn <= heatSevere && heatSevere <= heatDanger)) return null;
  if (startHours.indexOf(startHour) === -1) return null;
  return {
    dayMode: config.dayMode === 'prevday' ? 'prevday' : 'today',
    startHour: startHour,
    heatOn: config.heatOn === true,
    heatWarn: heatWarn,
    heatSevere: heatSevere,
    heatDanger: heatDanger,
    rainOn: config.rainOn === true,
    windOn: config.windOn === true,
    windSpeed: windSpeed
  };
}

function readPosts_(sheet) {
  const values = sheet.getDataRange().getValues().slice(1);
  return values.map(row => {
    try { return normalizePost_(JSON.parse(row[0]), true); } catch (e) { return null; }
  }).filter(Boolean);
}

function appendPost_(sheet, post) {
  sheet.appendRow([JSON.stringify(post)]);
}

function writePosts_(sheet, posts) {
  sheet.clear();
  sheet.appendRow(['json']);
  posts.map(post => normalizePost_(post, true)).filter(Boolean).forEach(post => appendPost_(sheet, post));
}

function normalizePost_(post, preserveServerFields) {
  if (!post || typeof post !== 'object' || !CATEGORIES[post.cat]) return null;
  const body = safeText_(post.body, 1200);
  if (!body) return null;
  const telRaw = safeText_(post.tel, 40);
  const tel = /^[0-9+()\-\sXx]*$/.test(telRaw) ? telRaw : '';
  const normalized = {
    id: preserveServerFields ? positiveInteger_(post.id) : 1,
    clientId: safeText_(post.clientId, 80),
    cat: post.cat,
    emoji: CATEGORIES[post.cat].emoji,
    name: safeText_(post.name, 40) || '匿名',
    area: safeText_(post.area, 80),
    time: safeText_(post.time, 40) || '日時不明',
    body: body,
    tags: Array.isArray(post.tags) ? post.tags.slice(0, 8).map(tag => safeText_(tag, 30)).filter(Boolean) : [],
    tel: tel,
    comments: Array.isArray(post.comments) ? post.comments.map(normalizeComment_).filter(Boolean).slice(-100) : [],
    createdAt: preserveServerFields ? safeText_(post.createdAt, 40) : ''
  };
  if (preserveServerFields && !normalized.id) return null;
  return normalized;
}

function normalizeComment_(comment) {
  if (!comment || typeof comment !== 'object') return null;
  const text = safeText_(comment.text, 300);
  if (!text) return null;
  return {
    emoji: '💬',
    name: safeText_(comment.name, 40) || '匿名',
    text: text
  };
}

function safeText_(value, maxLength) {
  return String(value == null ? '' : value)
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .trim()
    .slice(0, maxLength);
}

function positiveInteger_(value) {
  const number = Number(value);
  return Number.isSafeInteger(number) && number > 0 ? number : null;
}

function numberInRange_(value, min, max) {
  const number = Number(value);
  return Number.isFinite(number) && number >= min && number <= max ? number : null;
}

function validPin_(input, propertyName) {
  const expected = String(PROPS.getProperty(propertyName) || '');
  return expected.length >= 6 && String(input || '') === expected;
}

function isEmail_(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function withLock_(callback) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    return callback();
  } finally {
    lock.releaseLock();
  }
}

function json_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
