// 支部カレンダー設定
// カテゴリーの追加・削除・名称・色は CALENDARS だけを変更してください。
// APIキーは Google Calendar API と本番サイトのHTTPリファラーだけに制限します。
const PUBLIC_CALENDAR_KEY = [
  "AIzaSyDtc62rPLeYi9nL3uULHSZXdB5zt5uHjyw",
  ""
].join("");

const CALENDARS = [
  { id: "saitamadokenageoina@gmail.com", label: "全体",       color: "#616161" },
  { id: "920df97122bc62cb84852428f01928500d430b00a5acef448d6eb679d8cdf1fb@group.calendar.google.com", label: "班会議等",   color: "#0b8043" },
  { id: "54161b483cfaa13f0564824f4faefb29de140db9edaf11354a7e7ab1ea84a9bb@group.calendar.google.com", label: "行事・大会", color: "#d81b60" },
  { id: "e018dfe146750b7c91526703a0bd87946403c54a72f4ccae9d5d3ad7f4baa089@group.calendar.google.com", label: "研修・講習", color: "#f4511e" },
  { id: "b077dc8d3c4a32926a17ca7ab55fb0d7f3a1cbda300012ea6a40861d26e7228d@group.calendar.google.com", label: "役員会議",   color: "#f09300" },
  { id: "fed78bebafadb3c46d2a023a02549e5cdadf32ad56e5444f40a5ac99c3b68bd8@group.calendar.google.com", label: "その他",     color: "#8e24aa" }
];

// 埋め込みカレンダーだけに表示する祝日。予定カードの18件には含めません。
const EMBED_ONLY_CALENDARS = [
  { id: "ja.japanese#holiday@group.v.calendar.google.com", color: "#4285f4" }
];

window.DOKEN_CALENDAR_CONFIG = Object.freeze({
  PUBLIC_CALENDAR_KEY,
  CALENDARS,
  EMBED_ONLY_CALENDARS
});
