(function(){
  'use strict';
  var home=document.createElement('script');
  var palette=document.createElement('link');
  home.src='assets/js/home-modern-legacy-v177.js?v=188';
  palette.rel='stylesheet';
  palette.href='assets/css/home-semantic-palette.css?v=188';
  document.body.appendChild(home);
  document.head.appendChild(palette);

  /* iPhone/PWAで横スクロール内の「資料本棚」がタップ扱いにならない場合の保険。
     指の移動が小さいときだけ明示的に遷移し、横スワイプはそのまま許可する。 */
  function findBookshelfLink(node){
    while(node && node!==document){
      if(node.tagName && node.tagName.toLowerCase()==='a'){
        var href=node.getAttribute('href') || '';
        if(href==='shiryo.html' || /\/shiryo\.html(?:[?#]|$)/.test(node.href || '')) return node;
      }
      node=node.parentNode;
    }
    return null;
  }

  var touchState=null;
  document.addEventListener('touchstart',function(event){
    var link=findBookshelfLink(event.target);
    if(!link || !event.touches || event.touches.length!==1){ touchState=null; return; }
    touchState={link:link,x:event.touches[0].clientX,y:event.touches[0].clientY};
  },{capture:true,passive:true});

  document.addEventListener('touchend',function(event){
    if(!touchState || !event.changedTouches || !event.changedTouches.length){ touchState=null; return; }
    var link=findBookshelfLink(event.target);
    var point=event.changedTouches[0];
    var dx=Math.abs(point.clientX-touchState.x);
    var dy=Math.abs(point.clientY-touchState.y);
    var shouldOpen=link===touchState.link && dx<12 && dy<12;
    touchState=null;
    if(shouldOpen) window.location.assign('shiryo.html');
  },{capture:true,passive:true});

  document.addEventListener('click',function(event){
    var link=findBookshelfLink(event.target);
    if(!link) return;
    event.preventDefault();
    event.stopPropagation();
    window.location.assign('shiryo.html');
  },true);
})();
