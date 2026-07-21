(() => {
  'use strict';

  const CARD_SIZES = {
    horizontal:{finished:{width:1075,height:650},bleed:{width:1146,height:720,inset:35},finishedMm:{width:91,height:55},bleedMm:{width:97,height:61}},
    vertical:{finished:{width:650,height:1075},bleed:{width:720,height:1146,inset:35},finishedMm:{width:55,height:91},bleedMm:{width:61,height:97}}
  };
  const STORAGE_KEY = 'doken_meishi_draft_v1';
  const fields = ['company', 'person-name', 'role', 'trade', 'custom-trade', 'tagline', 'services', 'strengths', 'qualifications', 'permit-number', 'experience', 'achievements', 'ccus', 'insurance', 'invoice-number', 'business-hours', 'phone', 'email', 'address', 'website', 'social', 'service-area', 'qr-url', 'back-focus', 'style-preset', 'vertical-layout', 'accent-color', 'member-label'];
  const form = document.getElementById('card-form');
  const preview = document.getElementById('card-preview');
  const context = preview.getContext('2d');
  const STYLE_ALIASES=Object.freeze({corporate_panel:'split_duo',orange_slope:'diagonal_luxe',layered_wave:'wave_blue',round_window:'grand_arc',curve_split:'split_duo',orbit:'grand_arc',slim_vertical:'ink_black',black_gold:'hotel',luxury_home:'hotel',premium:'hotel',apple:'minimal',monochrome:'minimal',nordic:'muji',blueprint:'architect',technical:'architect',navy:'general_contractor',industrial:'stone_mono',concrete:'stone_mono',wood:'craft',local:'eco',friendly:'eco',housing:'eco',stylish:'future',modern:'future',japanese:'wa_pattern'});
  function normalizeStyle(style){return STYLE_ALIASES[style]||style||'trust';}
  const styleSelectElement=document.getElementById('style-preset');
  [...styleSelectElement.options].forEach(option=>{if(STYLE_ALIASES[option.value])option.remove();});
  const arcGroup=document.createElement('optgroup');arcGroup.label='円弧デザイン';const arcOption=document.createElement('option');arcOption.value='grand_arc';arcOption.textContent='大円弧・プレミアム';arcGroup.appendChild(arcOption);styleSelectElement.appendChild(arcGroup);
  const sceneGroup=document.createElement('optgroup');sceneGroup.label='日本・街並みデザイン';
  [['ichimatsu','市松モザイク・祭典風'],['fireworks','花火・和風'],['townscape','住宅・街並み']].forEach(item=>{const option=document.createElement('option');option.value=item[0];option.textContent=item[1];sceneGroup.appendChild(option);});
  styleSelectElement.appendChild(sceneGroup);
  const consolidatedLabels={trust:'AIおすすめ・信頼重視',diagonal_luxe:'斜め分割・モダン',wave_blue:'流線ウェーブ',grand_arc:'大円弧・プレミアム',split_duo:'企業ツートーン',ink_black:'黒紙・白文字',wa_pattern:'和柄・職人',stone_mono:'石材・コンクリート',hotel:'高級・ブラックゴールド',minimal:'白地・ミニマル',muji:'自然素材・ナチュラル',architect:'設計図・技術',general_contractor:'ゼネコン・企業',craft:'職人・木目',eco:'地域密着・環境',safety:'安全第一',future:'未来・スタイリッシュ',photo:'施工写真主役'};
  [...styleSelectElement.options].forEach(option=>{if(consolidatedLabels[option.value])option.textContent=consolidatedLabels[option.value];});
  styleSelectElement.querySelectorAll('optgroup').forEach(group=>{if(!group.querySelector('option'))group.remove();});
  document.querySelector('.style-select > span').textContent=`デザインコンセプト（${document.getElementById('style-preset').options.length}種類）`;
  let currentSide = 'front';
  let photoData = '';
  let photoImage = null;
  let layoutVariant = 0;
  let renderQueued = false;
  let autoSaveTimer = 0;

  const palettes = {
    trust: { dark: '#10243d', mid: '#1a5fa8', light: '#eef5fb', accent: '#e8612a' },
    craft: { dark: '#202326', mid: '#4a5055', light: '#f2eee7', accent: '#e8612a' },
    premium: { dark: '#161922', mid: '#323747', light: '#f7f3e8', accent: '#b78a36' },
    friendly: { dark: '#173d35', mid: '#23805f', light: '#eff9f4', accent: '#f08a32' },
    modern: { dark: '#111827', mid: '#334155', light: '#f8fafc', accent: '#0ea5e9' },
    japanese: { dark: '#2d2926', mid: '#5d5147', light: '#f5f0e6', accent: '#a33b32' },
    housing: { dark: '#123f3a', mid: '#2d7a68', light: '#f3faf7', accent: '#e47b38' },
    hotel: { dark: '#172235', mid: '#46566d', light: '#f8f5ed', accent: '#b8892d' },
    apple: { dark: '#111827', mid: '#4b5563', light: '#ffffff', accent: '#0a84ff' },
    muji: { dark: '#3f3933', mid: '#776c61', light: '#f5f1e8', accent: '#8b3d32' },
    architect: { dark: '#15222d', mid: '#425668', light: '#f5f7f8', accent: '#de5b35' },
    general_contractor: { dark: '#082f49', mid: '#075985', light: '#eef8fc', accent: '#f59e0b' },
    black_gold: { dark: '#090b0f', mid: '#252a32', light: '#f7f4ec', accent: '#c69a42' },
    navy: { dark: '#071b38', mid: '#123f70', light: '#f0f5fa', accent: '#e8612a' },
    monochrome: { dark: '#151515', mid: '#555555', light: '#f7f7f7', accent: '#222222' },
    stylish: { dark: '#17202a', mid: '#34495e', light: '#f8fafc', accent: '#00a7a5' },
    wood: { dark: '#3a281d', mid: '#76543b', light: '#f7f0e5', accent: '#c47b35' },
    concrete: { dark: '#343a40', mid: '#6c757d', light: '#eceff1', accent: '#e76f3c' },
    blueprint: { dark: '#073b66', mid: '#0d6aa7', light: '#edf7ff', accent: '#f5b642' },
    minimal: { dark: '#252525', mid: '#666666', light: '#ffffff', accent: '#d95d39' },
    industrial: { dark: '#1e252b', mid: '#4f5b62', light: '#eef0ed', accent: '#f0832d' },
    nordic: { dark: '#29434e', mid: '#607d7f', light: '#f5f2ea', accent: '#d97956' },
    future: { dark: '#08152e', mid: '#163d78', light: '#eef5ff', accent: '#00b8d9' },
    luxury_home: { dark: '#22211f', mid: '#5b5148', light: '#fbf8f2', accent: '#b58a52' },
    eco: { dark: '#173c2b', mid: '#35795a', light: '#f0f8f2', accent: '#e59a2f' },
    safety: { dark: '#172c43', mid: '#345d7d', light: '#f1f6fa', accent: '#f2a900' },
    local: { dark: '#173d35', mid: '#39755f', light: '#f5faf7', accent: '#ee7d35' },
    photo: { dark: '#111827', mid: '#374151', light: '#f8fafc', accent: '#e8612a' },
    technical: { dark: '#0b2748', mid: '#245681', light: '#eff6fb', accent: '#00a3a3' },
    diagonal_luxe: { dark: '#0b2464', mid: '#194ea0', light: '#ffffff', accent: '#e8612a' },
    wave_blue: { dark: '#073b66', mid: '#1686c5', light: '#f8fcff', accent: '#27a7df' },
    ink_black: { dark: '#090b0e', mid: '#262b31', light: '#f5f5f3', accent: '#c8a45b' },
    wa_pattern: { dark: '#102d2a', mid: '#315d42', light: '#f7f2e8', accent: '#b7912e' },
    stone_mono: { dark: '#25292c', mid: '#62686d', light: '#ececea', accent: '#d86537' },
    split_duo: { dark: '#10243d', mid: '#285d84', light: '#ffffff', accent: '#e8612a' },
    orbit: { dark: '#152c43', mid: '#26769c', light: '#f8fbfc', accent: '#16a0a5' },
    slim_vertical: { dark: '#0c0e11', mid: '#30353b', light: '#f7f7f5', accent: '#d7b56d' },
    grand_arc: { dark: '#072d72', mid: '#1562b1', light: '#ffffff', accent: '#e8612a' },
    corporate_panel: { dark: '#15263c', mid: '#315b80', light: '#ffffff', accent: '#d9962c' },
    orange_slope: { dark: '#172231', mid: '#34465b', light: '#ffffff', accent: '#f47b20' },
    layered_wave: { dark: '#10243d', mid: '#245b83', light: '#ffffff', accent: '#f08a24' },
    round_window: { dark: '#133d46', mid: '#277987', light: '#ffffff', accent: '#d8a73a' },
    curve_split: { dark: '#101a2f', mid: '#243a5d', light: '#ffffff', accent: '#f47b20' },
    ichimatsu: { dark: '#132a67', mid: '#2454a6', light: '#ffffff', accent: '#27a7df' },
    fireworks: { dark: '#075a70', mid: '#087c8f', light: '#f4fbfb', accent: '#f1c75b' },
    townscape: { dark: '#35251f', mid: '#765449', light: '#fffaf5', accent: '#d66a36' }
  };

  const tradeSuggestions = {
    carpenter: { style: 'craft', color: '#c97832', reason: '木の温かさと職人らしい力強さが伝わる構成です。', services: '新築・リフォーム・造作・木工事', lines: ['木を知り、暮らしをつくる。','確かな技で、住まいに安心を。','細部まで、誠実な仕事。','地域の住まいを、末永く支える。','大工の技で、想いをかたちに。'] },
    scaffold: { style: 'craft', color: '#e8612a', reason: '鳶・足場の機動力が伝わる、濃色とオレンジの構成です。', services: '足場工事・鳶工事・仮設工事', lines: ['安全を組み、現場を支える。','迅速・安全・確実な足場施工。','現場の一歩目を、確かな技で。','高所の仕事に、安心の土台を。','機動力で、現場を止めない。'] },
    plaster: { style: 'premium', color: '#a77a48', reason: '左官の質感と丁寧な仕事が伝わる落ち着いた構成です。', services: '左官・塗り壁・モルタル・補修工事', lines: ['塗りの技で、空間に表情を。','手仕事の美しさを、暮らしへ。','壁一面に、職人の誠実さを。','伝統の技と、現代の仕上がり。','下地から仕上げまで丁寧に。'] },
    electrical: { style: 'modern', color: '#f0b429', reason: '安全性と専門性が伝わる紺色と黄色の構成です。', services: '電気設備・配線・照明・改修工事', lines: ['安全な電気で、暮らしを明るく。','見えない配線まで、確かな仕事。','電気の困りごとに、迅速対応。','安心をつなぐ、電気のプロ。','未来の暮らしに、確かな電気を。'] },
    plumbing: { style: 'trust', color: '#1586a8', reason: '清潔感と安心感が伝わる青系の構成です。', services: '給排水・空調・設備・修繕工事', lines: ['水まわりの安心を、確かな技で。','暮らしを支える、設備のプロ。','見えない配管まで、丁寧に。','水と空気の困りごとに迅速対応。','毎日の快適を、設備から。'] },
    painting: { style: 'friendly', color: '#e85278', reason: '仕上がりの美しさが伝わる明るい差し色の構成です。', services: '外壁塗装・屋根塗装・吹付・補修', lines: ['住まいを守り、彩りをつくる。','丁寧な塗装で、長持ちする家へ。','下地から誠実に、美しい仕上がり。','色と技で、建物に新しい価値を。','塗るだけでなく、守る仕事。'] },
    civil: { style: 'craft', color: '#e07a24', reason: '土木の堅牢さが伝わる力強い構成です。', services: '土木・造成・外構・基礎工事', lines: ['地域の足元を、確かな技で。','強い基盤を、誠実な施工で。','安全第一、確実な土木工事。','地域の未来を、地面から支える。','機動力と技術で、現場に応える。'] },
    interior: { style: 'stylish', color: '#2f7d73', reason: '空間づくりのセンスと清潔感が伝わる構成です。', services: '内装・クロス・床・原状回復工事', lines: ['空間を整え、心地よさをつくる。','きれい・丁寧・確かな内装。','暮らしに合う空間をご提案。','仕上がりで選ばれる内装工事。','小さな張替えから誠実に。'] },
    demolition: { style: 'industrial', color: '#e8612a', reason: '安全管理と機動力が伝わる重厚な構成です。', services: '建物解体・内装解体・撤去・処分', lines: ['壊すだけでなく、次をつくる。','安全・迅速・近隣へ丁寧に。','解体から整地まで一貫対応。','現場をきれいに、確実に。','安心できる解体工事を。'] },
    rebar: { style: 'technical', color: '#16858c', reason: '構造を支える精度と技術力が伝わる構成です。', services: '鉄筋・型枠・躯体工事', lines: ['建物の強さを、確かな技で。','見えない構造に、誇れる仕事。','精度と安全で、現場を支える。','躯体の品質を、足元から。','確かな施工で、未来を組む。'] },
    roofing: { style: 'safety', color: '#d77a25', reason: '住まいを守る安心感と専門性が伝わる構成です。', services: '瓦・スレート・屋根葺き・雨漏り修繕', lines: ['屋根から、住まいを守る。','雨漏りの不安に迅速対応。','見えない傷みも丁寧に確認。','安心が長持ちする屋根工事。','地域の屋根を、確かな技で。'] },
    design: { style: 'architect', color: '#de5b35', reason: '設計力と管理能力を端正に見せる構成です。', services: '設計・施工管理・確認申請・改修提案', lines: ['図面から現場まで、確かな品質を。','考える力で、建築を整える。','設計と施工を、ひとつにつなぐ。','使いやすさを、かたちに。','現場を読み、最適解を描く。'] },
    general: { style: 'trust', color: '#e8612a', reason: '幅広いお客様に安心感を与える、誠実で見やすい構成です。', services: '建築・改修・修繕・住まいの相談', lines: ['確かな技で、地域の安心を。','相談しやすい、頼れる建設のプロ。','小さな修繕から、誠実に。','技術と信頼で、想いをかたちに。','地域に根ざし、末永いお付き合いを。'] }
  };

  function professionSuggestion(style,color,services,line,reason='専門性と信頼が伝わる構成です。'){
    return{style,color,services,reason,lines:[line,'専門の技で、現場に応える。','安全・丁寧・確実な施工。','見えない部分まで、誠実に。','地域と現場を、技術で支える。']};
  }

  Object.assign(tradeSuggestions,{
    survey:professionSuggestion('architect','#2872a8','測量・墨出し・現況調査・施工支援','正確な測量で、現場の基準をつくる。'),
    steel:professionSuggestion('industrial','#3b6f8f','鉄骨・鋼構造物・鍛冶・溶接工事','鉄で組み、建物の強さを支える。'),
    masonry:professionSuggestion('craft','#a66a43','石・タイル・れんが・ブロック工事','積み上げる技で、美しさと強さを。'),
    paving:professionSuggestion('industrial','#e2762d','舗装・路盤・駐車場・道路工事','確かな舗装で、安全な道をつくる。'),
    dredging:professionSuggestion('technical','#1686a0','しゅんせつ・河川・港湾・水路工事','水辺の基盤を、確かな技術で守る。'),
    sheetmetal:professionSuggestion('technical','#708090','建築板金・雨樋・金属屋根・外装工事','一枚の金属を、建物を守る技へ。'),
    glass:professionSuggestion('modern','#2997c8','ガラス・サッシ・窓・鏡工事','光と安心を、確かな窓まわりから。'),
    waterproof:professionSuggestion('trust','#1976a3','防水・シーリング・漏水補修工事','水を止め、建物を長く守る。'),
    machinery:professionSuggestion('industrial','#59636e','機械器具設置・据付・搬入・メンテナンス','精密な据付で、設備を確実に動かす。'),
    insulation:professionSuggestion('safety','#d98228','保温・保冷・断熱・熱絶縁工事','熱を制御し、建物の効率を高める。'),
    telecom:professionSuggestion('future','#1674bd','電気通信・LAN・弱電・防犯設備','通信をつなぎ、現場と暮らしを支える。'),
    landscaping:professionSuggestion('eco','#3f8a50','造園・植栽・剪定・庭・緑地管理','緑の技で、心地よい景色をつくる。'),
    well:professionSuggestion('technical','#167f9b','さく井・井戸・地中熱・揚水設備','地下の水を、安全に暮らしへ届ける。'),
    fittings:professionSuggestion('wood','#9b693f','建具・家具・木製扉・造作工事','開く、閉じる、その先まで美しく。'),
    waterworks:professionSuggestion('trust','#1689ad','水道施設・配水管・給水設備工事','安心できる水を、確かな設備で。'),
    fire:professionSuggestion('safety','#d64535','消防設備・警報・消火設備・点検','万一に備える設備を、確実に。'),
    cleaning:professionSuggestion('friendly','#2c9b83','建築美装・清掃施設・竣工クリーニング','仕上げの清潔さで、建物の価値を高める。'),
    sign:professionSuggestion('stylish','#e05275','看板・サイン・シート・広告施工','伝えたい想いを、街で目立つ形に。'),
    heavy_operator:professionSuggestion('industrial','#e2762d','重機運転・掘削・積込・整地作業','重機の技で、現場を正確に動かす。'),
    driver:professionSuggestion('safety','#3974a8','建設車両・資材運搬・ダンプ・運送','安全運行で、現場の流れを支える。'),
    custom:professionSuggestion('trust','#e8612a','建設関連工事・専門サービス','専門の仕事を、分かりやすく誠実に伝える。')
  });

  function value(id) {
    const element = document.getElementById(id);
    if (!element) return '';
    return element.type === 'checkbox' ? element.checked : element.value.trim();
  }

  function selectedStyle() {
    return normalizeStyle(value('style-preset'));
  }

  function selectedRadio(name,fallback){const selected=form.querySelector(`input[name="${name}"]:checked`);return selected?selected.value:fallback;}
  function selectedOrientation(){return selectedRadio('orientation','horizontal');}
  function selectedIllustration(){return selectedRadio('illustration-choice','auto');}
  function selectedBack(){return selectedRadio('back-choice','yes')==='yes';}
  function currentSizes(){return CARD_SIZES[selectedOrientation()]||CARD_SIZES.horizontal;}

  function tradeLabel() {
    const select=document.getElementById('trade');
    if(select.value==='custom')return value('custom-trade')||'その他の建設関連職種';
    return select.selectedOptions[0] ? select.selectedOptions[0].textContent : '建設業';
  }

  function cardData() {
    return {
      company: value('company'), name: value('person-name') || 'お名前', role: value('role'),
      trade: value('trade'), tradeName:tradeLabel(), tagline: value('tagline'), services: value('services'),
      qualifications: value('qualifications'), phone: value('phone'), email: value('email'),
      address: value('address'), website: value('website'), social: value('social'), area: value('service-area'),
      qrUrl: value('qr-url'), illustration:selectedIllustration(), backFocus: value('back-focus') || 'services', orientation:selectedOrientation(), verticalLayout:value('vertical-layout')||'center',
      strengths:value('strengths'), permit:value('permit-number'), experience:value('experience'), achievements:value('achievements'), ccus:value('ccus'), insurance:value('insurance'), invoice:value('invoice-number'), hours:value('business-hours'), member: value('member-label'), useBack:selectedBack(),
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

  const tradeIconPaths = {
    general:{stroke:['M180 610V390L500 155l320 235v220','M255 610v180h490V610','M405 790V565h190v225','M300 350c35-125 365-125 400 0','M275 350h450'],fill:[]},
    carpenter:{stroke:['M145 560L500 260l355 300','M255 550v240h490V550','M610 730L805 535','M750 475l105 105','M690 520l120-120'],fill:['M640 710l55 55-72 72-55-55z']},
    scaffold:{stroke:['M215 180v640M500 180v640M785 180v640','M145 300h710M145 500h710M145 700h710','M215 700L785 300','M500 500l285 200'],fill:['M365 175c18-105 252-105 270 0v42H365z']},
    plaster:{stroke:['M125 650h565l185-325H310z','M395 330l120-205 120 70-118 205','M215 750h570'],fill:['M270 575h420l-45 75H225z']},
    electrical:{stroke:['M235 205v140M385 205v140','M205 345h210v100c0 105-65 165-155 165','M260 610v175h155'],fill:['M610 115L385 510h180l-70 375 270-455H580z']},
    plumbing:{stroke:['M125 305h255v315h275','M230 215v180M545 515v190','M125 255h210M600 570h150'],fill:['M770 165c-150 180-150 310 0 350 150-40 150-170 0-350z']},
    painting:{stroke:['M180 625h520v-85h135v235','M835 775v95','M705 275h85v265','M195 725c135 70 270-70 405 0'],fill:['M125 220h580v220H125c-30 0-55-25-55-55V275c0-30 25-55 55-55z']},
    civil:{stroke:['M125 760h750','M250 650a125 125 0 1 0 250 0a125 125 0 1 0-250 0','M560 650a125 125 0 1 0 250 0a125 125 0 1 0-250 0','M585 335l205-180 125 80-165 315'],fill:['M165 540h520L570 325H300z']},
    interior:{stroke:['M170 180v640h660V180','M500 180v640','M610 315h145v270H610z','M240 315h165v310H240z','M680 315v270','M235 710h180'],fill:['M590 285h185v55H590z']},
    demolition:{stroke:['M175 790h650','M245 690h430','M300 690V390h300v300','M300 480h300M300 570h300','M500 390l65-155 95 40','M660 275l165 155','M825 430l-80 110'],fill:['M445 335l55-125 55 125z']},
    rebar:{stroke:['M190 210v580M395 210v580M600 210v580M805 210v580','M145 315h710M145 520h710M145 725h710','M190 725l615-410M190 315l615 410'],fill:['M150 175h80v70h-80zM765 755h80v70h-80z']},
    roofing:{stroke:['M105 530L500 190l395 340','M210 520v275h580V520','M320 430l180-155 180 155','M690 620c0 105-75 155-150 195-75-40-150-90-150-195v-70h300z'],fill:['M540 595l35 70 75 10-55 52 15 75-70-36-70 36 15-75-55-52 75-10z']},
    design:{stroke:['M185 160h480v680H185z','M285 290h275M285 410h275M285 530h195','M665 300l155-155 70 70-155 155','M625 410l110-40-70-70z','M655 610a125 125 0 1 0 0 250'],fill:['M790 125l120 120-48 48-120-120z']},
    survey:{stroke:['M175 790h650','M500 180v610','M310 420h380','M370 420l130-240 130 240','M250 690l250-270 250 270'],fill:['M455 135h90v90h-90z']},
    steel:{stroke:['M170 790h660','M250 790V225M750 790V225','M250 315h500M250 520h500M250 700h500','M250 700l500-385M250 315l500 385'],fill:['M210 180h580v90H210z']},
    masonry:{stroke:['M145 745h710','M185 295h630v390H185z','M185 425h630M185 555h630','M340 295v130M650 295v130M500 425v130M340 555v130M650 555v130'],fill:['M205 315h115v90H205z']},
    paving:{stroke:['M120 725h760','M210 630h580','M295 535h410','M375 440h250','M500 255v110','M410 315h180'],fill:['M455 185h90v110h-90z']},
    dredging:{stroke:['M115 725c125-90 250 90 375 0s250 90 375 0','M250 610h430l100-165H390z','M470 445l135-220 125 70','M730 295l135 115'],fill:['M315 535h365l-45 75H270z']},
    sheetmetal:{stroke:['M155 665L500 265l345 400','M245 650h510v160H245','M320 570l180-210 180 210','M690 235l105 105','M740 185l105 105'],fill:['M205 665h590v55H205z']},
    glass:{stroke:['M185 175h630v650H185z','M500 175v650M185 500h630','M250 255l165-30M585 745l165-30'],fill:['M225 540h235v245H225z']},
    waterproof:{stroke:['M165 710h670','M250 650V360h500v290','M335 470h330','M500 180c-135 160-135 285 0 325 135-40 135-165 0-325'],fill:['M420 585h160v125H420z']},
    machinery:{stroke:['M165 700h670','M250 620h500v-300H250z','M335 405h330v130H335z','M335 620v105M665 620v105','M500 205v115','M430 205h140'],fill:['M390 440h220v60H390z']},
    insulation:{stroke:['M165 735h670','M230 650V270h540v380','M315 345c70 55 140-55 210 0s140-55 210 0','M315 475c70 55 140-55 210 0s140-55 210 0','M315 605c70 55 140-55 210 0s140-55 210 0'],fill:[]},
    telecom:{stroke:['M205 760h590','M500 760V500','M370 500h260','M280 400c115-120 325-120 440 0','M175 285c175-205 475-205 650 0'],fill:['M445 435h110v110H445z']},
    landscaping:{stroke:['M500 790V455','M500 610l-165-135M500 560l165-135','M500 500c-205 0-275-155-230-300 155 0 260 85 230 300','M500 430c205 0 275-145 230-285-155 0-260 80-230 285','M230 790h540'],fill:[]},
    well:{stroke:['M200 730h600','M280 680V350h440v330','M230 350h540','M350 350v-95h300v95','M500 445v245','M430 515h140'],fill:['M500 105c-85 105-85 180 0 205 85-25 85-100 0-205z']},
    fittings:{stroke:['M220 170h560v660H220z','M310 255h380v575H310z','M610 535h18','M310 390h380','M385 300h230'],fill:['M580 500h85v70h-85z']},
    waterworks:{stroke:['M140 660h720','M215 660V430h570v230','M360 430V270h280v160','M500 145v125','M410 145h180','M690 505v155'],fill:['M295 505c-75 95-75 165 0 185 75-20 75-90 0-185z']},
    fire:{stroke:['M500 160c-85 125-240 210-240 410 0 150 105 250 240 250s240-100 240-250c0-115-65-220-155-300 5 115-45 180-95 210 20-125-20-220-90-285','M500 500c-70 80-100 145-100 205 0 65 45 110 100 110s100-45 100-110c0-60-30-125-100-205'],fill:[]},
    cleaning:{stroke:['M260 780l95-430h290l95 430','M315 560h370','M410 350v-145h180v145','M200 750h600'],fill:['M690 180l28 58 62 9-45 44 11 62-56-29-56 29 11-62-45-44 62-9z']},
    sign:{stroke:['M175 250h650v400H175z','M285 650v170M715 650v170','M245 820h510','M285 360h430M285 470h290M285 580h360'],fill:['M175 250h650v70H175z']},
    heavy_operator:{stroke:['M125 760h750','M200 650a115 115 0 1 0 230 0a115 115 0 1 0-230 0','M550 650a115 115 0 1 0 230 0a115 115 0 1 0-230 0','M535 345l200-185 130 75-155 305'],fill:['M155 545h515L555 330H285z']},
    driver:{stroke:['M145 710h710','M220 650a105 105 0 1 0 210 0a105 105 0 1 0-210 0','M600 650a105 105 0 1 0 210 0a105 105 0 1 0-210 0','M165 560V300h470v260','M635 395h120l105 165H635'],fill:['M205 340h390v170H205z']},
    custom:{stroke:['M170 610V390L500 155l320 235v220','M255 610v180h490V610','M405 790V565h190v225','M300 350c35-125 365-125 400 0','M275 350h450'],fill:[]}
  };

  function drawTradeIllustration(ctx, trade, x, y, size, color, reverse = false) {
    const spec=tradeIconPaths[trade]||tradeIconPaths.general;
    ctx.save();ctx.translate(x-size/2,y-size/2);ctx.scale(size/1000,size/1000);ctx.lineCap='round';ctx.lineJoin='round';
    ctx.fillStyle=color;ctx.strokeStyle=color;
    ctx.globalAlpha=reverse?.16:.08;ctx.beginPath();ctx.arc(500,500,455,0,Math.PI*2);ctx.fill();
    ctx.globalAlpha=reverse?.38:.22;ctx.lineWidth=16;ctx.beginPath();ctx.arc(500,500,430,0,Math.PI*2);ctx.stroke();
    ctx.globalAlpha=1;ctx.lineWidth=46;
    spec.fill.forEach(path=>ctx.fill(new Path2D(path)));
    spec.stroke.forEach(path=>ctx.stroke(new Path2D(path)));
    ctx.globalAlpha=.7;ctx.fillStyle=color;ctx.beginPath();ctx.arc(805,185,23,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(860,245,12,0,Math.PI*2);ctx.fill();
    ctx.restore();
  }

  function drawTradeBadge(ctx,text,x,y,maxWidth,accent){
    ctx.save();ctx.textAlign='left';ctx.textBaseline='middle';ctx.font='800 25px "BIZ UDPGothic","Noto Sans JP",sans-serif';
    const label=clippedText(ctx,text||'建設業',maxWidth-34);const width=Math.min(maxWidth,ctx.measureText(label).width+34);
    ctx.fillStyle=accent;roundedRect(ctx,x,y,width,44,12);ctx.fill();ctx.fillStyle='#fff';ctx.fillText(label,x+17,y+23);ctx.restore();
  }

  function drawTextOnlyFront(ctx,data,width,height){
    const vertical=data.orientation==='vertical';const palette=paletteFor(data);const target=qrTarget(data);
    ctx.fillStyle='#fff';ctx.fillRect(0,0,width,height);ctx.fillStyle=data.accent;ctx.fillRect(0,0,width,vertical?14:12);
    ctx.strokeStyle='rgba(16,36,61,.14)';ctx.lineWidth=2;ctx.strokeRect(vertical?34:28,vertical?34:28,width-(vertical?68:56),height-(vertical?68:56));ctx.textBaseline='alphabetic';ctx.textAlign='left';
    if(vertical){
      const x=60,max=530;ctx.fillStyle=palette.mid;ctx.font='700 28px "BIZ UDPGothic","Noto Sans JP",sans-serif';if(data.company)ctx.fillText(clippedText(ctx,data.company,max),x,105);
      ctx.fillStyle=palette.dark;ctx.font=`800 ${fitText(ctx,data.name,max,72,44,800)}px "BIZ UDPGothic","Noto Sans JP",sans-serif`;ctx.fillText(data.name,x,225);
      if(data.role){ctx.fillStyle=palette.mid;ctx.font='700 27px "BIZ UDPGothic","Noto Sans JP",sans-serif';ctx.fillText(clippedText(ctx,data.role,max),x,282);}
      drawTradeBadge(ctx,data.tradeName,x,315,max,data.accent);ctx.fillStyle=data.accent;ctx.fillRect(x,385,max,5);
      drawVerticalContactLines(ctx,data,x,465,target?330:max,64,'#20344a');
      if(target){const q=165,qx=420,qy=770;drawQr(ctx,target,qx,qy,q);ctx.fillStyle=palette.dark;ctx.font='700 23px "BIZ UDPGothic","Noto Sans JP",sans-serif';ctx.textAlign='center';ctx.fillText('WEB・LINE',qx+q/2,qy+q+36);ctx.textAlign='left';}
      if(data.member){ctx.fillStyle=data.accent;ctx.font='700 23px "BIZ UDPGothic","Noto Sans JP",sans-serif';ctx.fillText('埼玉土建 上尾伊奈支部 組合員',x,1015);}
      return;
    }
    const x=75,max=target?650:925;ctx.fillStyle=palette.mid;ctx.font='700 27px "BIZ UDPGothic","Noto Sans JP",sans-serif';if(data.company)ctx.fillText(clippedText(ctx,data.company,max),x,95);
    ctx.fillStyle=palette.dark;ctx.font=`800 ${fitText(ctx,data.name,max,78,46,800)}px "BIZ UDPGothic","Noto Sans JP",sans-serif`;ctx.fillText(data.name,x,210);
    if(data.role){ctx.fillStyle=palette.mid;ctx.font='700 26px "BIZ UDPGothic","Noto Sans JP",sans-serif';ctx.fillText(clippedText(ctx,data.role,max),x,268);}
    drawTradeBadge(ctx,data.tradeName,x,300,max,data.accent);ctx.fillStyle=data.accent;ctx.fillRect(x,365,max,5);
    const details=[data.phone&&`TEL  ${data.phone}`,data.email&&`MAIL  ${data.email}`,data.address,[data.website&&`WEB  ${data.website}`,data.social&&`SNS  ${data.social}`].filter(Boolean).join('  ')].filter(Boolean);
    ctx.fillStyle='#20344a';ctx.font='600 25px "BIZ UDPGothic","Noto Sans JP",sans-serif';details.slice(0,4).forEach((detail,index)=>ctx.fillText(clippedText(ctx,detail,max),x,425+index*52));
    if(target){const q=190,qx=820,qy=350;drawQr(ctx,target,qx,qy,q);ctx.fillStyle=palette.dark;ctx.font='700 23px "BIZ UDPGothic","Noto Sans JP",sans-serif';ctx.textAlign='center';ctx.fillText('WEB・LINE',qx+q/2,qy+q+36);ctx.textAlign='left';}
    if(data.member){ctx.fillStyle=data.accent;ctx.font='700 23px "BIZ UDPGothic","Noto Sans JP",sans-serif';ctx.fillText('埼玉土建 上尾伊奈支部 組合員',x,620);}
  }

  function drawTextOnlyBack(ctx,data,width,height){
    if(!data.useBack){ctx.fillStyle='#fff';ctx.fillRect(0,0,width,height);return;}
    const vertical=data.orientation==='vertical';const palette=paletteFor(data);const suggestion=tradeSuggestions[data.trade]||tradeSuggestions.general;const tagline=data.tagline||suggestion.lines[0];const left=vertical?60:75;const max=width-left*2;
    ctx.fillStyle='#fff';ctx.fillRect(0,0,width,height);ctx.fillStyle=data.accent;ctx.fillRect(0,0,width,vertical?14:12);ctx.fillStyle=palette.dark;ctx.font=`800 ${vertical?44:45}px "BIZ UDPGothic","Noto Sans JP",sans-serif`;ctx.fillText(clippedText(ctx,data.company||data.name,max),left,vertical?105:95);
    ctx.fillStyle=data.accent;ctx.font=`800 ${vertical?28:27}px "BIZ UDPGothic","Noto Sans JP",sans-serif`;ctx.fillText(clippedText(ctx,tagline,max),left,vertical?165:155);
    const blocks=[{label:'主な業務',text:data.services||suggestion.services},{label:'選ばれる理由',text:data.strengths||tagline},{label:'資格・許可',text:[data.qualifications,data.permit].filter(Boolean).join('／')||'資格・許可などの信頼情報'},{label:'対応エリア',text:data.area||'対応エリアをご入力ください'}];
    const start=vertical?275:250;const gap=vertical?160:112;blocks.slice(0,vertical?4:3).forEach((block,index)=>{const y=start+index*gap;ctx.fillStyle=data.accent;ctx.font='800 26px "BIZ UDPGothic","Noto Sans JP",sans-serif';ctx.fillText(block.label,left,y);ctx.fillStyle='#24384d';ctx.font='600 25px "BIZ UDPGothic","Noto Sans JP",sans-serif';ctx.fillText(clippedText(ctx,block.text,max),left,y+45);});
    const bottom=[data.hours,data.invoice].filter(Boolean).join('　｜　');if(bottom){ctx.fillStyle=palette.mid;ctx.font='600 23px "BIZ UDPGothic","Noto Sans JP",sans-serif';ctx.fillText(clippedText(ctx,bottom,max),left,vertical?1015:610);}
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
    drawStyleTexture(ctx,data,width,height);
  }

  function drawIchimatsuMosaic(ctx,width,height,color,alpha=.9) {
    ctx.save();
    const blocks=[[.7,.02,48],[.78,.08,58],[.88,.02,44],[.94,.13,56],[.73,.22,42],[.83,.27,64],[.94,.32,46],[.76,.42,55],[.89,.48,50],[.97,.58,62],[.79,.65,46],[.9,.72,60],[.73,.82,52],[.85,.9,44],[.96,.86,58]];
    blocks.forEach((block,index)=>{ctx.fillStyle=colorWithAlpha(index%3===0?'#ffffff':color,index%3===0?.22:alpha-(index%4)*.12);ctx.save();ctx.translate(width*block[0],height*block[1]);ctx.rotate((index%2?1:-1)*.09);ctx.fillRect(0,0,block[2],block[2]);ctx.restore();});
    ctx.restore();
  }

  function drawFireworkBurst(ctx,x,y,radius,color,alpha=.72) {
    ctx.save();ctx.strokeStyle=colorWithAlpha(color,alpha);ctx.fillStyle=colorWithAlpha(color,alpha);ctx.lineWidth=Math.max(2,radius*.025);ctx.lineCap='round';
    for(let i=0;i<24;i+=1){const angle=Math.PI*2*i/24;const inner=radius*(.2+(i%3)*.035);const outer=radius*(.68+(i%4)*.06);ctx.beginPath();ctx.moveTo(x+Math.cos(angle)*inner,y+Math.sin(angle)*inner);ctx.lineTo(x+Math.cos(angle)*outer,y+Math.sin(angle)*outer);ctx.stroke();ctx.beginPath();ctx.arc(x+Math.cos(angle)*radius*.92,y+Math.sin(angle)*radius*.92,Math.max(2,radius*.035),0,Math.PI*2);ctx.fill();}
    ctx.restore();
  }

  function drawTownscape(ctx,width,height,color,alpha=.16) {
    ctx.save();ctx.fillStyle=colorWithAlpha(color,alpha);const base=height*.98;let x=width*.6;
    const buildings=[{w:.075,h:.29,roof:'flat'},{w:.09,h:.2,roof:'gable'},{w:.07,h:.36,roof:'flat'},{w:.105,h:.25,roof:'gable'},{w:.065,h:.32,roof:'flat'}];
    buildings.forEach((building,index)=>{const w=width*building.w;const h=height*building.h;if(building.roof==='gable'){ctx.beginPath();ctx.moveTo(x,base);ctx.lineTo(x,base-h*.72);ctx.lineTo(x+w*.5,base-h);ctx.lineTo(x+w,base-h*.72);ctx.lineTo(x+w,base);ctx.closePath();ctx.fill();}else{ctx.fillRect(x,base-h,w,h);ctx.fillRect(x+w*.38,base-h-height*.06,w*.24,height*.06);}ctx.fillStyle=colorWithAlpha('#ffffff',.22);for(let row=0;row<3;row+=1){for(let col=0;col<2;col+=1){ctx.fillRect(x+w*(.18+col*.42),base-h+height*(.055+row*.07),w*.18,height*.035);}}ctx.fillStyle=colorWithAlpha(color,alpha);x+=w+width*.012;});
    ctx.fillRect(width*.57,base-height*.018,width*.43,height*.018);ctx.restore();
  }

  function drawStyleTexture(ctx,data,width,height) {
    ctx.save();
    ctx.lineWidth=1.5;
    if (data.style==='blueprint' || data.style==='architect') {
      ctx.strokeStyle=data.style==='blueprint'?'rgba(26,110,170,.12)':'rgba(40,60,75,.08)';
      const step=Math.max(28,Math.round(width/26));
      for(let x=0;x<width;x+=step){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,height);ctx.stroke();}
      for(let y=0;y<height;y+=step){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(width,y);ctx.stroke();}
      ctx.fillStyle=colorWithAlpha(data.accent,.08);
      [[.7,.05],[.83,.12],[.74,.34],[.9,.43],[.79,.65],[.93,.76]].forEach((point,index)=>{
        const size=42+(index%3)*20;const x=width*point[0];const y=height*point[1];
        ctx.beginPath();ctx.moveTo(x,y-size);ctx.lineTo(x+size*.86,y-size*.5);ctx.lineTo(x+size*.86,y+size*.5);ctx.lineTo(x,y+size);ctx.lineTo(x-size*.86,y+size*.5);ctx.lineTo(x-size*.86,y-size*.5);ctx.closePath();ctx.fill();
      });
    } else if (data.style==='wood' || data.style==='craft') {
      ctx.strokeStyle='rgba(83,48,22,.18)';ctx.lineWidth=2;
      for(let y=18;y<height;y+=30){ctx.beginPath();ctx.moveTo(0,y);ctx.bezierCurveTo(width*.1,y-8,width*.22,y+11,width*.31,y-2);ctx.stroke();}
      ctx.strokeStyle='rgba(255,255,255,.12)';
      for(let y=34;y<height;y+=62){ctx.beginPath();ctx.moveTo(0,y);ctx.bezierCurveTo(width*.12,y+10,width*.21,y-7,width*.31,y+4);ctx.stroke();}
    } else if (data.style==='concrete' || data.style==='industrial') {
      ctx.fillStyle='rgba(30,38,44,.075)';
      for(let i=0;i<54;i+=1){const x=(i*83)%width;const y=(i*47)%height;ctx.fillRect(x,y,2+(i%3),2+(i%2));}
    } else if (data.style==='future' || data.style==='technical') {
      const facets=[
        [.61,.02,.78,.02,.69,.29],[.78,.02,.98,.02,.9,.22],[.69,.29,.9,.22,.81,.5],
        [.9,.22,1,.12,1,.44],[.81,.5,1,.44,.94,.72],[.94,.72,1,.62,1,.98]
      ];
      facets.forEach((points,index)=>{ctx.fillStyle=colorWithAlpha(index%2?data.accent:'#ffffff',index%2?.13:.055);ctx.beginPath();ctx.moveTo(width*points[0],height*points[1]);ctx.lineTo(width*points[2],height*points[3]);ctx.lineTo(width*points[4],height*points[5]);ctx.closePath();ctx.fill();});
      ctx.strokeStyle=colorWithAlpha(data.accent,.25);ctx.lineWidth=2;
      for(let i=0;i<5;i+=1){const y=height*(.18+i*.14);ctx.beginPath();ctx.moveTo(width*.63,y);ctx.lineTo(width*(.77+i*.03),y);ctx.lineTo(width*(.82+i*.02),y-height*.07);ctx.lineTo(width*.98,y-height*.07);ctx.stroke();}
    } else if (data.style==='black_gold' || data.style==='hotel' || data.style==='luxury_home') {
      ctx.strokeStyle=colorWithAlpha(data.accent,.26);ctx.lineWidth=3;ctx.strokeRect(width*.035,height*.055,width*.93,height*.89);
    } else if (data.style==='ichimatsu') {
      drawIchimatsuMosaic(ctx,width,height,data.accent,.35);
    } else if (data.style==='fireworks') {
      drawFireworkBurst(ctx,width*.82,height*.17,height*.13,'#ffffff',.35);drawFireworkBurst(ctx,width*.94,height*.38,height*.09,data.accent,.5);
    } else if (data.style==='townscape') {
      drawTownscape(ctx,width,height,data.accent,.16);
    } else if (data.style==='japanese') {
      ctx.strokeStyle='rgba(90,55,42,.10)';
      for(let i=-height;i<width;i+=46){ctx.beginPath();ctx.moveTo(i,0);ctx.lineTo(i+height,height);ctx.stroke();}
    }
    ctx.restore();
  }

  function paletteFor(data) {
    const base = { ...palettes[data.style] };
    base.accent = data.accent;
    return base;
  }

  function designFamily(style){
    if(['apple','muji','monochrome','minimal','nordic','wave_blue','stone_mono','orbit','grand_arc','corporate_panel','orange_slope','layered_wave','round_window','ichimatsu','townscape'].includes(style))return'minimal';
    if(['hotel','black_gold','navy','industrial','future','luxury_home','ink_black','wa_pattern','slim_vertical','fireworks'].includes(style))return'dark';
    if(['craft','wood','concrete','safety','local','eco','split_duo','curve_split'].includes(style))return'band';
    if(['blueprint','architect','technical','general_contractor'].includes(style))return'blueprint';
    if(style==='photo')return'photo';
    return'card';
  }

  function drawVerticalContactLines(ctx,data,x,startY,maxWidth,lineHeight,color){
    const details=[
      data.phone&&`TEL  ${data.phone}`,
      data.email&&`MAIL  ${data.email}`,
      data.address,
      data.website&&`WEB  ${data.website}`,
      data.social&&`SNS  ${data.social}`
    ].filter(Boolean);
    ctx.fillStyle=color;ctx.font='600 25px "BIZ UDPGothic","Noto Sans JP",sans-serif';
    details.slice(0,5).forEach((detail,index)=>ctx.fillText(clippedText(ctx,detail,maxWidth),x,startY+index*lineHeight));
  }

  function drawFrontVertical(ctx,data,width,height){
    const palette=paletteFor(data);const mode=data.verticalLayout||'center';const target=qrTarget(data);
    ctx.textBaseline='alphabetic';
    if(data.style==='ink_black'){
      ctx.fillStyle='#090b0e';ctx.fillRect(0,0,width,height);ctx.fillStyle='#24282d';ctx.fillRect(width*.72,0,width*.28,height);ctx.fillStyle=data.accent;ctx.fillRect(width*.72,0,5,height);
      ctx.fillStyle='rgba(255,255,255,.07)';for(let y=0;y<height;y+=32){ctx.fillRect(width*.75,y,width*.25,1);}
      const x=58,max=530;ctx.fillStyle='rgba(255,255,255,.76)';ctx.font='700 27px "BIZ UDPGothic","Noto Sans JP",sans-serif';if(data.company)ctx.fillText(clippedText(ctx,data.company,max),x,105);
      if(photoImage)drawPhoto(ctx,photoImage,width/2,255,180,data.accent);else if(data.illustration!=='none')drawTradeIllustration(ctx,data.trade,width/2,255,175,'#fff',true);
      ctx.fillStyle='#fff';ctx.font=`800 ${fitText(ctx,data.name,max,70,43,800)}px "BIZ UDPGothic","Noto Sans JP",sans-serif`;ctx.fillText(data.name,x,445);
      if(data.role){ctx.fillStyle='rgba(255,255,255,.72)';ctx.font='700 26px "BIZ UDPGothic","Noto Sans JP",sans-serif';ctx.fillText(clippedText(ctx,data.role,max),x,500);}
      drawTradeBadge(ctx,data.tradeName,x,530,max,data.accent);ctx.fillStyle=data.accent;ctx.fillRect(x,590,max,5);
      drawVerticalContactLines(ctx,data,x,665,target?330:max,58,'rgba(255,255,255,.9)');
      if(target){const q=165,qx=425,qy=745;drawQr(ctx,target,qx,qy,q);ctx.fillStyle='#fff';ctx.font='700 23px "BIZ UDPGothic","Noto Sans JP",sans-serif';ctx.textAlign='center';ctx.fillText('WEB・LINE',qx+q/2,qy+q+36);ctx.textAlign='left';}
      if(data.member){ctx.fillStyle=data.accent;ctx.font='700 23px "BIZ UDPGothic","Noto Sans JP",sans-serif';ctx.fillText('埼玉土建 上尾伊奈支部 組合員',x,1020);}
      return;
    }
    if(mode==='stripe'){
      ctx.fillStyle='#f7fafc';ctx.fillRect(0,0,width,height);ctx.fillStyle=palette.dark;ctx.fillRect(0,0,155,height);ctx.fillStyle=data.accent;ctx.fillRect(155,0,10,height);drawStyleTexture(ctx,data,width,height);
      if(photoImage)drawPhoto(ctx,photoImage,78,190,112,data.accent);else if(data.illustration!=='none')drawTradeIllustration(ctx,data.trade,78,190,112,'#fff',true);
      const x=200,max=400;
      ctx.fillStyle=palette.mid;ctx.font='700 28px "BIZ UDPGothic","Noto Sans JP",sans-serif';if(data.company)ctx.fillText(clippedText(ctx,data.company,max),x,120);
      drawTradeBadge(ctx,data.tradeName,x,145,max,data.accent);
      ctx.fillStyle=palette.dark;ctx.font=`800 ${fitText(ctx,data.name,max,70,43,800)}px "BIZ UDPGothic","Noto Sans JP",sans-serif`;ctx.fillText(data.name,x,255);
      if(data.role){ctx.fillStyle=palette.mid;ctx.font='700 27px "BIZ UDPGothic","Noto Sans JP",sans-serif';ctx.fillText(clippedText(ctx,data.role,max),x,310);}
      ctx.fillStyle=data.accent;ctx.fillRect(x,350,max,7);
      drawVerticalContactLines(ctx,data,x,425,max,64,'#20344a');
      if(target){const q=170,qx=width-q-48,qy=790;drawQr(ctx,target,qx,qy,q);ctx.fillStyle=palette.dark;ctx.font='700 24px "BIZ UDPGothic","Noto Sans JP",sans-serif';ctx.textAlign='center';ctx.fillText('WEB・LINE',qx+q/2,qy+q+38);ctx.textAlign='left';}
      if(data.member){ctx.fillStyle=data.accent;ctx.font='700 24px "BIZ UDPGothic","Noto Sans JP",sans-serif';ctx.fillText('埼玉土建 上尾伊奈支部 組合員',x,1020);}
      return;
    }

    if(mode==='photo'){
      const g=ctx.createLinearGradient(0,0,0,height);g.addColorStop(0,palette.dark);g.addColorStop(.4,palette.mid);g.addColorStop(.401,'#fff');g.addColorStop(1,'#fff');ctx.fillStyle=g;ctx.fillRect(0,0,width,height);drawStyleTexture(ctx,data,width,height);
      if(photoImage)drawPhoto(ctx,photoImage,width/2,205,235,data.accent);else if(data.illustration!=='none')drawTradeIllustration(ctx,data.trade,width/2,205,220,'#fff',true);
      ctx.textAlign='center';ctx.fillStyle='#fff';ctx.font='700 27px "BIZ UDPGothic","Noto Sans JP",sans-serif';if(data.company)ctx.fillText(clippedText(ctx,data.company,540),width/2,360);
      ctx.fillStyle=palette.dark;ctx.font=`800 ${fitText(ctx,data.name,540,68,42,800)}px "BIZ UDPGothic","Noto Sans JP",sans-serif`;ctx.fillText(data.name,width/2,505);
      if(data.role){ctx.fillStyle=palette.mid;ctx.font='700 27px "BIZ UDPGothic","Noto Sans JP",sans-serif';ctx.fillText(clippedText(ctx,data.role,500),width/2,555);}
      ctx.textAlign='left';drawTradeBadge(ctx,data.tradeName,55,570,540,data.accent);ctx.fillStyle=data.accent;ctx.fillRect(55,625,540,7);
      drawVerticalContactLines(ctx,data,60,700,target?330:530,60,'#20344a');
      if(target){const q=165,qx=430,qy=745;drawQr(ctx,target,qx,qy,q);ctx.fillStyle=palette.dark;ctx.font='700 23px "BIZ UDPGothic","Noto Sans JP",sans-serif';ctx.textAlign='center';ctx.fillText('WEB・LINE',qx+q/2,qy+q+36);ctx.textAlign='left';}
      if(data.member){ctx.fillStyle=data.accent;ctx.font='700 23px "BIZ UDPGothic","Noto Sans JP",sans-serif';ctx.fillText('埼玉土建 上尾伊奈支部 組合員',60,1020);}
      return;
    }

    ctx.fillStyle='#fff';ctx.fillRect(0,0,width,height);ctx.fillStyle=palette.dark;ctx.fillRect(0,0,width,270);ctx.fillStyle=data.accent;ctx.fillRect(0,270,width,10);drawStyleTexture(ctx,data,width,height);
    if(photoImage)drawPhoto(ctx,photoImage,width/2,155,175,data.accent);else if(data.illustration!=='none')drawTradeIllustration(ctx,data.trade,width/2,155,170,'#fff',true);
    ctx.textAlign='center';ctx.fillStyle=palette.mid;ctx.font='700 28px "BIZ UDPGothic","Noto Sans JP",sans-serif';if(data.company)ctx.fillText(clippedText(ctx,data.company,540),width/2,355);
    ctx.fillStyle=palette.dark;ctx.font=`800 ${fitText(ctx,data.name,540,72,44,800)}px "BIZ UDPGothic","Noto Sans JP",sans-serif`;ctx.fillText(data.name,width/2,455);
    if(data.role){ctx.fillStyle=palette.mid;ctx.font='700 27px "BIZ UDPGothic","Noto Sans JP",sans-serif';ctx.fillText(clippedText(ctx,data.role,500),width/2,510);}
    ctx.textAlign='left';drawTradeBadge(ctx,data.tradeName,55,530,540,data.accent);ctx.fillStyle=data.accent;ctx.fillRect(55,590,540,7);
    drawVerticalContactLines(ctx,data,60,665,target?330:530,60,'#20344a');
    if(target){const q=165,qx=430,qy=710;drawQr(ctx,target,qx,qy,q);ctx.fillStyle=palette.dark;ctx.font='700 23px "BIZ UDPGothic","Noto Sans JP",sans-serif';ctx.textAlign='center';ctx.fillText('WEB・LINE',qx+q/2,qy+q+36);ctx.textAlign='left';}
    if(data.member){ctx.fillStyle=data.accent;ctx.font='700 23px "BIZ UDPGothic","Noto Sans JP",sans-serif';ctx.fillText('埼玉土建 上尾伊奈支部 組合員',60,1020);}
  }

  function drawBackVertical(ctx,data,width,height){
    if(!data.useBack){ctx.fillStyle='#fff';ctx.fillRect(0,0,width,height);return;}
    const palette=paletteFor(data);const gradient=ctx.createLinearGradient(0,0,0,height);gradient.addColorStop(0,palette.dark);gradient.addColorStop(1,palette.mid);ctx.fillStyle=gradient;ctx.fillRect(0,0,width,height);ctx.fillStyle=data.accent;ctx.fillRect(0,0,width,14);
    const left=58,max=534;ctx.fillStyle='#fff';ctx.font='800 45px "BIZ UDPGothic","Noto Sans JP",sans-serif';ctx.fillText(clippedText(ctx,data.company||data.name,max),left,105);
    const suggestion=tradeSuggestions[data.trade]||tradeSuggestions.general;const tagline=data.tagline||suggestion.lines[0];
    ctx.fillStyle=data.accent;ctx.font='800 28px "BIZ UDPGothic","Noto Sans JP",sans-serif';ctx.fillText(clippedText(ctx,tagline,max),left,165);
    const blocks=[
      {key:'services',label:'主な業務',text:data.services||suggestion.services},
      {key:'qualifications',label:'資格・許可',text:[data.qualifications,data.permit].filter(Boolean).join('／')||'資格・許可・保険などの信頼情報'},
      {key:'area',label:'対応エリア',text:data.area||'対応エリアをご入力ください'},
      {key:'message',label:'選ばれる理由',text:data.strengths||tagline},
      {key:'trust',label:'信頼情報',text:[data.experience,data.achievements,data.ccus,data.insurance].filter(Boolean).join('／')}
    ].filter(block=>block.text);
    blocks.sort((a,b)=>(a.key===data.backFocus?-1:b.key===data.backFocus?1:0));
    blocks.slice(0,4).forEach((block,index)=>{const y=270+index*165;ctx.fillStyle=data.accent;ctx.font='800 27px "BIZ UDPGothic","Noto Sans JP",sans-serif';ctx.fillText(block.label,left,y);ctx.fillStyle='#fff';ctx.font='600 25px "BIZ UDPGothic","Noto Sans JP",sans-serif';ctx.fillText(clippedText(ctx,block.text,max),left,y+48);});
    const bottom=[data.hours,data.invoice].filter(Boolean).join('　｜　');if(bottom){ctx.fillStyle='rgba(255,255,255,.92)';ctx.font='600 23px "BIZ UDPGothic","Noto Sans JP",sans-serif';ctx.fillText(clippedText(ctx,bottom,max),left,1015);}
  }

  function drawSignatureBackground(ctx,data,palette,width,height){
    const style=data.style;
    if(!['diagonal_luxe','wave_blue','ink_black','wa_pattern','craft','stone_mono','split_duo','orbit','slim_vertical','grand_arc','corporate_panel','orange_slope','layered_wave','round_window','curve_split','ichimatsu','fireworks','townscape'].includes(style))return false;
    ctx.save();
    if(style==='diagonal_luxe'){
      ctx.fillStyle='#fff';ctx.fillRect(0,0,width,height);
      const gradient=ctx.createLinearGradient(width*.58,0,width,height);gradient.addColorStop(0,palette.dark);gradient.addColorStop(1,palette.mid);ctx.fillStyle=gradient;
      ctx.beginPath();ctx.moveTo(width*.62,0);ctx.lineTo(width,0);ctx.lineTo(width,height);ctx.lineTo(width*.48,height);ctx.closePath();ctx.fill();
      ctx.strokeStyle=data.accent;ctx.lineWidth=9;ctx.beginPath();ctx.moveTo(width*.61,0);ctx.lineTo(width*.47,height);ctx.stroke();
    }else if(style==='wave_blue'){
      ctx.fillStyle='#fff';ctx.fillRect(0,0,width,height);ctx.lineCap='round';
      const waves=[
        {offset:0,color:colorWithAlpha(palette.dark,.16),line:34},
        {offset:.05,color:colorWithAlpha(data.accent,.72),line:17},
        {offset:.095,color:colorWithAlpha(palette.mid,.38),line:25},
        {offset:.145,color:colorWithAlpha(data.accent,.28),line:11},
        {offset:.19,color:colorWithAlpha(palette.dark,.11),line:19}
      ];
      waves.forEach(wave=>{ctx.strokeStyle=wave.color;ctx.lineWidth=wave.line;ctx.beginPath();ctx.moveTo(width*(.62+wave.offset),-30);ctx.bezierCurveTo(width*(.79+wave.offset),height*.18,width*(.66+wave.offset),height*.68,width*(.9+wave.offset),height+30);ctx.stroke();});
      ctx.fillStyle=colorWithAlpha(data.accent,.055);ctx.beginPath();ctx.arc(width*.94,height*.17,width*.21,0,Math.PI*2);ctx.fill();
    }else if(style==='ink_black'){
      const gradient=ctx.createLinearGradient(0,0,width,height);gradient.addColorStop(0,'#08090b');gradient.addColorStop(.58,'#191c20');gradient.addColorStop(1,'#050607');ctx.fillStyle=gradient;ctx.fillRect(0,0,width,height);
      ctx.strokeStyle=colorWithAlpha(data.accent,.55);ctx.lineWidth=3;ctx.strokeRect(34,34,width-68,height-68);
    }else if(style==='wa_pattern'){
      const gradient=ctx.createLinearGradient(0,0,width,0);gradient.addColorStop(0,palette.dark);gradient.addColorStop(1,'#182113');ctx.fillStyle=gradient;ctx.fillRect(0,0,width,height);
      ctx.strokeStyle=colorWithAlpha(data.accent,.18);ctx.lineWidth=3;
      for(let row=0;row<6;row+=1){for(let col=0;col<5;col+=1){const x=width*.68+col*85+(row%2)*42;const y=55+row*95;[34,52,70].forEach(radius=>{ctx.beginPath();ctx.arc(x,y,radius,Math.PI,Math.PI*2);ctx.stroke();});}}
    }else if(style==='craft'){
      ctx.fillStyle='#fff';ctx.fillRect(0,0,width,height);
      const wood=ctx.createLinearGradient(0,0,width*.31,0);wood.addColorStop(0,'#6d3f20');wood.addColorStop(.46,'#a86d38');wood.addColorStop(1,'#774521');ctx.fillStyle=wood;ctx.fillRect(0,0,width*.31,height);
      ctx.fillStyle=data.accent;ctx.fillRect(width*.31,0,10,height);drawStyleTexture(ctx,data,width,height);
      ctx.fillStyle='rgba(255,255,255,.12)';ctx.beginPath();ctx.arc(width*.13,height*.5,width*.11,0,Math.PI*2);ctx.fill();
    }else if(style==='stone_mono'){
      const gradient=ctx.createLinearGradient(0,0,width,height);gradient.addColorStop(0,'#fbfbf9');gradient.addColorStop(.64,'#e7e8e6');gradient.addColorStop(1,'#b9bec0');ctx.fillStyle=gradient;ctx.fillRect(0,0,width,height);
      const steel=ctx.createLinearGradient(width*.69,0,width,height);steel.addColorStop(0,'#2a2f33');steel.addColorStop(.5,'#555d61');steel.addColorStop(1,'#1d2124');ctx.fillStyle=steel;ctx.beginPath();ctx.moveTo(width*.72,0);ctx.lineTo(width,0);ctx.lineTo(width,height);ctx.lineTo(width*.61,height);ctx.closePath();ctx.fill();
      ctx.strokeStyle='rgba(255,255,255,.09)';ctx.lineWidth=1;for(let y=8;y<height;y+=13){ctx.beginPath();ctx.moveTo(width*.68,y);ctx.lineTo(width,y);ctx.stroke();}
      ctx.strokeStyle=colorWithAlpha(data.accent,.2);ctx.lineWidth=3;[60,105,150].forEach(radius=>{ctx.beginPath();ctx.arc(width*.87,height*.35,radius,0,Math.PI*2);ctx.stroke();});
      ctx.fillStyle=data.accent;ctx.beginPath();ctx.moveTo(width*.69,0);ctx.lineTo(width*.7,0);ctx.lineTo(width*.59,height);ctx.lineTo(width*.58,height);ctx.closePath();ctx.fill();
    }else if(style==='split_duo'){
      ctx.fillStyle='#fff';ctx.fillRect(0,0,width,height);ctx.fillStyle=palette.dark;ctx.fillRect(0,0,width*.3,height);ctx.fillStyle=palette.mid;ctx.fillRect(width*.3,0,12,height);
      ctx.fillStyle=colorWithAlpha(data.accent,.08);ctx.fillRect(width*.72,0,width*.28,height);ctx.fillStyle=data.accent;ctx.fillRect(width*.72,0,8,height);
      ctx.fillStyle='rgba(255,255,255,.075)';
      for(let row=0;row<6;row+=1){for(let col=0;col<3;col+=1){const size=44;const x=18+col*62+(row%2)*18;const y=18+row*74;ctx.save();ctx.translate(x,y);ctx.rotate(Math.PI/4);ctx.fillRect(0,0,size,size);ctx.restore();}}
    }else if(style==='orbit'){
      ctx.fillStyle='#fff';ctx.fillRect(0,0,width,height);ctx.strokeStyle=colorWithAlpha(data.accent,.2);ctx.lineWidth=5;
      [110,170,230,290].forEach(radius=>{ctx.beginPath();ctx.arc(width*.84,height*.5,radius,0,Math.PI*2);ctx.stroke();});ctx.fillStyle=colorWithAlpha(palette.mid,.08);ctx.beginPath();ctx.arc(width*.84,height*.5,300,0,Math.PI*2);ctx.fill();
    }else if(style==='grand_arc'){
      ctx.fillStyle='#fff';ctx.fillRect(0,0,width,height);const gradient=ctx.createLinearGradient(width*.58,0,width,height);gradient.addColorStop(0,palette.mid);gradient.addColorStop(1,palette.dark);ctx.fillStyle=gradient;
      ctx.beginPath();ctx.moveTo(width*.75,0);ctx.lineTo(width,0);ctx.lineTo(width,height);ctx.lineTo(width*.46,height);ctx.quadraticCurveTo(width*.71,height*.61,width*.75,0);ctx.closePath();ctx.fill();
      [['rgba(255,255,255,.92)',width*.72,width*.43,5],[colorWithAlpha(data.accent,.9),width*.735,width*.445,6],[colorWithAlpha(palette.mid,.28),width*.69,width*.4,3]].forEach(line=>{ctx.strokeStyle=line[0];ctx.lineWidth=line[3];ctx.beginPath();ctx.moveTo(line[1],0);ctx.quadraticCurveTo(width*.69,height*.61,line[2],height);ctx.stroke();});
    }else if(style==='ichimatsu'){
      ctx.fillStyle='#fff';ctx.fillRect(0,0,width,height);const navy=ctx.createLinearGradient(width*.66,0,width,height);navy.addColorStop(0,palette.mid);navy.addColorStop(1,palette.dark);ctx.fillStyle=navy;ctx.beginPath();ctx.moveTo(width*.68,0);ctx.lineTo(width,0);ctx.lineTo(width,height);ctx.lineTo(width*.75,height);ctx.quadraticCurveTo(width*.62,height*.55,width*.68,0);ctx.closePath();ctx.fill();
      drawIchimatsuMosaic(ctx,width,height,'#ffffff',.58);ctx.strokeStyle=data.accent;ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(width*.665,0);ctx.quadraticCurveTo(width*.61,height*.55,width*.735,height);ctx.stroke();
    }else if(style==='fireworks'){
      const night=ctx.createLinearGradient(0,0,width,height);night.addColorStop(0,palette.dark);night.addColorStop(1,'#063c55');ctx.fillStyle=night;ctx.fillRect(0,0,width,height);
      drawFireworkBurst(ctx,width*.78,height*.2,height*.18,'#ffffff',.72);drawFireworkBurst(ctx,width*.93,height*.46,height*.13,data.accent,.86);drawFireworkBurst(ctx,width*.7,height*.66,height*.09,'#89d7ea',.58);
      ctx.fillStyle='rgba(255,255,255,.075)';ctx.beginPath();ctx.moveTo(width*.55,height);ctx.lineTo(width*.68,height*.7);ctx.lineTo(width*.78,height);ctx.lineTo(width*.86,height*.68);ctx.lineTo(width,height*.84);ctx.lineTo(width,height);ctx.closePath();ctx.fill();
    }else if(style==='townscape'){
      const paper=ctx.createLinearGradient(0,0,width,height);paper.addColorStop(0,'#fffdf9');paper.addColorStop(1,'#f3e9df');ctx.fillStyle=paper;ctx.fillRect(0,0,width,height);drawTownscape(ctx,width,height,palette.dark,.24);
      ctx.strokeStyle=colorWithAlpha(data.accent,.32);ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(width*.62,height*.98);ctx.lineTo(width*.62,height*.66);ctx.lineTo(width*.7,height*.58);ctx.lineTo(width*.78,height*.66);ctx.lineTo(width*.78,height*.98);ctx.stroke();
    }else if(style==='corporate_panel'){
      ctx.fillStyle='#fff';ctx.fillRect(0,0,width,height);ctx.fillStyle=palette.dark;ctx.fillRect(width*.73,0,width*.27,height);ctx.fillStyle=data.accent;ctx.fillRect(width*.73,0,9,height);
      ctx.strokeStyle=colorWithAlpha(palette.mid,.18);ctx.lineWidth=3;ctx.strokeRect(30,30,width-60,height-60);ctx.fillStyle=colorWithAlpha(data.accent,.09);ctx.beginPath();ctx.arc(width*.87,height*.2,width*.13,0,Math.PI*2);ctx.fill();
    }else if(style==='orange_slope'){
      ctx.fillStyle='#fff';ctx.fillRect(0,0,width,height);ctx.fillStyle=palette.dark;ctx.beginPath();ctx.moveTo(width*.71,0);ctx.lineTo(width,0);ctx.lineTo(width,height);ctx.lineTo(width*.61,height);ctx.closePath();ctx.fill();
      ctx.fillStyle=data.accent;ctx.beginPath();ctx.moveTo(width*.67,0);ctx.lineTo(width*.74,0);ctx.lineTo(width*.64,height);ctx.lineTo(width*.57,height);ctx.closePath();ctx.fill();
    }else if(style==='layered_wave'){
      ctx.fillStyle='#fff';ctx.fillRect(0,0,width,height);ctx.fillStyle=colorWithAlpha(palette.mid,.13);ctx.beginPath();ctx.moveTo(width*.58,height);ctx.bezierCurveTo(width*.68,height*.34,width*.84,height*.42,width,height*.2);ctx.lineTo(width,height);ctx.closePath();ctx.fill();
      ctx.fillStyle=data.accent;ctx.beginPath();ctx.moveTo(width*.62,height);ctx.bezierCurveTo(width*.72,height*.48,width*.88,height*.52,width,height*.35);ctx.lineTo(width,height);ctx.closePath();ctx.fill();
      ctx.fillStyle=palette.dark;ctx.beginPath();ctx.moveTo(width*.7,height);ctx.bezierCurveTo(width*.78,height*.6,width*.91,height*.65,width,height*.5);ctx.lineTo(width,height);ctx.closePath();ctx.fill();
    }else if(style==='round_window'){
      ctx.fillStyle='#fff';ctx.fillRect(0,0,width,height);ctx.fillStyle=palette.dark;ctx.beginPath();ctx.arc(width*.91,height*.5,width*.36,0,Math.PI*2);ctx.fill();ctx.strokeStyle=data.accent;ctx.lineWidth=9;ctx.beginPath();ctx.arc(width*.91,height*.5,width*.31,0,Math.PI*2);ctx.stroke();
      ctx.strokeStyle=colorWithAlpha(palette.mid,.24);ctx.lineWidth=4;ctx.beginPath();ctx.arc(width*.91,height*.5,width*.27,0,Math.PI*2);ctx.stroke();
    }else if(style==='curve_split'){
      ctx.fillStyle='#fff';ctx.fillRect(0,0,width,height);ctx.fillStyle=palette.dark;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(width*.35,0);ctx.bezierCurveTo(width*.2,height*.28,width*.42,height*.7,width*.28,height);ctx.lineTo(0,height);ctx.closePath();ctx.fill();
      ctx.strokeStyle=data.accent;ctx.lineWidth=10;ctx.beginPath();ctx.moveTo(width*.35,0);ctx.bezierCurveTo(width*.2,height*.28,width*.42,height*.7,width*.28,height);ctx.stroke();
    }else{
      ctx.fillStyle='#0a0c0f';ctx.fillRect(0,0,width,height);ctx.fillStyle='#262a2f';ctx.fillRect(width*.7,0,width*.3,height);ctx.fillStyle=data.accent;ctx.fillRect(width*.7,0,5,height);
      ctx.strokeStyle='rgba(255,255,255,.08)';ctx.lineWidth=2;for(let x=width*.73;x<width;x+=24){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x-80,height);ctx.stroke();}
    }
    ctx.restore();return true;
  }

  function drawFront(ctx, data, width, height) {
    if(data.illustration==='text'){drawTextOnlyFront(ctx,data,width,height);return;}
    if(data.orientation==='vertical'){drawFrontVertical(ctx,data,width,height);return;}
    const palette = paletteFor(data);
    const family=designFamily(data.style);
    const signatureBackground=drawSignatureBackground(ctx,data,palette,width,height);
    if(!signatureBackground){
      if(family==='card')fillBackground(ctx,data,palette,width,height);
      else if(family==='minimal'){ctx.fillStyle='#fff';ctx.fillRect(0,0,width,height);ctx.fillStyle=data.accent;ctx.fillRect(0,0,width,10);ctx.fillStyle=colorWithAlpha(data.accent,.06);ctx.beginPath();ctx.arc(width*.92,height*.08,width*.22,0,Math.PI*2);ctx.fill();}
      else if(family==='band'){ctx.fillStyle='#fff';ctx.fillRect(0,0,width,height);const g=ctx.createLinearGradient(0,0,width*.3,height);g.addColorStop(0,palette.dark);g.addColorStop(1,palette.mid);ctx.fillStyle=g;ctx.fillRect(0,0,width*.3,height);ctx.fillStyle=data.accent;ctx.fillRect(width*.3,0,12,height);drawStyleTexture(ctx,data,width,height);}
      else{const g=ctx.createLinearGradient(0,0,width,height);g.addColorStop(0,palette.dark);g.addColorStop(1,palette.mid);ctx.fillStyle=g;ctx.fillRect(0,0,width,height);ctx.fillStyle=data.accent;ctx.fillRect(0,height-12,width,12);drawStyleTexture(ctx,data,width,height);}
    }
    const isBand=family==='band';const isDark=family==='dark'||family==='blueprint';const rightDark=['diagonal_luxe','stone_mono','grand_arc','corporate_panel','orange_slope','layered_wave','round_window','ichimatsu'].includes(data.style);
    const left=width*(isBand?.37:.075);
    const contentWidth=width*(isBand?.55:.53);
    ctx.textBaseline = 'alphabetic';
    if(family==='card'||family==='photo'){ctx.fillStyle='rgba(255,255,255,.94)';roundedRect(ctx,width*.035,height*.045,width*.62,height*.91,22);ctx.fill();}
    const companyX=left;const companyWidth=contentWidth;
    ctx.fillStyle = isDark?'#fff':palette.mid;
    ctx.font = `700 ${Math.max(25,Math.round(height*.04))}px "BIZ UDPGothic","Noto Sans JP",sans-serif`;
    if (data.company) ctx.fillText(clippedText(ctx, data.company, companyWidth), companyX, height*.14);
    ctx.fillStyle = isDark?'#fff':palette.dark;
    const nameSize = fitText(ctx, data.name, contentWidth, height*.115, height*.07, 800);
    ctx.font = `800 ${nameSize}px "BIZ UDPGothic","Noto Sans JP",sans-serif`;
    ctx.fillText(data.name, left, height*.285);
    if (data.role) {
      ctx.fillStyle = isDark?'rgba(255,255,255,.82)':palette.mid;
      ctx.font = `700 ${Math.max(25,Math.round(height*.035))}px "BIZ UDPGothic","Noto Sans JP",sans-serif`;
      ctx.fillText(clippedText(ctx, data.role, contentWidth), left, height*.37);
    }
    drawTradeBadge(ctx,data.tradeName,left,height*.395,contentWidth,data.accent);
    ctx.fillStyle=data.accent;ctx.fillRect(left,height*.475,contentWidth,height*.008);
    const details = [
      data.phone && `TEL  ${data.phone}`,
      data.email && `MAIL  ${data.email}`,
      data.address,
      [data.website&&`WEB  ${data.website}`,data.social&&`SNS  ${data.social}`].filter(Boolean).join('  ')
    ].filter(Boolean);
    ctx.fillStyle = isDark?'rgba(255,255,255,.92)':'#20344a';
    ctx.font = `600 ${Math.max(25,Math.round(height*.027))}px "BIZ UDPGothic","Noto Sans JP",sans-serif`;
    details.slice(0,4).forEach((detail,index) => ctx.fillText(clippedText(ctx, detail, contentWidth), left, height*(.56 + index*.085)));
    if (data.member) {
      ctx.fillStyle = data.accent; ctx.font = `700 ${Math.max(25,Math.round(height*.022))}px "BIZ UDPGothic","Noto Sans JP",sans-serif`;
      ctx.fillText('埼玉土建 上尾伊奈支部 組合員', left, height*.925);
    }
    const target=qrTarget(data);
    const rightCenter=width*(isBand?.16:.825);
    const artSize=target?height*.25:height*.42;
    const artY=target?height*.22:height*.42;
    if (photoImage) drawPhoto(ctx, photoImage, rightCenter, artY, artSize*.82, data.accent);
    else if (data.illustration !== 'none') drawTradeIllustration(ctx, data.trade, rightCenter, artY, artSize, isBand||isDark||rightDark?'#fff':data.accent, data.illustration !== 'line');
    if(target){
      const qrSize=Math.round(width*20/91);const qrX=isBand?width*.05:width-qrSize-width*.055;const qrY=height*.49;
      drawQr(ctx,target,qrX,qrY,qrSize);
      ctx.fillStyle=isBand||isDark||rightDark?'#fff':palette.dark;ctx.font=`700 ${Math.max(25,Math.round(height*.021))}px "BIZ UDPGothic","Noto Sans JP",sans-serif`;ctx.textAlign='center';ctx.fillText('WEB・LINE・施工事例',qrX+qrSize/2,qrY+qrSize+height*.045);ctx.textAlign='left';
    }
  }

  function drawBack(ctx, data, width, height) {
    if(data.illustration==='text'){drawTextOnlyBack(ctx,data,width,height);return;}
    if(data.orientation==='vertical'){drawBackVertical(ctx,data,width,height);return;}
    if(!data.useBack){ctx.fillStyle='#fff';ctx.fillRect(0,0,width,height);return;}
    const palette = paletteFor(data);
    const gradient = ctx.createLinearGradient(0,0,width,height);
    gradient.addColorStop(0,palette.dark); gradient.addColorStop(1,palette.mid);
    ctx.fillStyle = gradient; ctx.fillRect(0,0,width,height);
    ctx.fillStyle = data.accent; ctx.fillRect(0,0,width,16);
    ctx.fillStyle = colorWithAlpha(data.accent,.14); ctx.beginPath(); ctx.arc(width*.9,height*.14,width*.25,0,Math.PI*2); ctx.fill();
    if (data.illustration === 'auto') drawTradeIllustration(ctx,data.trade,width*.86,height*.2,height*.24,'rgba(255,255,255,.72)',true);
    const left = width*.08; const max = width*.82;
    ctx.fillStyle = '#fff'; ctx.font = `800 ${Math.max(25,Math.round(height*.072))}px "BIZ UDPGothic","Noto Sans JP",sans-serif`;
    ctx.fillText(clippedText(ctx,data.company || data.name,width*.64),left,height*.16);
    const suggestion=tradeSuggestions[data.trade]||tradeSuggestions.general;const tagline=data.tagline||suggestion.lines[0];
    ctx.fillStyle=data.accent;ctx.font=`800 ${Math.max(25,Math.round(height*.034))}px "BIZ UDPGothic","Noto Sans JP",sans-serif`;ctx.fillText(clippedText(ctx,tagline,max),left,height*.26);
    const standardBlocks = [
      { key: 'services', label: '主な業務', text: data.services||suggestion.services },
      { key: 'qualifications', label: '資格・許可', text: [data.qualifications,data.permit].filter(Boolean).join('／')||'資格・許可・保険などの信頼情報' },
      { key: 'area', label: '対応エリア', text: data.area||'対応エリアをご入力ください' },
      { key: 'message', label: '選ばれる理由', text: data.strengths||tagline },
      { key: 'trust', label: '信頼情報', text: [data.experience,data.achievements,data.ccus,data.insurance].filter(Boolean).join('／') }
    ];
    const blocks=standardBlocks.filter(block => block.text);
    blocks.sort((a,b) => (a.key === data.backFocus ? -1 : b.key === data.backFocus ? 1 : 0));
    blocks.slice(0,3).forEach((block,index) => {
      const labelY = height*(.38 + index*.19);
      ctx.fillStyle = data.accent; ctx.font = `800 ${Math.max(25,Math.round(height*.031))}px "BIZ UDPGothic","Noto Sans JP",sans-serif`; ctx.fillText(block.label,left,labelY);
      ctx.fillStyle = '#fff'; ctx.font = `600 ${Math.max(25,Math.round(height*.029))}px "BIZ UDPGothic","Noto Sans JP",sans-serif`; ctx.fillText(clippedText(ctx,block.text,max),left,labelY+height*.062);
    });
    const bottom = [data.hours,data.invoice].filter(Boolean).join('　｜　');
    if(bottom){ctx.fillStyle='rgba(255,255,255,.92)';ctx.font=`600 ${Math.max(25,Math.round(height*.025))}px "BIZ UDPGothic","Noto Sans JP",sans-serif`;ctx.fillText(clippedText(ctx,bottom,max),left,height*.95);}
  }

  function renderToCanvas(canvas, side, includeBleed) {
    const data = cardData();
    const sizes=CARD_SIZES[data.orientation]||CARD_SIZES.horizontal;
    const finished=sizes.finished;const bleed=sizes.bleed;
    const ctx = canvas.getContext('2d');
    const target = includeBleed ? bleed : finished;
    canvas.width = target.width; canvas.height = target.height;
    ctx.clearRect(0,0,target.width,target.height);
    if (includeBleed) {
      const design=document.createElement('canvas'); design.width=finished.width; design.height=finished.height;
      const designContext=design.getContext('2d');
      if (side === 'front') drawFront(designContext,data,finished.width,finished.height); else drawBack(designContext,data,finished.width,finished.height);
      const i=bleed.inset,w=finished.width,h=finished.height;
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
        queueAutoSave();
      });
      container.appendChild(button);
    });
    box.hidden = false;
  }

  function suggestDesign() {
    const trade = value('trade') || 'general';
    const suggestion = tradeSuggestions[trade] || tradeSuggestions.general;
    const styleSelect=document.getElementById('style-preset');
    const suggestedStyle=normalizeStyle(suggestion.style);if ([...styleSelect.options].some(option=>option.value===suggestedStyle)) styleSelect.value=suggestedStyle;
    document.getElementById('accent-color').value = suggestion.color;
    if(selectedBack()){
      if (!value('services')) document.getElementById('services').value = suggestion.services;
      if (!value('tagline')) document.getElementById('tagline').value = suggestion.lines[0];
      renderTaglineSuggestions(suggestion.lines);
    }
    layoutVariant = (layoutVariant + 1) % 3;
    document.getElementById('suggestion-message').textContent = `キャッチコピーを5案提案しました。気に入った言葉をタップしてください。${suggestion.reason}`;
    queueRender();
    queueAutoSave();
  }

  function resizePhoto(file) {
    if (!file || !/^image\/(png|jpeg|webp)$/.test(file.type)) return;
    if (file.size > 8 * 1024 * 1024) {
      document.getElementById('suggestion-message').textContent = '画像は8MB以下を選んでください。'; return;
    }
    document.getElementById('photo-status').textContent='画像を読み込んでいます…';
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const size = 640; const ratio = Math.min(size/image.width,size/image.height,1);
        const canvas = document.createElement('canvas'); canvas.width=Math.round(image.width*ratio); canvas.height=Math.round(image.height*ratio);
        canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);
        photoData=canvas.toDataURL('image/jpeg',.84); photoImage=new Image(); photoImage.onload=()=>{syncPhotoControls();queueRender();queueAutoSave();}; photoImage.src=photoData;
      };
      image.src=String(reader.result);
    };
    reader.readAsDataURL(file);
  }

  function syncPhotoControls(){
    const ready=Boolean(photoData);document.getElementById('remove-photo').hidden=!ready;
    document.getElementById('photo-control').classList.toggle('has-photo',ready);
    document.getElementById('photo-status').textContent=ready?'✓ 画像を読み込みました。名刺プレビューに反映されています。':'画像は未選択です';
  }

  function clearPhoto(){
    photoData='';photoImage=null;
    document.getElementById('photo').value='';
    syncPhotoControls();
    document.getElementById('save-message').textContent='画像を削除しました。職種イラストの設定が「入れる」の場合はイラスト表示に戻ります。';
    queueRender();
    queueAutoSave();
  }

  function safeFilename(side) {
    const base=(value('company') || value('person-name') || '名刺').replace(/[\\/:*?"<>|\s]+/g,'_').slice(0,30);
    const sizes=currentSizes();const orientation=selectedOrientation()==='vertical'?'縦型':'横型';
    return `${base}_${orientation}_${side === 'front' ? '表面' : '裏面'}_${sizes.bleedMm.width}x${sizes.bleedMm.height}mm.png`;
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
    const spec=tradeIconPaths[trade]||tradeIconPaths.general;
    const background=`<circle cx="500" cy="500" r="455" fill="${color}" opacity=".08"/><circle cx="500" cy="500" r="430" fill="none" stroke="${color}" stroke-width="16" opacity=".22"/>`;
    const fills=spec.fill.map(path=>`<path fill="${color}" d="${path}"/>`).join('');
    const strokes=spec.stroke.map(path=>`<path fill="none" stroke="${color}" stroke-width="46" stroke-linecap="round" stroke-linejoin="round" d="${path}"/>`).join('');
    const details=`<circle cx="805" cy="185" r="23" fill="${color}" opacity=".7"/><circle cx="860" cy="245" r="12" fill="${color}" opacity=".7"/>`;
    return `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000">${background}${fills}${strokes}${details}</svg>`;
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

  function makePdf(frontBytes,backBytes,sizes) {
    const chunks=[]; const offsets=[]; let length=0;
    const append = data => { const bytes=typeof data==='string'?ascii(data):data; chunks.push(bytes); length+=bytes.length; };
    const object = (number,parts) => {
      offsets[number]=length; append(`${number} 0 obj\n`); parts.forEach(append); append('\nendobj\n');
    };
    const pageWidth=(sizes.bleedMm.width/25.4*72).toFixed(3); const pageHeight=(sizes.bleedMm.height/25.4*72).toFixed(3);
    const content1=ascii(`q\n${pageWidth} 0 0 ${pageHeight} 0 0 cm\n/Im1 Do\nQ\n`);
    const content2=ascii(`q\n${pageWidth} 0 0 ${pageHeight} 0 0 cm\n/Im2 Do\nQ\n`);
    append('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');
    object(1,['<< /Type /Catalog /Pages 2 0 R >>']);
    object(2,['<< /Type /Pages /Count 2 /Kids [3 0 R 6 0 R] >>']);
    object(3,[`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /XObject << /Im1 4 0 R >> >> /Contents 5 0 R >>`]);
    object(4,[`<< /Type /XObject /Subtype /Image /Width ${sizes.bleed.width} /Height ${sizes.bleed.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${frontBytes.length} >>\nstream\n`,frontBytes,'\nendstream']);
    object(5,[`<< /Length ${content1.length} >>\nstream\n`,content1,'endstream']);
    object(6,[`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /XObject << /Im2 7 0 R >> >> /Contents 8 0 R >>`]);
    object(7,[`<< /Type /XObject /Subtype /Image /Width ${sizes.bleed.width} /Height ${sizes.bleed.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${backBytes.length} >>\nstream\n`,backBytes,'\nendstream']);
    object(8,[`<< /Length ${content2.length} >>\nstream\n`,content2,'endstream']);
    const xref=length; append('xref\n0 9\n0000000000 65535 f \n');
    for(let number=1;number<=8;number+=1) append(`${String(offsets[number]).padStart(10,'0')} 00000 n \n`);
    append(`trailer\n<< /Size 9 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`);
    return new Blob(chunks,{type:'application/pdf'});
  }

  function downloadPdf() {
    const front=document.createElement('canvas'); const back=document.createElement('canvas');
    renderToCanvas(front,'front',true); renderToCanvas(back,'back',true);
    const sizes=currentSizes();const pdf=makePdf(dataUrlBytes(front.toDataURL('image/jpeg',.96)),dataUrlBytes(back.toDataURL('image/jpeg',.96)),sizes);
    const base=(value('company') || value('person-name') || '名刺').replace(/[\\/:*?"<>|\s]+/g,'_').slice(0,30);
    const orientation=selectedOrientation()==='vertical'?'縦型':'横型';
    triggerDownload(pdf,`${base}_${orientation}_表裏_${sizes.bleedMm.width}x${sizes.bleedMm.height}mm_RGB.pdf`);
    document.getElementById('save-message').textContent='表裏2ページの入稿用PDFを保存しました。ラクスルのデータチェックで仕上がりと色を確認してください。';
  }

  function updateQuality() {
    const data=cardData(); let score=28; const items=[];
    const add=(ok,points,good,bad)=>{ if(ok){score+=points;items.push({ok:true,text:good});}else items.push({ok:false,text:bad}); };
    add(Boolean(data.name && data.name!=='お名前'),12,'氏名が入力されています','氏名を入力してください');
    add(Boolean(data.company),8,'会社・屋号が入力されています','会社・屋号を入れると信頼感が上がります');
    if(data.trade==='custom')add(Boolean(value('custom-trade')),8,'自由入力した職種名が表示されます','「その他」を選んだ場合は職種名を入力してください');
    add(Boolean(data.phone || data.email),12,'問い合わせ先があります','電話番号またはメールを入力してください');
    if(data.useBack){
      add(Boolean(data.tagline),10,'裏面で強みが一言で伝わります','裏面のキャッチコピーを入力してください');
      add(Boolean(data.services),10,'裏面で施工内容が分かります','裏面の主な業務・施工内容を入力してください');
      add(Boolean(data.qualifications || data.area),5,'資格または対応エリアがあります','資格または対応エリアを入れると安心感が増します');
    }else{
      score+=25;items.push({ok:true,text:'裏面は白無地で出力します'});
    }
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
    const sizes=CARD_SIZES[data.orientation]||CARD_SIZES.horizontal;
    const visualMode=data.illustration==='auto'?'職種イラストを使用':data.illustration==='text'?'文字だけのミニマル構成':'イラストを使用しない';
    return `あなたは世界最高峰のブランドデザイナー、建設業専門マーケティング責任者、印刷デザイナーです。次の情報から、3秒で業種、10秒で信頼、30秒で依頼方法まで伝わる「建設業で最も成果が出る名刺」を設計してください。\n\n【印刷条件】仕上がり${sizes.finishedMm.width}×${sizes.finishedMm.height}mm、塗り足し込み${sizes.bleedMm.width}×${sizes.bleedMm.height}mm、300dpi、角丸なし、重要情報は仕上がり線から3mm以上内側、色は3色以内、最小文字6pt、QRコードは約20mmで十分な余白を確保。${data.useBack?'表面・裏面を提案':'表面のみ提案し、裏面は白無地'}。\n【会社名】${data.company || '未入力'}\n【氏名】${data.name || '未入力'}\n【肩書】${data.role || '未入力'}\n【業種】${tradeLabel()}\n【キャッチコピー】${data.tagline || 'AIで5案提案'}\n【施工内容】${data.services || 'AIで整理'}\n【選ばれる理由】${data.strengths || 'AIで整理'}\n【資格】${data.qualifications || '未入力'}\n【建設業許可】${data.permit || '未入力'}\n【創業・経験】${data.experience || '未入力'}\n【施工実績】${data.achievements || '未入力'}\n【CCUS・所属】${data.ccus || '未入力'}\n【保険・保証】${data.insurance || '未入力'}\n【インボイス】${data.invoice || '未入力'}\n【営業時間】${data.hours || '未入力'}\n【対応エリア】${data.area || '未入力'}\n【希望スタイル】${data.style}\n【希望色】${data.accent}\n【見せ方】${visualMode}\n\n文字、写真、イラスト、QRコードが重ならない専用領域を確保してください。視線誘導、ブランドカラー、キャッチコピー5案、背景・アイコン・イラスト案、営業効果、印刷時の注意を日本語で提示してください。個人情報は回答内で必要以上に繰り返さないでください。`;
  }

  async function copyAiPrompt() {
    const prompt=buildAiPrompt();
    try { await navigator.clipboard.writeText(prompt); document.getElementById('suggestion-message').textContent='AI相談用プロンプトをコピーしました。必要なAI画面へ貼り付けてください。'; }
    catch(error){ const area=document.createElement('textarea');area.value=prompt;document.body.appendChild(area);area.select();document.execCommand('copy');area.remove();document.getElementById('suggestion-message').textContent='AI相談用プロンプトをコピーしました。'; }
  }

  function preparePrint() {
    const front=document.createElement('canvas'); const back=document.createElement('canvas');
    renderToCanvas(front,'front',true); renderToCanvas(back,'back',true);
    const sizes=currentSizes();
    ['front','back'].forEach(side=>{const image=document.getElementById(`print-${side}`);image.style.width=`${sizes.bleedMm.width}mm`;image.style.height=`${sizes.bleedMm.height}mm`;});
    document.querySelectorAll('.print-dimensions').forEach(node=>{node.textContent=`外枠：塗り足し${sizes.bleedMm.width}×${sizes.bleedMm.height}mm／内側：仕上がり${sizes.finishedMm.width}×${sizes.finishedMm.height}mm`;});
    document.getElementById('print-front').src=front.toDataURL('image/png'); document.getElementById('print-back').src=back.toDataURL('image/png');
    setTimeout(()=>window.print(),80);
  }

  function buildDraft(includeFullPhoto) {
    const values={};
    fields.forEach(id => { values[id]=value(id); });
    values.style=selectedStyle();values.orientation=selectedOrientation();values.illustrationChoice=selectedIllustration();values.backChoice=selectedBack()?'yes':'no';values.layoutVariant=layoutVariant;
    values.photo=photoData && (includeFullPhoto || photoData.length < 900000) ? photoData : '';
    values.format='doken-business-card-draft';values.version=2;values.savedAt=new Date().toISOString();
    return values;
  }

  function saveDraft(silent) {
    const values=buildDraft(false);
    try {
      localStorage.setItem(STORAGE_KEY,JSON.stringify(values));
      if(!silent)document.getElementById('save-message').textContent=photoData && !values.photo ? '文字情報をこの端末に保存しました。画像は容量が大きいため保存していません。' : 'この端末に保存しました。次回は自動で続きから開きます。';
      return true;
    } catch (error) {
      if(!silent)document.getElementById('save-message').textContent='端末の保存容量が不足しています。「作業データ保存」をお使いください。';
      return false;
    }
  }

  function queueAutoSave(){
    window.clearTimeout(autoSaveTimer);
    autoSaveTimer=window.setTimeout(()=>saveDraft(true),700);
  }

  function exportDraft(){
    const draft=buildDraft(true);
    const json=JSON.stringify(draft);
    const name=(value('company')||value('person-name')||'名刺').replace(/[\\/:*?"<>|\s]+/g,'_').slice(0,30);
    triggerDownload(new Blob([json],{type:'application/json;charset=utf-8'}),`${name}_名刺作業データ.doken-card.json`);
    saveDraft(true);
    document.getElementById('save-message').textContent='作業データを保存しました。別の端末では「続きから開く」で選択してください。';
  }

  function applyDraft(draft,message){
    if(!draft||typeof draft!=='object')throw new Error('invalid draft');
    fields.forEach(id=>{
      const element=document.getElementById(id);if(!element||draft[id]===undefined)return;
      if(id==='style-preset')return;
      if(element.type==='checkbox'){element.checked=Boolean(draft[id]);return;}
      const max=Number(element.maxLength)>0?Number(element.maxLength):500;
      element.value=String(draft[id]).slice(0,max);
    });
    const restoredStyle=normalizeStyle(draft.style||draft['style-preset']);if(restoredStyle){const select=document.getElementById('style-preset');if([...select.options].some(option=>option.value===restoredStyle))select.value=restoredStyle;}
    [['orientation',draft.orientation],['illustration-choice',draft.illustrationChoice],['back-choice',draft.backChoice]].forEach(([name,choice])=>{if(!choice)return;const radio=form.querySelector(`input[name="${name}"][value="${choice}"]`);if(radio)radio.checked=true;});
    layoutVariant=Number.isInteger(draft.layoutVariant)?Math.abs(draft.layoutVariant)%3:0;
    photoData='';photoImage=null;
    if(typeof draft.photo==='string'&&draft.photo.length<6500000&&/^data:image\/(png|jpeg|webp);base64,/.test(draft.photo)){photoData=draft.photo;photoImage=new Image();photoImage.onload=()=>{syncPhotoControls();queueRender();};photoImage.src=photoData;}
    syncPhotoControls();syncTradeUI();syncKeyOptions();queueRender();
    document.getElementById('save-message').textContent=message;
  }

  function importDraft(file){
    if(!file)return;
    if(file.size>6*1024*1024){document.getElementById('save-message').textContent='作業データは6MB以下のファイルを選んでください。';return;}
    const reader=new FileReader();
    reader.onload=()=>{try{const draft=JSON.parse(String(reader.result));if(draft.format&&draft.format!=='doken-business-card-draft')throw new Error('wrong format');applyDraft(draft,'作業データを読み込みました。続きから編集できます。');saveDraft(true);}catch(error){document.getElementById('save-message').textContent='名刺の作業データを読み込めませんでした。保存したJSONファイルを選んでください。';}document.getElementById('import-draft').value='';};
    reader.onerror=()=>{document.getElementById('save-message').textContent='ファイルを読み込めませんでした。';};
    reader.readAsText(file,'utf-8');
  }

  function restoreDraft() {
    let draft;
    try { draft=JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); } catch (error) { return; }
    if (!draft || typeof draft !== 'object') return;
    try{applyDraft(draft,'この端末に保存した作業内容を復元しました。続きから編集できます。');}catch(error){/* 壊れた保存データは無視する */}
  }

  function syncKeyOptions(){
    const sizes=currentSizes();const vertical=selectedOrientation()==='vertical';
    document.getElementById('vertical-layout-wrap').hidden=!vertical;
    document.getElementById('back-fields').hidden=!selectedBack();
    const shell=document.getElementById('canvas-shell');shell.style.aspectRatio=`${sizes.finished.width}/${sizes.finished.height}`;shell.classList.toggle('vertical',vertical);
    document.getElementById('card-size-label').textContent=`実際の比率 ${sizes.finishedMm.width}mm × ${sizes.finishedMm.height}mm`;
    queueRender();
  }

  function syncTradeUI(){
    const custom=value('trade')==='custom';const wrap=document.getElementById('custom-trade-wrap');const input=document.getElementById('custom-trade');
    wrap.hidden=!custom;input.required=custom;
    if(custom)input.setAttribute('aria-required','true');else input.removeAttribute('aria-required');
    queueRender();
  }

  function selectPreviewSide(side){
    currentSide=side;
    document.querySelectorAll('.side-tab').forEach(tab=>{const active=tab.dataset.side===side;tab.classList.toggle('active',active);tab.setAttribute('aria-selected',String(active));});
    queueRender();
  }

  form.addEventListener('input',()=>{queueRender();queueAutoSave();});
  form.addEventListener('change',()=>{queueRender();queueAutoSave();});
  form.querySelectorAll('input[name="orientation"],input[name="illustration-choice"]').forEach(radio=>radio.addEventListener('change',syncKeyOptions));
  document.getElementById('trade').addEventListener('change',syncTradeUI);
  form.querySelectorAll('input[name="back-choice"]').forEach(radio=>radio.addEventListener('change',()=>{syncKeyOptions();if(selectedBack())selectPreviewSide('back');else selectPreviewSide('front');}));
  document.getElementById('back-fields').addEventListener('input',()=>selectPreviewSide('back'));
  document.getElementById('back-fields').addEventListener('change',()=>selectPreviewSide('back'));
  document.getElementById('photo').addEventListener('change',event=>resizePhoto(event.target.files[0]));
  document.getElementById('remove-photo').addEventListener('click',clearPhoto);
  document.getElementById('suggest-button').addEventListener('click',suggestDesign);
  document.getElementById('download-front').addEventListener('click',()=>download('front'));
  document.getElementById('download-back').addEventListener('click',()=>download('back'));
  document.getElementById('download-icon').addEventListener('click',downloadIconPng);
  document.getElementById('download-svg').addEventListener('click',downloadIconSvg);
  document.getElementById('pdf-button').addEventListener('click',downloadPdf);
  document.getElementById('print-button').addEventListener('click',preparePrint);
  document.getElementById('save-draft').addEventListener('click',()=>saveDraft(false));
  document.getElementById('export-draft').addEventListener('click',exportDraft);
  document.getElementById('import-draft').addEventListener('change',event=>importDraft(event.target.files[0]));
  document.getElementById('copy-ai-prompt').addEventListener('click',copyAiPrompt);
  document.querySelectorAll('.side-tab').forEach(button=>button.addEventListener('click',()=>selectPreviewSide(button.dataset.side)));

  restoreDraft();
  syncPhotoControls();
  syncTradeUI();
  syncKeyOptions();
})();
