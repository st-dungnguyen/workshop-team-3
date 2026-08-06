# Implementation Plan: Environment Configuration

**Overview:** [_overview.md](./_overview.md)
**File:** `game-api/plugins/env.js`

---

## How Config Is Loaded

`plugins/env.js` is a fastify-plugin that:
1. Calls `require('dotenv').config()` — loads `game-api/.env` on startup
2. Validates required vars (non-local only)
3. Decorates `fastify.config` — available to all routes and plugins

Routes access config via `fastify.config.*` (not `process.env` directly).

---

## Environment Variables

### Required in ALL non-local environments

| Var | Description |
|---|---|
| `ENV` | Runtime environment: `local` \| `dev` \| `stg` \| `prd`. Default: `local` |
| `COUPON_API_URL` | Skylark Coupon API base URL |
| `X_SKYLARK_TOKEN` | `x-skylark-token` header value for Coupon API |
| `AUTH0_ISSUER` | Auth0 tenant URL (e.g. `https://dev-skylark.us.auth0.com/`) |

### Optional — all have defaults

| Var | Default | Description |
|---|---|---|
| `PORT` | `3001` | Server listen port |
| `CORS_ORIGIN` | `*` | Allowed CORS origin(s) |
| `WIN_PROBABILITY` | `0.5` | Float 0–1; win rate per play |
| `COUPON_ID` | `1000000001` | Coupon ID from Skylark CMS |
| `COUPON_TITLE` | `すかいらーくグループ全店共通クーポン` | Display title on win screen |
| `COUPON_DISCOUNT` | `500円OFF` | Display discount on win screen |
| `COUPON_START_DATE` | Server start time (ISO8601) | Coupon validity start |
| `COUPON_END_DATE` | +1 year from server start (ISO8601) | Coupon validity end / display expiry |

### Local dev minimum (ENV=local)

```env
ENV=local
PORT=3001
CORS_ORIGIN=http://localhost:5173
```

No Skylark credentials needed. JWT is decoded without signature verification. Coupon issuance is mocked.

---

## ENV=local Behaviour

| Feature | Non-local | Local |
|---|---|---|
| JWT verification | Auth0 JWKS (RS256) | `jwt.decode` — no sig check |
| Coupon API call | Real `POST /segment` | Skipped — returns `COUPON_ID` directly |
| Required env vars | `COUPON_API_URL`, `X_SKYLARK_TOKEN`, `AUTH0_ISSUER` | None |

---

## Per-Environment Values

| Var | local | dev | stg | prd |
|---|---|---|---|---|
| `COUPON_API_URL` | _(not set)_ | `https://coupon-api-dev.skylark.co.jp` | `https://coupon-api-stg.skylark.co.jp` | `https://coupon-api.skylark.co.jp` |
| `AUTH0_ISSUER` | _(not set)_ | `https://dev-skylark.us.auth0.com/` | `https://dev-skylark.us.auth0.com/` | _(TBD — confirm with API team)_ |
| `X_SKYLARK_TOKEN` | _(not set)_ | _(from API team)_ | _(from API team)_ | _(from API team)_ |

**Note:** dev and stg share the same Auth0 tenant (`dev-skylark`) — confirmed with API team.
