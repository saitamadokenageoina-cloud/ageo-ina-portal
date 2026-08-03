/*
 * DOKEN SMART PORTAL 匿名利用集計
 *
 * Google Analytics 4 の測定IDを設定するまで通信は一切行いません。
 * 測定IDは秘密情報ではありませんが、Google Analytics専用のものを使用します。
 * 氏名・電話番号・メール・住所・入力内容・金額・検索語は受け取りません。
 */
(function () {
  'use strict';

  var MEASUREMENT_ID = '';
  var OPEN_DEDUPLICATION_MS = 30 * 60 * 1000;
  var STORAGE_PREFIX = 'doken_usage_seen_v1_';

  var PAGE_FEATURES = {
    'index.html': 'home',
    'calendar.html': 'calendar',
    'doken_card.html': 'doken_card',
    'guild.html': 'guild',
    'meishi.html': 'business_card',
    'kyosai_guide.html': 'mutual_aid',
    'kyokyu.html': 'worker_supply',
    'calc.html': 'calculator',
    'atsusa.html': 'heat_alert',
    'anzen_check.html': 'safety_check',
    'work_log.html': 'work_log',
    'rodo36.html': 'overtime',
    'guide.html': 'procedure_guide',
    'merit.html': 'membership_benefits',
    'kensetsu_check.html': 'construction_license',
    'hitori.html': 'sole_proprietor',
    'koushu.html': 'training',
    'shiryo.html': 'library',
    'book.html': 'book_reader',
    'app_guide.html': 'app_guide'
  };

  var ALLOWED_EVENTS = {
    feature_open: true,
    branch_phone_click: true,
    external_estimate_open: true,
    guild_post_complete: true,
    business_card_png_download: true,
    business_card_pdf_download: true,
    work_log_save: true,
    workers_comp_calculate: true
  };

  var ALLOWED_FEATURES = {};
  var pageName;
  for (pageName in PAGE_FEATURES) {
    if (Object.prototype.hasOwnProperty.call(PAGE_FEATURES, pageName)) {
      ALLOWED_FEATURES[PAGE_FEATURES[pageName]] = true;
    }
  }
  ALLOWED_FEATURES.branch_contact = true;
  ALLOWED_FEATURES.standard_estimate = true;

  function validMeasurementId() {
    return /^G-[A-Z0-9]+$/i.test(MEASUREMENT_ID);
  }

  function currentFile() {
    var file = window.location.pathname.split('/').pop();
    return file || 'index.html';
  }

  function safePageLocation() {
    return window.location.origin + window.location.pathname;
  }

  function send(eventName, featureId) {
    if (!validMeasurementId() || !ALLOWED_EVENTS[eventName] || !ALLOWED_FEATURES[featureId]) return;
    if (typeof window.gtag !== 'function') return;
    window.gtag('event', eventName, {
      feature_id: featureId,
      page_location: safePageLocation(),
      page_title: featureId,
      send_to: MEASUREMENT_ID
    });
  }

  function track(eventName, featureId) {
    send(String(eventName || ''), String(featureId || ''));
  }

  function trackPageOpen() {
    var featureId = PAGE_FEATURES[currentFile()];
    var key;
    var last;
    var now;
    if (!featureId) return;
    key = STORAGE_PREFIX + featureId;
    now = Date.now();
    try {
      last = parseInt(window.sessionStorage.getItem(key) || '0', 10);
      if (last && now - last < OPEN_DEDUPLICATION_MS) return;
      window.sessionStorage.setItem(key, String(now));
    } catch (error) {
      /* 保存できない端末でも集計表示自体は妨げない */
    }
    track('feature_open', featureId);
  }

  function trackCommonClicks(event) {
    var target = event.target;
    var link;
    var href;
    while (target && target !== document && target.nodeType === 1 && target.tagName.toLowerCase() !== 'a') {
      target = target.parentNode;
    }
    link = target && target.tagName && target.tagName.toLowerCase() === 'a' ? target : null;
    if (!link) return;
    href = link.getAttribute('href') || '';
    if (/^tel:048[-]?773[-]?9863$/i.test(href)) {
      track('branch_phone_click', 'branch_contact');
    } else if (href.indexOf('saitamadokenageoina-cloud.github.io/estimate') !== -1) {
      track('external_estimate_open', 'standard_estimate');
    }
  }

  function trackCalculatorUse(event) {
    var target = event.target;
    var id = target && target.id ? target.id : '';
    var key = STORAGE_PREFIX + 'workers_comp_calculate';
    var last;
    var now;
    if (currentFile() !== 'calc.html' || id.indexOf('rs') !== 0 || event.isTrusted === false) return;
    now = Date.now();
    try {
      last = parseInt(window.sessionStorage.getItem(key) || '0', 10);
      if (last && now - last < OPEN_DEDUPLICATION_MS) return;
      window.sessionStorage.setItem(key, String(now));
    } catch (error) {
      /* 保存できない場合も計算画面は通常どおり動かす */
    }
    track('workers_comp_calculate', 'calculator');
  }

  function loadGoogleTag() {
    var script;
    if (!validMeasurementId()) return;
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
    window.gtag('consent', 'default', {
      analytics_storage: 'denied',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied'
    });
    window.gtag('js', new Date());
    window.gtag('config', MEASUREMENT_ID, {
      send_page_view: false,
      allow_google_signals: false,
      allow_ad_personalization_signals: false
    });
    script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(MEASUREMENT_ID);
    document.head.appendChild(script);
  }

  window.DokenUsage = { track: track };
  if (!validMeasurementId()) return;
  loadGoogleTag();
  document.addEventListener('click', trackCommonClicks, false);
  document.addEventListener('change', trackCalculatorUse, false);
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', trackPageOpen);
  } else {
    trackPageOpen();
  }
}());
