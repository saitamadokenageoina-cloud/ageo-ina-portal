(() => {
  'use strict';

  const FINISHED = { width: 1075, height: 650 };
  const BLEED = { width: 1146, height: 720, inset: 35 };
  const STORAGE_KEY = 'doken_meishi_draft_v1';
  const fields = ['company', 'person-name', 'role', 'trade', 'tagline', 'services', 'qualifications', 'phone', 'email', 'address', 'website', 'accent-color', 'member-label'];
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
    friendly: { dark: '#173d35', mid: '#23805f', light: '#eff9f4', accent: '#f08a32' }
  };

  const tradeSuggestions = {
    carpenter: { style: 'craft', color: '#c97832', reason: '木の温かさと職人らしい力強さが伝わる構成です。' },
    scaffold: { style: 'craft', color: '#e8612a', reason: '鳶・足場の機動力が伝わる、濃色とオレンジの構成です。' },
    plaster: { style: 'premium', color: '#a77a48', reason: '左官の質感と丁寧な仕事が伝わる落ち着いた構成です。' },
    electrical: { style: 'trust', color: '#f0b429', reason: '安全性と専門性が伝わる紺色と黄色の構成です。' },
    plumbing: { style: 'trust', color: '#1586a8', reason: '清潔感と安心感が伝わる青系の構成です。' },
    painting: { style: 'friendly', color: '#e85278', reason: '仕上がりの美しさが伝わる明るい差し色の構成です。' },
    civil: { style: 'craft', color: '#e07a24', reason: '土木・重機の堅牢さが伝わる力強い構成です。' },
    general: { style: 'trust', color: '#e8612a', reason: '幅広いお客様に安心感を与える、誠実で見やすい構成です。' }
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
      address: value('address'), website: value('website'), member: value('member-label'),
      style: selectedStyle(), accent: value('accent-color') || '#e8612a'
    };
  }

  function colorWithAlpha(hex, alpha) {
    const clean = /^#[0-9a-f]{6}$/i.test(hex) ? hex.slice(1) : 'e8612a';
    const number = parseInt(clean, 16);
    return `rgba(${number >> 16},${(number >> 8) & 255},${number & 255},${alpha})`;
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
    ctx.font = `700 ${Math.round(height*.04)}px "BIZ UDPGothic","Noto Sans JP",sans-serif`;
    if (data.company) ctx.fillText(clippedText(ctx, data.company, contentWidth), left, height*.18);
    ctx.fillStyle = palette.dark;
    const nameSize = fitText(ctx, data.name, contentWidth, height*.115, height*.07, 800);
    ctx.font = `800 ${nameSize}px "BIZ UDPGothic","Noto Sans JP",sans-serif`;
    ctx.fillText(data.name, left, height*.39);
    if (data.role) {
      ctx.fillStyle = onDark ? 'rgba(255,255,255,.82)' : palette.mid;
      ctx.font = `700 ${Math.round(height*.035)}px "BIZ UDPGothic","Noto Sans JP",sans-serif`;
      ctx.fillText(clippedText(ctx, data.role, contentWidth), left, height*.47);
    }
    if (data.tagline) {
      ctx.fillStyle = onDark ? '#fff' : palette.dark;
      ctx.font = `700 ${Math.round(height*.031)}px "BIZ UDPGothic","Noto Sans JP",sans-serif`;
      drawLines(ctx, wrapLines(ctx, data.tagline, contentWidth, 2), left, height*.6, height*.048);
    }
    const details = [data.phone && `TEL  ${data.phone}`, data.email, data.address].filter(Boolean);
    ctx.fillStyle = onDark ? 'rgba(255,255,255,.82)' : '#34465a';
    ctx.font = `500 ${Math.round(height*.026)}px "BIZ UDPGothic","Noto Sans JP",sans-serif`;
    details.slice(0,3).forEach((detail,index) => ctx.fillText(clippedText(ctx, detail, contentWidth), left, height*(.75 + index*.052)));
    if (data.member) {
      ctx.fillStyle = data.accent; ctx.font = `700 ${Math.round(height*.022)}px "BIZ UDPGothic","Noto Sans JP",sans-serif`;
      ctx.fillText('埼玉土建 上尾伊奈支部 組合員', left, height*.95);
    }
    const artX = variant === 0 ? width*.83 : variant === 1 ? width*.86 : width*.15;
    const artY = variant === 1 ? height*.69 : height*.38;
    const artSize = height*.42;
    if (photoImage) drawPhoto(ctx, photoImage, artX, artY, artSize*.82, data.accent);
    else drawTradeIllustration(ctx, data.trade, artX, artY, artSize, variant === 0 ? '#fff' : variant === 2 ? '#fff' : data.accent, true);
  }

  function drawBack(ctx, data, width, height) {
    const palette = paletteFor(data);
    const gradient = ctx.createLinearGradient(0,0,width,height);
    gradient.addColorStop(0,palette.dark); gradient.addColorStop(1,palette.mid);
    ctx.fillStyle = gradient; ctx.fillRect(0,0,width,height);
    ctx.fillStyle = data.accent; ctx.fillRect(0,0,width,16);
    ctx.fillStyle = colorWithAlpha(data.accent,.14); ctx.beginPath(); ctx.arc(width*.9,height*.14,width*.25,0,Math.PI*2); ctx.fill();
    drawTradeIllustration(ctx,data.trade,width*.86,height*.22,height*.28,'rgba(255,255,255,.72)',true);
    const left = width*.08; const max = width*.69;
    ctx.fillStyle = '#fff'; ctx.font = `800 ${Math.round(height*.072)}px "BIZ UDPGothic","Noto Sans JP",sans-serif`;
    ctx.fillText(clippedText(ctx,data.company || data.name,max),left,height*.19);
    if (data.services) {
      ctx.fillStyle = data.accent; ctx.font = `800 ${Math.round(height*.031)}px "BIZ UDPGothic","Noto Sans JP",sans-serif`; ctx.fillText('主な業務',left,height*.34);
      ctx.fillStyle = '#fff'; ctx.font = `600 ${Math.round(height*.032)}px "BIZ UDPGothic","Noto Sans JP",sans-serif`; drawLines(ctx,wrapLines(ctx,data.services,max,2),left,height*.41,height*.05);
    }
    if (data.qualifications) {
      ctx.fillStyle = data.accent; ctx.font = `800 ${Math.round(height*.031)}px "BIZ UDPGothic","Noto Sans JP",sans-serif`; ctx.fillText('資格・許可',left,height*.58);
      ctx.fillStyle = '#fff'; ctx.font = `600 ${Math.round(height*.029)}px "BIZ UDPGothic","Noto Sans JP",sans-serif`; drawLines(ctx,wrapLines(ctx,data.qualifications,max,2),left,height*.65,height*.047);
    }
    const bottom = [data.phone && `TEL ${data.phone}`,data.website || data.email].filter(Boolean);
    ctx.fillStyle = 'rgba(255,255,255,.82)'; ctx.font = `500 ${Math.round(height*.027)}px "BIZ UDPGothic","Noto Sans JP",sans-serif`;
    bottom.forEach((line,index)=>ctx.fillText(clippedText(ctx,line,width*.82),left,height*(.84+index*.055)));
    if (!data.services && !data.qualifications && data.tagline) {
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
      ctx.save(); ctx.translate(BLEED.inset,BLEED.inset);
      if (side === 'front') drawFront(ctx,data,FINISHED.width,FINISHED.height); else drawBack(ctx,data,FINISHED.width,FINISHED.height);
      ctx.restore();
      const edge = ctx.getImageData(BLEED.inset,BLEED.inset,1,1).data;
      ctx.globalCompositeOperation='destination-over'; ctx.fillStyle=`rgb(${edge[0]},${edge[1]},${edge[2]})`; ctx.fillRect(0,0,target.width,target.height); ctx.globalCompositeOperation='source-over';
    } else if (side === 'front') drawFront(ctx,data,target.width,target.height); else drawBack(ctx,data,target.width,target.height);
  }

  function renderPreview() {
    renderQueued = false;
    renderToCanvas(preview,currentSide,false);
  }

  function queueRender() {
    if (renderQueued) return;
    renderQueued = true;
    requestAnimationFrame(renderPreview);
  }

  function suggestDesign() {
    const trade = value('trade') || 'general';
    const suggestion = tradeSuggestions[trade] || tradeSuggestions.general;
    const radio = form.querySelector(`input[name="style"][value="${suggestion.style}"]`);
    if (radio) radio.checked = true;
    document.getElementById('accent-color').value = suggestion.color;
    layoutVariant = (layoutVariant + 1) % 3;
    document.getElementById('suggestion-message').textContent = `提案しました：${suggestion.reason} 「もう一度」で別レイアウトも試せます。`;
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

  function download(side) {
    const canvas=document.createElement('canvas'); renderToCanvas(canvas,side,true);
    canvas.toBlob(blob => {
      if (!blob) return;
      const url=URL.createObjectURL(blob); const link=document.createElement('a'); link.href=url; link.download=safeFilename(side); document.body.appendChild(link); link.click(); link.remove(); setTimeout(()=>URL.revokeObjectURL(url),1000);
    },'image/png');
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
  document.getElementById('print-button').addEventListener('click',preparePrint);
  document.getElementById('save-draft').addEventListener('click',saveDraft);
  document.querySelectorAll('.side-tab').forEach(button => button.addEventListener('click',()=>{
    currentSide=button.dataset.side;
    document.querySelectorAll('.side-tab').forEach(tab=>{ const active=tab===button; tab.classList.toggle('active',active); tab.setAttribute('aria-selected',String(active)); });
    queueRender();
  }));

  restoreDraft();
  renderPreview();
})();
