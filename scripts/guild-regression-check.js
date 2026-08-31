'use strict';

var fs=require('fs');
var vm=require('vm');
var failures=[];
function read(path){return fs.readFileSync(path,'utf8');}
function fail(message){failures.push(message);}
function assert(condition,message){if(!condition)fail(message);}
function equal(actual,expected,message){if(actual!==expected)fail(message+' (actual='+JSON.stringify(actual)+', expected='+JSON.stringify(expected)+')');}

var guild=read('guild.html');
var config=read('assets/js/guild-config.js');
var canonical=read('assets/js/guild-canonical-v199.js');
var guildCss=read('assets/css/guild-v195.css');
var themeCss=read('assets/css/theme-polish.css');
var paypayCss=read('assets/css/paypay-tabs-base.css');
var navigation=read('assets/js/navigation.js');
var backend=read('docs/guild-apps-script-template.js');
var sw=read('sw.js');
var spec=read('DOKEN_GUILD_SPEC.md');

// guild.html の本体を副作用なしで評価し、文字列の有無ではなく挙動を検証する。
var inlineMatch=guild.match(/<script>\s*([\s\S]*?)<\/script>/);
assert(Boolean(inlineMatch),'guild.html のインライン本体を抽出できません');
var inline=inlineMatch?inlineMatch[1]:'';
inline=inline.replace(/\bsetupGuildDraft\(\);/,'').replace(/\bsyncPosts\(\);\s*$/,'');
var context={console:console,setTimeout:setTimeout,clearTimeout:clearTimeout,requestAnimationFrame:function(){},window:{DOKEN_GUILD_CONFIG:{}},location:{origin:'https://example.test',pathname:'/guild.html'},navigator:{},localStorage:{getItem:function(){return null;},setItem:function(){},removeItem:function(){}},alert:function(){},confirm:function(){return true;},prompt:function(){return '';}};
context.window.window=context.window;
vm.createContext(context);
try{vm.runInContext(inline,context,{filename:'guild-inline.js'});}catch(error){fail('guild.html のJavaScript評価に失敗: '+error.stack);}
var core=context.window.DokenGuild||{};

equal(core.safeMultilineText&&core.safeMultilineText('  1行目\r\n\r\n\r\n  2行目  ',1200),'1行目\n\n2行目','改行・段落の正規化が不正です');
equal(core.safeMultilineText&&core.safeMultilineText('A\u2028\u2028B',1200),'A\n\nB','旧クラウド互換の段落復元が不正です');
var encoded=core.encodeMultilineForCloud&&core.encodeMultilineForCloud('A\n\nB');
equal(encoded,'A\u2028\u2028B','旧クラウドでも段落を失わない送信形式ではありません');
assert(encoded&&encoded.indexOf('\n')===-1,'互換送信本文に制御改行が残っています');

var expiry=core.calculateExpiry;
equal(expiry&&expiry('unlimited','',new Date('2025-01-01T00:00:00Z')),'','無期限の expiresAt は空でなければなりません');
var oneMonth=expiry&&new Date(expiry('1m','',new Date('2025-01-31T12:00:00Z')));
equal(oneMonth&&oneMonth.getUTCDate(),28,'月末の1か月加算が翌月へあふれています');
var oneYear=expiry&&new Date(expiry('1y','',new Date('2024-02-29T12:00:00Z')));
equal(oneYear&&oneYear.getUTCDate(),28,'うるう日の1年加算が翌月へあふれています');
var sevenDays=expiry&&Date.parse(expiry('7d','',new Date('2025-01-01T00:00:00Z')))-Date.parse('2025-01-01T00:00:00Z');
equal(sevenDays,7*86400000,'7日の掲載期限計算が不正です');

