# 埼玉土建 上尾伊奈支部 組合員アプリ — 引き継ぎ資料
最終更新：2026年7月15日／作成：Claude（前担当AI）／更新：Codex

---

## 1. プロジェクト概要

- **名称**：上尾伊奈支部 組合員ポータル（PWA）
- **運営**：埼玉土建一般労働組合 上尾伊奈支部
- **公開URL**：`https://saitamadokenageoina-cloud.github.io/ageo-ina-portal/`
- **リポジトリ**：`https://github.com/saitamadokenageoina-cloud/ageo-ina-portal`（GitHub Pages配信、ブランチ`main`直下がそのまま公開される legacy build type）
- **利用者**：組合員（建設業従事者）。現場で使うためスマホ（主にiPhone Safari／ホーム画面PWA）が主戦場。電波が弱い環境を想定した設計が随所にある。
- **姉妹サービス**：見積書作成アプリ（別リポジトリ、`https://saitamadokenageoina-cloud.github.io/estimate/` としてホームからリンクのみ、統合はしていない）

## 2. 技術スタック（あえてシンプル）

- **フレームワークなし**。素のHTML + CSS + JavaScript（ES5〜ES6混在、バニラJS）。
- ビルドツール・バンドラーなし。ファイルをそのまま`git push`すればGitHub Pagesに反映される。
- PWA対応（`manifest.webmanifest` + `sw.js`のService Worker）。
- 外部ライブラリはCDNではなく**極力自前ホスティング**（後述の教訓参照）。
- アイコン：Tabler Icons 2.47.0（自前ホスティング済み）。
- フォント：Google Fonts「M PLUS 1p」（CDN読み込み、これは許容している）。

## 3. デプロイ手順（最重要・必ずこの手順で）

```bash
# 1. 変更後、sw.js の CACHE_VERSION を必ず1つ上げる
#    形式: 'v20260707-NN' → NNをインクリメント
#    例: v20260707-52 → v20260707-53

# 2. commit & push
git add -A
git commit -m "変更内容"
git push origin main

# 3. GitHub Pagesは稀に自動ビルドされないことがあるため、明示的にビルドをトリガー
curl -sS -X POST -H "Authorization: token <GH_TOKEN>" \
  -H "Accept: application/vnd.github+json" \
  https://api.github.com/repos/saitamadokenageoina-cloud/ageo-ina-portal/pages/builds

# 4. ビルド完了をポーリング確認（statusが built かつ commit が最新一致するまで）
curl -sS -H "Authorization: token <GH_TOKEN>" \
  -H "Accept: application/vnd.github+json" \
  https://api.github.com/repos/saitamadokenageoina-cloud/ageo-ina-portal/pages/builds/latest
```

**GitHubトークンについて**：本セッションで使用していたPersonal Access Tokenはこの会話ログに露出済みのため、**Codexへ引き継ぐ際は新しいトークンを発行し直すことを強く推奨**します（GitHub → Settings → Developer settings → Personal access tokens）。必要スコープは`repo`（Pages管理には`pages`権限も）。

**なぜ手動ビルドトリガーが必要か**：GitHub Pages（legacy build）はpush後に自動ビルドされないことがあり、放置すると古い内容が配信され続ける。必ずビルドAPIを叩いて`status: built` かつ `commit` が最新であることを確認してから「反映完了」と判断すること。

## 4. Service Worker（sw.js）の設計

- **キャッシュ戦略**：Network-First（同一オリジンのGETリクエストのみ）。外部オリジン（Google Calendar API、天気API等）はSWを素通りしそのままネットワークへ。
- **CACHE_VERSIONを上げないと更新が反映されない**。全ページ共通で`assets/js/navigation.js`がSW登録・自動更新チェック・`controllerchange`での自動リロードを担う。
- **CACHE_FILES**に事前キャッシュ対象を列挙（全HTML、共通JS/CSS、PWAアイコン、PDF.js本体・ワーカー、36協定正式様式PDFなど）。新規ページや必須共通ファイルを追加したら**ここにも追記が必要**。
- 容量の大きい資料PDFは事前キャッシュしない。一度オンラインで開いたPDFはNetwork-Firstの実行時キャッシュに保存され、次回以降のオフライン表示に利用される。
- PDF.jsが必要に応じてCDNから取得するCMap・標準フォントだけは例外的に実行時キャッシュする。Google Calendar・天気API等の外部APIは従来どおりSWを素通りする。
- オフライン時、キャッシュに無いページは動作しない。新規ページ作成時は必ずCACHE_FILESへの追加を忘れないこと。

