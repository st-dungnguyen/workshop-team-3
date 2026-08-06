# Implementation Plan: GET /game/eligibility

**Overview:** [_overview.md](./_overview.md)
**Called by:** `game-ui/src/app/shared/services/game.service.ts` — `GameService.checkEligibility()`
**Frontend hook:** `useEligibilityCheck` → see [F4.1 plan](../game-session/f4.1-pre-game-session-eligibility-check.md)

---

## Purpose

Determines whether the player has a play available for the current window (UTC day). Returns `nextPlayAt` (next midnight UTC) when ineligible, so the frontend can display when the player can return.

Called once on `GameShell` mount, before the game board renders.

---

## File

`game-api/routes/game/index.js` — `GET /game/eligibility`

---

## Request / Response

```
GET /game/eligibility
Authorization: Bearer <jwt>

200 OK — eligible:
  { "eligible": true, "nextPlayAt": null }

200 OK — ineligible:
  { "eligible": false, "nextPlayAt": "2026-08-07T00:00:00.000Z" }

401: { "code": "unauthorized" }
403: { "code": "TOKEN_INVALID" }
```

---

## Logic

```
1. extractBearerToken(request) → token
2. verifyToken(token) → { sub: userId }
3. hasPlayedToday(userId)
   ├─ false → return { eligible: true, nextPlayAt: null }
   └─ true  → return { eligible: false, nextPlayAt: getNextPlayAt(userId) }
```

`getNextPlayAt(userId)` computes the next midnight UTC:
```javascript
const tomorrow = new Date()
tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)
tomorrow.setUTCHours(0, 0, 0, 0)
return tomorrow.toISOString()
```

Play window is UTC-day based. A player who plays at 23:59 UTC is eligible again at 00:00 UTC.

---

## Storage

`game-api/services/draws.service.js` — in-memory `Map<userId, DrawRecord[]>`

Each record: `{ date: 'YYYY-MM-DD', outcome, couponId, createdAt }`.

`hasPlayedToday` checks if any record for today's UTC date key exists.

**Production note:** Replace with Firestore query on the `draws` collection before production deploy.
