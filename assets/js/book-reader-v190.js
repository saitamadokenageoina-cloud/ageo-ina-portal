(function(){
'use strict';
if(window.pdfjsLib){pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';}

const params=new URLSearchParams(location.search);
const docs=window.BOOKSHELF_DOCS||[];
const doc=docs.find(d=>d.id===params.get('book'))||docs[0];
const state={pdf:null,page:Math.max(1,parseInt(params.get('page')||'1',10)||1),zoom:1,panX:0,panY:0,view:'auto',token:0,renderTasks:[],touch:null,pinch:null,textCache:new Map(),thumbObserver:null};
const $=id=>document.getElementById(id);
const els={reader:$('reader'),stage:$('stage'),pages:$('pages-transform'),leftShell:$('left-shell'),rightShell:$('right-shell'),leftCanvas:$('left-page'),rightCanvas:$('right-page'),leftNo:$('left-no'),rightNo:$('right-no'),title:$('book-title'),sub:$('book-sub'),pageLabel:$('page-label'),zoomValue:$('zoom-value'),loading:$('loading'),progressBar:$('progress-bar'),progressText:$('progress-text'),error:$('reader-error'),pdf:$('pdf-link'),save:$('save-link'),errorPdf:$('error-pdf'),backdrop:$('backdrop'),toc:$('toc-list'),thumbs:$('thumb-grid'),searchInput:$('search-input'),searchStatus:$('search-status'),searchResults:$('search-results'),bookmarkBtn:$('bookmark-btn'),bookmarkList:$('bookmark-list'),viewLabel:$('view-label')};

function clamp(v,min,max){return Math.min(max,Math.max(min,v));}
function spread(){if(state.view==='single')return false;if(state.view==='spread')return window.innerWidth>=650;return window.innerWidth>=900;}
function step(){return spread()?2:1;}
function maxPage(){return state.pdf?state.pdf.numPages:1;}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function pageText(){return spread()&&state.page<maxPage()?`${state.page}-${state.page+1} / ${maxPage()}`:`${state.page} / ${maxPage()}`;}
function setProgress(p,msg){const n=clamp(Math.round(p||0),0,100);els.progressBar.style.width=Math.max(6,n)+'%';els.progressText.textContent=msg||(n?`${n}%`:'読み込み中…');}
function showError(){els.loading.style.display='none';els.error.style.display='flex';}
function cancelRenders(){state.renderTasks.forEach(t=>{try{t.cancel();}catch(e){}});state.renderTasks=[];}
function fitScale(page){const vp=page.getViewport({scale:1});const r=els.stage.getBoundingClientRect();const count=spread()?2:1;const gap=spread()?8:0;const usableW=Math.max(120,(r.width-24-gap)/count);const usableH=Math.max(120,r.height-22);return Math.min(usableW/vp.width,usableH/vp.height);}

async function draw(pageNo,canvas,shell,label,token){
  if(pageNo>maxPage()){shell.style.display='none';return;}
  shell.style.display='block';shell.classList.toggle('single',!spread());
  const page=await state.pdf.getPage(pageNo);if(token!==state.token)return;
  const scale=Math.max(.18,fitScale(page)*state.zoom);const viewport=page.getViewport({scale});const dpr=Math.min(window.devicePixelRatio||1,1.75);
  canvas.width=Math.max(1,Math.floor(viewport.width*dpr));canvas.height=Math.max(1,Math.floor(viewport.height*dpr));canvas.style.width=Math.floor(viewport.width)+'px';canvas.style.height=Math.floor(viewport.height)+'px';
  const ctx=canvas.getContext('2d',{alpha:false});ctx.setTransform(dpr,0,0,dpr,0,0);
  const task=page.render({canvasContext:ctx,viewport,intent:'display'});state.renderTasks.push(task);
  try{await task.promise;}catch(e){if(e&&e.name!=='RenderingCancelledException')throw e;}
  label.textContent=pageNo;
}
function updateUrl(){const u=new URL(location.href);u.searchParams.set('book',doc.id);u.searchParams.set('page',String(state.page));history.replaceState(null,'',u);}
function applyPan(extraScale){if(state.zoom<=1){state.panX=0;state.panY=0;}els.pages.style.transform=`translate3d(${state.panX}px,${state.panY}px,0) scale(${extraScale||1})`;}
function constrainPan(){if(state.zoom<=1){state.panX=0;state.panY=0;return;}const r=els.stage.getBoundingClientRect();const p=els.pages.getBoundingClientRect();const maxX=Math.max(0,(p.width-r.width)/2+70),maxY=Math.max(0,(p.height-r.height)/2+70);state.panX=clamp(state.panX,-maxX,maxX);state.panY=clamp(state.panY,-maxY,maxY);}

function currentBookmarks(){try{return JSON.parse(localStorage.getItem('doken_bookmarks_v1')||'{}');}catch(e){return{};}}
function bookmarkPages(){const all=currentBookmarks();return Array.isArray(all[doc.id])?all[doc.id]:[];}
function saveBookmarkPages(pages){const all=currentBookmarks();all[doc.id]=pages;localStorage.setItem('doken_bookmarks_v1',JSON.stringify(all));}
function updateBookmarkButton(){const on=bookmarkPages().includes(state.page);els.bookmarkBtn.classList.toggle('bookmarked',on);els.bookmarkBtn.innerHTML=`<i class="ti ${on?'ti-bookmark-filled':'ti-bookmark'}"></i>`;els.bookmarkBtn.setAttribute('aria-label',on?'このページのしおりを削除':'このページをしおりに保存');}
function renderBookmarks(){const pages=bookmarkPages().sort((a,b)=>a-b);els.bookmarkList.innerHTML=pages.length?pages.map(p=>`<button class="bookmark-item" data-page="${p}"><strong>ページ ${p}</strong><span>開く</span></button>`).join(''):'<div class="empty">まだ、しおりはありません。<br>読み返したいページで、上部のしおりボタンを押してください。</div>';els.bookmarkList.querySelectorAll('[data-page]').forEach(b=>b.addEventListener('click',()=>{jump(Number(b.dataset.page));closeSheets();}));}
function toggleBookmark(){let pages=bookmarkPages();const i=pages.indexOf(state.page);if(i>=0)pages.splice(i,1);else pages.push(state.page);saveBookmarkPages(pages);updateBookmarkButton();renderBookmarks();}

async function render(){
  if(!state.pdf)return;state.page=clamp(state.page,1,maxPage());cancelRenders();const token=++state.token;els.loading.style.display='flex';els.error.style.display='none';els.reader.classList.remove('turn-next','turn-prev');els.rightShell.style.display=spread()?'block':'none';
  try{
    await draw(state.page,els.leftCanvas,els.leftShell,els.leftNo,token);if(spread())await draw(state.page+1,els.rightCanvas,els.rightShell,els.rightNo,token);if(token!==state.token)return;
    els.pageLabel.textContent=pageText();els.zoomValue.textContent=Math.round(state.zoom*100)+'%';els.sub.textContent=`${doc.category||'資料'} / ${maxPage()}ページ`;
    constrainPan();applyPan();updateUrl();updateBookmarkButton();markActiveThumb();preloadNeighbors();
  }catch(e){if(!(e&&e.name==='RenderingCancelledException')){console.error(e);showError();}}
  finally{if(token===state.token)els.loading.style.display='none';}
}
function preloadNeighbors(){[state.page-step(),state.page+step(),state.page+step()*2].filter(p=>p>=1&&p<=maxPage()).forEach(p=>state.pdf.getPage(p).catch(()=>{}));}
function go(delta){if(!state.pdf)return;const next=clamp(state.page+delta,1,maxPage());if(next===state.page)return;state.panX=state.panY=0;els.reader.classList.add(delta>0?'turn-next':'turn-prev');state.page=next;render();setTimeout(()=>els.reader.classList.remove('turn-next','turn-prev'),300);}
function jump(p){state.panX=state.panY=0;state.page=clamp(Math.round(p||1),1,maxPage());render();}
function setZoom(z){state.zoom=clamp(Math.round(z*100)/100,1,4);if(state.zoom===1){state.panX=0;state.panY=0;}render();}

function openSheet(name){closeSheets(false);const sheet=$('sheet-'+name);if(!sheet)return;els.backdrop.classList.add('open');sheet.classList.add('open');if(name==='thumbs')ensureThumbs();if(name==='bookmarks')renderBookmarks();if(name==='search')setTimeout(()=>els.searchInput.focus(),160);}
function closeSheets(hideBackdrop=true){document.querySelectorAll('.sheet.open').forEach(s=>s.classList.remove('open'));if(hideBackdrop)els.backdrop.classList.remove('open');}
async function resolveOutlinePage(item){try{const dest=typeof item.dest==='string'?await state.pdf.getDestination(item.dest):item.dest;if(!dest||!dest[0])return null;return(await state.pdf.getPageIndex(dest[0]))+1;}catch(e){return null;}}
async function buildToc(){
  let rows=[];try{const outline=await state.pdf.getOutline();async function walk(items,depth){for(const item of items||[]){const p=await resolveOutlinePage(item);if(p)rows.push({title:item.title||`ページ ${p}`,page:p,depth});if(item.items&&item.items.length)await walk(item.items,depth+1);}}await walk(outline||[],0);}catch(e){}
  if(!rows.length&&Array.isArray(doc.toc))rows=doc.toc.map(x=>({title:x.title,page:x.page,depth:x.depth||0}));
  if(!rows.length){const stride=maxPage()<=20?2:maxPage()<=50?5:10;rows=[{title:'表紙',page:1,depth:0}];for(let p=1+stride;p<=maxPage();p+=stride)rows.push({title:`ページ ${p} から`,page:p,depth:0});}
  els.toc.innerHTML=rows.map(r=>`<button class="toc-item" data-page="${r.page}" style="padding-left:${10+r.depth*14}px"><span>${esc(r.title)}</span><span>P.${r.page}</span></button>`).join('');els.toc.querySelectorAll('[data-page]').forEach(b=>b.addEventListener('click',()=>{jump(Number(b.dataset.page));closeSheets();}));
}
function ensureThumbs(){
  if(els.thumbs.children.length)return;const frag=document.createDocumentFragment();
  for(let p=1;p<=maxPage();p++){const b=document.createElement('button');b.className='thumb';b.dataset.page=p;b.innerHTML=`<canvas class="thumb-canvas" width="120" height="160" aria-label="ページ ${p} のサムネイル"></canvas><span>${p}</span>`;b.addEventListener('click',()=>{jump(p);closeSheets();});frag.appendChild(b);}els.thumbs.appendChild(frag);
  if('IntersectionObserver'in window){state.thumbObserver=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){renderThumb(entry.target).catch(()=>{});state.thumbObserver.unobserve(entry.target);}});},{root:$('sheet-thumbs').querySelector('.sheet-body'),rootMargin:'180px'});els.thumbs.querySelectorAll('.thumb').forEach(t=>state.thumbObserver.observe(t));}
  else{Array.from(els.thumbs.querySelectorAll('.thumb')).slice(0,12).forEach(t=>renderThumb(t).catch(()=>{}));}
  markActiveThumb();
}
async function renderThumb(btn){if(btn.dataset.rendered)return;btn.dataset.rendered='1';const p=Number(btn.dataset.page),page=await state.pdf.getPage(p),base=page.getViewport({scale:1}),scale=Math.min(130/base.width,170/base.height),vp=page.getViewport({scale}),c=btn.querySelector('canvas');c.width=Math.max(1,Math.floor(vp.width));c.height=Math.max(1,Math.floor(vp.height));const ctx=c.getContext('2d',{alpha:false});await page.render({canvasContext:ctx,viewport:vp,intent:'display'}).promise;}
function markActiveThumb(){els.thumbs.querySelectorAll('.thumb').forEach(t=>{const p=Number(t.dataset.page);t.classList.toggle('active',p===state.page||(spread()&&p===state.page+1));});const active=els.thumbs.querySelector('.thumb.active');if(active&&$('sheet-thumbs').classList.contains('open'))active.scrollIntoView({block:'nearest',inline:'center'});}

