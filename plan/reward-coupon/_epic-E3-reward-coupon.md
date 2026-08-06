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
| `src/app/shared/models/game.ts` | `CouponInfo`, `PlayResult` types |
| `src/app/shared/services/game.service.ts` | `play()` — `POST /game/play` with `Authorization` header |
| `src/app/pages/game/containers/GameResult.tsx` | `WinResult` (F3.1 CTA state machine, F3.2 AppLink navigation) + `LoseResult` |
| `src/assets/i18n/ja/game.json` | `result.win.*`, `result.claimCoupon`, `result.useNow`, `result.claimError` |
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
GameResult renders WinResult (outcome === 'win', coupon in props)
  ctaState: 'idle'

Player taps "Use Now" or "Claim Coupon"
  → if ctaState === 'loading': return  (double-tap guard)
  → setCtaState('loading')
  → encodedId = encodeURIComponent(coupon.id)
  → "Use Now":     window.location.href = /app/takeout?coupon_id={encodedId}
  → "Claim Coupon": window.location.href = /app/coupon/segment?id={encodedId}
  → native app intercepts URL → opens coupon screen
  (on unexpected error: setCtaState('error') → shows claimError message)
```

---

## 6. AppLink URLs

| CTA | URL |
|---|---|
| "Claim Coupon" | `https://www.skylark.co.jp/app/coupon/segment?id={encodedId}` |
| "Use Now" | `https://www.skylark.co.jp/app/takeout?coupon_id={encodedId}` |

`couponId` is `encodeURIComponent`-encoded (SEC-322). `/app/takeout` requires app v8.0.7+.

**Open question before launch:** Confirm that a segment `couponId` is accepted by `/app/takeout?coupon_id=` — not yet confirmed with native team (spec F3.2 §3 Assumptions).

---

## 7. Key Business Rules Implemented

| Rule | How |
|---|---|
| Frontend never calls Coupon API directly | Only `coupon.service.js` in game-api calls `POST /segment` |
| Idempotency (no duplicate coupon on retry) | `ALREADY_PLAYED` gate prevents a second play for the same user on the same day |
| `couponId` held in memory only | Stored in React `useState` in `GameResult`; not written to any storage |
| AppLink must use `/coupon/segment` not `/coupon/detail` | Hardcoded in `handleCta` |

---

## 8. Unresolved Items

| Item | Owner | Blocker? |
|---|---|---|
| Confirm segment `couponId` works with `/app/takeout?coupon_id=` | Native team | Pre-launch |
| Confirm target app version ≥ 8.0.7 for `/app/takeout` | Native team | Pre-launch |
| Populate real `COUPON_ID` from Skylark CMS after coupon is published | BE/campaign | Required for dev/stg deploy |
| Set `X_SKYLARK_TOKEN` per env | API team | Required for dev/stg deploy |
