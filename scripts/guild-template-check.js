'use strict';

var fs=require('fs');
var vm=require('vm');
var src=fs.readFileSync('assets/js/guild-template-v200.js','utf8');
var failures=[];
function equal(actual,expected,message){if(actual!==expected)failures.push(message+' (actual='+JSON.stringify(actual)+', expected='+JSON.stringify(expected)+')');}
function assert(condition,message){if(!condition)failures.push(message);}
var context={
  window:{generatePostTemplate:function(){}},
  document:{readyState:'complete',getElementById:function(){return null;}},
  setTimeout:function(){},alert:function(){},
  PURPOSE:{seek_help:{cat:'jinzai'}}
};
context.window.addEventListener=function(){};
vm.createContext(context);
try{vm.runInContext(src,context,{filename:'guild-template-v200.js'});}catch(error){failures.push('テンプレート補助JSの評価に失敗: '+error.stack);}
var helper=context.window.DOKEN_GUILD_TEMPLATE_V200||{};
var generated=helper.buildTemplate&&helper.buildTemplate('seek_help',{area:'上尾市',workDate:'9/3',workTime:'8:00〜17:00',trade:'大工',people:2,conditions:'経験者'});
equal(generated,'上尾市で大工を2人募集しています。\n\n作業日：9/3\n時間：8:00〜17:00\n条件：経験者\n\n詳しくは支部を通じてお問い合わせください。','人材募集の自動文章が読みやすい段落になっていません');
equal(helper.buildTemplate&&helper.buildTemplate('offer_help',{area:'伊奈町',workDate:'',workTime:'',trade:'大工',people:0,conditions:''}),'伊奈町で大工の応援に行けます。\n\n詳しくは支部を通じてお問い合わせください。','応援可能の文章が不自然です');
equal(helper.buildTemplate&&helper.buildTemplate('give_material',{area:'上尾市',workDate:'',workTime:'',trade:'',people:0,conditions:''}),'上尾市で資材・道具をお譲りします。\n\n詳しくは支部を通じてお問い合わせください。','資材投稿の文章が不自然です');
assert(src.indexOf('window.generatePostTemplate=generateReadablePostTemplate')!==-1,'実際の文章生成ボタンへv200を接続していません');
if(failures.length){failures.forEach(function(message){console.error('FAIL: '+message);});process.exit(1);}
console.log('DOKEN Guild template paragraph regression check: OK');
