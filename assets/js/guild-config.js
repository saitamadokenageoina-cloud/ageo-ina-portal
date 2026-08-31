window.DOKEN_GUILD_CONFIG={apiUrl:'https://script.google.com/macros/s/AKfycbxSyE47dgEqRzugYnufktKxlCx5KMrU_DNDovymGrDX4XPwRhPGrxZbGMpr885WHO2O/exec',notifyEmail:'ageoina@saitama-doken.or.jp'};

/* Hotfix v197: keep the visual guild stylesheet without loading the admin
 * enhancement scripts that interfered with standard posting. Also load the
 * isolated display patch that preserves multiline post bodies.
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
    if(!document.getElementById('guild-display-hotfix-v197')){
      script=document.createElement('script');
      script.id='guild-display-hotfix-v197';
      script.src='assets/js/guild-display-hotfix-v197.js?v=186';
      document.body.appendChild(script);
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',loadAssets);else loadAssets();
})();
