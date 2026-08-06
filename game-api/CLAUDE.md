# Mini Game API — Development Guide

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A **Fastify 5** backend API for the Mini Game WebView. It validates Auth0 JWT tokens from the WebView, manages daily game eligibility (one play per user per day), resolves win/lose outcomes, issues coupons to winners via an external Coupon API, and records all game sessions in PostgreSQL.

**Companion frontend**: [`../game-ui/`](../game-ui/)

## Tech Stack

Fastify 5 with `@fastify/autoload` for plugin + route discovery, **Knex 3** for PostgreSQL query building and migrations, `@fastify/cors`, `@fastify/sensible` for HTTP error utilities, `jsonwebtoken` + `jwks-rsa` for Auth0 RS256 validation, `axios` for Coupon API calls, and Node.js native `test` runner.

## Commands

```sh
pnpm run dev             # fastify start -w -l info -P app.js  (watch mode)
pnpm start               # fastify start -l info app.js  (production)
pnpm test                # node --test test/**/*.test.js
pnpm run migrate         # knex migrate:latest  (apply pending migrations)
pnpm run migrate:rollback  # knex migrate:rollback  (undo last batch)
pnpm run migrate:make -- <name>  # scaffold a new migration file
```

## Architecture

### Top-level layout

```
app.js            # entry — autoloads plugins/ then routes/
knexfile.js       # Knex configuration (reads DATABASE_URL)
plugins/          # shared Fastify plugins (env, knex, cors, sensible)
routes/           # auto-loaded route handlers, one subfolder per feature
services/         # business logic (CouponService, DrawsService)
helpers/          # utilities (JWT validation/extraction)
migrations/       # Knex migration files (timestamp-prefixed JS)
test/             # Node native test suite
```

### Plugin load order

