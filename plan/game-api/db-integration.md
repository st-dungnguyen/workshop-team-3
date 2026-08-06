# Implementation Plan: PostgreSQL Integration for game-api

**Spec:** [F2.5 — Persistent Game Session Storage](../spec/game-core/f2.5-db-integration.md)
**Scope:** `game-api/` only. No `game-ui` changes required.

---

## Overview

Replace the in-memory `Map` in `draws.service.js` with a PostgreSQL-backed persistence layer. Add a DB plugin to Fastify, SQL migrations, and a migrate script. Docker Compose provides the local dev database.

## Prerequisites

- Docker Desktop running
- `pnpm` installed in `game-api/`

---

## Step 1 — Add dependencies

In `game-api/`, install the PostgreSQL client:

```bash
cd game-api
pnpm add pg
pnpm add -D @types/pg   # optional, only if TypeScript is added later
```

**Why `pg` (node-postgres) directly:** `@fastify/postgres` wraps `pg` with Fastify lifecycle integration. We use it as the DB plugin (Step 3).

```bash
pnpm add @fastify/postgres
```

**Packages added:**
- `pg` — PostgreSQL client driver
- `@fastify/postgres` — Fastify plugin that manages pool lifecycle and decorates `fastify.pg`

---

## Step 2 — Environment variables

### `game-api/.env.example` — add DB vars

Append to the existing `.env.example`:

```dotenv
# PostgreSQL (matches docker-compose.yml defaults)
DATABASE_URL=postgresql://game_user:game_password@localhost:5432/game_db
```

### `game-api/.env` — add actual value for local dev

```dotenv
DATABASE_URL=postgresql://game_user:game_password@localhost:5432/game_db
```

---

## Step 3 — DB plugin

**Create `game-api/plugins/db.js`**

```js
'use strict'

require('dotenv').config()
const fp = require('fastify-plugin')
const fastifyPostgres = require('@fastify/postgres')

module.exports = fp(async function (fastify, opts) {
  const url = process.env.DATABASE_URL

  if (!url) {
    throw new Error('DATABASE_URL environment variable is not set')
  }

  await fastify.register(fastifyPostgres, { connectionString: url })
}, {
  name: 'db',
  dependencies: [],
})
```

`@fastify/autoload` picks this up automatically because it lives in `plugins/`. It runs before routes, so `fastify.pg` is available in all route handlers and services.

**`fastify.pg` API (provided by `@fastify/postgres`):**
- `fastify.pg.query(sql, params)` — run a parameterized query
- `fastify.pg.connect()` — get a client from the pool (for transactions)

---

## Step 4 — Migrations

### `game-api/migrations/001_create_schema_migrations.sql`

