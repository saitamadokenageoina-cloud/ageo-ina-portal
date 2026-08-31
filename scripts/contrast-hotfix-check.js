'use strict';

var fs=require('fs');
var failures=[];
function read(path){return fs.readFileSync(path,'utf8');}
function assert(condition,message){if(!condition)failures.push(message);}
function luminance(hex){
  var raw=hex.replace('#','');
  var rgb=[0,2,4].map(function(i){return parseInt(raw.slice(i,i+2),16)/255;});
  var linear=rgb.map(function(c){return c<=0.04045?c/12.92:Math.pow((c+0.055)/1.055,2.4);});
  return 0.2126*linear[0]+0.7152*linear[1]+0.0722*linear[2];
}
function contrast(a,b){
  var la=luminance(a),lb=luminance(b),hi=Math.max(la,lb),lo=Math.min(la,lb);
  return (hi+0.05)/(lo+0.05);
}

var loader=read('assets/css/paypay-tabs.css');
var css=read('assets/css/contrast-hotfix-v205.css');
assert(loader.indexOf("@import url('./contrast-hotfix-v205.css?v=205');")!==-1,'v205コントラストCSSが共通スタイルチェーンの最後に読み込まれていません');
assert(css.indexOf('html[data-theme="light"] .result-principle small')!==-1,'AI名刺の説明文コントラスト修正がありません');
assert(css.indexOf('html[data-theme="light"] .cta small')!==-1,'労働者供給事業CTAの説明文コントラスト修正がありません');
assert(css.indexOf('footer [data-app-version]')!==-1,'フッターのアプリ版数コントラスト修正がありません');
assert(css.indexOf('-webkit-text-fill-color')!==-1,'iPhone Safari向け文字色固定がありません');
assert(contrast('#F3F8FE','#183E63')>=4.5,'AI名刺の補助文がWCAG AA相当のコントラストを満たしません');
assert(contrast('#F7FAFC','#1D63AF')>=4.5,'労働者供給事業CTAの補助文がWCAG AA相当のコントラストを満たしません');
assert(contrast('#CBD5E1','#1B2A3B')>=4.5,'フッター版数表示がWCAG AA相当のコントラストを満たしません');

if(failures.length){failures.forEach(function(message){console.error('FAIL: '+message);});process.exit(1);}
console.log('Portal contrast hotfix regression check: OK');