## 5. 共通基盤ファイル

### common.css
全ページ共通のCSS変数・ベーススタイル。

```css
--navy, --orange, --white, --gray50〜900, --green, --red, --blue, --yellow
--r8, --r12, --r16, --r24 (角丸)
--shadow-sm/md/lg
```

**⚠️最重要の罠**：`html[data-theme="dark"]`セレクタで、これらのCSS変数がダークモード用に**再マッピング**される（例：`--gray50`は通常「明るい背景色」だが、ダークモードでは「濃紺の背景色」に変わる。`--navy`は通常「濃紺の文字色」だが、ダークモードでは「明るい文字色」に変わる）。

このため、**固定の背景色を持つ要素**（例：常に薄いオレンジ背景のカードなど）に`color:var(--gray700)`のようなテーマ変数を使うと、ダークモード時に「淡い固定背景＋明るい文字」になり、**文字が見えなくなるバグを繰り返し引き起こした**。固定背景の要素には、テーマ変数を使わず**固定の色コード**を直接指定すること。

電話番号の自動リンク化対策、拡大禁止解除（アクセシビリティ）なども含まれる。

共通UIとして、48px以上のタップ領域、16px以上の入力文字、キーボードフォーカス、必須入力エラー、誤りのある最初の入力欄への自動案内、オフライン・通信復帰表示、狭い画面での戻るボタンとタイトルの折り返し防止を定義している。個別ページでこれらを小さく上書きしないこと。

### assets/js/navigation.js（20ページ中19ページで読み込み）
- SW登録・起動時update・待機中SWの即時適用
- `controllerchange`/`message`イベントでの自動リロード（初回インストール時は除外、8秒の連続リロード防止ガードあり）
- 画面復帰時（`visibilitychange`）の再チェック
- 戻るボタンの挙動（`goBack()`）
- テーマ切替トグル、下部の電話/LINE/地図/ガイドの固定バー（`injectContactRail`）注入
- 戻るボタンの読み上げラベル、必須入力エラーの欄直下表示と最初のエラー欄への移動、外部リンクの安全属性、オフライン・通信復帰表示

`rodo36_form_preview.html`は印刷専用プレビューのため、例外的に`navigation.js`を読み込まない。

### assets/js/calendar-config.js + calendar-upcoming.js（支部カレンダー）
- 支部カレンダーは支部行事・会議・支部予定用。技能講習の日程は掲載せず、`koushu.html`の「技能講習日程案内」で案内する。
- `calendar-config.js`の`CALENDARS`配列が、カード取得対象・iframe表示対象・カテゴリー名・色の単一設定元。カテゴリー変更はこの配列だけを編集する。
- APIキーはGoogle Cloudの`portal-calendar`プロジェクトで発行し、Google Calendar API限定かつ`https://saitamadokenageoina-cloud.github.io/*`（必要に応じて`/ageo-ina-portal/*`も併記）のHTTPリファラー限定にする。キー文字列はログや作業報告へ出さない。
- `calendar-upcoming.js`は現在時刻から45日間を`Promise.allSettled()`で並列取得し、キャンセル・重複を除いて開始日時順に最大18件表示する。
- 終日予定の説明欄に`【時間】19時30分〜`・`19時〜21時`・`19時〜`があれば、開始時刻と任意の終了時刻を抽出してカード表示と並び順へ反映する。終了時刻がなければ補完しない。
- 取得結果は`localStorage`の`doken_calendar_upcoming_v2`へ15分間キャッシュする。通信失敗時は期限切れの保存データもフォールバック表示する。
- Google Calendar APIの予定名・場所は必ず`textContent`で描画し、予定詳細URLはHTTPSかつ`calendar.google.com`／`www.google.com`だけを許可する。

### assets/js/print-util.js + assets/css/print.css（印刷・プレビュー共通基盤）
`calc.html`・`kensetsu_check.html`・`hitori.html`で使用。グローバル`DokenPrint`オブジェクトを公開。

