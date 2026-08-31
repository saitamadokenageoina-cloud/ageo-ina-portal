/* DOKEN Guild admin-update compatibility v201.
 * If the deployed Apps Script is older than the repository template and
 * returns "unknown action" for updatePost, replace the post transactionally
 * via create -> delete. The normal updatePost path always has priority.
 * ES5 syntax only for older iPhone PWA compatibility.
 */
(function(){
'use strict';
var installed=false,originalGuildWrite=null;
function errorMessage(error){return String(error&&error.message?error.message:error||'');}
function findPostById(id){
  var list=typeof posts!=='undefined'&&posts?posts:[],i;
  for(i=0;i<list.length;i+=1){if(Number(list[i].id)===Number(id))return list[i];}
  return null;
}
function own(source,key,fallback){return source&&Object.prototype.hasOwnProperty.call(source,key)?source[key]:fallback;}
function replacementClientId(changes){
  var token='',stamp=Date.now();
  if(typeof expiryCompatibilityTag==='function')token=expiryCompatibilityTag(changes.expiryOption,changes.expiresAt)||'';
  return 'admin-edit-'+stamp+'-'+Math.random().toString(36).slice(2)+(token?'|'+token:'');
}
function replacementPost(payload){
  var changes=payload&&payload.changes?payload.changes:{},current=findPostById(payload&&payload.postId)||{};
  return {
    clientId:replacementClientId(changes),
    cat:own(changes,'cat',current.cat||'soudan'),
    emoji:current.emoji||'',
    name:own(changes,'name',current.name||''),
    area:own(changes,'area',current.area||''),
    body:own(changes,'body',current.body||''),
    tags:own(changes,'tags',current.tags||[]),
    tel:own(changes,'tel',''),
    comments:current.comments||[],
    status:'open',
    workflow:current.workflow||'unhandled',
    purpose:own(changes,'purpose',current.purpose||'share'),
    urgent:Boolean(own(changes,'urgent',current.urgent)),
    workDate:own(changes,'workDate',current.workDate||''),
    workTime:own(changes,'workTime',current.workTime||''),
    trade:own(changes,'trade',current.trade||''),
    people:own(changes,'people',current.people||null),
    conditions:own(changes,'conditions',current.conditions||''),
    expiryOption:own(changes,'expiryOption',current.expiryOption||'7d'),
    expiresAt:own(changes,'expiresAt',current.expiresAt||''),
    imageData:own(changes,'imageData',current.imageData||'')
  };
}
function rollbackCreated(createdId,pin){
  if(!createdId)return Promise.resolve();
  return originalGuildWrite('delete',{postId:createdId,adminPin:pin}).catch(function(){return null;});
}
function compatibilityReplace(payload){
  var replacement=replacementPost(payload),createdId=0;
  if(!replacement.name||!replacement.tel) return Promise.reject(new Error('compat update missing contact'));
  if(typeof setStatus==='function')setStatus('旧クラウド互換で投稿を更新中...');
  return originalGuildWrite('create',{post:replacement,notifyEmail:''}).then(function(data){
    createdId=data&&data.post?Number(data.post.id)||0:0;
    if(!createdId)throw new Error('compat update create failed');
    return originalGuildWrite('delete',{postId:payload.postId,adminPin:payload.adminPin}).then(function(){
      return {ok:true,compatibilityReplace:true,post:data.post};
    }).catch(function(deleteError){
      return rollbackCreated(createdId,payload.adminPin).then(function(){throw deleteError;});
    });
  });
}
function install(){
  if(installed)return;
  if(typeof window==='undefined'||typeof window.guildWrite!=='function'){setTimeout(install,50);return;}
  installed=true;
  originalGuildWrite=window.guildWrite;
  window.guildWrite=function(action,payload){
    return originalGuildWrite(action,payload).catch(function(error){
      if(action==='updatePost'&&/unknown action/i.test(errorMessage(error))){
        return compatibilityReplace(payload||{});
      }
      throw error;
    });
  };
  window.DOKEN_GUILD_UPDATE_COMPAT_V201={replacementPost:replacementPost,errorMessage:errorMessage};
}
if(document.readyState==='complete')install();else window.addEventListener('load',install);
})();
