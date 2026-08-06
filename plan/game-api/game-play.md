# Implementation Plan: POST /game/play

**Overview:** [_overview.md](./_overview.md)
**Called by:** `game-ui/src/app/shared/services/game.service.ts` — `GameService.play()`
**Frontend hook:** `useGameSession.handlePlayInitiated()` → see [F2.2 plan](../game-core/f2.2-game-play-session.md)

---

## Purpose

The core game action. Determines win/lose outcome, issues a coupon via Skylark API on win, records the play in draws storage, and returns the result to the frontend.

This endpoint is the single integration point for E2 (game mechanics), E3 (coupon issuance), and E4 (play-limit enforcement) on the backend.

---

## File

`game-api/routes/game/index.js` — `POST /game/play`

---

## Request / Response

```
POST /game/play
Authorization: Bearer <jwt>
Content-Type: application/json

Body: { "campaignId": "campaign-2026-summer" }

200 OK — lose:
  { "outcome": "lose" }

200 OK — win:
  {
    "outcome": "win",
    "coupon": {
      "id": "1000000001",
      "title": "すかいらーくグループ全店共通クーポン",
      "discount": "500円OFF",
      "endDate": "2027-08-06T00:00:00.000Z"
    }
  }

401: { "code": "unauthorized" }
403: { "code": "ALREADY_PLAYED", "message": "Already played today" }
500: { "code": "systemError", "message": "Failed to issue coupon" }
503: { "code": "maintenance" }
```

---

## Logic

```
1. extractBearerToken + verifyToken → { userId, token }
2. hasPlayedToday(userId)
   └─ true → 403 ALREADY_PLAYED  (play-limit gate — E4)

3. Math.random() < fastify.config.winProbability
   │
   ├─ LOSE:
   │   recordPlay(userId, { outcome: 'lose' })
   │   return { outcome: 'lose' }
   │
   └─ WIN:
       couponService.issueCoupon({ userId, token })   ← E3
         └─ POST /segment → Skylark Coupon API
            (mock: return COUPON_ID env var when COUPON_API_URL unset)
       recordPlay(userId, { outcome: 'win', couponId })
       return { outcome: 'win', coupon: { id, title, discount, endDate } }
```

---

## Win Probability

Controlled by env var `WIN_PROBABILITY` (float 0–1, default `0.5`). Set per campaign/env.

---

## Coupon Issuance (coupon.service.js)

`POST /segment` to Skylark Coupon API:

```json
{
  "userId": "<userId from JWT sub>",
  "member": "1",
  "coupons": [{ "id": "<COUPON_ID>", "startDate": "<ISO>", "endDate": "<ISO>" }],
  "information": [],
  "banners": []
}
```

Headers: `Authorization: Bearer <user JWT>`, `x-skylark-token`, `x-client-version: webview-mini-app-{env}`.

The user JWT is forwarded from the frontend — the Skylark Coupon API validates it to associate the coupon with the correct user account.

**Error propagation from Coupon API:**

| Skylark response | game-api response |
|---|---|
| 401 | 401 `unauthorized` |
| 503 | 503 `maintenance` |
| other / network | 500 `systemError` |

When issueCoupon fails, `recordPlay` is NOT called — the user can retry the full play action.

---

## Ordering Note

Current ordering: `issueCoupon` → `recordPlay`. If the server crashes between these two steps, the coupon is issued but the play is not recorded — the user could theoretically play again. This is acceptable for MVP with in-memory storage. With Firestore, use a transaction to atomically record the play and store the couponId.

---

## Coupon Display Metadata

`title`, `discount`, `endDate` come from `fastify.config` (env vars), not from the Coupon API response. The API only confirms issuance (returns the `couponId`). Display data is campaign-level config.

| Env var | Default |
|---|---|
| `COUPON_ID` | `1000000001` |
| `COUPON_TITLE` | `すかいらーくグループ全店共通クーポン` |
| `COUPON_DISCOUNT` | `500円OFF` |
| `COUPON_END_DATE` | +1 year from server start |
