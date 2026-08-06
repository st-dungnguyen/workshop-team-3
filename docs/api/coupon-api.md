# クーポン API 連携仕様（セグメント API）

キャンペーンからユーザーへのクーポン付与に使う Skylark クーポン API（セグメント API）の仕様。
新キャンペーンは本書のセグメント登録 API（`POST /segment`）/ セグメント取得 API（`GET /segment`）を使用する。

- 元スペック: apidog（本書は 2026-08 時点の内容を転記・整理）。クライアント実装: `src/services/coupon-api.ts`（`registerSegment` / `getSegments`）
- 注記: 旧 API `POST /coupon/segment/entry` が既存キャンペーン（lottery / 8box）のコードに残存しているが、新 API への切替予定のため**新規では使用しない**

## クーポン付与の全体フロー

1. **CMS でセグメントクーポンを発行**し、クーポン ID を控える
2. キャンペーン側のマスタ（Firestore `coupon_master` 等）にクーポン ID を設定する
3. 当選時にサーバー側から**セグメント登録 API**で対象ユーザーに付与する
4. 付与済みの確認は**セグメント取得 API**（またはアプリのクーポン詳細画面 `https://www.skylark.co.jp/app/coupon/segment?id={クーポンID}`。AppLink の仕様は [applinks.md](./applinks.md)）

## 接続情報

| 環境 | ベース URL |
|------|-----------|
| dev | `https://coupon-api-dev.skylark.co.jp` |
| stg | `https://coupon-api-stg.skylark.co.jp` |
| prd | `https://coupon-api.skylark.co.jp` |

アプリ側では環境変数 `COUPON_API_URL` で指定する。

## 認証・共通ヘッダー

| ヘッダー | 必須 | 内容 |
|---------|------|------|
| `Authorization` | ○ | `Bearer <ユーザーのアクセストークン>`（ネイティブアプリから渡される JWT） |
| `x-skylark-token` | ○ | 環境変数 `X_SKYLARK_TOKEN` の値 |
| `x-client-version` | ○ | クライアント識別子。実値は `webview-mini-app-{env}`（local は `webview-mini-app-local`） |

## セグメント登録 API — `POST /segment`

対象ユーザーにクーポン（および任意でインフォメーション・バナー）を付与する。

### リクエストボディ

```json
{
  "userId": "9d4f2d7c-7e40-11e9-b1b9-0242ac130008",
  "member": "1",
  "coupons": [
    { "id": "1000000001", "startDate": "2026-03-01T00:00:00Z", "endDate": "2026-03-31T23:59:59Z" }
  ],
  "information": [],
  "banners": []
}
```

| フィールド | 型 | 必須 | 内容 |
|-----------|----|------|------|
| `userId` | string | ○ | ユーザー ID |
| `member` | string enum | ○ | 会員種別。`0`: ゲスト / `1`: 会員（キャンペーンでは `1` 固定） |
| `coupons[]` | array | - | 付与するクーポン。`{ id, startDate, endDate }` |
| `information[]` | array | - | インフォメーション。同形式（キャンペーンでは通常空配列） |
| `banners[]` | array | - | バナー（お知らせ）。同形式（キャンペーンでは通常空配列） |

- 各アイテムの `id` は**数字のみの文字列**、`startDate` / `endDate` は ISO8601（UTC）で `startDate < endDate` 必須
- `coupons` / `information` / `banners` の**いずれかに1件以上**が必要
- `endDate` がクーポンの有効期限に相当する

### レスポンス（200）

登録された内容がそのまま返る（`userId` + `coupons` / `information` / `banners` 各配列。アイテムは `{ id, startDate, endDate }`）。
アプリ実装では `coupons[0].id` を発行済みクーポン ID として `draws` に保存している。

### エラー

| ステータス | reason | 意味 |
|-----------|--------|------|
| 400 | `requiredAtLeastOneSegmentList` | クーポン・インフォメーション・バナーのいずれかに1件以上必要 |
| 400 | `invalidSegmentDatetimeRange` | 配信開始日時が終了日時より後 |
| 400 | `requiredNumericStringCouponId` / `requiredNumericStringInformationId` | ID が数字文字列でない |
| 401 | `unauthorized` | 認証情報不足 |
| 422 | `validationFailed` | バリデーションエラー（`details[]` に詳細） |
| 500 | `systemError` | システムエラー |
| 503 | `maintenance` | メンテナンス中 |

## セグメント取得 API — `GET /segment`

ユーザーに付与済みのセグメント（クーポン等）一覧を取得する。

### クエリパラメータ

| パラメータ | 必須 | 内容 |
|-----------|------|------|
| `userId` | △ | ユーザー ID（`userId` / `guestId` のいずれかが必須） |
| `guestId` | △ | ゲスト ID |
| `types` | - | 取得対象種別。カンマ区切り（例: `coupon,information`。キャンペーン実装では `coupon` のみ指定） |

### レスポンス（200）

`coupons` / `information` / `banners` 各配列（アイテムは `{ id, startDate, endDate }`）。

### エラー

| ステータス | reason | 意味 |
|-----------|--------|------|
| 400 | `requiredUserIdOrGuestId` | ユーザー ID またはゲスト ID が必須 |
| 400 | `invalidTypeParameter` | 無効な種別指定 |
| 401 / 422 / 500 / 503 | （登録 API と同様） | |

## 実装メモ

- 型定義は OpenAPI スキーマ（`schema/coupon-api.json`）から `npm run openapi-typescript:coupon-api` で生成される（`src/lib/openapi/coupon-api.d.ts`）。スキーマ更新時は再生成すること
- CMS 側で発行したクーポンの表示用メタデータ（名称・画像等）は別経路（CMS の `segments.json`）から取得する実装例がある（`src/features/8box/services/coupon-segments.ts`）
