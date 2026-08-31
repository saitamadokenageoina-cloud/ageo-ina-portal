'use strict';

var fs=require('fs');
var vm=require('vm');
var src=fs.readFileSync('assets/js/guild-update-compat-v201.js','utf8');
var failures=[];
function assert(condition,message){if(!condition)failures.push(message);}
function equal(actual,expected,message){if(actual!==expected)failures.push(message+' (actual='+JSON.stringify(actual)+', expected='+JSON.stringify(expected)+')');}
var calls=[],updateError='unknown action';
function backend(action,payload){
  calls.push({action:action,payload:payload});
  if(action==='updatePost')return Promise.reject(new Error(updateError));
  if(action==='create')return Promise.resolve({ok:true,post:{id:999}});
  if(action==='delete')return Promise.resolve({ok:true});
  return Promise.resolve({ok:true});
}
var context={
  console:console,Promise:Promise,Math:Math,Date:Date,setTimeout:setTimeout,
  document:{readyState:'complete'},
  window:{guildWrite:backend,addEventListener:function(){}},
  posts:[{id:1,cat:'jinzai',emoji:'👷',name:'大工A',area:'上尾市',body:'旧本文',tags:['上尾市'],purpose:'seek_help',urgent:false,workDate:'',workTime:'',trade:'大工',people:1,conditions:'',expiryOption:'7d',expiresAt:'',comments:[],workflow:'unhandled'}],
  expiryCompatibilityTag:function(){return '__dx:3m:12345';},
  setStatus:function(){}
};
context.window.window=context.window;
vm.createContext(context);
try{vm.runInContext(src,context,{filename:'guild-update-compat-v201.js'});}catch(error){failures.push('互換JSの評価に失敗: '+error.stack);}
(async function(){
  var payload={postId:1,adminPin:'9863',changes:{cat:'jinzai',name:'大工A',tel:'090-1234-5678',area:'伊奈町',body:'1行目\u2028\u20282行目',tags:['伊奈町','人材・仕事'],purpose:'seek_help',urgent:true,workDate:'2026-09-03',workTime:'8:00〜17:00',trade:'大工',people:2,conditions:'経験者',expiryOption:'3m',expiresAt:'2026-12-01T00:00:00.000Z',imageData:''}};
  try{await context.window.guildWrite('updatePost',payload);}catch(error){failures.push('unknown action時の互換更新に失敗: '+error.stack);}
  equal(calls.map(function(item){return item.action;}).join(','),'updatePost,create,delete','旧バックエンド時に updatePost→create→delete の順で処理していません');
  assert(calls[1]&&calls[1].payload&&calls[1].payload.post,'互換作成データがありません');
  equal(calls[1].payload.post.tel,'090-1234-5678','非公開電話番号を互換更新へ引き継いでいません');
  equal(calls[1].payload.post.body,'1行目\u2028\u20282行目','段落互換本文をそのまま引き継いでいません');
  assert(/\|__dx:3m:12345$/.test(calls[1].payload.post.clientId),'長期掲載期限の互換トークンを引き継いでいません');
  equal(calls[1].payload.notifyEmail,'','旧バックエンド互換作成でブラウザ通知先を抑制していません');
  equal(calls[2].payload.postId,1,'互換作成後に元投稿を削除していません');

  calls=[];updateError='invalid admin pin';
  var rejected=false;
  try{await context.window.guildWrite('updatePost',payload);}catch(error){rejected=true;equal(error.message,'invalid admin pin','管理者エラーを書き換えています');}
  assert(rejected,'管理者PINエラーを成功扱いしています');
  equal(calls.map(function(item){return item.action;}).join(','),'updatePost','unknown action以外で互換作成を実行しています');

  if(failures.length){failures.forEach(function(message){console.error('FAIL: '+message);});process.exit(1);}
  console.log('DOKEN Guild admin update compatibility check: OK');
})().catch(function(error){console.error(error);process.exit(1);});
