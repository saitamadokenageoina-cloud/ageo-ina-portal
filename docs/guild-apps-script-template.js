/*
DOKEN Guild cloud backend template for Google Apps Script.

1. Create a Google Spreadsheet and copy its ID.
2. Open Extensions > Apps Script and paste this file.
3. Set Script Properties:
   SPREADSHEET_ID = your spreadsheet id
   ADMIN_PIN = a private deletion PIN
4. Deploy as Web app:
   Execute as: Me
   Who has access: Anyone
5. Copy the Web app URL into assets/js/guild-config.js as apiUrl.
*/

const PROPS = PropertiesService.getScriptProperties();
const SHEET_NAME = 'guild_posts';

function doPost(e) {
  const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
  const action = body.action || 'list';
  const sheet = getSheet_();

  if (action === 'list') {
    return json_({ posts: readPosts_(sheet) });
  }

  if (action === 'create') {
    const post = body.post || {};
    post.createdAt = new Date().toISOString();
    appendPost_(sheet, post);
    if (body.notifyEmail) {
      MailApp.sendEmail({
        to: body.notifyEmail,
        subject: '【DOKENギルド】新しい投稿がありました',
        body: [
          'DOKENギルドに新しい投稿がありました。',
          '',
          `カテゴリ: ${post.cat || ''}`,
          `投稿者: ${post.name || ''}`,
          `地域: ${post.area || ''}`,
          '',
          post.body || '',
          '',
          `連絡先: ${post.tel || '未入力'}`
        ].join('\n')
      });
    }
    return json_({ ok: true });
  }

  if (action === 'comment') {
    const posts = readPosts_(sheet);
    const target = posts.find(p => String(p.id) === String(body.postId));
    if (target) {
      target.comments = target.comments || [];
      target.comments.push(body.comment || {});
      writePosts_(sheet, posts);
    }
    return json_({ ok: true });
  }

  if (action === 'delete') {
    if (String(body.adminPin || '') !== String(PROPS.getProperty('ADMIN_PIN') || '')) {
      return json_({ ok: false, error: 'invalid admin pin' }, 403);
    }
    const posts = readPosts_(sheet).filter(p => String(p.id) !== String(body.postId));
    writePosts_(sheet, posts);
    return json_({ ok: true });
  }

  return json_({ ok: false, error: 'unknown action' }, 400);
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

function readPosts_(sheet) {
  const values = sheet.getDataRange().getValues().slice(1);
  return values.map(row => {
    try { return JSON.parse(row[0]); } catch (e) { return null; }
  }).filter(Boolean);
}

function appendPost_(sheet, post) {
  sheet.appendRow([JSON.stringify(post)]);
}

function writePosts_(sheet, posts) {
  sheet.clear();
  sheet.appendRow(['json']);
  posts.forEach(post => appendPost_(sheet, post));
}

function json_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