function rawPost(overrides){return Object.assign({id:1,cat:'jinzai',body:'1行目\n\n2行目',name:'大工 A',area:'上尾市',tags:[],status:'open',purpose:'seek_help',workflow:'unhandled',expiryOption:'7d',expiresAt:new Date(Date.now()+7*86400000).toISOString(),createdAt:new Date().toISOString(),comments:[]},overrides||{});}
var normalized=core.normalizePost&&core.normalizePost(rawPost());
equal(normalized&&normalized.body,'1行目\n\n2行目','投稿読込時に段落が失われます');
var futureLong=core.normalizePost&&core.normalizePost(rawPost({createdAt:new Date(Date.now()-60*86400000).toISOString(),expiryOption:'6m',expiresAt:new Date(Date.now()+60*86400000).toISOString()}));
equal(core.isArchived&&core.isArchived(futureLong),false,'将来期限の長期投稿が30日で過去扱いになります');
var unlimited=core.normalizePost&&core.normalizePost(rawPost({createdAt:new Date(Date.now()-90*86400000).toISOString(),workDate:'2025-01-01',expiryOption:'unlimited',expiresAt:''}));
equal(core.isArchived&&core.isArchived(unlimited),false,'無期限投稿が期限切れまたは30日で過去扱いになります');
var expired=core.normalizePost&&core.normalizePost(rawPost({expiresAt:new Date(Date.now()-1000).toISOString()}));
equal(core.isArchived&&core.isArchived(expired),true,'期限切れ投稿が過去扱いになりません');
var legacy=core.normalizePost&&core.normalizePost(rawPost({expiryOption:'unknown',expiresAt:'',createdAt:new Date(Date.now()-31*86400000).toISOString()}));
equal(core.isArchived&&core.isArchived(legacy),true,'期限情報のない旧投稿の30日互換判定がありません');
var compatStamp=Date.now()+75*86400000;
var compat=core.normalizePost&&core.normalizePost(rawPost({clientId:'local-test|__dx:3m:'+compatStamp,expiryOption:'7d',expiresAt:new Date(Date.now()+7*86400000).toISOString(),tags:['上尾市']}));
equal(compat&&compat.expiryOption,'3m','旧バックエンドが7日に丸めた長期期限を復元できません');
equal(compat&&Date.parse(compat.expiresAt),compatStamp,'互換タグの期限日時を復元できません');
assert(compat&&compat.tags.indexOf('__dx:3m:'+compatStamp)===-1,'内部互換タグが公開タグに表示されます');
var reviewedCompat=core.normalizePost&&core.normalizePost(rawPost({clientId:'local-test|__dx:3m:'+compatStamp,expiryOption:'7d',expiresAt:new Date(Date.now()+7*86400000).toISOString(),lastReviewedAt:new Date().toISOString()}));
equal(reviewedCompat&&reviewedCompat.expiryOption,'7d','管理者確認後も古い互換期限が上書きします');

// 新規投稿のローカル経路を模擬し、一般投稿処理そのものを通す。
var fields={
  'post-body':{value:'1行目\n\n2行目'},'post-area':{value:'上尾市'},'post-name':{value:'大工 A'},'post-tel':{value:'090-1234-5678'},
  'post-work-date':{value:''},'post-work-time':{value:'8:00〜17:00'},'post-trade':{value:'大工'},'post-people':{value:'2'},'post-conditions':{value:'経験者'},
  'post-expiry':{value:'3m'},'post-urgent':{checked:true},'job-fields':{classList:{remove:function(){}}}
};
context.document={getElementById:function(id){return fields[id]||null;},querySelectorAll:function(selector){return selector==='.t-btn'?[{click:function(){}}]:[];}};
vm.runInContext("GUILD_CONFIG.apiUrl='';posts=[];nextId=1;selectedCat='jinzai';selectedPurpose='seek_help';preparedPhoto='';save=function(){};clearGuildDraft=function(){};closeModal=function(){};render=function(){};clearPhoto=function(){};",context);
try{vm.runInContext('submitPost()',context);}catch(error){fail('新規投稿処理の模擬実行に失敗: '+error.stack);}
var submitted=vm.runInContext('posts[0]',context);
equal(submitted&&submitted.body,'1行目\n\n2行目','新規投稿処理で段落が失われます');
equal(submitted&&submitted.expiryOption,'3m','新規投稿処理が選択した掲載期限を保持しません');
assert(submitted&&/\|__dx:3m:\d+$/.test(submitted.clientId),'新規投稿に非表示の旧バックエンド互換期限が付きません');
assert(submitted&&submitted.tags.every(function(tag){return tag.indexOf('__dx:')!==0;}),'内部互換期限が公開タグに混入します');
equal(submitted&&submitted.urgent,true,'新規投稿処理が急募を保持しません');
equal(submitted&&submitted.people,2,'新規投稿処理が必要人数を保持しません');

