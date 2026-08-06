# Implementation Plan: Epic E4 — Game Session

**Spec:** [_epic-E4-game-session.md](../../spec/game-session/_epic-E4-game-session.md)
**Depends on:** [E1 — Auth Bridge](../auth-bridge/_epic-E1-auth-bridge.md) ✅ implemented
**Status:** ✅ Implemented
**Date:** 2026-08-06

---

## 1. Overview

E4 enforces the play-once-per-window rule. Before the game board renders, the frontend queries `GET /game/eligibility`. Eligible players reach the game; ineligible players see the play-limit screen (F4.2) with a warm, encouraging message and a close CTA.

The eligibility check is implemented as a hook-based gate in `GameShell` — not as a route guard — because it requires the in-memory auth token from `AuthContext`.

---

## 2. Feature Status

| Feature | Plan | Status |
|---|---|---|
| F4.1 Pre-Game Session Eligibility Check | [f4.1-pre-game-session-eligibility-check.md](./f4.1-pre-game-session-eligibility-check.md) | ✅ Implemented |
| F4.2 Play Limit & Cooldown Screen | [f4.2-play-limit-and-cooldown-screen.md](./f4.2-play-limit-and-cooldown-screen.md) | ✅ Implemented |

---

## 3. File Map

### game-api

| File | Change |
|---|---|
| `game-api/services/draws.service.js` | Added `getNextPlayAt(userId)` — next midnight UTC |
| `game-api/routes/game/index.js` | `GET /game/eligibility` → `{ eligible: boolean, nextPlayAt: string \| null }` |

### game-ui

| File | Change |
|---|---|
| `src/config/endpoint.ts` | Added `game.eligibility` |
| `src/app/shared/models/game.ts` | Added `EligibilityResult` interface |
| `src/app/shared/services/game.service.ts` | Added `checkEligibility(token)` |
| `src/app/pages/game/hooks/useEligibilityCheck.ts` | New hook (F4.1 gate) |
| `src/app/pages/game/containers/GameShell.tsx` | Restructured: eligibility gate + `PlayLimitScreen` + `GameSessionCheckError` |
| `src/assets/i18n/ja/game.json` | Added `alreadyPlayed.comeBackSoon/nextPlayAt/returnToApp`, `sessionCheckError.*` |
| `src/assets/i18n/en/game.json` | Same keys in English |

---

## 4. Architecture

```
GameShell (entry point after AuthGate)
  │
  ├─ useEligibilityCheck()
  │    └─ GameService.checkEligibility(token)
  │         └─ GET /game/eligibility → { eligible, nextPlayAt? }
  │
  ├─ status === 'loading'    → <Spinner />           (game board absent — SEC-412)
  ├─ status === 'error'      → <GameSessionCheckError onRetry />
  ├─ status === 'ineligible' → <PlayLimitScreen nextPlayAt />   (F4.2)
  └─ status === 'eligible'   → <GameContent />
                                   └─ useGameSession()  (E2)
```

`GameContent` is a private sub-component of `GameShell`. It is only mounted when eligibility is confirmed, ensuring the game board is never in the DOM during the check (CON-412).

---

## 5. Eligibility Hook State Machine

```typescript
type EligibilityStatus = 'loading' | 'eligible' | 'ineligible' | 'error';

// Transitions:
// mount / retry()  → 'loading'
// GET success, eligible: true   → 'eligible'
// GET success, eligible: false  → 'ineligible' (+ nextPlayAt from response)
// GET error (any)               → 'error'
// GET 401                       → 'error' (auth.unauthorized shown by AuthContext upstream)
```

The hook runs on mount and exposes `retry` for the error screen. `token` from `AuthContext` is the only dependency — a change in token (e.g., session refresh) re-triggers the check.

---

## 6. Backend: GET /game/eligibility

```
Headers: Authorization: Bearer <user JWT>

Response 200:
  { eligible: true,  nextPlayAt: null }        ← can play
  { eligible: false, nextPlayAt: "ISO8601" }   ← already played; nextPlayAt = next midnight UTC
```

`nextPlayAt` is computed as midnight UTC of the next calendar day. Since `draws.service.js` tracks plays by UTC date key (`YYYY-MM-DD`), this is consistent with when the play window resets.

---

## 7. Play Limit Screen (F4.2)

`PlayLimitScreen` is a private sub-component of `GameShell`. It is used in two places:

1. **Primary:** When `useEligibilityCheck` returns `ineligible` — rendered by `GameShell` before `GameContent` mounts.
2. **Fallback:** When `POST /game/play` returns 403 `ALREADY_PLAYED` mid-session (race condition or stale eligibility result) — rendered inside `GameContent` via `inlineError === 'alreadyPlayed'`.

```tsx
<PlayLimitScreen nextPlayAt={string | null} />
```

| `nextPlayAt` | Message shown |
|---|---|
| `string` (ISO8601) | `alreadyPlayed.nextPlayAt` with formatted local date/time |
| `null` | `alreadyPlayed.comeBackSoon` |

Date formatting uses `toLocaleString` with `ja-JP` / `en-US` locale based on `i18n.language`.

Close CTA: `window.location.href = \`${window.location.origin}/close\`` — per `applinks.md`.

---

## 8. i18n Keys

All new keys added to `game` namespace (both `ja` and `en`):

| Key | ja | en |
|---|---|---|
| `alreadyPlayed.comeBackSoon` | また明日チャレンジしてね！ | Come back tomorrow for another chance! |
| `alreadyPlayed.nextPlayAt` | {{date}} からまた遊べます！ | You can play again from {{date}}! |
| `alreadyPlayed.returnToApp` | アプリに戻る | Return to App |
| `sessionCheckError.title` | 少しだけお待ちください | Please wait a moment |
| `sessionCheckError.body` | 読み込みに失敗しました。もう一度お試しください。 | Failed to load. Please try again. |
| `sessionCheckError.retry` | もう一度試す | Try again |

**Note:** `alreadyPlayed.body` (the original key) has been superseded by `alreadyPlayed.comeBackSoon` — the old key is no longer referenced.

---

## 9. Key Business Rules Implemented

| Rule | How |
|---|---|
| Backend is authoritative on eligibility | `useEligibilityCheck` always calls `GET /game/eligibility` on mount — no local caching |
| Both win and lose consume the play | `recordPlay` is called for both outcomes in `POST /game/play` |
| Eligibility check precedes game board | `GameContent` (with `useGameSession`) only mounts when `status === 'eligible'` |
| Ineligible is not an error | `PlayLimitScreen` is warm, not an error screen; uses `alreadyPlayed.*` keys, not `serverError.*` |
| No persistent eligibility result | `useEligibilityCheck` state is React state — cleared on unmount / page reload |
