(function () {
  'use strict';

  const CONFIG = window.DOKEN_CALENDAR_CONFIG || {};
  const CALENDARS = Array.isArray(CONFIG.CALENDARS) ? CONFIG.CALENDARS : [];
  const API_KEY = String(CONFIG.PUBLIC_CALENDAR_KEY || '');
  const CACHE_KEY = 'doken_calendar_upcoming_v2';
  const CACHE_TTL_MS = 15 * 60 * 1000;
  const RANGE_DAYS = 45;
  const MAX_EVENTS = 18;
  const GOOGLE_EVENT_HOSTS = new Set(['calendar.google.com', 'www.google.com']);

  function byId(id) {
    return document.getElementById(id);
  }

  function createElement(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text != null) element.textContent = String(text);
    return element;
  }

  function normalizeColor(color) {
    return /^#[0-9a-f]{6}$/i.test(String(color || '')) ? color : '#616161';
  }

  function isSafeGoogleEventUrl(value) {
    try {
      const url = new URL(String(value || ''));
      return url.protocol === 'https:' && GOOGLE_EVENT_HOSTS.has(url.hostname) ? url.href : '';
    } catch (error) {
      return '';
    }
  }

  function parseDescriptionTime(value) {
    const text = String(value || '').replace(/[０-９]/g, character =>
      String.fromCharCode(character.charCodeAt(0) - 0xFEE0));
    const match = text.match(/(?:【\s*時間\s*】\s*)?(\d{1,2})\s*時\s*(?:(\d{1,2})\s*分)?\s*[〜～~\-－]\s*(?:(\d{1,2})\s*時\s*(?:(\d{1,2})\s*分)?)?/);
    if (!match) return null;

    const startHour = Number(match[1]);
    const startMinute = Number(match[2] || 0);
    const hasEnd = match[3] != null;
    const endHour = hasEnd ? Number(match[3]) : null;
    const endMinute = hasEnd ? Number(match[4] || 0) : null;
    if (startHour > 23 || startMinute > 59
      || (hasEnd && (endHour > 23 || endMinute > 59))) return null;

    const pad = number => String(number).padStart(2, '0');
    return {
      startMinutes: startHour * 60 + startMinute,
      endMinutes: hasEnd ? endHour * 60 + endMinute : null,
      label: pad(startHour) + ':' + pad(startMinute) + '〜'
        + (hasEnd ? pad(endHour) + ':' + pad(endMinute) : '')
    };
  }

  function dateAtMinutes(dateString, minutes) {
    const date = new Date(String(dateString) + 'T00:00:00+09:00');
    date.setTime(date.getTime() + minutes * 60 * 1000);
    return date.toISOString();
  }

  function eventStartValue(event) {
    return Date.parse(event.start) || 0;
  }

  function normalizeEvent(rawEvent, calendar) {
    if (!rawEvent || rawEvent.status === 'cancelled' || !rawEvent.start) return null;
    const start = rawEvent.start.dateTime || rawEvent.start.date;
    const end = rawEvent.end && (rawEvent.end.dateTime || rawEvent.end.date);
    if (!start || !end) return null;

    const descriptionTime = !rawEvent.start.dateTime
      ? parseDescriptionTime(rawEvent.description)
      : null;
    let normalizedStart = String(start);
    let normalizedEnd = String(end);
    let allDay = !rawEvent.start.dateTime;
    let timeText = '';
    if (descriptionTime) {
      normalizedStart = dateAtMinutes(rawEvent.start.date, descriptionTime.startMinutes);
      const endMinutes = descriptionTime.endMinutes == null
        ? descriptionTime.startMinutes
        : descriptionTime.endMinutes + (descriptionTime.endMinutes <= descriptionTime.startMinutes ? 24 * 60 : 0);
      normalizedEnd = dateAtMinutes(rawEvent.start.date, endMinutes);
      allDay = false;
      timeText = descriptionTime.label;
    }

    return {
      id: String(rawEvent.id || ''),
      iCalUID: String(rawEvent.iCalUID || ''),
      title: String(rawEvent.summary || '(無題)'),
      start: normalizedStart,
      end: normalizedEnd,
      allDay,
      timeText,
      location: String(rawEvent.location || ''),
      category: String(calendar.label || '予定'),
      color: normalizeColor(calendar.color),
      detailUrl: isSafeGoogleEventUrl(rawEvent.htmlLink)
    };
  }

  function dedupeAndSort(events) {
    const seen = new Set();
    return events
      .filter(Boolean)
      .sort((a, b) => eventStartValue(a) - eventStartValue(b))
      .filter(event => {
        const key = event.iCalUID
          ? event.iCalUID + '|' + event.start
          : [event.id, event.start, event.end, event.title].join('|');
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, MAX_EVENTS);
  }

  function getCache() {
    try {
      const parsed = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
      if (!parsed || !Array.isArray(parsed.events) || !Number.isFinite(parsed.savedAt)) return null;
      return parsed;
    } catch (error) {
      return null;
    }
  }

  function saveCache(events) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ savedAt: Date.now(), events }));
    } catch (error) {
      // 容量不足・プライベートブラウズ等でも予定表示は継続する。
    }
  }

  function formatTime(event) {
    if (event.timeText) return event.timeText;
    if (event.allDay) return '終日';
    const start = new Date(event.start);
    const end = new Date(event.end);
    const hm = date => String(date.getHours()).padStart(2, '0') + ':'
      + String(date.getMinutes()).padStart(2, '0');
    const sameDay = start.getFullYear() === end.getFullYear()
      && start.getMonth() === end.getMonth()
      && start.getDate() === end.getDate();
    if (sameDay) return hm(start) + '〜' + hm(end);
    return hm(start) + '〜' + (end.getMonth() + 1) + '/' + end.getDate() + ' ' + hm(end);
  }

  function eventDate(event) {
    return event.allDay ? new Date(event.start + 'T00:00:00') : new Date(event.start);
  }

  function isToday(event, now) {
    const date = eventDate(event);
    return date.getFullYear() === now.getFullYear()
      && date.getMonth() === now.getMonth()
      && date.getDate() === now.getDate();
  }

  function setTodayDate() {
    const now = new Date();
    const weeks = ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'];
    byId('today-day').textContent = String(now.getDate());
    byId('today-week').textContent = weeks[now.getDay()];
  }

  function updateTodaySummary(events) {
    const todayEvents = events.filter(event => isToday(event, new Date()));
    const text = byId('today-summary');
    const dot = byId('today-category-color');
    if (!text || !dot) return;

    if (!todayEvents.length) {
      text.textContent = '今日の登録予定はありません';
      dot.hidden = true;
      return;
    }

    const first = todayEvents[0];
    text.textContent = todayEvents.length === 1
      ? first.title
      : first.title + ' ほか' + (todayEvents.length - 1) + '件';
    dot.style.backgroundColor = normalizeColor(first.color);
    dot.hidden = false;
  }

  function createMetaRow(iconClass, text) {
    const row = createElement('p', 'agenda-meta');
    const icon = createElement('i', 'ti ' + iconClass);
    icon.setAttribute('aria-hidden', 'true');
    row.append(icon, createElement('span', '', text));
    return row;
  }

  function createEventCard(event) {
    const safeUrl = isSafeGoogleEventUrl(event.detailUrl);
    const card = createElement(safeUrl ? 'a' : 'article', 'agenda-card');
    card.setAttribute('role', 'listitem');
    card.style.setProperty('--category-color', normalizeColor(event.color));
    if (safeUrl) {
      card.href = safeUrl;
      card.target = '_blank';
      card.rel = 'noopener noreferrer';
      card.setAttribute('aria-label', event.title + 'の詳細をGoogleカレンダーで開く');
    }

    const date = eventDate(event);
    const days = ['日', '月', '火', '水', '木', '金', '土'];
    const dateBlock = createElement('div', 'agenda-date');
    dateBlock.append(
      createElement('span', 'agenda-month', (date.getMonth() + 1) + '月'),
      createElement('strong', '', date.getDate()),
      createElement('span', 'agenda-weekday weekday-' + date.getDay(), days[date.getDay()] + '曜')
    );

    const accent = createElement('span', 'agenda-accent');
    accent.setAttribute('aria-hidden', 'true');

    const body = createElement('div', 'agenda-body');
    body.append(
      createElement('span', 'agenda-category', event.category),
      createElement('h3', 'agenda-title', event.title),
      createMetaRow('ti-clock', formatTime(event))
    );
    if (event.location) body.append(createMetaRow('ti-map-pin', event.location));

    const arrow = createElement('span', 'agenda-arrow');
    const arrowIcon = createElement('i', 'ti ti-chevron-right');
    arrowIcon.setAttribute('aria-hidden', 'true');
    arrow.append(arrowIcon);
    if (!safeUrl) arrow.hidden = true;

    card.append(dateBlock, accent, body, arrow);
    return card;
  }

  function createRetryButton() {
    const button = createElement('button', 'agenda-retry', 'もう一度読み込む');
    button.type = 'button';
    button.addEventListener('click', () => loadUpcoming(true));
    return button;
  }

  function setStatus(message, kind, showRetry) {
    const status = byId('agenda-status');
    status.replaceChildren();
    status.className = 'agenda-status' + (kind ? ' is-' + kind : '');
    if (message) status.append(createElement('span', '', message));
    if (showRetry) status.append(createRetryButton());
  }

  function renderSkeletons() {
    const list = byId('agenda-list');
    list.setAttribute('aria-busy', 'true');
    list.replaceChildren();
    for (let index = 0; index < 3; index += 1) {
      const skeleton = createElement('div', 'agenda-card agenda-skeleton');
      skeleton.setAttribute('aria-hidden', 'true');
      skeleton.append(
        createElement('span', 'skeleton-date'),
        createElement('span', 'skeleton-line'),
        createElement('span', 'skeleton-body')
      );
      list.append(skeleton);
    }
    setStatus('今後45日間の予定を読み込んでいます…', 'loading', false);
  }

  function renderUpcoming(events, options) {
    const list = byId('agenda-list');
    list.replaceChildren();
    list.setAttribute('aria-busy', 'false');

    if (!events.length) {
      list.append(createElement('p', 'agenda-message', '今後45日間に登録されている予定はありません。'));
    } else {
      events.forEach(event => list.append(createEventCard(event)));
    }

    updateTodaySummary(events);
    if (options.saved) {
      setStatus('保存データ', 'saved', true);
    } else if (options.partial) {
      setStatus('一部のカレンダーを取得できませんでした。取得できた予定を表示しています。', 'warning', true);
    } else {
      setStatus('Googleカレンダーから最新情報を取得しました', 'success', true);
    }
  }

  function renderError() {
    const list = byId('agenda-list');
    list.setAttribute('aria-busy', 'false');
    list.replaceChildren(createElement('p', 'agenda-message', '予定を取得できませんでした。通信環境を確認してください。'));
    updateTodaySummary([]);
    setStatus('取得エラー', 'error', true);
  }

  function calendarEventsUrl(calendar, timeMin, timeMax) {
    const base = 'https://www.googleapis.com/calendar/v3/calendars/'
      + encodeURIComponent(calendar.id) + '/events';
    const params = new URLSearchParams({
      key: API_KEY,
      timeMin,
      timeMax,
      singleEvents: 'true',
      orderBy: 'startTime',
      showDeleted: 'false',
      maxResults: String(MAX_EVENTS)
    });
    return base + '?' + params.toString();
  }

  async function fetchCalendar(calendar, timeMin, timeMax) {
    const response = await fetch(calendarEventsUrl(calendar, timeMin, timeMax));
    if (!response.ok) throw new Error('calendar request failed');
    const data = await response.json();
    return (Array.isArray(data.items) ? data.items : [])
      .map(event => normalizeEvent(event, calendar))
      .filter(Boolean);
  }

  async function loadUpcoming(forceRefresh) {
    const cache = getCache();
    if (!forceRefresh && cache && Date.now() - cache.savedAt < CACHE_TTL_MS) {
      renderUpcoming(dedupeAndSort(cache.events), { saved: true, partial: false });
      return;
    }

    renderSkeletons();
    const now = new Date();
    const end = new Date(now);
    end.setDate(end.getDate() + RANGE_DAYS);
    const results = await Promise.allSettled(
      CALENDARS.map(calendar => fetchCalendar(calendar, now.toISOString(), end.toISOString()))
    );
    const successes = results.filter(result => result.status === 'fulfilled');

    if (successes.length) {
      const events = dedupeAndSort(successes.flatMap(result => result.value));
      if (successes.length === CALENDARS.length || !cache) saveCache(events);
      renderUpcoming(events, { saved: false, partial: successes.length !== CALENDARS.length });
      return;
    }

    if (cache) {
      renderUpcoming(dedupeAndSort(cache.events), { saved: true, partial: false });
      return;
    }
    renderError();
  }

  function calendarEmbedUrl(mode) {
    const params = new URLSearchParams({
      height: '600',
      wkst: '1',
      ctz: 'Asia/Tokyo',
      showPrint: '0',
      showTabs: '0',
      showCalendars: '0',
      showTz: '0',
      mode
    });
    CALENDARS.concat(CONFIG.EMBED_ONLY_CALENDARS || []).forEach(calendar => {
      params.append('src', calendar.id);
      params.append('color', normalizeColor(calendar.color));
    });
    return 'https://calendar.google.com/calendar/embed?' + params.toString();
  }

  function switchView(mode, button) {
    document.querySelectorAll('.view-btn').forEach(item => item.classList.remove('active'));
    button.classList.add('active');
    byId('gcal').src = calendarEmbedUrl(mode);
  }

  function init() {
    setTodayDate();
    document.querySelectorAll('[data-calendar-mode]').forEach(button => {
      button.addEventListener('click', () => switchView(button.dataset.calendarMode, button));
    });
    byId('gcal').src = calendarEmbedUrl('MONTH');
    loadUpcoming(false);
  }

  window.DokenCalendarUpcoming = Object.freeze({
    dedupeAndSort,
    isSafeGoogleEventUrl,
    normalizeEvent,
    parseDescriptionTime,
    renderUpcoming,
    loadUpcoming
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
