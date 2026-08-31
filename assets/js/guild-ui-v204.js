/* DOKEN Guild UI cleanup v204
 * Keep legacy DOM nodes for existing JavaScript compatibility, but hide
 * the summary and search controls requested to be removed from the UI.
 */
(function(){
  'use strict';
  function hideElement(selector){
    var node=document.querySelector(selector);
    if(node&&node.style&&node.style.setProperty){
      node.style.setProperty('display','none','important');
      node.setAttribute('aria-hidden','true');
    }
  }
  function applyGuildUiCleanup(){
    hideElement('.premium-summary');
    hideElement('.search-panel');
  }
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',applyGuildUiCleanup);
  }else{
    applyGuildUiCleanup();
  }
  window.addEventListener('load',applyGuildUiCleanup);
  window.addEventListener('pageshow',applyGuildUiCleanup);
})();
