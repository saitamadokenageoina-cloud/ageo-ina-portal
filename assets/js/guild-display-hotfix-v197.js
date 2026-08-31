/* DOKEN Guild display hotfix v197
 * - Preserve line breaks/paragraphs in post bodies when normalizing cloud data.
 * - Re-sync once after patching so already-loaded cloud posts are rendered correctly.
 * ES5 syntax only.
 */
(function(){
  'use strict';
  var patched=false;

  function cleanMultiline(value,max){
    var text=String(value==null?'':value);
    text=text.replace(/\r\n?/g,'\n');
    text=text.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g,' ');
    text=text.replace(/[ \t]+\n/g,'\n').replace(/\n[ \t]+/g,'\n');
    text=text.replace(/\n{3,}/g,'\n\n').trim();
    return text.slice(0,max);
  }

  function patch(){
    var original;
    if(patched||typeof window.normalizePost!=='function')return;
    original=window.normalizePost;
    window.normalizePost=function(post){
      var normalized=original(post),body;
      if(!normalized||!post)return normalized;
      body=cleanMultiline(post.body,1200);
      if(body)normalized.body=body;
      return normalized;
    };
    patched=true;
    if(typeof window.syncPosts==='function')window.syncPosts();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',patch);else setTimeout(patch,0);
})();