async function getPageText(p){if(state.textCache.has(p))return state.textCache.get(p);const page=await state.pdf.getPage(p),tc=await page.getTextContent(),text=tc.items.map(i=>i.str).join(' ').replace(/\s+/g,' ').trim();state.textCache.set(p,text);return text;}
async function search(){
  const q=els.searchInput.value.trim().toLowerCase();if(!q){els.searchStatus.textContent='キーワードを入力してください';els.searchResults.innerHTML='';return;}
  els.searchResults.innerHTML='';const hits=[];
  for(let p=1;p<=maxPage();p++){els.searchStatus.textContent=`検索中… ${p} / ${maxPage()}ページ`;try{const text=await getPageText(p),low=text.toLowerCase(),idx=low.indexOf(q);if(idx>=0){const s=Math.max(0,idx-36),e=Math.min(text.length,idx+q.length+55);hits.push({page:p,snippet:(s?'…':'')+text.slice(s,e)+(e<text.length?'…':'')});}}catch(e){}await new Promise(r=>setTimeout(r,0));}
  els.searchStatus.textContent=`${hits.length}件見つかりました`;els.searchResults.innerHTML=hits.length?hits.map(h=>`<button class="search-item" data-page="${h.page}"><div><strong>ページ ${h.page}</strong><div class="search-snippet">${esc(h.snippet)}</div></div><span><i class="ti ti-chevron-right"></i></span></button>`).join(''):'<div class="empty">該当するページがありません。</div>';els.searchResults.querySelectorAll('[data-page]').forEach(b=>b.addEventListener('click',()=>{jump(Number(b.dataset.page));closeSheets();}));
}
function cycleView(){state.view=state.view==='auto'?'single':state.view==='single'?'spread':'auto';els.viewLabel.textContent=state.view==='auto'?'表示：自動':state.view==='single'?'表示：1ページ':'表示：見開き';state.panX=state.panY=0;render();}
async function sharePage(){const url=location.href,data={title:doc.title,text:`${doc.title}（${state.page}ページ）`,url};try{if(navigator.share)await navigator.share(data);else if(navigator.clipboard){await navigator.clipboard.writeText(url);alert('このページのURLをコピーしました。');}else{prompt('このURLをコピーしてください',url);}}catch(e){if(e&&e.name!=='AbortError')alert('共有できませんでした。');}}
function toggleFullscreen(){const root=document.documentElement,req=root.requestFullscreen||root.webkitRequestFullscreen,exit=document.exitFullscreen||document.webkitExitFullscreen;if(!document.fullscreenElement&&!document.webkitFullscreenElement&&req){Promise.resolve(req.call(root)).catch(()=>{});}else if(exit){Promise.resolve(exit.call(document)).catch(()=>{});}}
function openJump(){if(!state.pdf)return;$('jump-input').max=maxPage();$('jump-input').value=state.page;$('jump-help').textContent=`1〜${maxPage()}ページの番号を入力してください。`;$('jump-wrap').classList.add('open');setTimeout(()=>$('jump-input').select(),60);}
function closeJump(){$('jump-wrap').classList.remove('open');}
function distance(a,b){return Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY);}