```js
DokenPrint.print({title, sections:[{label, html}], note})   // 印刷
DokenPrint.preview({title, sections, note})                  // プレビュー表示
```

- `#print-area`をbody直下に生成し、`window.print()`を呼ぶ方式（新規ウィンドウ/iframe方式は**iOS PWAで動作しないため不採用**、後述の教訓参照）。
- プレビューは`#preview-overlay`のオーバーレイ＋A4イメージの`.pv-sheet`。
- 複製されたHTMLに残るインラインの色指定（`color`/`background`等）を`stripColorStyles()`でDOMレベルから除去し、印刷/プレビュー内は白地・黒文字に強制する二重の安全策あり。

## 6. ページ一覧（22ページ、現行）

| ファイル | 内容 | 備考 |
|---|---|---|
| index.html | ホーム（5セクション：よく使う/仕事確保/現場・管理関係/手続き・シミュレーション/講習・資料） | 各セクションに`id="yoku"`等のアンカーあり（LINEリッチメニュー用URL）。「手続き・シミュレーション」に総合共済申請ナビと健康診断Googleフォームへの外部リンクあり |
| calendar.html | 支部カレンダー | iframeを維持し、その下に今後45日・最大18件の予定カードを表示。設定は`assets/js/calendar-config.js`、取得・15分キャッシュ・安全なDOM描画は`assets/js/calendar-upcoming.js` |
| doken_card.html | どけんカード登録店 | 外部サイト`doken-card.jp`のパスワード表示・コピー機能 |
| guild.html | DOKENギルド（掲示板） | Google Apps Script連携。投稿目的・文章テンプレート・掲載期限・取り次ぎ状況・LINE文コピー・DOKENギルド専用月間カレンダー・近似マッチ・月次集計・圧縮写真・支部経由連絡に対応。作業日のある人材投稿は専用カレンダーへ自動表示する。「今日／明日 空いています」の簡易投稿と、期限到達後の管理者確認（7日継続／解決済み）も備える。投稿途中は写真を除いて端末内へ下書き保存し、再開・削除できる |
| meishi.html | 建設業向けAI名刺作成 | 会社名・氏名・業種から配色・文章・職種イラスト・レイアウトを端末内で自動提案。QRコード、300dpi情報付きPNG、97×61mmの表裏PDF、透過PNG・SVG、端末下書き保存、印刷・営業チェックに対応。個人情報は外部送信しない。QR生成は自前ホストの`assets/js/qrcode-generator.js`（MIT）を使用 |
| kyosai_guide.html | 総合共済 申請ナビ | 申請事由を選ぶと対象目安・期限・必要書類チェックリストを表示。チェック状態は端末保存。不明点は支部へ相談する運用 |
| kyokyu.html | 労働者供給事業 | 東栄住宅の求人情報を掲載（変更される可能性あり） |
| calc.html | 計算ツール（労災保険料/労務費/国保料/給付金） | 労災は末尾5（元請工事高）・6（労働者の賃金総額）、建設一人親方の特2（17/1000）、運送一人親方の特1（11/1000）、第一種特別加入の月割りに対応。CCUS能力評価は公式外部サイトへ一本化。前回使った内部計算を端末内に記憶して再開導線を表示。料率は毎年4月更新が必要（下記7章） |
| atsusa.html | 熱中症AIアラート | GPS→Open-Meteo API→環境省の実況推定式でWBGT概算。今後8時間、建設現場条件、法令チェック（当日の3項目進捗表示）、朝礼文、症状別対処を表示。GPS拒否時は上尾・伊奈周辺へ切替、通信失敗時は最大6時間の端末保存データを明示して使用 |
| alert_settings.html | 天気アラート管理者設定 | 管理PINはコードに保存せず、入力値をApps Scriptの`ALERT_PIN`で検証。6文字以上を使用 |
| anzen_check.html | 現場安全チェックリスト | 印刷対応 |
| work_log.html | 作業記録（労災対策） | localStorage保存、PDF印刷、バックアップ/復元機能。保存前の入力も端末内へ下書き保存し、再開・削除できる |
| rodo36.html | 36協定・残業時間カウンター | 印刷対応（A4縦） |
| rodo36_form_preview.html | 36協定 正式様式プレビュー | pdf.js使用、A4横向き |
| guide.html | 手続き・必要書類ガイド | |
| merit.html | 加入のメリット | JSデータ駆動（MERITS配列＋ICON_GLYPHSマップ） |
| kensetsu_check.html | 建設業許可チェッカー | 印刷対応。添付資料準拠の必要書類チェックリスト（新規／更新／年度終了報告、個人／法人、未提出年度分の追加）を備え、進捗はクラウド送信せずlocalStorageだけに保存 |
| hitori.html | 一人親方の基礎知識・診断 | 国交省PDF準拠。5問診断＋判定＋比較表（PC横並び/スマホ縦カード切替）＋印刷対応 |
| koushu.html | 技能講習日程案内 | 対応する日程カード内で受講資格・必要書類をチェック可能。足場と石綿は一問ずつ答える選択式判定。資料画像はUIに直接表示せず構造化データとして反映 |
| shiryo.html / book.html | 資料本棚 / デジタルブックリーダー | `assets/js/bookshelf.js`使用。PDF.js本体・ワーカーはSWインストール時に事前キャッシュ |
| app_guide.html | 説明書・ヘルプ | |

