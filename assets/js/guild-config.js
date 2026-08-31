window.DOKEN_GUILD_CONFIG={apiUrl:'https://script.google.com/macros/s/AKfycbxSyE47dgEqRzugYnufktKxlCx5KMrU_DNDovymGrDX4XPwRhPGrxZbGMpr885WHO2O/exec',notifyEmail:'ageoina@saitama-doken.or.jp'};

/* DOKEN Guild v199 + readable-template v200 bootstrap.
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
      link.href='assets/css/guild-v195.css?v=188';
      document.head.appendChild(link);
    }
    if(!document.getElementById('guild-canonical-v199')){
      script=document.createElement('script');
      script.id='guild-canonical-v199';
      script.src='assets/js/guild-canonical-v199.js?v=188';
      document.body.appendChild(script);
    }
    if(!document.getElementById('guild-template-v200')){
      script=document.createElement('script');
      script.id='guild-template-v200';
      script.src='assets/js/guild-template-v200.js?v=188';
      document.body.appendChild(script);
    }
  }
  if(document.readyState==='complete')loadAssets();else window.addEventListener('load',loadAssets);
})();
