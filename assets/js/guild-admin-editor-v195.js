/* DOKEN Guild admin editor v195
 * Uses the existing post form for administrator edits.
 * Keeps delete independent from expiry-review actions.
 * ES5 syntax only.
 */
(function(){
  'use strict';
  var editingId=0;
  var busyDelete={};
  var originalSubmit=null;
  var originalClose=null;

  function byId(id){return document.getElementById(id);}
  function postById(id){var i;if(typeof posts==='undefined'||!posts)return null;for(i=0;i<posts.length;i++){if(Number(posts[i].id)===Number(id))return posts[i];}return null;}
  function setValue(id,value){var el=byId(id);if(el)el.value=value==null?'':String(value);}
  function setChecked(id,value){var el=byId(id);if(el)el.checked=Boolean(value);}
  function selectPurposeValue(value){var btn=document.querySelector('.purpose-btn[data-purpose="'+value+'"]');if(btn&&typeof selectPurpose==='function')selectPurpose(btn);}
  function selectCategoryValue(value){var btn=document.querySelector('.cat-chip.'+value);if(btn&&typeof selCat==='function')selCat(value,btn);}
  function clearEditState(){editingId=0;var modal=byId('modal'),title,submit,cancel;if(!modal)return;modal.classList.remove('admin-edit-mode');title=modal.querySelector('.modal-title');submit=modal.querySelector('.btn-primary');cancel=modal.querySelector('.btn-secondary');if(title)title.textContent='新しく投稿する';if(submit)submit.innerHTML='<i class="ti ti-send"></i>投稿する';if(cancel)cancel.textContent='キャンセル';}
  function fillEditor(post){
    if(!post)return;
    if(post.purpose)selectPurposeValue(post.purpose);else if(post.cat)selectCategoryValue(post.cat);
    setChecked('post-urgent',post.urgent);
    setValue('post-work-date',post.workDate);
    setValue('post-work-time',post.workTime);
    setValue('post-trade',post.trade);
    setValue('post-people',post.people);
    setValue('post-conditions',post.conditions);
    setValue('post-area',post.area);
    setValue('post-name',post.name);
    setValue('post-tel',post.tel);
    setValue('post-expiry',post.expiryOption&&post.expiryOption!=='legacy'?post.expiryOption:'7d');
    setValue('post-body',post.body);
    if(post.imageData){preparedPhoto=post.imageData;var image=byId('photo-preview-img'),preview=byId('photo-preview');if(image)image.src=post.imageData;if(preview)preview.classList.add('show');}
    else if(typeof clearPhoto==='function')clearPhoto();
  }
  function editorPayload(post){
    var body=byId('post-body').value.trim();
    var area=byId('post-area').value.trim();
    var name=byId('post-name').value.trim();
    var tel=byId('post-tel').value.trim();
    var telDigits=tel.replace(/\D/g,'');
    var peopleValue=Number(byId('post-people').value);
    var workDate=selectedCat==='jinzai'?byId('post-work-date').value:'';
    var expiryOption=byId('post-expiry').value;
    if(!selectedCat){alert('カテゴリを選択してください');return null;}
    if(!selectedPurpose){alert('「何をしたいですか？」を選択してください');return null;}
    if(!body){alert('投稿内容を入力してください');return null;}
    if(/(?:\+81|0)\d[\d\s()\-]{7,}\d/.test(body)||/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(body)){alert('電話番号やメールアドレスは投稿内容に書かず、非公開の連絡先欄へ入力してください。');return null;}
    if(!name){alert('投稿者名・職種を入力してください');return null;}
    if(!/^[0-9+()\-\s]+$/.test(tel)||telDigits.length<10||telDigits.length>12){alert('連絡先電話番号を正しく入力してください');return null;}
    return {cat:selectedCat,purpose:selectedPurpose,urgent:byId('post-urgent').checked,body:body,area:area,name:name,tel:tel,tags:[area,CAT[selectedCat].label].filter(Boolean),workDate:workDate,workTime:selectedCat==='jinzai'?byId('post-work-time').value.trim():'',trade:selectedCat==='jinzai'?byId('post-trade').value.trim():'',people:selectedCat==='jinzai'&&Number.isInteger(peopleValue)&&peopleValue>0?peopleValue:null,conditions:selectedCat==='jinzai'?byId('post-conditions').value.trim():'',expiryOption:expiryOption,expiresAt:typeof calculateExpiry==='function'?calculateExpiry(expiryOption,workDate):post.expiresAt,imageData:typeof preparedPhoto!=='undefined'?preparedPhoto:(post.imageData||'')};
  }
  window.guildAdminEditPost=function(id){
    if(typeof isAdmin==='undefined'||!isAdmin){alert('管理者モードで利用してください。');return;}
    var post=postById(id),modal,title,submit,cancel;if(!post)return;
    editingId=Number(id);
    if(typeof openModal==='function')openModal();
    modal=byId('modal');if(!modal)return;
    modal.classList.add('admin-edit-mode');
    title=modal.querySelector('.modal-title');submit=modal.querySelector('.btn-primary');cancel=modal.querySelector('.btn-secondary');
    if(title)title.textContent='投稿を修正する';
    if(submit)submit.innerHTML='<i class="ti ti-device-floppy"></i>修正内容を保存';
    if(cancel)cancel.textContent='修正をやめる';
    fillEditor(post);
    var draft=byId('guild-draft-panel');if(draft)draft.classList.remove('show');
    var sheet=modal.querySelector('.modal-sheet');if(sheet)sheet.scrollTop=0;
  };
  window.submitPost=async function(){
    if(!editingId){return originalSubmit.apply(this,arguments);}
    var post=postById(editingId),changes;if(!post){clearEditState();return;}
    changes=editorPayload(post);if(!changes)return;
    if(!confirm('修正内容を保存しますか？'))return;
    try{
      if(typeof setStatus==='function')setStatus('投稿を更新中...');
      await guildWrite('updatePost',{postId:editingId,changes:changes,adminPin:adminPinValue});
      if(typeof setStatus==='function')setStatus('投稿内容を更新しました。');
      clearEditState();
      if(typeof closeModal==='function')closeModal();
      if(typeof syncPosts==='function')await syncPosts();
    }catch(e){console.error(e);alert('投稿を更新できませんでした。通信環境を確認して、もう一度お試しください。');}
  };
  window.guildAdminDeletePost=async function(id){
    if(typeof isAdmin==='undefined'||!isAdmin||busyDelete[id])return;
    var post=postById(id),label=post?(post.name+'さんの投稿'):'この投稿';
    if(!confirm(label+'を完全に削除しますか？\n\n削除すると元に戻せません。'))return;
    busyDelete[id]=true;
    try{
      if(typeof setStatus==='function')setStatus('投稿を削除中...');
      await guildWrite('delete',{postId:id,adminPin:adminPinValue});
      if(typeof setStatus==='function')setStatus('投稿を削除しました。');
      if(typeof syncPosts==='function')await syncPosts();
    }catch(e){console.error(e);alert('投稿を削除できませんでした。通信環境を確認してください。');}
    busyDelete[id]=false;
  };
  function init(){
    if(typeof window.submitPost!=='function')return;
    originalSubmit=window.submitPost;
    originalClose=window.closeModal;
    if(typeof originalClose==='function')window.closeModal=function(){var wasEditing=Boolean(editingId);clearEditState();originalClose.apply(this,arguments);if(wasEditing&&typeof clearGuildDraft==='function')clearGuildDraft(false);};
    var style=document.createElement('style');style.textContent='.admin-edit-mode .draft-panel{display:none!important}.admin-edit-mode .template-action{display:none}.admin-edit-mode .modal-nav{border-bottom-color:#9AB5CB}.admin-edit-mode .modal-title:after{content:" 管理者";display:inline-block;margin-left:7px;padding:3px 7px;border-radius:99px;background:#EAF5FA;color:#1769AA;font-size:10px;vertical-align:middle}html[data-theme="dark"] .admin-edit-mode .modal-title:after{background:#15314A;color:#9DD6FA}';document.head.appendChild(style);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();