**`_archive/`フォルダ**：旧版で現行導線からリンクされていないページ10個（ccus_check, kanyu_merit, kokuho_sim, kyosai, merit_check, portal, techno, tetsuzuki_guide, youtube, rodo36_preview）。削除ではなく退避のみ。復元可能。

## 7. 定期更新が必要なデータ（要注意）

引き継ぎ時と年度更新時は、リポジトリ直下の`ANNUAL_UPDATE.md`も確認する。

| 項目 | 場所 | 更新頻度 |
|---|---|---|
| 雇用保険料率 | calc.html `const RM` | 毎年4月（厚労省告示） |
| 労災保険率・労務費率・第1/2種特別加入率 | calc.html `ROUSAI_TYPES`ほか | 毎年4月（厚労省告示・埼玉土建労働保険ガイド） |
| 厚生年金・介護保険料率 | calc.html `const RM` | 据置が多いが年1回要確認 |
| 国保料率・区分別金額 | calc.html 国保シミュ内 | 年度更新 |
| CCUS判定基準 | 公式外部サイトを利用（アプリ内に固定基準を持たない） | 公式URL変更時 |
| 傷病手当金・出産育児一時金等の給付内容 | calc.html／hitori.html | 埼玉土建国保の規程変更時（公式：https://www.sai-doken-kokuho.jp/ ） |
| 労働者供給事業の募集内容 | kyokyu.html | 随時（支部からの依頼） |

## 8. 外部API・外部サイト依存一覧

| 用途 | URL | 備考 |
|---|---|---|
| 天気・気温湿度 | `api.open-meteo.com/v1/forecast` | キー不要 |
| Googleカレンダー | `www.googleapis.com/calendar/v3/calendars/...` | APIキーは`assets/js/calendar-config.js`。Google Calendar API限定・本番URLのHTTPリファラー限定。複数カレンダーは`CALENDARS`配列で管理 |
| PDF表示 | cdnjsのpdf.js 3.11.174 | 本体・ワーカーはSWインストール時に事前キャッシュ。CMap・標準フォントも必要時取得後に実行時キャッシュ |
| DOKENギルド・天気設定 | Google Apps Script Webアプリ | URLは`assets/js/guild-config.js`。実働コード更新にはApps Script側の再デプロイが必要 |
| CCUS公式診断 | `lv-asses-sup.ccus.jp` | 外部リンク |
| どけんカード公式 | `doken-card.jp` | 外部サイト、アプリ内は誘導のみ |
| 求人求職 | `www.saitama-doken.or.jp/kyujin/` | 外部リンク |
| ホームドクターなび | `home-dr-navi.jp/home-dr/index` | 外部リンク（住民からの仕事依頼サイト） |
| 建退共 | `www2.kentaikyo.taisyokukin.go.jp` | 退職金シミュレーションへの外部リンク |
| 標準見積書作成 | `saitamadokenageoina-cloud.github.io/estimate/` | 姉妹アプリ（別リポジトリ、未統合） |

## 9. 開発中に判明した「教訓」（重要・再発防止用）

今後の実装で同じ不具合を再発させないために、過去に実際に起きたバグとその原因を記録する。

