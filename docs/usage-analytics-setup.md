# 匿名利用集計の初期設定

## 目的

DOKEN SMART PORTALで、どの機能がよく使われているかをGoogle Analytics 4で確認します。
氏名・電話番号・メール・住所・投稿内容・入力金額・検索語は記録しません。

## 集計開始までの操作

1. Google Analyticsで「DOKEN SMART PORTAL」用のプロパティを作ります。
2. ウェブデータストリームのURLへ、次を入力します。
   `https://saitamadokenageoina-cloud.github.io/ageo-ina-portal/`
3. 画面に表示される「測定ID」を控えます。`G-`から始まる文字です。
4. `assets/js/usage-analytics.js`を開きます。
5. 次の行の空欄へ測定IDを入力します。

   ```js
   var MEASUREMENT_ID = 'G-XXXXXXXXXX';
   ```

6. `sw.js`の`CACHE_VERSION`を1つ上げます。
7. 公開後、Google Analyticsのリアルタイム画面で自分の操作が表示されることを確認します。

## 主に確認するイベント

| イベント | 内容 |
|---|---|
| `feature_open` | 各機能を開いた回数 |
| `guild_post_complete` | DOKENギルドの投稿完了 |
| `business_card_png_download` | 名刺PNGの保存 |
| `business_card_pdf_download` | 名刺PDFの保存 |
| `work_log_save` | 作業記録の保存 |
| `workers_comp_calculate` | 労災保険料計算の利用 |
| `external_estimate_open` | 標準見積書作成を開いた回数 |
| `branch_phone_click` | 支部電話ボタンの利用 |

`feature_open`は`feature_id`で機能別に分けます。同じ端末で同じ機能を30分以内に開き直した場合は、重複を抑えます。

## 運用上の注意

- Google Analytics専用のアカウント・プロパティを使います。
- 広告機能とGoogleシグナルは使用しません。
- 画面の入力値をイベント名や項目へ追加しないでください。
- 新しい機能を追加するときは、決められた英字の機能名だけを許可一覧へ追加します。
- 導入前の利用回数を後から復元することはできません。
