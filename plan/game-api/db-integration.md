# Implementation Plan: PostgreSQL Integration & Campaign Management

**Specs:**
- [F2.1 — Active Game Configuration](../spec/game-core/f2.1-active-game-configuration.md)
- [F2.5 — Persistent Game Session Storage](../spec/game-core/f2.5-db-integration.md)
- [F2.6 — Campaign & Coupon Management](../spec/game-core/f2.6-campaign-coupon-management.md)

**Status: ✅ Implemented**

---

## Overview

Three-phase implementation:
1. **PostgreSQL infrastructure** — Docker, Knex, `game_sessions` table, daily play tracking
2. **Campaign management** — `campaigns` + `campaign_coupons` tables, active config API, coupon pool
3. **Frontend config loading** — runtime `GET /game/config` fetch, parallel eligibility check, dynamic variant rendering

---

## Phase 1 — PostgreSQL Infrastructure (F2.5)

### 1.1 Docker Compose

`docker-compose.yml` at project root — PostgreSQL 16 Alpine with named volume, health check, and env-var-driven credentials (defaults: `game_user / game_password / game_db : 5432`).

```bash
docker compose up -d
```

### 1.2 Dependencies

```bash
cd game-api
pnpm add knex pg
pnpm remove @fastify/postgres   # replaced by knex
```

### 1.3 Environment variables

Add to `game-api/.env` and `.env.example`:

```dotenv
DATABASE_URL=postgresql://game_user:game_password@localhost:5432/game_db
```

### 1.4 Knex config — `game-api/knexfile.js`

```js
require('dotenv').config()
module.exports = {
  client: 'pg',
  connection: process.env.DATABASE_URL,
  migrations: { directory: './migrations', extension: 'js' },
  seeds: { directory: './seeds' },
  pool: { min: 2, max: 10 },
}
```

### 1.5 Fastify plugin — `game-api/plugins/knex.js`

Registers Knex, tests connection with `SELECT 1` on startup (fails fast if DB unreachable), decorates `fastify.knex`, destroys pool on `onClose`.

### 1.6 Migration — `game-api/migrations/20260806000001_create_game_sessions.js`

```
game_sessions
  id          SERIAL PK
  user_id     TEXT NOT NULL
  play_date   DATE NOT NULL          -- UTC YYYY-MM-DD, indexed with user_id
  outcome     VARCHAR(8) NOT NULL    -- 'win' | 'lose'
  coupon_id   TEXT
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
  INDEX (user_id, play_date)
```

Uses `hasTable` check + `CREATE INDEX IF NOT EXISTS` to be idempotent (handles case where table was previously created by raw SQL).

### 1.7 Updated service — `game-api/services/draws.service.js`

Factory `createDrawsService(knex)` — three async functions:
- `hasPlayedToday(userId)` — `SELECT 1 WHERE user_id=$1 AND play_date=$2 LIMIT 1`
- `getNextPlayAt(userId)` — calls `hasPlayedToday`, returns UTC midnight of next day if played
- `recordPlay(userId, {outcome, couponId})` — `INSERT INTO game_sessions ...`

### 1.8 Scripts — `game-api/package.json`

```json
"migrate":          "knex migrate:latest",
"migrate:rollback": "knex migrate:rollback",
"migrate:make":     "knex migrate:make",
"seed":             "knex seed:run"
```

---

## Phase 2 — Campaign & Coupon Management (F2.6)

### 2.1 Migration — `game-api/migrations/20260806000002_create_campaigns.js`

```
campaigns
  id               TEXT PK             -- e.g. 'summer-2026'
  name             TEXT NOT NULL
  game_variant     TEXT NOT NULL       -- 'scratch-card' | 'flip-card'
  is_active        BOOLEAN DEFAULT false
  win_probability  DECIMAL(4,3) DEFAULT 0.5
  created_at, updated_at  TIMESTAMPTZ

campaign_coupons
  id           SERIAL PK
  campaign_id  TEXT NOT NULL → campaigns.id (CASCADE DELETE)
  coupon_id    TEXT NOT NULL           -- external ID for Coupon API
  title        TEXT NOT NULL           -- display text
  discount     TEXT NOT NULL           -- display value e.g. '500円OFF'
  start_date   TIMESTAMPTZ NOT NULL
  end_date     TIMESTAMPTZ NOT NULL
  weight       INTEGER NOT NULL DEFAULT 1
  created_at   TIMESTAMPTZ
  INDEX (campaign_id)
```

### 2.2 Seed — `game-api/seeds/01_default_campaign.js`

Idempotent: checks if campaign row already exists before inserting.
Reads `VITE_CAMPAIGN_ID`, `VITE_GAME_VARIANT`, `WIN_PROBABILITY`, `COUPON_ID`, `COUPON_TITLE`, `COUPON_DISCOUNT`, `COUPON_START_DATE`, `COUPON_END_DATE` from env vars.

### 2.3 Campaign service — `game-api/services/campaign.service.js`

Factory `createCampaignService(knex)`:
- `getActiveConfig()` — `SELECT WHERE is_active=true LIMIT 1` → `{ campaignId, gameVariant, winProbability }`
- `getRandomCoupon(campaignId)` — fetches eligible coupons (within date window), applies weighted random selection

**Weighted random algorithm:**
```
totalWeight = sum of all weights
random = Math.random() * totalWeight
iterate coupons: random -= weight; if random <= 0 → return this coupon
```

### 2.4 Updated coupon service — `game-api/services/coupon.service.js`

`issueCoupon({ userId, token, coupon })` — `coupon` is the DB row selected by campaign service. Uses `coupon.coupon_id`, `coupon.start_date`, `coupon.end_date` in the Coupon API call (instead of reading from `fastify.config`).