let lastTap=0;
els.stage.addEventListener('touchstart',e=>{
  if(e.touches.length===2){state.pinch={dist:distance(e.touches[0],e.touches[1]),startZoom:state.zoom,currentZoom:state.zoom};state.touch=null;return;}
  if(e.touches.length===1){const t=e.touches[0];state.touch={x:t.clientX,y:t.clientY,lastX:t.clientX,lastY:t.clientY,time:Date.now()};}
},{passive:true});
els.stage.addEventListener('touchmove',e=>{
  if(e.touches.length===2&&state.pinch){e.preventDefault();const d=distance(e.touches[0],e.touches[1]),next=clamp(state.pinch.startZoom*(d/state.pinch.dist),1,4);state.pinch.currentZoom=Math.round(next*100)/100;els.zoomValue.textContent=Math.round(state.pinch.currentZoom*100)+'%';applyPan(state.pinch.currentZoom/state.pinch.startZoom);return;}
  if(e.touches.length===1&&state.touch&&state.zoom>1){e.preventDefault();const t=e.touches[0];state.panX+=t.clientX-state.touch.lastX;state.panY+=t.clientY-state.touch.lastY;state.touch.lastX=t.clientX;state.touch.lastY=t.clientY;applyPan();}
},{passive:false});
els.stage.addEventListener('touchend',e=>{
  if(state.pinch&&e.touches.length<2){state.zoom=state.pinch.currentZoom;state.pinch=null;render();return;}
  if(!state.touch||!e.changedTouches.length)return;const t=e.changedTouches[0],dx=t.clientX-state.touch.x,dy=t.clientY-state.touch.y,dt=Date.now()-state.touch.time;state.touch=null;
  if(state.zoom>1){constrainPan();applyPan();return;}
  if(dt<650&&Math.abs(dx)>46&&Math.abs(dx)>Math.abs(dy)*1.2){go(dx<0?step():-step());return;}
  const now=Date.now();if(dt<260&&Math.abs(dx)<12&&Math.abs(dy)<12){if(now-lastTap<330){lastTap=0;setZoom(state.zoom>1?1:2);}else lastTap=now;}
},{passive:true});