`app.js` autoloads **plugins/** first (env → knex → cors → sensible), then **routes/**. Plugins decorate the `fastify` instance; routes consume decorators. Never import a plugin from within another plugin — rely on autoload ordering.

### Environment modes

Three modes controlled by `ENV`:

| Mode | `ENV` value | JWT verification | Coupon API | DB required |
|---|---|---|---|---|
| Local dev | `local` (default) | Returns mock payload `{ sub: 'local-dev-user', iss: 'local' }` — accepts any token string including `local-dev-token` | Mock (500 ms delay, fake coupon ID) | Required |
| Dev / staging | `dev` (or any non-`local`, non-`prod`) | Decodes token without signature or issuer check — real JWT structure required but no JWKS call | Real external API | Required |
| Production | `prod` | RS256 via Auth0 JWKS with 10-min cache — `AUTH0_ISSUER` required | Real external API | Required |

`fastify.config.isLocal` boolean is the authoritative check used inside services and helpers.

## Key Files

| File | Role |
|---|---|
| `plugins/env.js` | Loads `.env`, validates required vars, decorates `fastify.config` |
| `plugins/knex.js` | Initializes Knex, tests connection, decorates `fastify.knex` |
| `knexfile.js` | Knex config — reads `DATABASE_URL`, points to `./migrations` |
| `helpers/jwt.helper.js` | `verifyToken(token)` + `extractBearerToken(request)` |
| `services/draws.service.js` | `hasPlayedToday`, `getNextPlayAt`, `recordPlay` (factory, receives `fastify.knex`) |
| `services/coupon.service.js` | `issueCoupon({ userId, token })` — local mock or real POST to Coupon API |

## API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | None | Health check — `{ root: true }` |
| POST | `/auth/validate` | None | Validates a token; returns `{ success, userId }` |
| GET | `/game/eligibility` | Bearer | Returns `{ eligible, nextPlayAt }` |
| POST | `/game/play` | Bearer | Plays the game; returns `{ outcome, coupon? }` — does NOT call Coupon API |
| POST | `/game/claim` | Bearer | Issues coupon via Coupon API for today's win; idempotent |

**`POST /game/play`** flow:
1. Extract + verify Bearer token → get `userId`
2. Check `hasPlayedToday(userId)` → 403 if already played
3. Roll win/lose via campaign's `win_probability`
4. On win → pick random coupon from `campaign_coupons` → record `{ outcome: 'win', couponId }`; return coupon object (Coupon API NOT called here)
5. On lose → record `{ outcome: 'lose' }`; return `{ outcome: 'lose' }`

**`POST /game/claim`** flow:
1. Extract + verify Bearer token → get `userId`
2. Look up today's win session for `userId` → 404 if none
3. Verify body `couponId` matches `session.coupon_id` → 409 if mismatch
4. If `session.claimed_at` is set → return 200 (idempotent)
5. Fetch coupon row from `campaign_coupons` → call `issueCoupon` → update `claimed_at`

## Database Schema

Managed via Knex migration files in `migrations/`. Run `pnpm run migrate` after adding a new file.

```
game_sessions
  id          SERIAL PK
  user_id     TEXT NOT NULL
  play_date   DATE NOT NULL          -- UTC YYYY-MM-DD
  outcome     VARCHAR(8) NOT NULL    -- 'win' | 'lose'
  coupon_id   TEXT                   -- pre-selected coupon ID (from campaign_coupons)
  claimed_at  TIMESTAMPTZ            -- set by POST /game/claim; null = not yet issued via Coupon API
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
  INDEX: (user_id, play_date)
```

`play_date` is always stored as UTC `YYYY-MM-DD`. The one-play-per-day rule is enforced in `DrawsService.hasPlayedToday`, not as a DB constraint. Knex manages its own `knex_migrations` and `knex_migrations_lock` tracking tables automatically.

## Auth & JWT

- Token arrives in `Authorization: Bearer <jwt>` header (WebView passes the token it received from the mobile app).
- `helpers/jwt.helper.js` handles both modes — callers always use `verifyToken` regardless of env.
- Auth0 issuer: `https://login-dev.skylark.co.jp/` (set via `AUTH0_ISSUER` env var).
- Algorithm: RS256. JWKS fetched from `{AUTH0_ISSUER}/.well-known/jwks.json`.

## External Coupon API

**Never called client-side** — only this backend issues coupons.

| Detail | Value |
|---|---|
| Base URL | `COUPON_API_URL` env var |
| Endpoint | `POST /segment` |
| Required headers | `x-skylark-token`, `x-client-version: webview-mini-app-{env}`, `Authorization: Bearer <user-token>` |
| Response | `{ couponId }` |

Error codes propagated to the frontend: 401 → Unauthorized, 503 → maintenance.

## Environment Variables

```sh
# Required in all environments
DATABASE_URL=          # PostgreSQL connection string

# Required in prod only
AUTH0_ISSUER=          # Auth0 tenant URL (trailing slash) — only enforced when ENV=prod
COUPON_API_URL=        # External coupon service base URL
X_SKYLARK_TOKEN=       # Skylark API auth token

# Required in non-local (dev/prod)
DATABASE_URL=          # PostgreSQL connection string (also required in local, listed above)

# Optional (with defaults)
ENV=local              # 'local' | 'dev' | 'prod'
CORS_ORIGIN=*          # Allowed CORS origin
WIN_PROBABILITY=0.5    # Float 0–1
COUPON_ID=1000000001
COUPON_TITLE=          # Japanese display name
COUPON_DISCOUNT=500円OFF
COUPON_START_DATE=     # ISO date string
COUPON_END_DATE=       # ISO date string (default +1 year)
```

## Testing

Tests use Node.js native `test` + Fastify's `app.inject()` — no supertest or jest. The `test/helper.js` `build(t)` factory creates a fully-wired Fastify instance for each test. Keep tests close to their corresponding route/plugin folder under `test/`.

## Conventions

- Route files export an `async function(fastify, opts)` registered with `@fastify/autoload` — no manual `fastify.register()` in `app.js`.
- Services receive dependencies via constructor/factory (no global singletons). `CouponService` takes `fastify.config`; `DrawsService` takes `fastify.knex`.
- All DB queries go through `fastify.knex` (Knex query builder) — never import `pg` or `knex` directly in routes or services.
- Validation uses Fastify JSON Schema on `schema.body` / `schema.response` — define schemas inline in the route file.
- Error responses: throw `fastify.httpErrors.*` (from `@fastify/sensible`) in routes; catch and re-map in try-catch blocks where status codes matter.
- New migrations: run `pnpm run migrate:make -- <description>` to scaffold, then implement `exports.up` / `exports.down`.

## Development Workflows

- Use the `fastify-best-practise` skill when adding routes, plugins, or services.
- After changing schema: create a new migration with `pnpm run migrate:make -- <name>` and run `pnpm run migrate`.
- `ENV=local` is the default — the server starts without a real Auth0 issuer or Coupon API.