// 検索、並べ替え、カテゴリー、カレンダーの既存機能を挙動で確認する。
var future=new Date(Date.now()+30*86400000).toISOString();
var listCode='posts=['+JSON.stringify(rawPost({id:11,urgent:true,area:'上尾市',trade:'大工',workDate:'2099-01-10',createdAt:'2025-01-01T00:00:00Z',expiresAt:future}))+','+JSON.stringify(rawPost({id:12,cat:'shizai',purpose:'give_material',urgent:false,name:'設備 B',area:'伊奈町',trade:'',workDate:'',createdAt:'2025-02-01T00:00:00Z',expiresAt:future}))+'].map(normalizePost);showArchived=false;';
vm.runInContext(listCode,context);
equal(vm.runInContext("currentTab='all';searchTerm='';sortMode='urgent';filteredPosts().map(function(p){return p.id;}).join(',')",context),'11,12','急募優先の並べ替えが不正です');
equal(vm.runInContext("sortMode='newest';filteredPosts().map(function(p){return p.id;}).join(',')",context),'12,11','新しい順の並べ替えが不正です');
equal(vm.runInContext("currentTab='shizai';filteredPosts().map(function(p){return p.id;}).join(',')",context),'12','カテゴリー絞り込みが不正です');
equal(vm.runInContext("currentTab='all';searchTerm='上尾 大工';filteredPosts().map(function(p){return p.id;}).join(',')",context),'','検索は単一キーワードの部分一致仕様から変えてはなりません');
equal(vm.runInContext("searchTerm='上尾';filteredPosts().map(function(p){return p.id;}).join(',')",context),'11','地域キーワード検索が不正です');
equal(vm.runInContext("searchTerm='大工';filteredPosts().map(function(p){return p.id;}).join(',')",context),'11','職種キーワード検索が不正です');
equal(vm.runInContext("guildCalendarPosts().map(function(p){return p.id;}).join(',')",context),'11','カレンダー対象が人材・作業日・掲載中に限定されていません');
assert(vm.runInContext("lineNoticeText(Object.assign({},posts[0],{body:'連絡先 090-1234-5678'}))",context).indexOf('090-1234-5678')===-1,'LINE告知文に投稿者電話番号が残ります');
equal(vm.runInContext("hasGuildDraftContent({'post-body':'下書き'})",context),true,'本文だけの下書きを保存対象として認識しません');

var selectMatch=guild.match(/<select class="guild-field" id="post-expiry"[\s\S]*?<\/select>/);
var options=[];
if(selectMatch){var optionPattern=/<option value="([^"]+)"([^>]*)>/g,optionMatch;while((optionMatch=optionPattern.exec(selectMatch[0])))options.push({value:optionMatch[1],selected:/\bselected\b/.test(optionMatch[2])});}
equal(options.map(function(item){return item.value;}).join(','),'24h,48h,3d,7d,14d,1m,2m,3m,6m,1y,workdate,unlimited','掲載期限の選択肢または順序が確定仕様と違います');
equal(options.filter(function(item){return item.selected;}).map(function(item){return item.value;}).join(','),'7d','掲載期限の初期値は7日だけでなければなりません');

var categoryLabels=[];
var categoryPattern=/<button[^>]+data-category="(?:all|jinzai|shizai|soudan)"[\s\S]*?<strong>([^<]+)<\/strong>[\s\S]*?<\/button>/g,categoryMatch;
while((categoryMatch=categoryPattern.exec(guild)))categoryLabels.push(categoryMatch[1]);
equal(categoryLabels.join(','),'すべて,人材・仕事,資材・道具,相談・情報','カテゴリーの実テキストが確定名称と違います');
assert(themeCss.indexOf('.t-btn-copy strong::after')===-1&&paypayCss.indexOf('.t-btn-copy strong::after')===-1,'疑似要素がカテゴリー名を重複生成しています');
assert(themeCss.indexOf('.guild-hero-copy::after')===-1,'疑似要素がヒーロー説明を重複生成しています');
assert(navigation.indexOf('enhanceGuildMobile')===-1&&navigation.indexOf('copyMap')===-1,'共通JavaScriptがギルドのカテゴリー名を上書きしています');
assert(guild.indexOf('.post-body{font-size:15px')!==-1&&guild.indexOf('white-space:pre-wrap')!==-1,'本文表示の段落保持CSSが正規のページ本体にありません');
assert(guildCss.indexOf('.post-body')===-1,'旧追加CSSが本文表示を重複上書きしています');
assert(guildCss.indexOf('body:has(.guild-hero) .t-btn.active')!==-1&&guildCss.indexOf('html[data-theme="dark"] body:has(.guild-hero) .t-btn.active')!==-1,'ライト・ダークの選択色が共通CSSの詳細度に負けます');
assert(guild.indexOf("jinzai:{label:'人材・仕事'")!==-1&&guild.indexOf("soudan:{label:'相談・情報'")!==-1,'投稿カードのカテゴリー名が確定名称と違います');

