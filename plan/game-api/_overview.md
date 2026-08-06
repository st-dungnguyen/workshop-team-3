# Implementation Plan: game-api — Backend Overview

**Stack:** Fastify 5, Node.js (CommonJS), @fastify/autoload
**Status:** ✅ Implemented
**Date:** 2026-08-06

---

## 1. Purpose

`game-api` is the project backend. It sits between `game-ui` and the Skylark Coupon API:

```
game-ui  →  game-api  →  Skylark Coupon API (POST /segment)
                       ↕
                      JWT verification via Auth0 JWKS
```

Frontend never calls Skylark APIs directly. All external API calls go through game-api.

---

## 2. Directory Structure

```
game-api/
├── app.js                    # Fastify app entry — autoloads plugins + routes
├── plugins/
│   ├── env.js                # Config plugin — loads .env, exposes fastify.config
│   ├── cors.js               # @fastify/cors plugin
│   └── sensible.js           # @fastify/sensible (HTTP helpers)
├── helpers/
│   └── jwt.helper.js         # JWT decode (local) / JWKS verify (non-local)
├── services/
│   ├── coupon.service.js     # HTTP client for Skylark POST /segment
│   └── draws.service.js      # In-memory play tracking (replace with Firestore)
└── routes/
    ├── root.js               # GET / → health check
    ├── auth/
    │   └── index.js          # POST /auth/validate
    └── game/
        └── index.js          # GET /game/eligibility, POST /game/play
```

Autoload convention: `routes/auth/index.js` → prefix `/auth`; `routes/game/index.js` → prefix `/game`.

---

## 3. Environments

| `ENV` value | JWT verification | Coupon API |
|---|---|---|
| `local` | Decode only (no sig check) | Mock — returns `COUPON_ID` env var directly |
| `dev` / `stg` / `prd` | Auth0 JWKS (RS256) | Real `POST /segment` call |

Local mode allows development without Auth0 credentials or Skylark API access.

---

## 4. API Surface

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/` | None | Health check |
| `POST` | `/auth/validate` | Body: `{ token }` | Verify JWT, return `{ success, userId }` |
| `GET` | `/game/eligibility` | `Bearer <jwt>` | Check if user can play today |
| `POST` | `/game/play` | `Bearer <jwt>` | Play game — returns outcome + coupon on win |

---

## 5. Request Flow

```
game-ui sends request with Authorization: Bearer <jwt>
    │
    ├─ POST /auth/validate
    │    └─ verifyToken(token) → { sub: userId }
    │    └─ return { success: true, userId }
    │
    ├─ GET /game/eligibility
    │    └─ verifyToken(token) → userId
    │    └─ hasPlayedToday(userId) → eligible boolean
    │    └─ return { eligible, nextPlayAt? }
    │
    └─ POST /game/play
         └─ verifyToken(token) → userId
         └─ hasPlayedToday → 403 ALREADY_PLAYED
         └─ Math.random() → win/lose
         └─ win: couponService.issueCoupon → POST /segment
         └─ recordPlay(userId, { outcome, couponId })
         └─ return { outcome, coupon? }
```

---

## 6. Feature Plans

| Feature area | Plan file |
|---|---|
| JWT validation (POST /auth/validate) | [auth-validate.md](./auth-validate.md) |
| Eligibility check (GET /game/eligibility) | [game-eligibility.md](./game-eligibility.md) |
| Play & coupon issuance (POST /game/play) | [game-play.md](./game-play.md) |
| Environment configuration | [env-config.md](./env-config.md) |

---

## 7. Unresolved / Pre-Launch Checklist

| Item | Owner | Blocker? |
|---|---|---|
| Replace in-memory `draws.service.js` with Firestore | BE | Before prd |
| Replace `coupon_master` COUPON_ID with real CMS value | Campaign | Before dev/stg |
| Set `X_SKYLARK_TOKEN` per env | API team | Before dev/stg |
| Set `AUTH0_ISSUER` for non-local envs | BE | Before dev/stg |
| Fix egress IP for Point API (Cloud NAT) | Infra | If using Point API |