### 9-1. `<script src="...">`タグに直接コードを書いてはいけない
`<script src="navigation.js">console.log(...)</script>`のように、**src属性のあるscriptタグの中にインラインコードを書くと、そのコードは一切実行されない**（ブラウザ仕様）。過去にこれが原因で印刷・プレビューのボタンが完全に無反応になるバグが発生した。必ず`<script src="...">`と`<script>コード</script>`は別タグに分離する。

### 9-2. 印刷/プレビューの「色を全部リセットする」CSSは対象範囲に注意
`#print-area, #print-area *{background:transparent!important}`のように**用紙自体も対象に含めてしまう**と、直前に書いた「用紙を白くする」ルールを同じ詳細度・同じ`!important`で「後勝ち」により打ち消してしまう。結果、用紙が透明になり下の暗い背景が透けて見え、文字も黒に強制されるため実質「暗い背景に黒文字」で読めなくなる。**対象は子孫のみ（`#print-area *`）に限定**し、コンテナ自体の背景指定は別ルールとして独立させること。

### 9-3. 外部CDN依存はオフラインで「四角（グリフ欠落）」の原因になる
Service WorkerはNetwork-Firstだが**同一オリジンのリクエストしかキャッシュしない**設計のため、外部CDN（Tabler Iconsなど）はキャッシュ対象外だった。電波の弱い現場でCDN取得が失敗すると、アイコンフォントが読み込めずアイコンが軒並み「四角」表示になった。**外部ライブラリは可能な限り自前ホスティングし、SWキャッシュに含めること**。

### 9-4. ダークテーマのCSS変数再マッピングに要注意（9-3節参照の`common.css`の項目も参照）
固定背景の要素にテーマ変数の文字色を使うと、ダークモードで「淡い背景×明るい文字」の組み合わせになり読めなくなる。固定背景には固定文字色を。

### 9-5. iOS PWAでは`window.open()`や別ウィンドウ/iframeでの印刷が機能しないことがある
`window.open('','_blank')`はホーム画面PWAでは`null`を返すことがあり、iframeの`contentWindow.print()`も無反応になることがある。**同一ページ内にDOMを描画してから`window.print()`を呼ぶ方式**が最も安定する（`print-util.js`参照）。

### 9-6. 重複関数定義に注意
同名の関数を2回定義しても後者が有効になるだけで構文エラーにはならないため、コピペ時の重複に気づきにくい。定期的に`grep -c "^function 関数名"`等でチェックすると良い。

### 9-7. 半角%のエスケープミス
Pythonスクリプトで`width:100%%`のように誤って二重エスケープすると、CSSとして無効になりレイアウトが崩れる。生成スクリプトを書く際は出力結果を必ず`grep`で確認すること。

### 9-8. 公開HTML・JavaScriptに管理PINや秘密情報を書かない
GitHub Pagesとリポジトリは公開されているため、HTML・JavaScriptに書いた値は画面上で隠しても第三者が確認できる。管理PINはGoogle Apps Scriptのスクリプトプロパティ（`ADMIN_PIN`・`ALERT_PIN`）だけに設定し、6文字以上の推測されにくい値を使う。ブラウザ側は入力されたPINをその画面を閉じるまでメモリ上でのみ保持し、`localStorage`や`sessionStorage`には保存しない。

### 9-9. DOKENギルドの投稿データはサーバーと画面の両方で検証する
Apps Scriptはカテゴリ、投稿目的、掲載期限、取り次ぎ状況、期限確認結果、ID、本文長、氏名、地域、急募、作業日、時間、職種、人数、条件、状態、コメント、圧縮写真、天気設定値を許可形式へ正規化する。写真はブラウザのcanvasでJPEGへ再生成して位置情報を除去し、データURL4万文字以下だけを許可する。公開`list`レスポンスでは既存データを削除せず電話番号を完全に除外し、画面の連絡先は支部電話へ統一する。電話番号はlocalStorage・通知メール・LINE告知文にも含めない。画面側もクラウド・端末保存データを`normalizePost()`へ通し、HTML表示時は`esc()`でエスケープする。クラウド取得成功時はクラウド投稿を正とし、古い端末データを再結合しない。書き込みは`ok:true`のJSON応答を確認してから成功表示する。通知先メールはブラウザから受け取らず、スクリプトプロパティ`NOTIFY_EMAIL`のみを使用する。期限確認の`reviewExpiry`操作は管理PINを必須とし、継続時は期限を7日延長、解決時は完了状態へ移す。`docs/guild-apps-script-template.js`を変更しただけでは実働APIは更新されないため、Apps Script側の再デプロイまで完了させること。