### 2.5 Updated game route — `game-api/routes/game/index.js`

**`GET /game/config`** (new, Bearer auth):
- Calls `getActiveConfig()`
- Returns `{ campaignId, gameVariant }` or 404 `NO_ACTIVE_CAMPAIGN`

**`POST /game/play`** (updated):
- Fetches `campaignConfig` from DB (win_probability lives here now)
- Validates `campaignId` from body matches active campaign
- Selects coupon via `getRandomCoupon(campaignId)`
- Returns 500 `systemError` if no eligible coupon found
- Passes selected coupon to `couponService.issueCoupon(...)`

---

## Phase 3 — Frontend Config Loading (F2.1)

### 3.1 New type — `game-ui/src/app/shared/models/game.ts`

```ts
export interface GameActiveConfig {
  campaignId: string;
  gameVariant: GameVariant;
}
```

### 3.2 New endpoint — `game-ui/src/config/endpoint.ts`

```ts
config: `${RESOURCES.game}/config`,
```

### 3.3 Updated service — `game-ui/src/app/shared/services/game.service.ts`

New method `getConfig(token)` — calls `GET /game/config` with Bearer auth. Demo mode returns from static `GAME_CONFIG` env vars.

### 3.4 New hook — `game-ui/src/app/pages/game/hooks/useGameConfig.ts`

```
status: 'loading' | 'ready' | 'error'
config: GameActiveConfig | null
retry: () => void
```

Calls `gameService.getConfig(token)` on mount and on retry. Pattern mirrors `useEligibilityCheck`.

### 3.5 Updated hook — `hooks/useGameSession.ts`

`useGameSession(campaignId: string)` — accepts `campaignId` as a parameter instead of reading from static `GAME_CONFIG`.

### 3.6 Updated component — `components/VariantRenderer.tsx`

```tsx
interface VariantRendererProps extends GameVariantProps {
  variant: GameVariant;
}
```

Accepts `variant` prop instead of reading from static `GAME_CONFIG.activeVariant`.

### 3.7 Updated container — `containers/GameShell.tsx`

**New loading flow (config gate → eligibility gate → game):**

```
Auth complete
  ↓
useGameConfig()   ←── parallel ──→   useEligibilityCheck()
  ↓                                        ↓
config: 'ready'                   eligibility: 'eligible'
  ↓ (both ready)
<GameContent config={config} />
     ↓
useGameSession(config.campaignId)
     ↓
<VariantRenderer variant={config.gameVariant} ... />
```

Error routing:
- `configStatus === 'error'` → `GameSessionCheckError` with `retryConfig`
- `eligibilityStatus === 'error'` → `GameSessionCheckError` with `retryEligibility`
- `eligibilityStatus === 'ineligible'` → `PlayLimitScreen`

---

## Local Development Workflow

```bash
# 1. Start PostgreSQL
docker compose up -d

# 2. Apply all migrations (game_sessions + campaigns tables)
cd game-api && pnpm run migrate

# 3. Seed default campaign + coupon
pnpm run seed

# 4. Start API
pnpm run dev

# 5. Start frontend (separate terminal)
cd game-ui && pnpm run dev
```

---

## File Change Summary

| File | Phase | Action |
|---|---|---|
| `docker-compose.yml` (root) | 1 | Created |
| `game-api/knexfile.js` | 1 | Created |
| `game-api/plugins/knex.js` | 1 | Created |
| `game-api/plugins/db.js` | 1 | Deleted (replaced by knex.js) |
| `game-api/migrations/20260806000001_create_game_sessions.js` | 1 | Created |
| `game-api/migrations/001_*.sql`, `002_*.sql` | 1 | Deleted |
| `game-api/scripts/migrate.js` | 1 | Deleted (replaced by knex CLI) |
| `game-api/services/draws.service.js` | 1 | Rewritten (factory, Knex queries) |
| `game-api/routes/game/index.js` | 1+2 | Updated (await, factory, config endpoint) |
| `game-api/package.json` | 1 | Updated (scripts, deps) |
| `game-api/migrations/20260806000002_create_campaigns.js` | 2 | Created |
| `game-api/seeds/01_default_campaign.js` | 2 | Created |
| `game-api/services/campaign.service.js` | 2 | Created |
| `game-api/services/coupon.service.js` | 2 | Updated (accepts coupon param) |
| `game-ui/src/app/shared/models/game.ts` | 3 | Updated (GameActiveConfig type) |
| `game-ui/src/config/endpoint.ts` | 3 | Updated (game.config endpoint) |
| `game-ui/src/app/shared/services/game.service.ts` | 3 | Updated (getConfig method) |
| `game-ui/src/app/pages/game/hooks/useGameConfig.ts` | 3 | Created |
| `game-ui/src/app/pages/game/hooks/useGameSession.ts` | 3 | Updated (campaignId param) |
| `game-ui/src/app/pages/game/components/VariantRenderer.tsx` | 3 | Updated (variant prop) |
| `game-ui/src/app/pages/game/containers/GameShell.tsx` | 3 | Updated (config gate flow) |
| `game-api/CLAUDE.md` | 1+2 | Updated (Knex stack, new endpoints) |

---

## Risk Notes

| Risk | Mitigation |
|---|---|
| Empty coupon pool on win | Returns 500 `systemError` to frontend, play not recorded — player can retry |
| DB unreachable at startup | Knex plugin `SELECT 1` check → API refuses to start |
| Config not found (no active campaign) | 404 `NO_ACTIVE_CAMPAIGN` → frontend shows retry screen |
| play_date UTC drift | `todayUTC()` always slices ISO string → consistent UTC date regardless of server timezone |
| Migration re-run | `hasTable` check + Knex tracking tables → idempotent |
