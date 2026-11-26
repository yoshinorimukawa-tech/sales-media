# 武川農園 通販サイト

## 画面を確認する
`public/index.html` をダブルクリックすると開きます。
パソコン内で開いている間は、支払いボタンを押しても決済されません（確認用の表示が出ます）。

## ファイル構成
| 場所 | 内容 |
|---|---|
| `public/js/catalog.js` | 商品・価格・送料・お届け時期（普段直すのはここ） |
| `public/index.html` | トップページ |
| `public/checkout.html` | ご注文手続き |
| `public/thanks.html` | 注文完了 |
| `public/legal.html` | 特定商取引法に基づく表記・プライバシーポリシー |
| `public/css/style.css` | デザイン |
| `public/assets/` | ロゴ（`logo.svg`、`emblem.svg`）と写真（`photo-*.jpg`） |
| `public/credits.html` | 写真の作者とライセンスの表記 |

## 写真について
Wikimedia Commons の写真を使っています。シャインマスカットの2枚は CC BY-SA 4.0 で、商用利用できますが、**作者名とライセンスの表記が必須**です。写真を使う間は `credits.html` とそこへのリンクを消さないでください。写真を加工して配布する場合は、同じライセンスになります。
自分で撮影した写真に差し替えたら、`credits.html` の該当行と「掲載写真はイメージです」の注記を見直してください。
| `netlify/functions/create-checkout.js` | 決済ページを作る処理 |

## GitHub Pages で見た目を確認する（決済は不可）
1. このフォルダの**中身**（`index.html`、`public`、`netlify`、`netlify.toml`、`README.md`）を、リポジトリの一番上にアップロードします。
2. リポジトリの Settings → Pages で、Source を「Deploy from a branch」、Branch を `main`・`/(root)` にして保存します。
3. 数分後に `https://ユーザー名.github.io/リポジトリ名/` を開きます。

GitHub Pages はネットショップの運営用には使えない規約のため、販売は次の方法（Netlify）で公開してください。

## 公開して決済を使えるようにする
1. **Stripe に登録**（https://stripe.com/jp）。事業者情報と入金口座を登録して審査を受けます。
2. **GitHub に登録**し、このフォルダ一式をリポジトリにアップロードします。
3. **Netlify に登録**し、そのリポジトリを読み込みます（設定は `netlify.toml` から自動で反映されます）。
   画面へのドラッグ＆ドロップで公開すると決済処理が動かないため、必ず GitHub 経由にしてください。
4. Netlify の「Environment variables」に `STRIPE_SECRET_KEY` を追加し、再デプロイします。
   最初は **テスト用キー（`sk_test_...`）** を使います。
5. テストカード `4242 4242 4242 4242`（有効期限は未来の日付、CVCは任意の3桁）で注文を試します。
6. 問題がなければ本番キー（`sk_live_...`）に差し替えて再デプロイします。

秘密キーはファイルに書かないでください。Netlify の環境変数だけに設定します。

## 注文の確認
- Stripe の管理画面の「支払い」を開くと、贈り先・のし・メッセージが「メタデータ」に表示されます。
- Stripe の設定で、入金時の自分宛て通知メールと、お客様宛て領収書メールを有効にしてください。
- **発送の判断は、必ず Stripe で入金を確認してから行ってください。**
- 在庫数の管理機能はありません。予定数に達したら、`catalog.js` から該当の商品やサイズを削除してください。

## 公開前のチェックリスト
- [ ] 価格・内容量・送料（現在はすべて仮の値）
- [ ] 農園の読み方とローマ字表記（現在は MUKAWA FARM）
- [ ] `index.html` と `legal.html` の〔　〕部分（住所・電話番号など）
- [ ] 説明文が実際の栽培・サービス内容と合っているか（朝採り、のし無料、金額を記載しない納品書など）
- [ ] 返品・キャンセル・返金の条件
- [ ] 先行予約で代金を先に受け取ることについて、Stripe の審査条件を確認
- [ ] イメージ写真を当園の実際の商品写真に差し替え（`catalog.js` の `image`・`photos` と `index.html` のトップ画像）

## 次のシーズンに直す場所
`catalog.js` の `season` と `deliveryPeriods`、`index.html` のお知らせ、`legal.html` の引渡し時期。
