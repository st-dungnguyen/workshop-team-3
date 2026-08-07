# Implementation Plan: Epic E3 — Reward / Coupon

**Spec:** [_epic-E3-reward-coupon.md](../../spec/reward-coupon/_epic-E3-reward-coupon.md)
**Depends on:** [E2 — Game Core](../game-core/_epic-E2-game-core.md) ✅ implemented
**Status:** ✅ Implemented
**Date:** 2026-08-06

---

## 1. Overview

E3 covers everything that happens after a player wins: issuing a coupon server-side and delivering the player to the native app coupon screen via AppLink.

**Key decision — single-call approach:** The spec describes a two-step flow (play → outcome; CTA tap → win-record → couponId). We merged both steps: `POST /game/play` issues the coupon server-side on win and returns `{ outcome, coupon? }` in one response. The CTA navigates directly to the AppLink without an additional API call.

Full rationale: [f3.1 plan](./f3.1-win-recording-and-coupon-issuance.md#design-decision-merged-into-post-gameplay).

---

## 2. Feature Status

| Feature | Plan | Status |
|---|---|---|
| F3.1 Win Recording & Coupon Issuance | [f3.1-win-recording-and-coupon-issuance.md](./f3.1-win-recording-and-coupon-issuance.md) | ✅ Implemented (merged into play API) |
| F3.2 Coupon Delivery via AppLink | [f3.2-coupon-delivery-via-applink.md](./f3.2-coupon-delivery-via-applink.md) | ✅ Implemented |

---

## 3. File Map

### game-api

| File | Role |
|---|---|
| `game-api/services/coupon.service.js` | HTTP client for Skylark `POST /segment`; mock fallback when `COUPON_API_URL` unset |
| `game-api/services/draws.service.js` | In-memory play tracking (`hasPlayedToday`, `recordPlay`) |
| `game-api/routes/game/index.js` | `POST /game/play` — win determination, coupon issuance, draws recording |

### game-ui

| File | Role |
|---|---|
| `src/app/shared/models/game.ts` | `CouponInfo`, `PlayResult` (with `points?: number \| null`), `EligibilityResult` types |
| `src/app/shared/services/game.service.ts` | `play()`, `claimCoupon()` (fire-and-forget), `getConfig()`, `checkEligibility()` |
| `src/app/pages/game/hooks/useGameSession.ts` | Calls `play()` then fires `claimCoupon()` on win; returns `coupon`, `points` |
| `src/app/pages/game/containers/GameResult.tsx` | `WinResult` (AppLink navigation, coupon preview, points badge) + `LoseResult` |
| `src/assets/i18n/ja/game.json` | `result.win.*`, `result.useCoupon`, `result.myCoupon`, `result.pointsAwarded_*`, `result.close` |
| `src/assets/i18n/en/game.json` | Same keys in English |

---

## 4. Backend Flow (POST /game/play — win path)

```
Receive request
├─ Verify JWT (local: decode only; non-local: Auth0 JWKS)
├─ hasPlayedToday(userId) → 403 ALREADY_PLAYED
├─ Math.random() < winProbability → determine outcome
│
├─ outcome === 'lose'
│   ├─ recordPlay(userId, { outcome: 'lose' })
│   └─ return { outcome: 'lose' }
│
└─ outcome === 'win'
    ├─ couponService.issueCoupon({ userId, token })
    │   └─ POST /segment → Skylark Coupon API
    │       (mock coupon ID when COUPON_API_URL unset)
    ├─ recordPlay(userId, { outcome: 'win', couponId })
    └─ return { outcome: 'win', coupon: { id, title, discount, endDate } }
```

Coupon display metadata (`title`, `discount`, `endDate`) comes from env vars — not from Coupon API response.

---

## 5. Frontend Flow (WinResult CTA)

```
useGameSession.handlePlayInitiated()
  → POST /game/play → outcome: 'win', coupon
  → if coupon.id: gameService.claimCoupon(coupon.id, token).catch(() => {})   ← fire-and-forget claim
  → setSessionState('revealing')

[animation completes → handleAnimationComplete → sessionState = 'completed']

GameResult renders WinResult (outcome === 'win', coupon in props)
  No CTA loading state — CTAs navigate immediately

Player taps "Use Coupon"
  → encodedId = encodeURIComponent(coupon.id)
  → window.location.href = `${COUPON_BASE_URL}/app/coupon/detail?id=${encodedId}`

Player taps "My Coupon"
  → window.location.href = `${COUPON_BASE_URL}/app/main?to=coupon_list`

native app intercepts URL → opens coupon detail or coupon list
```

---

## 6. AppLink URLs

| CTA | URL |
|---|---|
| "Use Coupon" (`result.useCoupon`) | `${VITE_SKYLARK_BASE_URL}/app/coupon/detail?id={encodedId}` |
| "My Coupon" (`result.myCoupon`) | `${VITE_SKYLARK_BASE_URL}/app/main?to=coupon_list` |

`COUPON_BASE_URL` defaults to `https://www.skylark.co.jp` (from `VITE_SKYLARK_BASE_URL` env var).
`couponId` is `encodeURIComponent`-encoded before insertion into query param.

> **Note:** The spec (F3.2) documents `/app/coupon/segment?id=` and `/app/coupon` but the implemented URLs are `/app/coupon/detail?id=` and `/app/main?to=coupon_list`. The spec should be updated to match the actual AppLink targets confirmed with the native team.

---

## 7. Key Business Rules Implemented

| Rule | How |
|---|---|
| Frontend never calls Coupon API directly | Only `coupon.service.js` in game-api calls `POST /segment` |
| Idempotency (no duplicate coupon on retry) | `ALREADY_PLAYED` gate prevents a second play for the same user on the same day |
| `couponId` held in React state only | `useGameSession` stores `coupon` in `useState`; not written to any storage |
| Background claim fires before animation | `claimCoupon()` called in `handlePlayInitiated()` on win, before `setSessionState('revealing')` |
| CTAs navigate directly — no loading state | `handleUseCoupon` / `handleMyCoupon` call `window.location.href` immediately |
| AppLink for "Use Coupon" | `/app/coupon/detail?id={encodedId}` |
| AppLink for "My Coupon" | `/app/main?to=coupon_list` |
| Points badge | `GameResult` receives `points: number \| null`; shows `PointsBadge` when non-null |

---

## 8. Unresolved Items

| Item | Owner | Blocker? |
|---|---|---|
| Confirm segment `couponId` works with `/app/takeout?coupon_id=` | Native team | Pre-launch |
| Confirm target app version ≥ 8.0.7 for `/app/takeout` | Native team | Pre-launch |
| Populate real `COUPON_ID` from Skylark CMS after coupon is published | BE/campaign | Required for dev/stg deploy |
| Set `X_SKYLARK_TOKEN` per env | API team | Required for dev/stg deploy |
