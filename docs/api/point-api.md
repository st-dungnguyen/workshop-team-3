# すかいらーくポイント付与 API 連携仕様

キャンペーンからユーザーへのすかいらーくポイント付与に使う API の仕様。

- 元スペック: swagger（`appcode/skylark-point-api/public/swagger/api/docs/`）。本書は 2026-08 時点の swagger・実装と、API 担当チームから受領した接続・認証情報の転記・整理
- API 実装の参照: `appcode/skylark-point-api`（任意サブモジュール。参照専用）
- クーポン付与は別 API（[coupon-api.md](./coupon-api.md)）

## 接続情報

| 項目 | 値 |
|------|-----|
| API ベース（audience） | `https://skpoint-public-dev.skylark.co.jp/api/v1/points` |
| Auth0 トークンエンドポイント | `https://dev-skylark.us.auth0.com/oauth/token` |

- **Auth0 は 2 環境のみで、`dev` 表記のテナントを dev / stg が共用する**（担当チーム確認済み。stg 用途でも上記 URL のままで良い）
- prd の接続情報は本書では未確認（利用時は担当チームに確認）

## IP 制限

API は**許可リストに登録された IP からのリクエストのみ**受け付ける。呼び出し元の外向き IP を固定し、担当チームに許可リスト登録を依頼すること。

- サーバーの外向き IP が不定な環境（Cloud Run 等）では、NAT 等で egress IP を固定する必要がある（構成例: [ワークショップの Cloud NAT 構成](../workshops/2026-danang-ai-driven/stretch-deploy-cloudrun.md)）

## 認証（M2M / client_credentials）

ユーザーのアクセストークンではなく、**サーバー間認証（Auth0 の M2M トークン）**を使う。

```bash
curl --request POST \
  --url https://dev-skylark.us.auth0.com/oauth/token \
  --header 'content-type: application/json' \
  --data '{
    "client_id": "<CLIENT_ID>",
    "client_secret": "<CLIENT_SECRET>",
    "audience": "https://skpoint-public-dev.skylark.co.jp/api/v1/points",
    "grant_type": "client_credentials"
  }'
```

レスポンス:

```json
{ "access_token": "eyJ...", "token_type": "Bearer" }
```

取得した `access_token` を API リクエストの `Authorization: Bearer <access_token>` に設定する。

- `client_id` / `client_secret` は API 担当チームから受領する。**本書・リポジトリには記載しない。コードに書かず環境変数で注入し、コミット禁止**

## 共通ヘッダー

| ヘッダー | 必須 | 内容 |
|---------|------|------|
| `Authorization` | ○ | `Bearer <M2M アクセストークン>`（上記で取得） |
| `X-request-id` | ○ | リクエスト識別子。生成ロジックは下記 |

`X-request-id` の生成（swagger にも記載があるが分かりづらいため、担当チーム提供のサンプルを転記）:

```js
// Node.js
const requestId = "CKI_" + crypto.randomUUID().replaceAll("-", "");
```

## キャンペーンポイント付与 API — `POST /api/v1/points/campaign`

キャンペーンからユーザーにポイントを付与する（M2M 認証 + 冪等性制御）。

出典: `appcode/skylark-point-api` の swagger（`public/swagger/api/docs/paths/points/campaign.yaml`）と FormRequest（`StoreCampaignPointRequest`）から 2026-08 時点の内容を転記。

### `X-request-id`（冪等性キー）

同じ `X-request-id` のリクエストは **24時間**、初回のレスポンスがキャッシュから返る（レスポンスヘッダー `X-Idempotent-Replayed: true` が付く）。二重付与防止のため、**1回の付与操作ごとに新しい ID を生成**すること。

- 形式: `CKI_` + 小文字16進32文字（正規表現 `/^CKI_[a-f0-9]{32}$/`）。前掲の生成サンプルがこの形式を満たす
- 同一 ID の同時リクエストはロック（30秒）により `409` になる

### リクエストボディ

```json
{
  "user_id": "auth0|123456d98910d11c1213c",
  "transaction_date": "2026/08/06",
  "point_type_id": 4,
  "campaign_cd": "00011",
  "campaign_name": "Mini Game",
  "expired_at": "2026/12/31",
  "shop_cd": "123456",
  "point": 50
}
```

| フィールド | 型 | 必須 | 内容・バリデーション |
|-----------|----|------|--------------------|
| `user_id` | string | ○ | ユーザー ID（`auth0|…` 形式） |
| `transaction_date` | string | ○ | 付与日。`Y/m/d` 形式・**当日以前** |
| `point_type_id` | integer | ○ | ポイント種別。`3` または `4`（区別の詳細は API 担当チームへ。swagger の例は `4`） |
| `campaign_cd` | string | ○ | キャンペーンコード（最大255文字） |
| `campaign_name` | string | ○ | キャンペーン名（最大255文字） |
| `expired_at` | string | ○ | ポイント有効期限。`Y/m/d` 形式・`transaction_date` より後 |
| `point` | integer | ○ | 付与ポイント数。**1〜999999** |
| `shop_cd` | string | - | 店舗コード。**6桁固定**（`point_type_id` に応じたカスタム検証あり） |

### レスポンス

```json
// 200
{
  "success": true,
  "data": { "user_id": "auth0|123456d98910d11c1213c", "point": 50, "campaign_cd": "00011", "campaign_name": "Mini Game" }
}
```

エラー: `400`（バリデーション）/ `401`（認証）/ `404` / `409`（同一 `X-request-id` の同時実行）/ `500`