```sql
CREATE TABLE IF NOT EXISTS schema_migrations (
  filename TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### `game-api/migrations/002_create_game_sessions.sql`

```sql
CREATE TABLE IF NOT EXISTS game_sessions (
  id          SERIAL PRIMARY KEY,
  user_id     TEXT        NOT NULL,
  play_date   DATE        NOT NULL,
  outcome     TEXT        NOT NULL CHECK (outcome IN ('win', 'lose')),
  coupon_id   TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_game_sessions_user_date
  ON game_sessions (user_id, play_date);
```

**Design notes:**
- `play_date DATE` stores only the calendar date (no time), making daily uniqueness checks a simple equality condition: `play_date = CURRENT_DATE`.
- The `CHECK` constraint on `outcome` enforces the enum at the DB level.
- The composite index on `(user_id, play_date)` makes `hasPlayedToday` a fast index scan regardless of row count.

---

## Step 5 — Migrate script

**Create `game-api/scripts/migrate.js`**

```js
'use strict'

require('dotenv').config()
const { Client } = require('pg')
const fs = require('node:fs')
const path = require('node:path')

const MIGRATIONS_DIR = path.join(__dirname, '..', 'migrations')

async function migrate() {
  const client = new Client({ connectionString: process.env.DATABASE_URL })

  try {
    await client.connect()

    // Ensure the tracking table exists first
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        filename TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `)

    const { rows: applied } = await client.query(
      'SELECT filename FROM schema_migrations'
    )
    const appliedSet = new Set(applied.map((r) => r.filename))

    const files = fs
      .readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith('.sql'))
      .sort()

    let count = 0
    for (const file of files) {
      if (appliedSet.has(file)) continue

      console.log(`Applying migration: ${file}`)
      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8')
      await client.query(sql)
      await client.query(
        'INSERT INTO schema_migrations (filename) VALUES ($1)',
        [file]
      )
      count++
    }

    if (count === 0) {
      console.log('No pending migrations.')
    } else {
      console.log(`Applied ${count} migration(s).`)
    }
  } finally {
    await client.end()
  }
}

migrate().catch((err) => {
  console.error('Migration failed:', err.message)
  process.exit(1)
})
```

### `game-api/package.json` — add migrate script

```json
"scripts": {
  "test": "node --test test/**/*.test.js",
  "start": "fastify start -l info app.js",
  "dev": "fastify start -w -l info -P app.js",
  "migrate": "node scripts/migrate.js"
}
```

---

## Step 6 — Update `plugins/env.js`

Add `DATABASE_URL` to the required env var check for non-local environments:

```js
if (!isLocal) {
  const required = ['COUPON_API_URL', 'X_SKYLARK_TOKEN', 'AUTH0_ISSUER', 'DATABASE_URL']
  const missing = required.filter((k) => !process.env[k])
  if (missing.length > 0) {
    throw new Error(`Missing required env vars: ${missing.join(', ')}`)
  }
}
```

Note: `DATABASE_URL` is also required locally but is validated at startup by the DB plugin itself (Step 3), which throws if missing. No need for duplicate validation in `env.js` for local.

---

## Step 7 — Rewrite `services/draws.service.js`

Replace the entire in-memory `Map` implementation with DB queries. The public API (`hasPlayedToday`, `getNextPlayAt`, `recordPlay`) stays identical so that `routes/game/index.js` requires **no changes**.

```js
'use strict'

function todayUTC() {
  return new Date().toISOString().slice(0, 10) // YYYY-MM-DD UTC
}

function nextMidnightUTC() {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() + 1)
  d.setUTCHours(0, 0, 0, 0)
  return d.toISOString()
}

function createDrawsService(pg) {
  async function hasPlayedToday(userId) {
    const { rows } = await pg.query(
      'SELECT 1 FROM game_sessions WHERE user_id = $1 AND play_date = $2 LIMIT 1',
      [userId, todayUTC()]
    )
    return rows.length > 0
  }

  async function getNextPlayAt(userId) {
    const played = await hasPlayedToday(userId)
    return played ? nextMidnightUTC() : null
  }

  async function recordPlay(userId, { outcome, couponId = null }) {
    if (!userId) throw new Error('userId is required')
    if (outcome !== 'win' && outcome !== 'lose') {
      throw new Error(`Invalid outcome: ${outcome}`)
    }

    await pg.query(
      `INSERT INTO game_sessions (user_id, play_date, outcome, coupon_id)
       VALUES ($1, $2, $3, $4)`,
      [userId, todayUTC(), outcome, couponId]
    )
  }

  return { hasPlayedToday, getNextPlayAt, recordPlay }
}

module.exports = { createDrawsService }
```

**Key change:** The service is now a factory (`createDrawsService(pg)`) that receives the `fastify.pg` pool as a dependency. This keeps the service pure and testable without a live DB.

---

## Step 8 — Update `routes/game/index.js`

Change the `require` and initialization to use the factory:

```js
// Before
const { hasPlayedToday, getNextPlayAt, recordPlay } = require('../../services/draws.service')

// After
const { createDrawsService } = require('../../services/draws.service')

module.exports = async function (fastify, opts) {
  const couponService = new CouponService(fastify.config)
  const { hasPlayedToday, getNextPlayAt, recordPlay } = createDrawsService(fastify.pg)

  // ... rest of the route handlers are unchanged
}
```

The route handler bodies for `GET /eligibility` and `POST /play` **do not change** — they still call the same three functions. The only difference is they are now `async` all the way down.

---

## Step 9 — Update `.gitignore`

Ensure the root `.gitignore` excludes Docker data volumes (usually already excluded via `**/data/`). Verify that `.env` files are excluded.

---

## Local Development Workflow

After these changes, the local dev workflow becomes:

```bash
# 1. Start PostgreSQL
docker compose up -d

# 2. Run migrations
cd game-api
pnpm run migrate

# 3. Start API
pnpm run dev
```

---

## File Change Summary

| File | Action |
|---|---|
| `docker-compose.yml` | **Create** (project root) |
| `game-api/plugins/db.js` | **Create** |
| `game-api/migrations/001_create_schema_migrations.sql` | **Create** |
| `game-api/migrations/002_create_game_sessions.sql` | **Create** |
| `game-api/scripts/migrate.js` | **Create** |
| `game-api/services/draws.service.js` | **Rewrite** |
| `game-api/routes/game/index.js` | **Update** (import + factory init only) |
| `game-api/plugins/env.js` | **Update** (add `DATABASE_URL` to required list) |
| `game-api/package.json` | **Update** (add `migrate` script, add `pg` + `@fastify/postgres`) |
| `game-api/.env.example` | **Update** (add `DATABASE_URL`) |
| `game-api/.env` | **Update** (add `DATABASE_URL` for local) |

---

## Risk & Rollback

| Risk | Mitigation |
|---|---|
| DB unavailable at startup | Plugin throws immediately; API does not start |
| `play_date` timezone drift | Always compute `todayUTC()` using UTC slice, same as current `todayKey()` logic |
| Concurrent double-play (race) | Eligibility check + insert are two operations; a DB unique constraint on `(user_id, play_date)` could be added in a follow-up migration if race conditions are observed in production |
| Migration re-run on fresh deploy | `schema_migrations` tracking table prevents re-applying; `CREATE TABLE IF NOT EXISTS` makes it idempotent |
