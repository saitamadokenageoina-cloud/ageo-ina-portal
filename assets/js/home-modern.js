(function(){
  'use strict';

  function installCalendarImage(){
    var section=document.getElementById('nichijo');
    var card,top,img;
    if(!section)return false;
    card=section.querySelector('a[href$="calendar.html"]');
    if(!card)card=section.querySelector('.mc');
    if(!card)return false;
    top=card.querySelector('.mc-top');
    if(!top)return false;
    img=top.querySelector('.calendar-card-real-img');
    if(img)return true;
    while(top.firstChild)top.removeChild(top.firstChild);
    top.style.setProperty('background','none','important');
    top.style.setProperty('background-image','none','important');
    top.style.setProperty('background-color','#f7e6c4','important');
    top.style.setProperty('padding','0','important');
    top.style.setProperty('overflow','hidden','important');
    top.style.setProperty('position','relative','important');
    img=document.createElement('img');
    img.src='assets/illustrations/home-3d/calendar-v176.jpg?v=178';
    img.alt='';
    img.setAttribute('aria-hidden','true');
    img.className='calendar-card-real-img';
    img.style.setProperty('display','block','important');
    img.style.setProperty('position','absolute','important');
    img.style.setProperty('inset','0','important');
    img.style.setProperty('width','100%','important');
    img.style.setProperty('height','100%','important');
    img.style.setProperty('max-width','none','important');
    img.style.setProperty('object-fit','cover','important');
    img.style.setProperty('object-position','center','important');
    img.style.setProperty('opacity','1','important');
    img.style.setProperty('visibility','visible','important');
    img.style.setProperty('z-index','999','important');
    top.appendChild(img);
    return true;
  }

  function watchForCalendar(){
    var observer,tries=0,timer;
    if(installCalendarImage())return;
    if(window.MutationObserver){
      observer=new MutationObserver(function(){
        if(installCalendarImage())observer.disconnect();
      });
      observer.observe(document.documentElement,{childList:true,subtree:true});
      window.setTimeout(function(){observer.disconnect();},10000);
    }
    timer=window.setInterval(function(){
      tries+=1;
      if(installCalendarImage()||tries>=40)window.clearInterval(timer);
    },250);
  }

  function startWatcher(){
    if(document.readyState==='loading'){
      document.addEventListener('DOMContentLoaded',watchForCalendar);
    }else{
      watchForCalendar();
    }
  }

  var legacy=document.createElement('script');
  legacy.src='assets/js/home-modern-legacy-v177.js?v=178';
  legacy.onload=function(){installCalendarImage();};
  legacy.onerror=function(){watchForCalendar();};
  document.body.appendChild(legacy);
  startWatcher();
})();
