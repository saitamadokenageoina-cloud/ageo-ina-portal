(() => {
  'use strict';

  const FINISHED = { width: 1075, height: 650 };
  const BLEED = { width: 1146, height: 720, inset: 35 };
  const STORAGE_KEY = 'doken_meishi_draft_v1';
  const fields = ['company', 'person-name', 'role', 'trade', 'tagline', 'services', 'qualifications', 'phone', 'email', 'address', 'website', 'social', 'service-area', 'qr-url', 'illustration', 'back-focus', 'accent-color', 'member-label'];
  const form = document.getElementById('card-form');
  const preview = document.getElementById('card-preview');
  const context = preview.getContext('2d');
  let currentSide = 'front';
  let photoData = '';
  let photoImage = null;
  let layoutVariant = 0;
  let renderQueued = false;

  const palettes = {
    trust: { dark: '#10243d', mid: '#1a5fa8', light: '#eef5fb', accent: '#e8612a' },
    craft: { dark: '#202326', mid: '#4a5055', light: '#f2eee7', accent: '#e8612a' },
    premium: { dark: '#161922', mid: '#323747', light: '#f7f3e8', accent: '#b78a36' },
    friendly: { dark: '#173d35', mid: '#23805f', light: '#eff9f4', accent: '#f08a32' },
    modern: { dark: '#111827', mid: '#334155', light: '#f8fafc', accent: '#0ea5e9' },
    japanese: { dark: '#2d2926', mid: '#5d5147', light: '#f5f0e6', accent: '#a33b32' },
    housing: { dark: '#123f3a', mid: '#2d7a68', light: '#f3faf7', accent: '#e47b38' }
  };

  const tradeSuggestions = {
    carpenter: { style: 'craft', color: '#c97832', reason: '木の温かさと職人らしい力強さが伝わる構成です。', services: '新築・リフォーム・造作・木工事', lines: ['木を知り、暮らしをつくる。','確かな技で、住まいに安心を。','細部まで、誠実な仕事。','地域の住まいを、末永く支える。','大工の技で、想いをかたちに。'] },
    scaffold: { style: 'craft', color: '#e8612a', reason: '鳶・足場の機動力が伝わる、濃色とオレンジの構成です。', services: '足場工事・鳶工事・仮設工事', lines: ['安全を組み、現場を支える。','迅速・安全・確実な足場施工。','現場の一歩目を、確かな技で。','高所の仕事に、安心の土台を。','機動力で、現場を止めない。'] },
    plaster: { style: 'premium', color: '#a77a48', reason: '左官の質感と丁寧な仕事が伝わる落ち着いた構成です。', services: '左官・タイル・外構・補修工事', lines: ['塗りの技で、空間に表情を。','手仕事の美しさを、暮らしへ。','壁一面に、職人の誠実さを。','伝統の技と、現代の仕上がり。','下地から仕上げまで丁寧に。'] },
    electrical: { style: 'modern', color: '#f0b429', reason: '安全性と専門性が伝わる紺色と黄色の構成です。', services: '電気設備・配線・照明・改修工事', lines: ['安全な電気で、暮らしを明るく。','見えない配線まで、確かな仕事。','電気の困りごとに、迅速対応。','安心をつなぐ、電気のプロ。','未来の暮らしに、確かな電気を。'] },
    plumbing: { style: 'trust', color: '#1586a8', reason: '清潔感と安心感が伝わる青系の構成です。', services: '給排水・空調・設備・修繕工事', lines: ['水まわりの安心を、確かな技で。','暮らしを支える、設備のプロ。','見えない配管まで、丁寧に。','水と空気の困りごとに迅速対応。','毎日の快適を、設備から。'] },
    painting: { style: 'friendly', color: '#e85278', reason: '仕上がりの美しさが伝わる明るい差し色の構成です。', services: '外壁塗装・屋根塗装・防水・補修', lines: ['住まいを守り、彩りをつくる。','丁寧な塗装で、長持ちする家へ。','下地から誠実に、美しい仕上がり。','色と技で、建物に新しい価値を。','塗るだけでなく、守る仕事。'] },
    civil: { style: 'craft', color: '#e07a24', reason: '土木・重機の堅牢さが伝わる力強い構成です。', services: '土木・造成・外構・重機工事', lines: ['地域の足元を、確かな技で。','強い基盤を、誠実な施工で。','安全第一、確実な土木工事。','地域の未来を、地面から支える。','機動力と技術で、現場に応える。'] },
    general: { style: 'trust', color: '#e8612a', reason: '幅広いお客様に安心感を与える、誠実で見やすい構成です。', services: '建築・改修・修繕・住まいの相談', lines: ['確かな技で、地域の安心を。','相談しやすい、頼れる建設のプロ。','小さな修繕から、誠実に。','技術と信頼で、想いをかたちに。','地域に根ざし、末永いお付き合いを。'] }
  };

  function value(id) {
    const element = document.getElementById(id);
    if (!element) return '';
    return element.type === 'checkbox' ? element.checked : element.value.trim();
  }

  function selectedStyle() {
    const selected = form.querySelector('input[name="style"]:checked');
    return selected ? selected.value : 'trust';
  }

  function cardData() {
    return {
      company: value('company'), name: value('person-name') || 'お名前', role: value('role'),
      trade: value('trade'), tagline: value('tagline'), services: value('services'),
      qualifications: value('qualifications'), phone: value('phone'), email: value('email'),
      address: value('address'), website: value('website'), social: value('social'), area: value('service-area'),
      qrUrl: value('qr-url'), illustration: value('illustration') || 'auto', backFocus: value('back-focus') || 'services', member: value('member-label'),
      style: selectedStyle(), accent: value('accent-color') || '#e8612a'
    };
  }

  function colorWithAlpha(hex, alpha) {
    const clean = /^#[0-9a-f]{6}$/i.test(hex) ? hex.slice(1) : 'e8612a';
    const number = parseInt(clean, 16);
    return `rgba(${number >> 16},${(number >> 8) & 255},${number & 255},${alpha})`;
  }

  function safeHttpsUrl(raw) {
    if (!raw) return '';
    try {
      const url = new URL(raw);
      return url.protocol === 'https:' ? url.href : '';
    } catch (error) {
      return '';
    }
  }

  function qrTarget(data) {
    return safeHttpsUrl(data.qrUrl) || safeHttpsUrl(data.website) || safeHttpsUrl(data.social);
  }

  function makeQrMatrix(text) {
    if (!text || typeof window.qrcode !== 'function') return null;
    try {
      const code = window.qrcode(0, 'M');
      code.addData(text);
      code.make();
      return code;
    } catch (error) {
      return null;
    }
  }

  function drawQr(ctx, text, x, y, size) {
    const code = makeQrMatrix(text);
    if (!code) return false;
    const count = code.getModuleCount();
    const quiet = 4;
    const total = count + quiet * 2;
    const cell = size / total;
    ctx.save();
    ctx.fillStyle = '#fff';
    ctx.fillRect(x, y, size, size);
    ctx.fillStyle = '#000';
    for (let row = 0; row < count; row += 1) {
      for (let col = 0; col < count; col += 1) {
        if (code.isDark(row, col)) {
          const left = x + (col + quiet) * cell;
          const top = y + (row + quiet) * cell;
          ctx.fillRect(Math.floor(left), Math.floor(top), Math.ceil(cell), Math.ceil(cell));
        }
      }
    }
    ctx.restore();
    return true;
  }

  function roundedRect(ctx, x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + width, y, x + width, y + height, r);
    ctx.arcTo(x + width, y + height, x, y + height, r);
    ctx.arcTo(x, y + height, x, y, r);
    ctx.arcTo(x, y, x + width, y, r);
    ctx.closePath();
  }

  function fitText(ctx, text, maxWidth, initialSize, minSize, weight = 700) {
    let size = initialSize;
    do {
      ctx.font = `${weight} ${size}px "BIZ UDPGothic","Noto Sans JP",sans-serif`;
      if (ctx.measureText(text).width <= maxWidth) return size;
      size -= 2;
    } while (size >= minSize);
    return minSize;
  }

  function clippedText(ctx, text, maxWidth) {
    if (ctx.measureText(text).width <= maxWidth) return text;
    let result = text;
    while (result.length > 1 && ctx.measureText(`${result}…`).width > maxWidth) result = result.slice(0, -1);
    return `${result}…`;
  }

  function wrapLines(ctx, text, maxWidth, maxLines) {
    if (!text) return [];
    const chars = Array.from(text);
    const lines = [];
    let line = '';
    chars.forEach(char => {
      const test = line + char;
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = char;
      } else line = test;
    });
    if (line) lines.push(line);
    if (lines.length > maxLines) {
      const kept = lines.slice(0, maxLines);
      kept[maxLines - 1] = clippedText(ctx, kept[maxLines - 1] + lines.slice(maxLines).join(''), maxWidth);
      return kept;
    }
    return lines;
  }

  function drawLines(ctx, lines, x, y, lineHeight) {
    lines.forEach((line, index) => ctx.fillText(line, x, y + lineHeight * index));
  }

  function drawTradeIllustration(ctx, trade, x, y, size, color, reverse = false) {
    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = Math.max(5, size * .045);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const s = size;
    if (trade === 'carpenter') {
      ctx.beginPath(); ctx.moveTo(-s*.42, 0); ctx.lineTo(0, -s*.34); ctx.lineTo(s*.42, 0); ctx.stroke();
      ctx.strokeRect(-s*.29, 0, s*.58, s*.34);
      ctx.beginPath(); ctx.moveTo(s*.12, s*.31); ctx.lineTo(s*.38, s*.06); ctx.moveTo(s*.29, s*.02); ctx.lineTo(s*.42, s*.15); ctx.stroke();
    } else if (trade === 'scaffold') {
      for (let i = -1; i <= 1; i += 1) { ctx.beginPath(); ctx.moveTo(i*s*.25, -s*.35); ctx.lineTo(i*s*.25, s*.38); ctx.stroke(); }
      [-.28, 0, .28].forEach(row => { ctx.beginPath(); ctx.moveTo(-s*.42, row*s); ctx.lineTo(s*.42, row*s); ctx.stroke(); });
      ctx.beginPath(); ctx.moveTo(-s*.4, s*.32); ctx.lineTo(s*.4, -s*.32); ctx.stroke();
    } else if (trade === 'electrical') {
      ctx.beginPath(); ctx.moveTo(s*.06,-s*.45); ctx.lineTo(-s*.27,s*.05); ctx.lineTo(-s*.02,s*.05); ctx.lineTo(-s*.13,s*.43); ctx.lineTo(s*.3,-s*.12); ctx.lineTo(s*.05,-s*.12); ctx.closePath(); ctx.fill();
    } else if (trade === 'plumbing') {
      ctx.beginPath(); ctx.moveTo(-s*.38,-s*.15); ctx.lineTo(-s*.08,-s*.15); ctx.lineTo(-s*.08,s*.2); ctx.lineTo(s*.23,s*.2); ctx.stroke();
      ctx.strokeRect(-s*.29,-s*.25,s*.11,s*.2); ctx.strokeRect(s*.13,s*.1,s*.2,s*.2);
      ctx.beginPath(); ctx.moveTo(s*.35,-s*.36); ctx.bezierCurveTo(s*.16,-s*.12,s*.16,s*.02,s*.35,s*.09); ctx.bezierCurveTo(s*.54,s*.02,s*.54,-s*.12,s*.35,-s*.36); ctx.fill();
    } else if (trade === 'painting') {
      roundedRect(ctx,-s*.42,-s*.3,s*.54,s*.25,s*.06); ctx.fill();
      ctx.beginPath(); ctx.moveTo(s*.12,-s*.18); ctx.lineTo(s*.3,-s*.18); ctx.lineTo(s*.3,s*.06); ctx.lineTo(s*.08,s*.06); ctx.lineTo(s*.08,s*.39); ctx.stroke();
    } else if (trade === 'civil') {
      ctx.beginPath(); ctx.arc(-s*.18,s*.22,s*.17,0,Math.PI*2); ctx.arc(s*.2,s*.22,s*.17,0,Math.PI*2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-s*.35,s*.06); ctx.lineTo(s*.23,s*.06); ctx.lineTo(s*.06,-s*.18); ctx.lineTo(-s*.19,-s*.18); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(s*.03,-s*.2); ctx.lineTo(s*.26,-s*.4); ctx.lineTo(s*.42,-s*.33); ctx.moveTo(s*.26,-s*.4); ctx.lineTo(s*.42,-s*.12); ctx.stroke();
    } else if (trade === 'plaster') {
      ctx.beginPath(); ctx.moveTo(-s*.42,s*.18); ctx.lineTo(s*.26,s*.18); ctx.lineTo(s*.42,-s*.12); ctx.lineTo(-s*.25,-s*.12); ctx.closePath(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-s*.08,-s*.13); ctx.lineTo(s*.06,-s*.38); ctx.lineTo(s*.19,-s*.31); ctx.lineTo(s*.05,-s*.08); ctx.stroke();
    } else {
      ctx.beginPath(); ctx.moveTo(-s*.42,s*.15); ctx.lineTo(-s*.42,-s*.1); ctx.lineTo(0,-s*.4); ctx.lineTo(s*.42,-s*.1); ctx.lineTo(s*.42,s*.15); ctx.stroke();
      ctx.strokeRect(-s*.3,s*.15,s*.6,s*.2);
      ctx.beginPath(); ctx.moveTo(-s*.12,s*.35); ctx.lineTo(-s*.12,s*.02); ctx.lineTo(s*.12,s*.02); ctx.lineTo(s*.12,s*.35); ctx.stroke();
    }
    if (reverse) { ctx.globalAlpha = .18; ctx.beginPath(); ctx.arc(0,0,s*.53,0,Math.PI*2); ctx.fill(); }
    ctx.restore();
  }

  function drawPhoto(ctx, image, x, y, size, accent) {
    ctx.save();
    ctx.beginPath(); ctx.arc(x, y, size / 2, 0, Math.PI * 2); ctx.clip();
    const ratio = Math.max(size / image.width, size / image.height);
    const width = image.width * ratio; const height = image.height * ratio;
    ctx.drawImage(image, x - width / 2, y - height / 2, width, height);
    ctx.restore();
    ctx.save(); ctx.strokeStyle = accent; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(x, y, size / 2 - 4, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
  }

  function fillBackground(ctx, data, palette, width, height) {
    ctx.fillStyle = palette.light; ctx.fillRect(0, 0, width, height);
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, palette.dark); gradient.addColorStop(1, palette.mid);
    if (layoutVariant % 3 === 0) {
      ctx.fillStyle = gradient; ctx.beginPath(); ctx.moveTo(width*.7,0); ctx.lineTo(width,0); ctx.lineTo(width,height); ctx.lineTo(width*.58,height); ctx.closePath(); ctx.fill();
      ctx.fillStyle = data.accent; ctx.fillRect(0, 0, 18, height);
    } else if (layoutVariant % 3 === 1) {
      ctx.fillStyle = gradient; ctx.fillRect(0, 0, width, height*.24);
      ctx.fillStyle = data.accent; ctx.fillRect(0, height*.24, width, 10);
      ctx.fillStyle = colorWithAlpha(data.accent,.1); ctx.beginPath(); ctx.arc(width*.86,height*.75,width*.22,0,Math.PI*2); ctx.fill();
    } else {
      ctx.fillStyle = gradient; ctx.fillRect(0, 0, width*.3, height);
      ctx.fillStyle = data.accent; ctx.fillRect(width*.3, 0, 12, height);
      ctx.fillStyle = colorWithAlpha(data.accent,.1); ctx.beginPath(); ctx.moveTo(width*.66,0); ctx.lineTo(width,0); ctx.lineTo(width,height*.48); ctx.closePath(); ctx.fill();
    }
  }

  function paletteFor(data) {
    const base = { ...palettes[data.style] };
    base.accent = data.accent;
    return base;
  }

  function drawFront(ctx, data, width, height) {
    const palette = paletteFor(data);
    fillBackground(ctx, data, palette, width, height);
    const variant = layoutVariant % 3;
    const left = variant === 2 ? width*.36 : width*.075;
    const contentWidth = variant === 0 ? width*.54 : variant === 2 ? width*.57 : width*.82;
    const onDark = false;
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = variant === 1 ? '#fff' : palette.dark;
    ctx.font = `700 ${Math.max(25,Math.round(height*.04))}px "BIZ UDPGothic","Noto Sans JP",sans-serif`;
    if (data.company) ctx.fillText(clippedText(ctx, data.company, contentWidth), left, height*.18);
    ctx.fillStyle = palette.dark;
    const nameSize = fitText(ctx, data.name, contentWidth, height*.115, height*.07, 800);
    ctx.font = `800 ${nameSize}px "BIZ UDPGothic","Noto Sans JP",sans-serif`;
    ctx.fillText(data.name, left, height*.39);
    if (data.role) {
      ctx.fillStyle = onDark ? 'rgba(255,255,255,.82)' : palette.mid;
      ctx.font = `700 ${Math.max(25,Math.round(height*.035))}px "BIZ UDPGothic","Noto Sans JP",sans-serif`;
      ctx.fillText(clippedText(ctx, data.role, contentWidth), left, height*.47);
    }
    if (data.tagline) {
      ctx.fillStyle = onDark ? '#fff' : palette.dark;
      ctx.font = `700 ${Math.max(25,Math.round(height*.031))}px "BIZ UDPGothic","Noto Sans JP",sans-serif`;
      drawLines(ctx, wrapLines(ctx, data.tagline, contentWidth, 2), left, height*.6, height*.048);
    }
    const details = [data.phone && `TEL  ${data.phone}`, data.email, data.address].filter(Boolean);
    ctx.fillStyle = onDark ? 'rgba(255,255,255,.82)' : '#34465a';
    ctx.font = `500 ${Math.max(25,Math.round(height*.026))}px "BIZ UDPGothic","Noto Sans JP",sans-serif`;
    details.slice(0,3).forEach((detail,index) => ctx.fillText(clippedText(ctx, detail, contentWidth), left, height*(.75 + index*.052)));
    if (data.member) {
      ctx.fillStyle = data.accent; ctx.font = `700 ${Math.max(25,Math.round(height*.022))}px "BIZ UDPGothic","Noto Sans JP",sans-serif`;
      ctx.fillText('埼玉土建 上尾伊奈支部 組合員', left, height*.95);
    }
    const artX = variant === 0 ? width*.83 : variant === 1 ? width*.86 : width*.15;
    const artY = variant === 1 ? height*.69 : height*.38;
    const artSize = height*.42;
    if (photoImage) drawPhoto(ctx, photoImage, artX, artY, artSize*.82, data.accent);
    else if (data.illustration !== 'none') drawTradeIllustration(ctx, data.trade, artX, artY, artSize, variant === 0 ? '#fff' : variant === 2 ? '#fff' : data.accent, data.illustration !== 'line');
  }

  function drawBack(ctx, data, width, height) {
    const palette = paletteFor(data);
    const gradient = ctx.createLinearGradient(0,0,width,height);
    gradient.addColorStop(0,palette.dark); gradient.addColorStop(1,palette.mid);
    ctx.fillStyle = gradient; ctx.fillRect(0,0,width,height);
    ctx.fillStyle = data.accent; ctx.fillRect(0,0,width,16);
    ctx.fillStyle = colorWithAlpha(data.accent,.14); ctx.beginPath(); ctx.arc(width*.9,height*.14,width*.25,0,Math.PI*2); ctx.fill();
    if (data.illustration !== 'none') drawTradeIllustration(ctx,data.trade,width*.86,height*.2,height*.24,'rgba(255,255,255,.72)',data.illustration !== 'line');
    const target = qrTarget(data);
    const left = width*.08; const max = target ? width*.61 : width*.78;
    ctx.fillStyle = '#fff'; ctx.font = `800 ${Math.max(25,Math.round(height*.072))}px "BIZ UDPGothic","Noto Sans JP",sans-serif`;
    ctx.fillText(clippedText(ctx,data.company || data.name,max),left,height*.19);
    const blocks = [
      { key: 'services', label: '主な業務', text: data.services },
      { key: 'qualifications', label: '資格・許可', text: data.qualifications },
      { key: 'area', label: '対応エリア', text: data.area },
      { key: 'message', label: '私たちの強み', text: data.tagline }
    ].filter(block => block.text);
    blocks.sort((a,b) => (a.key === data.backFocus ? -1 : b.key === data.backFocus ? 1 : 0));
    blocks.slice(0,2).forEach((block,index) => {
      const labelY = height*(.34 + index*.25);
      ctx.fillStyle = data.accent; ctx.font = `800 ${Math.max(25,Math.round(height*.031))}px "BIZ UDPGothic","Noto Sans JP",sans-serif`; ctx.fillText(block.label,left,labelY);
      ctx.fillStyle = '#fff'; ctx.font = `600 ${Math.max(25,Math.round(height*.03))}px "BIZ UDPGothic","Noto Sans JP",sans-serif`; drawLines(ctx,wrapLines(ctx,block.text,max,2),left,labelY+height*.07,height*.048);
    });
    if (target) {
      const qrSize = Math.round(width * 20 / 91);
      const qrX = width - qrSize - width*.055;
      const qrY = height*.43;
      drawQr(ctx,target,qrX,qrY,qrSize);
      ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.font = `700 ${Math.max(25,Math.round(height*.02))}px "BIZ UDPGothic","Noto Sans JP",sans-serif`; ctx.textAlign='center'; ctx.fillText('詳しくはこちら',qrX+qrSize/2,qrY+qrSize+height*.045); ctx.textAlign='left';
    }
    const bottom = [data.phone && `TEL ${data.phone}`,data.website || data.social || data.email].filter(Boolean);
    ctx.fillStyle = 'rgba(255,255,255,.82)'; ctx.font = `500 ${Math.max(25,Math.round(height*.027))}px "BIZ UDPGothic","Noto Sans JP",sans-serif`;
    bottom.forEach((line,index)=>ctx.fillText(clippedText(ctx,line,target ? max : width*.82),left,height*(.86+index*.052)));
    if (!blocks.length && data.tagline) {
      ctx.fillStyle='#fff'; ctx.font=`700 ${Math.round(height*.045)}px "BIZ UDPGothic","Noto Sans JP",sans-serif`; drawLines(ctx,wrapLines(ctx,data.tagline,width*.75,3),left,height*.42,height*.065);
    }
  }

  function renderToCanvas(canvas, side, includeBleed) {
    const data = cardData();
    const ctx = canvas.getContext('2d');
    const target = includeBleed ? BLEED : FINISHED;
    canvas.width = target.width; canvas.height = target.height;
    ctx.clearRect(0,0,target.width,target.height);
    if (includeBleed) {
      const design=document.createElement('canvas'); design.width=FINISHED.width; design.height=FINISHED.height;
      const designContext=design.getContext('2d');
      if (side === 'front') drawFront(designContext,data,FINISHED.width,FINISHED.height); else drawBack(designContext,data,FINISHED.width,FINISHED.height);
      const i=BLEED.inset,w=FINISHED.width,h=FINISHED.height;
      ctx.drawImage(design,0,0,w,h,i,i,w,h);
      ctx.drawImage(design,0,0,w,1,i,0,w,i); ctx.drawImage(design,0,h-1,w,1,i,i+h,w,i);
      ctx.drawImage(design,0,0,1,h,0,i,i,h); ctx.drawImage(design,w-1,0,1,h,i+w,i,i,h);
      ctx.drawImage(design,0,0,1,1,0,0,i,i); ctx.drawImage(design,w-1,0,1,1,i+w,0,i,i);
      ctx.drawImage(design,0,h-1,1,1,0,i+h,i,i); ctx.drawImage(design,w-1,h-1,1,1,i+w,i+h,i,i);
    } else if (side === 'front') drawFront(ctx,data,target.width,target.height); else drawBack(ctx,data,target.width,target.height);
  }

  function renderPreview() {
    renderQueued = false;
    renderToCanvas(preview,currentSide,false);
  }

  function queueRender() {
    if (renderQueued) return;
    renderQueued = true;
    requestAnimationFrame(() => { renderPreview(); updateQuality(); });
  }

  function renderTaglineSuggestions(lines) {
    const box = document.getElementById('tagline-suggestion-box');
    const container = document.getElementById('tagline-suggestions');
    container.replaceChildren();
    lines.forEach(line => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = line;
      button.addEventListener('click', () => {
        document.getElementById('tagline').value = line;
        container.querySelectorAll('button').forEach(item => item.classList.toggle('selected', item === button));
        queueRender();
      });
      container.appendChild(button);
    });
    box.hidden = false;
  }

  function suggestDesign() {
    const trade = value('trade') || 'general';
    const suggestion = tradeSuggestions[trade] || tradeSuggestions.general;
    const radio = form.querySelector(`input[name="style"][value="${suggestion.style}"]`);
    if (radio) radio.checked = true;
    document.getElementById('accent-color').value = suggestion.color;
    if (!value('services')) document.getElementById('services').value = suggestion.services;
    if (!value('tagline')) document.getElementById('tagline').value = suggestion.lines[0];
    renderTaglineSuggestions(suggestion.lines);
    layoutVariant = (layoutVariant + 1) % 3;
    document.getElementById('suggestion-message').textContent = `提案しました：${suggestion.reason} キャッチコピーは5案から選べます。`;
    queueRender();
  }

  function resizePhoto(file) {
    if (!file || !/^image\/(png|jpeg|webp)$/.test(file.type)) return;
    if (file.size > 8 * 1024 * 1024) {
      document.getElementById('suggestion-message').textContent = '画像は8MB以下を選んでください。'; return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const size = 640; const ratio = Math.min(size/image.width,size/image.height,1);
        const canvas = document.createElement('canvas'); canvas.width=Math.round(image.width*ratio); canvas.height=Math.round(image.height*ratio);
        canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);
        photoData=canvas.toDataURL('image/jpeg',.84); photoImage=new Image(); photoImage.onload=queueRender; photoImage.src=photoData;
      };
      image.src=String(reader.result);
    };
    reader.readAsDataURL(file);
  }

  function safeFilename(side) {
    const base=(value('company') || value('person-name') || '名刺').replace(/[\\/:*?"<>|\s]+/g,'_').slice(0,30);
    return `${base}_${side === 'front' ? '表面' : '裏面'}_97x61mm.png`;
  }

  const crcTable = (() => {
    const table = new Uint32Array(256);
    for (let n = 0; n < 256; n += 1) {
      let c = n;
      for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[n] = c >>> 0;
    }
    return table;
  })();

  function crc32(bytes) {
    let crc = 0xffffffff;
    for (let index = 0; index < bytes.length; index += 1) crc = crcTable[(crc ^ bytes[index]) & 0xff] ^ (crc >>> 8);
    return (crc ^ 0xffffffff) >>> 0;
  }

  function setUint32(bytes, offset, value) {
    bytes[offset] = (value >>> 24) & 255; bytes[offset + 1] = (value >>> 16) & 255;
    bytes[offset + 2] = (value >>> 8) & 255; bytes[offset + 3] = value & 255;
  }

  async function addPngDpi(blob, dpi) {
    const source = new Uint8Array(await blob.arrayBuffer());
    const ihdrLength = ((source[8] << 24) | (source[9] << 16) | (source[10] << 8) | source[11]) >>> 0;
    const insertAt = 8 + 12 + ihdrLength;
    const chunk = new Uint8Array(21);
    setUint32(chunk, 0, 9);
    chunk.set([112,72,89,115], 4);
    const pixelsPerMeter = Math.round(dpi / .0254);
    setUint32(chunk, 8, pixelsPerMeter); setUint32(chunk, 12, pixelsPerMeter); chunk[16] = 1;
    setUint32(chunk, 17, crc32(chunk.subarray(4,17)));
    return new Blob([source.subarray(0,insertAt),chunk,source.subarray(insertAt)],{type:'image/png'});
  }

  function triggerDownload(blob, filename) {
    const url=URL.createObjectURL(blob); const link=document.createElement('a');
    link.href=url; link.download=filename; document.body.appendChild(link); link.click(); link.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  }

  function download(side) {
    const canvas=document.createElement('canvas'); renderToCanvas(canvas,side,true);
    canvas.toBlob(async blob => {
      if (!blob) return;
      try { triggerDownload(await addPngDpi(blob,300),safeFilename(side)); }
      catch (error) { triggerDownload(blob,safeFilename(side)); }
    },'image/png');
  }

  function downloadIconPng() {
    const canvas=document.createElement('canvas'); canvas.width=1200; canvas.height=1200;
    const ctx=canvas.getContext('2d');
    if(photoImage) drawPhoto(ctx,photoImage,600,600,820,value('accent-color'));
    else drawTradeIllustration(ctx,value('trade')||'general',600,600,820,value('accent-color')||'#e8612a',false);
    canvas.toBlob(blob=>{if(blob)triggerDownload(blob,`${value('company')||'建設業'}_イラスト透過.png`);},'image/png');
  }

  function iconSvgMarkup(trade,color) {
    const common=`fill="none" stroke="${color}" stroke-width="34" stroke-linecap="round" stroke-linejoin="round"`;
    const shapes={
      carpenter:`<path ${common} d="M120 430L500 130l380 300M240 430v330h520V430M570 710V500h150v210M560 260l210-110m-55-35l90 100"/>`,
      scaffold:`<path ${common} d="M180 130v650M500 130v650M820 130v650M120 260h760M120 500h760M120 740h760M180 740L820 130"/>`,
      electrical:`<path fill="${color}" d="M560 70L245 535h235l-75 395 350-520H520z"/>`,
      plumbing:`<path ${common} d="M130 300h280v310h280M250 210v180M640 520v180M770 160c-130 150-130 250 0 280 130-30 130-130 0-280z"/>`,
      painting:`<path ${common} d="M140 160h480v230H140zM620 275h170v190H520v370M450 835h140"/>`,
      civil:`<path ${common} d="M150 690h700M230 690a120 120 0 10240 0 120 120 0 10-240 0zm360 0a120 120 0 10240 0 120 120 0 10-240 0zM190 500h500L550 280H300zM530 275l210-170 150 90-170 300"/>`,
      plaster:`<path ${common} d="M120 620h620l150-270H270zM460 350l120-220 130 70-120 210"/>`,
      general:`<path ${common} d="M120 430L500 130l380 300M220 430v350h560V430M400 780V520h200v260M90 820h820"/>`
    };
    return `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000">${shapes[trade]||shapes.general}</svg>`;
  }

  function downloadIconSvg() {
    const svg=iconSvgMarkup(value('trade')||'general',value('accent-color')||'#e8612a');
    triggerDownload(new Blob([svg],{type:'image/svg+xml;charset=utf-8'}),`${value('company')||'建設業'}_イラスト.svg`);
  }

  function dataUrlBytes(dataUrl) {
    const binary = atob(dataUrl.split(',')[1]);
    const bytes = new Uint8Array(binary.length);
    for (let index=0; index<binary.length; index+=1) bytes[index]=binary.charCodeAt(index);
    return bytes;
  }

  function ascii(text) { return new TextEncoder().encode(text); }

  function makePdf(frontBytes,backBytes) {
    const chunks=[]; const offsets=[]; let length=0;
    const append = data => { const bytes=typeof data==='string'?ascii(data):data; chunks.push(bytes); length+=bytes.length; };
    const object = (number,parts) => {
      offsets[number]=length; append(`${number} 0 obj\n`); parts.forEach(append); append('\nendobj\n');
    };
    const pageWidth=(97/25.4*72).toFixed(3); const pageHeight=(61/25.4*72).toFixed(3);
    const content1=ascii(`q\n${pageWidth} 0 0 ${pageHeight} 0 0 cm\n/Im1 Do\nQ\n`);
    const content2=ascii(`q\n${pageWidth} 0 0 ${pageHeight} 0 0 cm\n/Im2 Do\nQ\n`);
    append('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');
    object(1,['<< /Type /Catalog /Pages 2 0 R >>']);
    object(2,['<< /Type /Pages /Count 2 /Kids [3 0 R 6 0 R] >>']);
    object(3,[`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /XObject << /Im1 4 0 R >> >> /Contents 5 0 R >>`]);
    object(4,[`<< /Type /XObject /Subtype /Image /Width ${BLEED.width} /Height ${BLEED.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${frontBytes.length} >>\nstream\n`,frontBytes,'\nendstream']);
    object(5,[`<< /Length ${content1.length} >>\nstream\n`,content1,'endstream']);
    object(6,[`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /XObject << /Im2 7 0 R >> >> /Contents 8 0 R >>`]);
    object(7,[`<< /Type /XObject /Subtype /Image /Width ${BLEED.width} /Height ${BLEED.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${backBytes.length} >>\nstream\n`,backBytes,'\nendstream']);
    object(8,[`<< /Length ${content2.length} >>\nstream\n`,content2,'endstream']);
    const xref=length; append('xref\n0 9\n0000000000 65535 f \n');
    for(let number=1;number<=8;number+=1) append(`${String(offsets[number]).padStart(10,'0')} 00000 n \n`);
    append(`trailer\n<< /Size 9 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`);
    return new Blob(chunks,{type:'application/pdf'});
  }

  function downloadPdf() {
    const front=document.createElement('canvas'); const back=document.createElement('canvas');
    renderToCanvas(front,'front',true); renderToCanvas(back,'back',true);
    const pdf=makePdf(dataUrlBytes(front.toDataURL('image/jpeg',.96)),dataUrlBytes(back.toDataURL('image/jpeg',.96)));
    const base=(value('company') || value('person-name') || '名刺').replace(/[\\/:*?"<>|\s]+/g,'_').slice(0,30);
    triggerDownload(pdf,`${base}_表裏_97x61mm_RGB.pdf`);
    document.getElementById('save-message').textContent='表裏2ページの入稿用PDFを保存しました。ラクスルのデータチェックで仕上がりと色を確認してください。';
  }

  function updateQuality() {
    const data=cardData(); let score=28; const items=[];
    const add=(ok,points,good,bad)=>{ if(ok){score+=points;items.push({ok:true,text:good});}else items.push({ok:false,text:bad}); };
    add(Boolean(data.name && data.name!=='お名前'),12,'氏名が入力されています','氏名を入力してください');
    add(Boolean(data.company),8,'会社・屋号が入力されています','会社・屋号を入れると信頼感が上がります');
    add(Boolean(data.phone || data.email),12,'問い合わせ先があります','電話番号またはメールを入力してください');
    add(Boolean(data.tagline),10,'強みが一言で伝わります','キャッチコピー候補から1つ選んでください');
    add(Boolean(data.services),10,'施工内容が分かります','主な業務・施工内容を入力してください');
    add(Boolean(data.qualifications || data.area),5,'資格または対応エリアがあります','資格または対応エリアを入れると安心感が増します');
    const rawQr=data.qrUrl || data.website || data.social;
    add(Boolean(qrTarget(data)),15,'QRコードは約20mm・余白付きです',rawQr?'QRコードのURLはhttps://から入力してください':'QRコードのリンク先を入れると営業力が上がります');
    score=Math.min(100,score);
    const list=document.getElementById('quality-list'); list.replaceChildren();
    items.forEach(item=>{const li=document.createElement('li');li.className=item.ok?'ok':'warn';li.textContent=`${item.ok?'✓':'△'} ${item.text}`;list.appendChild(li);});
    document.getElementById('quality-score').textContent=String(score);
    document.getElementById('quality-meter').style.width=`${score}%`;
    document.getElementById('quality-label').textContent=score>=95?'入稿前の基本条件を満たしています':score>=75?'あと少しで完成です':'不足項目を確認してください';
  }

  function buildAiPrompt() {
    const data=cardData();
    return `あなたは世界最高峰のブランドデザイナー兼、建設業専門マーケティングコンサルタントです。次の情報から、初対面で信頼を獲得し受注につながる横型名刺を提案してください。\n\n【印刷条件】仕上がり91×55mm、塗り足し込み97×61mm、300dpi、角丸なし、重要情報は仕上がり線から3mm以上内側、色は3色以内、最小文字6pt、QRコードは約20mmで十分な余白を確保。表面・裏面を提案。\n【会社名】${data.company || '未入力'}\n【氏名】${data.name || '未入力'}\n【肩書】${data.role || '未入力'}\n【業種】${document.getElementById('trade').selectedOptions[0].textContent}\n【キャッチコピー】${data.tagline || 'AIで5案提案'}\n【施工内容】${data.services || 'AIで整理'}\n【資格】${data.qualifications || '未入力'}\n【対応エリア】${data.area || '未入力'}\n【希望スタイル】${data.style}\n【希望色】${data.accent}\n【イラスト】${data.illustration}\n\n表裏の構成、ブランドカラー、キャッチコピー5案、背景・アイコン・イラスト案、営業効果、印刷時の注意を日本語で提示してください。個人情報は回答内で必要以上に繰り返さないでください。`;
  }

  async function copyAiPrompt() {
    const prompt=buildAiPrompt();
    try { await navigator.clipboard.writeText(prompt); document.getElementById('suggestion-message').textContent='AI相談用プロンプトをコピーしました。必要なAI画面へ貼り付けてください。'; }
    catch(error){ const area=document.createElement('textarea');area.value=prompt;document.body.appendChild(area);area.select();document.execCommand('copy');area.remove();document.getElementById('suggestion-message').textContent='AI相談用プロンプトをコピーしました。'; }
  }

  function preparePrint() {
    const front=document.createElement('canvas'); const back=document.createElement('canvas');
    renderToCanvas(front,'front',true); renderToCanvas(back,'back',true);
    document.getElementById('print-front').src=front.toDataURL('image/png'); document.getElementById('print-back').src=back.toDataURL('image/png');
    setTimeout(()=>window.print(),80);
  }

  function saveDraft() {
    const values={};
    fields.forEach(id => { values[id]=value(id); });
    values.style=selectedStyle(); values.layoutVariant=layoutVariant; values.photo=photoData && photoData.length < 900000 ? photoData : '';
    try {
      localStorage.setItem(STORAGE_KEY,JSON.stringify(values));
      document.getElementById('save-message').textContent=photoData && !values.photo ? '文字情報をこの端末に保存しました。画像は容量が大きいため保存していません。' : '下書きをこの端末に保存しました。';
    } catch (error) {
      document.getElementById('save-message').textContent='端末の保存容量が不足しています。PNGで保存してください。';
    }
  }

  function restoreDraft() {
    let draft;
    try { draft=JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); } catch (error) { return; }
    if (!draft || typeof draft !== 'object') return;
    fields.forEach(id => {
      const element=document.getElementById(id); if (!element || draft[id] === undefined) return;
      if (element.type === 'checkbox') element.checked=Boolean(draft[id]); else element.value=String(draft[id]);
    });
    if (draft.style) { const radio=form.querySelector(`input[name="style"][value="${draft.style}"]`); if (radio) radio.checked=true; }
    layoutVariant=Number.isInteger(draft.layoutVariant) ? draft.layoutVariant%3 : 0;
    if (typeof draft.photo === 'string' && draft.photo.startsWith('data:image/')) { photoData=draft.photo; photoImage=new Image(); photoImage.onload=queueRender; photoImage.src=photoData; }
    document.getElementById('save-message').textContent='この端末に保存した下書きを復元しました。';
  }

  form.addEventListener('input',queueRender);
  form.addEventListener('change',queueRender);
  document.getElementById('photo').addEventListener('change',event=>resizePhoto(event.target.files[0]));
  document.getElementById('suggest-button').addEventListener('click',suggestDesign);
  document.getElementById('download-front').addEventListener('click',()=>download('front'));
  document.getElementById('download-back').addEventListener('click',()=>download('back'));
  document.getElementById('download-icon').addEventListener('click',downloadIconPng);
  document.getElementById('download-svg').addEventListener('click',downloadIconSvg);
  document.getElementById('pdf-button').addEventListener('click',downloadPdf);
  document.getElementById('print-button').addEventListener('click',preparePrint);
  document.getElementById('save-draft').addEventListener('click',saveDraft);
  document.getElementById('copy-ai-prompt').addEventListener('click',copyAiPrompt);
  document.querySelectorAll('.side-tab').forEach(button => button.addEventListener('click',()=>{
    currentSide=button.dataset.side;
    document.querySelectorAll('.side-tab').forEach(tab=>{ const active=tab===button; tab.classList.toggle('active',active); tab.setAttribute('aria-selected',String(active)); });
    queueRender();
  }));

  restoreDraft();
  renderPreview();
  updateQuality();
})();