$('back-btn').addEventListener('click',()=>location.href='shiryo.html');$('error-back').addEventListener('click',()=>location.href='shiryo.html');$('retry-btn').addEventListener('click',()=>boot());
$('prev-btn').addEventListener('click',()=>go(-step()));$('next-btn').addEventListener('click',()=>go(step()));$('prev-hit').addEventListener('click',()=>{if(state.zoom===1)go(-step());});$('next-hit').addEventListener('click',()=>{if(state.zoom===1)go(step());});
$('zoom-out').addEventListener('click',()=>setZoom(state.zoom-.25));$('zoom-in').addEventListener('click',()=>setZoom(state.zoom+.25));$('page-jump').addEventListener('click',openJump);$('jump-cancel').addEventListener('click',closeJump);$('jump-go').addEventListener('click',()=>{jump(Number($('jump-input').value));closeJump();});$('jump-input').addEventListener('keydown',e=>{if(e.key==='Enter')$('jump-go').click();});
els.bookmarkBtn.addEventListener('click',toggleBookmark);document.querySelectorAll('[data-open]').forEach(b=>b.addEventListener('click',()=>openSheet(b.dataset.open)));document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>closeSheets()));els.backdrop.addEventListener('click',()=>closeSheets());
$('search-btn').addEventListener('click',search);els.searchInput.addEventListener('keydown',e=>{if(e.key==='Enter')search();});$('view-btn').addEventListener('click',cycleView);$('share-btn').addEventListener('click',sharePage);$('fullscreen-btn').addEventListener('click',toggleFullscreen);$('jump-wrap').addEventListener('click',e=>{if(e.target===$('jump-wrap'))closeJump();});
if(!(document.documentElement.requestFullscreen||document.documentElement.webkitRequestFullscreen))$('fullscreen-btn').style.display='none';
window.addEventListener('resize',()=>{state.panX=state.panY=0;render();});window.addEventListener('keydown',e=>{if(e.key==='ArrowLeft')go(-step());else if(e.key==='ArrowRight')go(step());else if(e.key==='Home')jump(1);else if(e.key==='End')jump(maxPage());else if(e.key==='Escape'){closeSheets();closeJump();}});

async function boot(){
  if(!doc){showError();return;}els.title.textContent=doc.title;document.title=doc.title+'｜デジタルブック';els.pdf.href=doc.file;els.save.href=doc.file;els.errorPdf.href=doc.file;els.loading.style.display='flex';els.error.style.display='none';setProgress(4,'PDFを読み込んでいます…');
  if(!window.pdfjsLib){showError();return;}
  try{const task=pdfjsLib.getDocument({url:doc.file,cMapUrl:'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',cMapPacked:true,standardFontDataUrl:'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/standard_fonts/'});task.onProgress=p=>{if(p&&p.total){const n=(p.loaded/p.total)*100;setProgress(n,`${Math.round(n)}%`);}};state.pdf=await task.promise;state.page=clamp(state.page,1,maxPage());setProgress(100,'表示を準備しています…');await buildToc();renderBookmarks();await render();}
  catch(e){console.error(e);showError();}
}
boot();
})();
