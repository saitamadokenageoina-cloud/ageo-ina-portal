window.DOKEN_GUILD_CONFIG = {
  apiUrl: 'https://script.google.com/macros/s/AKfycbxSyE47dgEqRzugYnufktKxlCx5KMrU_DNDovymGrDX4XPwRhPGrxZbGMpr885WHO2O/exec',
  notifyEmail: 'ageoina@saitama-doken.or.jp'
};

/* Guild usability enhancements v193
 * - 投稿本文の改行・段落を保持
 * - 掲載期限を1/2/3/6か月、1年、無期限まで拡張
 * - 管理者モードで投稿本文・地域・現場情報・掲載期限を編集
 * ES5 syntax only.
 */
(function(){
  'use strict';
  var expiryLabels={'24h':'24時間','48h':'48時間','3d':'3日','7d':'7日','14d':'14日','workdate':'作業日まで','1m':'1か月','2m':'2か月','3m':'3か月','6m':'6か月','1y':'1年','unlimited':'無期限'};
  function addStyle(){var style=document.createElement('style');style.textContent='.post-body{white-space:pre-wrap!important;word-break:break-word}.admin-edit-btn{border-color:#8DB7D8!important;color:#165F8F!important;background:#F2F8FC!important}.admin-edit-btn:hover{background:#E4F1FA!important;border-color:#397FAF!important}html[data-theme="dark"] .admin-edit-btn{background:#15314A!important;color:#9DD6FA!important;border-color:#477C9E!important}';document.head.appendChild(style);}
  function addExpiryOptions(){var select=document.getElementById('post-expiry');if(!select||select.querySelector('option[value="1m"]'))return;var items=[['1m','1か月'],['2m','2か月'],['3m','3か月'],['6m','6か月'],['1y','1年'],['unlimited','無期限']],i,opt;for(i=0;i<items.length;i++){opt=document.createElement('option');opt.value=items[i][0];opt.textContent=items[i][1];select.appendChild(opt);}}
  function expiryDate(option,workDate){var now=new Date(),d=new Date(now.getTime());if(option==='unlimited')return '';if(option==='workdate'&&/^\d{4}-\d{2}-\d{2}$/.test(workDate||''))return new Date(workDate+'T23:59:59+09:00').toISOString();if(option==='24h')d.setDate(d.getDate()+1);else if(option==='48h')d.setDate(d.getDate()+2);else if(option==='3d')d.setDate(d.getDate()+3);else if(option==='7d')d.setDate(d.getDate()+7);else if(option==='14d')d.setDate(d.getDate()+14);else if(option==='1m')d.setMonth(d.getMonth()+1);else if(option==='2m')d.setMonth(d.getMonth()+2);else if(option==='3m')d.setMonth(d.getMonth()+3);else if(option==='6m')d.setMonth(d.getMonth()+6);else if(option==='1y')d.setFullYear(d.getFullYear()+1);else d.setDate(d.getDate()+7);return d.toISOString();}
  function findPost(id){var i;if(typeof posts==='undefined'||!posts)return null;for(i=0;i<posts.length;i++){if(Number(posts[i].id)===Number(id))return posts[i];}return null;}
  function promptValue(label,value){var result=window.prompt(label,value==null?'':String(value));return result===null?null:result.trim();}
  function chooseExpiry(current){var text='掲載期限を入力してください。\n\n24h = 24時間\n48h = 48時間\n3d = 3日\n7d = 7日\n14d = 14日\n1m = 1か月\n2m = 2か月\n3m = 3か月\n6m = 6か月\n1y = 1年\nunlimited = 無期限\nworkdate = 作業日まで',value=window.prompt(text,current||'7d');if(value===null)return null;value=value.trim().toLowerCase();if(!expiryLabels[value]){alert('掲載期限の入力が正しくありません。');return chooseExpiry(current);}return value;}
  window.guildAdminEditPost=function(id){
    if(typeof isAdmin==='undefined'||!isAdmin){alert('管理者モードで利用してください。');return;}
    var post=findPost(id),body,area,workDate,workTime,trade,people,conditions,expiry,updated;if(!post)return;
    body=promptValue('投稿本文を編集してください。\n改行はそのまま表示されます。',post.body);if(body===null)return;if(!body){alert('投稿本文は空欄にできません。');return;}
    area=promptValue('地域・場所を編集してください。',post.area);if(area===null)return;
    workDate=post.workDate||'';workTime=post.workTime||'';trade=post.trade||'';people=post.people||'';conditions=post.conditions||'';
    if(post.cat==='jinzai'){workDate=promptValue('作業日（YYYY-MM-DD）を編集してください。空欄でも構いません。',workDate);if(workDate===null)return;workTime=promptValue('作業時間を編集してください。',workTime);if(workTime===null)return;trade=promptValue('職種を編集してください。',trade);if(trade===null)return;people=promptValue('必要人数を編集してください。',people);if(people===null)return;conditions=promptValue('条件・備考を編集してください。',conditions);if(conditions===null)return;}
    expiry=chooseExpiry(post.expiryOption==='legacy'?'7d':post.expiryOption);if(expiry===null)return;
    updated={body:body,area:area,workDate:workDate,workTime:workTime,trade:trade,people:people===''?null:Number(people),conditions:conditions,expiryOption:expiry,expiresAt:expiryDate(expiry,workDate)};
    if(!confirm('この内容で投稿を更新しますか？'))return;
    if(typeof setStatus==='function')setStatus('投稿を更新中...');
    guildWrite('updatePost',{postId:id,changes:updated,adminPin:adminPinValue}).then(function(){if(typeof setStatus==='function')setStatus('投稿内容を更新しました。');if(typeof syncPosts==='function')return syncPosts();}).catch(function(e){console.error(e);alert('投稿を編集できませんでした。管理者権限または通信環境を確認してください。');if(typeof syncPosts==='function')return syncPosts();});
  };
  function addEditButtons(){var cards,i,card,actions,id,btn;if(typeof isAdmin==='undefined'||!isAdmin)return;cards=document.querySelectorAll('.post-card[id^="pc-"]');for(i=0;i<cards.length;i++){card=cards[i];if(card.querySelector('.admin-edit-btn'))continue;id=Number(card.id.replace('pc-',''));actions=card.querySelector('.post-actions');if(!actions||!id)continue;btn=document.createElement('button');btn.type='button';btn.className='post-btn admin-edit-btn';btn.innerHTML='<i class="ti ti-edit"></i>投稿を編集';(function(postId,button){button.onclick=function(){window.guildAdminEditPost(postId);};})(id,btn);actions.appendChild(btn);}}
  function patchExpiryCalculation(){if(typeof window.calculateExpiry==='function')window.calculateExpiry=function(option,workDate){return expiryDate(option,workDate);};if(typeof window.needsExpiryReview==='function'){var originalNeedsReview=window.needsExpiryReview;window.needsExpiryReview=function(post){if(post&&post.expiryOption==='unlimited')return false;return originalNeedsReview(post);};}}
  function init(){addStyle();addExpiryOptions();patchExpiryCalculation();addEditButtons();var observer=new MutationObserver(function(){addExpiryOptions();addEditButtons();});observer.observe(document.body,{childList:true,subtree:true});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();