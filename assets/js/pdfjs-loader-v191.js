(function(){
'use strict';
if(window.DOKEN_PDFJS_READY)return;
var sources=[
  {js:'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',worker:'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'},
  {js:'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js',worker:'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js'},
  {js:'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.min.js',worker:'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js'}
];
function activate(source){
  if(!window.pdfjsLib)throw new Error('PDF.js did not initialize');
  window.pdfjsLib.GlobalWorkerOptions.workerSrc=source.worker;
  window.DOKEN_PDFJS_WORKER_SRC=source.worker;
  return window.pdfjsLib;
}
function load(index){
  if(window.pdfjsLib)return Promise.resolve(activate(sources[0]));
  if(index>=sources.length)return Promise.reject(new Error('PDF.jsを読み込めませんでした'));
  return new Promise(function(resolve,reject){
    var script=document.createElement('script');
    var source=sources[index];
    script.src=source.js;
    script.async=true;
    script.setAttribute('data-pdfjs-source',String(index));
    script.onload=function(){
      try{resolve(activate(source));}catch(e){reject(e);}
    };
    script.onerror=function(){
      script.remove();
      load(index+1).then(resolve,reject);
    };
    document.head.appendChild(script);
  }).catch(function(error){
    if(index+1<sources.length&&!window.pdfjsLib)return load(index+1);
    throw error;
  });
}
window.DOKEN_PDFJS_READY=load(0);
})();