## 10. LINE公式アカウント連携

リッチメニュー（6分割・大サイズ2500×1686px）用の画像と設定URL一式を過去に作成済み。ホームの5セクションに直接飛べるアンカー：

```
よく使う：      …/ageo-ina-portal/#yoku
仕事確保：      …/ageo-ina-portal/#shigoto
現場・管理関係： …/ageo-ina-portal/#genba
手続き・試算：   …/ageo-ina-portal/#tetsuzuki
講習・資料：     …/ageo-ina-portal/#koushu
```
アンカー着地時は`navigation.js`が自動スクロールを行う。

## 11. 支部の基本情報（コード内に散在）

- 支部名：埼玉土建一般労働組合 上尾伊奈支部
- 住所：〒362-0003 上尾市菅谷295
- 電話：048-773-9863
- 各ページのフッターに記載（`footer`タグ内、電話番号は`.tel-inline`クラスで自動リンク化済み）

## 12. 現状の既知の未対応・保留事項

- `_archive/`内の旧10ページ：削除するか判断待ち
- doken_card.htmlのパスワードは外部サイト（doken-card.jp）でクロスオリジンのため自動入力不可（手動コピー＆ペースト方式で運用中）
- doken_card.htmlの共通パスワードは公開HTML内に存在する。組合員限定を厳密に担保するには認証付き配信へ移す必要があり、現在の静的GitHub Pagesだけでは実現できない
- DOKENギルドは公開URLから閲覧できる。氏名等を組合員だけに限定するには認証導入が必要。投稿者の電話番号は公開API・一般画面・通知メールへ返さず、管理PIN検証済みの`getContact`操作だけで個別取得し、支部経由で取り次ぐ
- Google Calendar APIキーはクライアント公開型。Google Cloud側でCalendar API限定・公開サイトのHTTPリファラー限定・使用量アラートを必ず設定する
- LINEリッチメニューのタブ切替は公式管理画面のみでは実現不可（Liny/Lステップ等の有料ツールか、Messaging API + GAS実装が必要）
- PDF.js一式はcdnjs依存だが、本体・ワーカーはSWで事前キャッシュし、CMap・標準フォントは一度取得後に実行時キャッシュする

## 13. 検証コマンド集（引き継ぎ後も活用推奨）

```bash
# 全HTML内のJS構文チェック（src指定なしのscriptタグを抽出してnode --checkにかける）
python3 -c "
import re,glob,subprocess,tempfile,os
for f in sorted(glob.glob('*.html')):
    s=open(f,encoding='utf-8').read()
    for m in re.findall(r'<script(?![^>]*\ssrc=)[^>]*>(.*?)</script>',s,re.S):
        if not m.strip(): continue
        t=tempfile.NamedTemporaryFile('w',suffix='.js',delete=False,encoding='utf-8');t.write(m);t.close()
        r=subprocess.run(['node','--check',t.name],capture_output=True,text=True);os.unlink(t.name)
        if r.returncode: print('NG:',f,r.stderr)
"

# 内部リンク切れチェック
python3 -c "
import re,glob,os
htmls=set(glob.glob('*.html'))
for f in htmls:
    s=open(f,encoding='utf-8').read()
    for href in re.findall(r'href=\"([^\"#?]+\.html)',s):
        if not href.startswith('http') and os.path.basename(href) not in htmls:
            print(f, '->', href)
"

# 重複関数定義チェック
python3 -c "
import re,glob
from collections import Counter
for f in glob.glob('*.html'):
    s=open(f,encoding='utf-8').read()
    c=Counter(re.findall(r'function\s+(\w+)\s*\(', s))
    dups={k:v for k,v in c.items() if v>1}
    if dups: print(f, dups)
"
```

---

以上で、これまでの開発経緯・設計判断・既知の落とし穴を含む引き継ぎ情報を網羅しています。ご不明点があれば元の会話履歴（本ドキュメント作成元のClaudeとのチャット）も参照可能です。
