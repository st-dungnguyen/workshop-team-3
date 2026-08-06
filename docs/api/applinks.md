# AppLink 仕様（ネイティブアプリへの画面遷移リンク）

すかいらーくアプリは `https://www.skylark.co.jp/app/*` の URL（AppLink / Universal Links 形式）をインターセプトし、対応するネイティブ画面を開く。
ミニアプリ（WebView 内の Web ページ）からアプリ側の画面へ遷移したい場合は、この URL に `window.location.href` 等で遷移すればよい。

- **正: [AppLink 仕様スプレッドシート](https://docs.google.com/spreadsheets/d/1ZPO_uVfXlb9fJSBPc5KvBZb1HLl4SYEwbqO1n_OAxL8)**。本書はその転記・整理（2026-04-09 時点の仕様 + 2026-07-01 の内部 WebView 表示形態追加を反映）
- リンク生成・QR コード化ツール: `sk-applinks-generator.html`（スプレッドシートと同内容をフォーム化したもの）
- ミニアプリでの実使用例: [campaign-common-spec.md §9](../specs/campaign-common-spec.md)（クーポン一覧・クーポン詳細への遷移）

ベース URL: `https://www.skylark.co.jp`

## 画面遷移（/app/main 系）

`/app/main` に `to` パラメータで遷移先を指定する形式。

| 遷移先 | URL | パラメータ |
|--------|-----|-----------|
| ホーム画面 | `/app/main` | — |
| ネット注文画面 | `/app/main?to=onlineorder` | — |
| クーポン TOP | `/app/main?to=coupon_top` | — |
| クーポン一覧 | `/app/main?to=coupon_list` | `brand`（任意。brand_id） |
| クーポンマップ | `/app/main?to=coupon_map` | `brand` / `group` / `lat` / `lon`（すべて任意） |
| ポイントカード設定 | `/app/main?to=point_card_setting` | — |
| 会員情報画面 | `/app/main?to=member_info` | — |
| テイクアウト画面 | `/app/main?to=to_site` | — |
| テイクアウト画面（TO クーポン取得済） | `/app/main?to=to_site` | `coupon_id`（必須） |
| EC 画面の個別商品 | `/app/main?to=ec_site` | `sku`（必須。商品固有 ID） |
| お知らせタブ | `/app/main?to=information` | — |
| 支払い詳細画面（main 経由） | `/app/main?to=payment_order` | `order_id`（必須） |

## テイクアウト（/app/takeout）v8.0.7〜

| 遷移先 | URL | パラメータ |
|--------|-----|-----------|
| テイクアウト画面 | `/app/takeout` | — |
| テイクアウト画面（TO クーポン取得済） | `/app/takeout` | `coupon_id`（必須） |

## スキャン v8.0.9〜

| 遷移先 | URL | パラメータ |
|--------|-----|-----------|
| スキャン トップ | `/app/scan` | `camera=1`（任意。スキャナー自動起動） |
| アプリ決済説明ページ | `/app/scan/payment` | `camera=1`（任意） |
| チェックイン説明ページ | `/app/scan/checkin` | `camera=1`（任意） |

## チェックイン v8.0.9〜

| 遷移先 | URL | パラメータ |
|--------|-----|-----------|
| チェックインする | `/app/checkin` | `key`（必須。unique_key） |

## アプリ決済

| 遷移先 | URL | パラメータ |
|--------|-----|-----------|
| 支払い詳細画面 | `/app/payment/order` | `order_id`（必須） |
| 決済確認中画面 | `/app/payment/complete` | `paymentId`（必須。※このキーのみキャメルケース） |

## クーポン

| 遷移先 | URL | パラメータ |
|--------|-----|-----------|
| クーポン詳細画面 | `/app/coupon/detail` | `id`（必須。coupon_id） |
| セグメントクーポン詳細画面 | `/app/coupon/segment` | `id`（必須。coupon_id） |
| 店舗クーポン画面 | `/app/coupon/store` | `store_id`（必須。**shop_cd（6桁数字）とは別物**） |

ミニアプリのキャンペーンで発行するのはセグメントクーポンなので、当選結果画面などからは `/app/coupon/segment?id={クーポンID}` を使う（[coupon-api.md](./coupon-api.md) のフロー 4 も参照）。

## WebView

| 遷移先 | URL | パラメータ |
|--------|-----|-----------|
| 内部 WebView で URL を表示 | `/app/web/inside` | `url`（必須）/ `hAuth`（任意。`1`=認証ヘッダー付与）/ `present`（任意。下記） |
| 外部ブラウザで URL を表示 | `/app/web/outside` | `url`（必須） |

### 内部 WebView の表示形態 `present`（2026-07-01 追加）

| 値 | 表示 |
|----|------|
| `full`（省略時） | 全画面。後方互換のため URL には付けない |
| `modal` | モーダル表示 |
| `headerless` | ヘッダーなし・全画面 |

**headerless の注意**: ヘッダー（✗ ボタン）が出ないため、閉じる導線は Web ページ側が `sklgusto://close` を呼ぶ実装に依存する。`close` は自社管理ドメインのみ許可される想定のため、**`hAuth=1` とセットで使うことを強く推奨**（未設定だと閉じられない画面になる恐れがある）。
※ ただし `present` / `sklgusto://close` は**現在実装中で develop 未マージ**（2026-08 時点）。下記「アプリ実装からの確認結果」参照。

## 補足

- バージョン注記（v8.0.7〜 等）はアプリの対応開始バージョン。古いアプリでは動作しないリンクがあるため、キャンペーンの対象バージョンと突き合わせること

## アプリ実装からの確認結果（iOS / Android コード）

`appcode/skylark-visit-ios` / `appcode/skylark-visit-android`（いずれも develop、2026-07-06 時点）で確認した内容。

### カスタム URL スキーム `sklgusto`

- iOS: `ReduxFramework/SupportingFiles/Info.plist` の `CFBundleURLSchemes` に登録。全環境（stub/develop/staging/release）で `sklgusto`（`ApplicationConfig/Environment.swift`）
- Android: `modules/resource/src/main/res/values/strings.xml` の `deep_link_scheme_sklgusto` + 各 AndroidManifest の intent-filter
- iOS は Universal Link（`https://www.skylark.co.jp/app/X`）を内部で `sklgusto://X` に変換して処理する（`ApplicationModel/Util/DeepLinkUtil.swift`）。つまり iOS では本書の各リンクは `sklgusto://main?to=...` のようなスキーム直接起動でも動く
- Android の `DeepLinkHandler.kt` が明示的に処理する sklgusto リンクは `sklgusto://main?to=...` と `sklgusto://anpanman?code=...` のみ（Manifest には `sklgusto://payment/complete` のフィルタもあり）

### 「WebView を閉じる」の実装

- 両 OS とも「**パスが `/close` の URL への遷移**」で WebView を閉じる実装（iOS: `WebViewPaths.close = "/close"`、Android: `Constants.FRONT_CLOSE_URL = "/close"`）。iOS では `{webViewHost}/close` という https URL として組み立てられる
- `sklgusto://close` と `present`（modal / headerless）は**現在実装中で、develop には未マージ**（2026-08 時点。develop 2026-07-06 断面には処理コードなし。iOS の DeepLink Host enum にも `close` は無い）。**headerless + close を使う際は、対象アプリバージョンにこの実装が入っているかをアプリチームに確認すること**

### ジェネレータに載っていないリンク（Android `DeepLinkHandler.kt` で処理）

- `https://skylark.co.jp/app/launch` — スプラッシュ画面へ
- `https://skylark.co.jp/app/campaign/detail?id={キャンペーンID}` — キャンペーン詳細へ
- `https://skylark.co.jp/app/tpoint` — Vポイントへ

### 参考

- アプリ側のディープリンク設計資料: https://github.com/team-lab/skylark-visit-doc/tree/master/ディープリンク（`DeepLinkHandler.kt` のコメントで参照されている）