assert(canonical.indexOf('originalSubmit.apply(this,arguments)')!==-1,'管理者拡張が通常投稿へ委譲していません');
assert(canonical.indexOf("guildWrite('updatePost'")!==-1,'管理者編集APIがありません');
assert(canonical.indexOf("guildWrite('delete'")!==-1,'管理者完全削除APIがありません');
assert(canonical.indexOf("guildWrite('getContact'")!==-1,'管理者編集が非公開連絡先を取得していません');
assert(canonical.indexOf('DOKEN_GUILD_ADMIN_EDITING=true')!==-1&&guild.indexOf('DOKEN_GUILD_ADMIN_EDITING===true')!==-1,'管理者編集と一般下書きの分離がありません');
assert(guild.indexOf("workflow:'unhandled'")!==-1&&guild.indexOf("decision:'continue'")!==-1,'解決済み投稿の7日再掲載で取り次ぎ状態を戻していません');
assert(guild.indexOf('function guildAdminView(mode)')!==-1&&guild.indexOf('過去投稿を管理')!==-1,'現在・過去投稿の管理切替がありません');
assert(guild.indexOf("await guildWrite('comment'")!==-1,'クラウドコメント送信処理がありません');
assert(guild.indexOf("await guildWrite('create', {post:cloudPost})")!==-1&&guild.indexOf('body:encodeMultilineForCloud(newPost.body)')!==-1,'クラウド新規投稿が本文互換処理を通っていません');
assert(guild.indexOf("location.href = 'tel:0487739863'")!==-1,'支部問い合わせの電話導線がありません');
assert(guild.indexOf("post.cat==='jinzai' && post.workDate && !isArchived(post)")!==-1,'カレンダーの対象条件が不明確です');
assert(guild.indexOf("localStorage.setItem(GUILD_DRAFT_KEY")!==-1&&guild.indexOf('function restoreGuildDraft()')!==-1,'下書き保存・復元処理がありません');
assert(guild.indexOf('.post-body{font-size:15px')!==-1&&guild.indexOf('html[data-theme="dark"] .post-body,')!==-1,'本文のライト・ダーク表示定義がありません');

// Apps Script テンプレートも同じ仕様で動くことを検証する。
var backendContext={console:console,PropertiesService:{getScriptProperties:function(){return {getProperty:function(){return '';}};}}};
vm.createContext(backendContext);
try{vm.runInContext(backend+'\nthis.__test={normalizePost_:normalizePost_,safeMultilineText_:safeMultilineText_,calculateExpiry_:calculateExpiry_,publicPost_:publicPost_};',backendContext,{filename:'guild-apps-script-template.js'});}catch(error){fail('Apps ScriptテンプレートのJavaScript評価に失敗: '+error.stack);}
var server=backendContext.__test||{};
equal(server.safeMultilineText_&&server.safeMultilineText_('A\r\n\r\n\r\nB',1200),'A\n\nB','クラウド保存側の段落正規化が不正です');
equal(server.safeMultilineText_&&server.safeMultilineText_('A\u2028\u2028B',1200),'A\n\nB','クラウド保存側が互換改行を復元しません');
var serverPost=server.normalizePost_&&server.normalizePost_({cat:'jinzai',body:'A\n\nB',name:'大工 A',tel:'090-1234-5678',purpose:'seek_help',expiryOption:'3m',tags:[]},false);
equal(serverPost&&serverPost.body,'A\n\nB','クラウド保存時に段落が失われます');
equal(serverPost&&serverPost.expiryOption,'3m','クラウド保存側が長期期限を7日に丸めます');
var publicPost=server.publicPost_&&server.publicPost_(Object.assign({},serverPost,{tel:'090-1234-5678'}));
assert(publicPost&&!Object.prototype.hasOwnProperty.call(publicPost,'tel'),'公開APIに非公開電話番号が含まれます');
equal(server.calculateExpiry_&&server.calculateExpiry_('unlimited','',new Date('2025-01-01T00:00:00Z')),'','クラウド側の無期限計算が不正です');
assert(backend.indexOf("action === 'updatePost'")!==-1,'クラウド側に管理者編集APIがありません');
assert(backend.indexOf("target.workflow = 'unhandled'")!==-1,'クラウド側の再掲載が終了ワークフローを解除しません');
assert(backend.indexOf('MailApp.sendEmail')!==-1&&backend.indexOf("PROPS.getProperty('NOTIFY_EMAIL')")!==-1,'支部へのサーバー設定メール通知がありません');

var release=(sw.match(/CACHE_VERSION\s*=\s*'v\d{8}-(\d+)'/)||[])[1];
assert(Boolean(release),'Service Workerのリリース番号を取得できません');
assert(config.indexOf('guild-canonical-v199.js?v='+release)!==-1&&config.indexOf('guild-v195.css?v='+release)!==-1,'Guild資産のクエリ番号とService Workerが同期していません');
assert(sw.indexOf('assets/js/guild-canonical-v199.js')!==-1,'Service Workerがv199の正規拡張をキャッシュしていません');
['guild-canonical-v198.js','guild-config-v194.js','guild-v195-loader.js','guild-admin-editor-v195.js','guild-display-hotfix-v197.js'].forEach(function(file){assert((config+sw+guild+navigation).indexOf(file)===-1,'停止済み旧スクリプトが再び読み込まれています: '+file);});
assert(spec.indexOf('v199')!==-1&&spec.indexOf('旧バックエンド互換')!==-1,'確定仕様書がv199の互換方針を記録していません');

if(failures.length){failures.forEach(function(message){console.error('FAIL: '+message);});process.exit(1);}
console.log('DOKEN Guild behavioral regression check: OK');
