var fs=require('fs');
function read(path){return fs.readFileSync(path,'utf8');}
function fail(message){console.error('FAIL: '+message);process.exitCode=1;}
function need(source,text,label){if(source.indexOf(text)===-1)fail(label+': '+text);}
var guild=read('guild.html');
var config=read('assets/js/guild-config.js');
var canonical=read('assets/js/guild-canonical-v198.js');
var css=read('assets/css/guild-v195.css');
var spec=read('DOKEN_GUILD_SPEC.md');
need(guild,'async function submitPost()','標準の新規投稿処理がありません');
need(config,'guild-canonical-v198.js?v=186','確定版Guild拡張が読み込まれていません');
['1m','2m','3m','6m','1y','unlimited'].forEach(function(key){need(canonical,"['"+key+"'",'長期掲載期限が不足');});
need(canonical,"option==='unlimited'",'無期限の期限計算がありません');
need(canonical,"post.expiryOption==='unlimited'",'無期限の期限切れ除外がありません');
need(canonical,"cleanMultiline(post.body,1200)",'本文改行保持がありません');
need(css,'.post-body{white-space:pre-wrap!important','本文表示の改行保持CSSがありません');
need(css,'.t-btn[data-category="all"] .t-btn-copy small{display:none!important','すべて重複表示の防止がありません');
need(canonical,"originalSubmit.apply(this,arguments)",'通常投稿への委譲がありません');
need(canonical,"guildWrite('updatePost'",'管理者編集APIがありません');
need(canonical,"guildWrite('delete'",'管理者完全削除APIがありません');
need(canonical,"guildWrite('getContact'",'管理者編集の非公開連絡先取得がありません');
need(spec,'1か月','確定仕様に長期期限がありません');
need(spec,'新規投稿と同じフォーム','確定仕様に管理者編集方式がありません');
if(process.exitCode)process.exit(process.exitCode);console.log('DOKEN Guild regression check: OK');
