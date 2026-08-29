(function(){
  'use strict';
  function installCalendarImage(){
    var section=document.getElementById('nichijo');
    var card,top,img;
    if(!section)return;
    card=section.querySelector('.mc');
    if(!card)return;
    top=card.querySelector('.mc-top');
    if(!top)return;
    while(top.firstChild)top.removeChild(top.firstChild);
    top.style.setProperty('background-image','none','important');
    top.style.setProperty('background-color','#f7e6c4','important');
    top.style.setProperty('padding','0','important');
    top.style.setProperty('overflow','hidden','important');
    img=document.createElement('img');
    img.src='assets/illustrations/home-3d/calendar-v176.jpg?v=177';
    img.alt='';
    img.setAttribute('aria-hidden','true');
    img.className='calendar-card-real-img';
    img.style.setProperty('display','block','important');
    img.style.setProperty('width','100%','important');
    img.style.setProperty('height','100%','important');
    img.style.setProperty('object-fit','cover','important');
    img.style.setProperty('object-position','center','important');
    img.style.setProperty('position','relative','important');
    img.style.setProperty('z-index','20','important');
    top.appendChild(img);
  }
  function afterLegacy(){
    if(document.readyState==='loading'){
      document.addEventListener('DOMContentLoaded',function(){window.setTimeout(installCalendarImage,0);});
    }else{
      window.setTimeout(installCalendarImage,0);
    }
  }
  var legacy=document.createElement('script');
  legacy.src='assets/js/home-modern-legacy-v177.js';
  legacy.onload=afterLegacy;
  document.body.appendChild(legacy);
})();
