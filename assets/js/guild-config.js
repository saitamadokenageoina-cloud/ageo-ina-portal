window.DOKEN_GUILD_CONFIG={apiUrl:'https://script.google.com/macros/s/AKfycbxSyE47dgEqRzugYnufktKxlCx5KMrU_DNDovymGrDX4XPwRhPGrxZbGMpr885WHO2O/exec',notifyEmail:'ageoina@saitama-doken.or.jp'};

/* DOKEN Guild v198 bootstrap.
 * The page's built-in submitPost remains the canonical new-post implementation.
 * Enhancements load only after window.load, after guild.html has defined its core functions.
 */
(function(){
  'use strict';
  function loadAssets(){
    var link,script;
    if(!document.getElementById('guild-v195-css')){
      link=document.createElement('link');
      link.id='guild-v195-css';
      link.rel='stylesheet';
      link.href='assets/css/guild-v195.css?v=186';
      document.head.appendChild(link);
    }
    if(!document.getElementById('guild-canonical-v198')){
      script=document.createElement('script');
      script.id='guild-canonical-v198';
      script.src='assets/js/guild-canonical-v198.js?v=186';
      document.body.appendChild(script);
    }
  }
  if(document.readyState==='complete')loadAssets();else window.addEventListener('load',loadAssets);
})();
