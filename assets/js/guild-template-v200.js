/* DOKEN Guild readable post-template helper v200.
 * Keeps the stable v199 posting/admin paths untouched and only improves
 * the optional "入力内容から文章を作る" helper.
 * ES5 syntax only for older iPhone PWA compatibility.
 */
(function(){
'use strict';
var initialized=false;
function el(id){return document.getElementById(id);}
function value(id){var node=el(id);return node?String(node.value||'').trim():'';}
function formatDate(valueText){
  var match;
  if(typeof formatWorkDate==='function')return formatWorkDate(valueText);
  match=String(valueText||'').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return match?Number(match[2])+'/'+Number(match[3]):String(valueText||'');
}
function buildActionLine(purpose,data){
  var text='',count=Number(data.people)||0,prefix=data.area?data.area+'で':'';
  if(purpose==='seek_help'){
    if(data.trade)text=data.trade+(count>0?'を'+count+'人':'')+'募集しています。';
    else text='応援に来ていただける方'+(count>0?'を'+count+'人':'')+'募集しています。';
  }else if(purpose==='offer_help'){
    text=data.trade?data.trade+'の応援に行けます。':'現場の応援に行けます。';
  }else if(purpose==='request_work'){
    text=data.trade?data.trade+'の仕事をお願いしたいです。':'仕事をお願いしたいです。';
  }else if(purpose==='offer_work'){
    text=data.trade?data.trade+'の仕事を請けられます。':'仕事を請けられます。';
  }else if(purpose==='give_material'){
    text='資材・道具をお譲りします。';
  }else if(purpose==='seek_material'){
    text='資材・道具を探しています。';
  }else if(purpose==='share'){
    text='相談・情報を共有します。';
  }
  return prefix+text;
}
function buildTemplate(purpose,data){
  var lines=[buildActionLine(purpose,data)],hasDetails=Boolean(data.workDate||data.workTime||data.conditions);
  if(hasDetails)lines.push('');
  if(data.workDate)lines.push('作業日：'+data.workDate);
  if(data.workTime)lines.push('時間：'+data.workTime);
  if(data.conditions)lines.push('条件：'+data.conditions);
  lines.push('','詳しくは支部を通じてお問い合わせください。');
  return lines.join('\n');
}
function generateReadablePostTemplate(){
  var body=el('post-body'),purpose,isJob,data,people;
  if(!body)return;
  if(String(body.value||'').trim()){
    alert('入力済みの投稿内容は上書きしません。内容を消してからお試しください。');
    return;
  }
  purpose=typeof selectedPurpose!=='undefined'?selectedPurpose:'';
  if(!purpose||typeof PURPOSE==='undefined'||!PURPOSE[purpose]){
    alert('「何をしたいですか？」を選択してください');
    return;
  }
  isJob=PURPOSE[purpose].cat==='jinzai';
  people=Number(value('post-people'));
  data={
    area:value('post-area'),
    workDate:isJob?formatDate(value('post-work-date')):'',
    workTime:isJob?value('post-work-time'):'',
    trade:isJob?value('post-trade'):'',
    people:isJob&&Number.isInteger(people)&&people>0?people:0,
    conditions:isJob?value('post-conditions'):''
  };
  body.value=buildTemplate(purpose,data);
  if(typeof saveGuildDraft==='function')saveGuildDraft();
  if(typeof body.focus==='function')body.focus();
}
if(typeof window!=='undefined')window.DOKEN_GUILD_TEMPLATE_V200={buildActionLine:buildActionLine,buildTemplate:buildTemplate};
function init(){
  if(initialized)return;
  if(typeof window==='undefined'||typeof window.generatePostTemplate!=='function'||typeof PURPOSE==='undefined'){
    setTimeout(init,50);
    return;
  }
  initialized=true;
  window.generatePostTemplate=generateReadablePostTemplate;
}
if(document.readyState==='complete')init();else window.addEventListener('load',init);
})();
