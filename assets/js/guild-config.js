window.DOKEN_GUILD_CONFIG={apiUrl:'https://script.google.com/macros/s/AKfycbxSyE47dgEqRzugYnufktKxlCx5KMrU_DNDovymGrDX4XPwRhPGrxZbGMpr885WHO2O/exec',notifyEmail:'ageoina@saitama-doken.or.jp'};

/* Hotfix v196: keep the visual guild stylesheet, but do not load the v194/v195
 * admin enhancement scripts that can interfere with the standard submit flow.
 * The canonical submitPost() in guild.html remains the only handler for new posts.
 */
(function(){
  'use strict';
  function loadCss(){
    var link;
    if(document.getElementById('guild-v195-css'))return;
    link=document.createElement('link');
    link.id='guild-v195-css';
    link.rel='stylesheet';
    link.href='assets/css/guild-v195.css?v=186';
    document.head.appendChild(link);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',loadCss);else loadCss();
})();
