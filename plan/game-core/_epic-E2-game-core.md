# Implementation Plan: E2 — Game Core

**Spec:** [_epic-E2-game-core.md](../../spec/game-core/_epic-E2-game-core.md)
**Depends on:** [E1 — Auth Bridge](../auth-bridge/_epic-E1-auth-bridge.md) ✅ implemented
**Date:** 2026-08-06
**Status:** Ready to implement

---

## 1. Overview

E2 builds the core game layer that sits directly above the auth gate. Once `AuthGate` confirms a valid token, the player lands on the game screen. E2 owns:

- **F2.1** — A single deploy-time config that declares the active variant and campaign metadata
- **F2.2** — A shared session lifecycle shell + variant contract + two variant implementations (Scratch Card, Flip Card)
- **F2.3** — A shared win/lose result screen that hands off to E3

The session flow is always: `pending → initiated → resolving → revealing → completed`. Only the animation style differs between variants.

---

## 2. Cleanup First — Delete Unused Boilerplate

Before adding game code, remove everything the WebView will never use. This keeps routes, services, and bundles clean.

### Files to delete

| Path | Reason |
|---|---|
| `src/app/core/auth/Auth.tsx` | Auth shell layout — only wraps Login/Register |
| `src/app/core/auth/auth.routes.ts` | `/auth/login`, `/auth/register` routes |
| `src/app/core/auth/containers/Login.tsx` | Login form — WebView never shows login |
| `src/app/core/auth/containers/Register.tsx` | Registration form — WebView never shows registration |
| `src/app/pages/home/` | Placeholder home page |
| `src/app/pages/articles/` | Boilerplate reference implementation |
| `src/app/shared/services/article.service.ts` | Boilerplate domain service |

### Files to update

| File | Change |
|---|---|
| `src/app/app.routes.ts` | Remove `authRoutes` import and spread |
| `src/app/pages/page.routes.ts` | Remove `homeRoutes`, `articleRoutes`; add `gameRoutes`; add root redirect |
| `src/app/pages/Page.tsx` | Remove Header/Footer — game is full-screen WebView with no nav bar |

---

## 3. New File Map

```
src/
├── config/
│   └── game.config.ts              # active variant + campaign metadata (F2.1)
│
└── app/
    ├── pages/
    │   └── game/
    │       ├── game.routes.ts
    │       ├── containers/
    │       │   ├── GameShell.tsx         # session lifecycle host (F2.2)
    │       │   └── GameResult.tsx        # shared win/lose result screen (F2.3)
    │       ├── hooks/
    │       │   └── useGameSession.ts     # session state machine
    │       └── components/
    │           ├── VariantRenderer.tsx   # reads config → renders active variant
    │           ├── ScratchCard.tsx       # scratch-card variant
    │           └── FlipCard.tsx          # flip-card variant
    │
    └── shared/
        ├── models/
        │   └── game.ts                   # SessionState, GameOutcome, GameVariant types
        └── services/
            └── game.service.ts           # POST /game/play
```

---

## 4. Navigation After Auth

After `AuthGate` sets `authStatus = 'authenticated'`, `RouterProvider` renders. The root route `/` redirects immediately to `/game`.

```
AuthGate (authenticated)
└─ RouterProvider
   └─ /   → redirect → /game
      /game → GameShell (session lifecycle)
```

`GameResult` is not a separate route — it is rendered by `GameShell` when `sessionState === 'completed'`. This avoids direct URL access to the result screen without a completed session.

---

## 5. Session State Machine

```
pending     Game board visible, player can interact (tap/scratch)
    ↓  player performs play action
initiated   Play request submitted to backend; board is locked (no second play)
    ↓  backend responds
resolving   (brief — happens in the same state transition as backend response)
    ↓  outcome received → pass to variant
revealing   Variant animates the reveal (3–5 seconds)
    ↓  variant signals onAnimationComplete
completed   Result screen shown
```

Error paths:
- Backend 5xx during `initiated` → show `game.serverError` inline; session stays `pending` (not counted as played)
- Backend signals already-played → show `game.alreadyPlayed` state inline

---

## 6. Variant Contract

```typescript
// Every variant component must accept exactly these props
interface GameVariantProps {
  outcome: 'win' | 'lose' | null;       // null while pending/resolving
  sessionState: SessionState;
  onPlayInitiated: () => void;           // player tapped/scratched → call this
  onAnimationComplete: () => void;       // animation done → call this
}
```

`GameShell` passes these props to `VariantRenderer`, which passes them down to whichever variant is active. Adding a new variant = create a new component matching this interface and register it in `VariantRenderer`.

---

## 7. Game Config (F2.1)

```typescript
// src/config/game.config.ts
export const GAME_CONFIG = {
  activeVariant: (import.meta.env.VITE_GAME_VARIANT ?? 'scratch-card') as GameVariant,
  campaignId: import.meta.env.VITE_CAMPAIGN_ID ?? '',
} as const;
```

`.env` variables required:
```
VITE_GAME_VARIANT=scratch-card   # or: flip-card
VITE_CAMPAIGN_ID=campaign-2026-summer
```

`VariantRenderer` reads `GAME_CONFIG.activeVariant` and throws a clear error if the value is not a known key — satisfies REQ-204.

---

## 8. Backend Endpoint

```
POST /game/play
Authorization: Bearer <token>
Body: { campaignId: string }

Response 200: { outcome: "win" | "lose" }
Response 403: { code: "ALREADY_PLAYED" }   → game.alreadyPlayed state
Response 5xx: any                           → game.serverError state (retry available)
```

Add `game: { play: 'game/play' }` to `src/config/endpoint.ts`.

---

## 9. i18n Keys (game.json namespace)

Full key list in [F2.2 plan](./f2.2-game-play-session.md) and [F2.3 plan](./f2.3-game-result-screen.md). Summary:

```json
// ja/game.json — new file
{
  "scratch": { "instruction": "カードをこすってね！" },
  "flip": { "instruction": "カードを1枚えらんでね！" },
  "serverError": { "title": "...", "body": "...", "retry": "..." },
  "alreadyPlayed": { "title": "...", "body": "..." },
  "result": {
    "win": { "title": "...", "body": "..." },
    "lose": { "title": "...", "body": "..." },
    "claimCoupon": "...",
    "useNow": "...",
    "close": "..."
  }
}
```

---

## 10. Execution Order

| Step | Task | Files |
|---|---|---|
| 1 | **Cleanup** — delete boilerplate files | (see §2) |
| 2 | **Cleanup** — update `app.routes.ts`, `page.routes.ts`, `Page.tsx` | (see §2) |
| 3 | Add `shared/models/game.ts` | types |
| 4 | Add `game/play` endpoint to `endpoint.ts` | config |
| 5 | Create `config/game.config.ts` | F2.1 |
| 6 | Create `shared/services/game.service.ts` | service |
| 7 | Create `pages/game/hooks/useGameSession.ts` | hook |
| 8 | Create `pages/game/components/ScratchCard.tsx` | F2.2 variant |
| 9 | Create `pages/game/components/FlipCard.tsx` | F2.2 variant |
| 10 | Create `pages/game/components/VariantRenderer.tsx` | F2.2 |
| 11 | Create `pages/game/containers/GameResult.tsx` | F2.3 |
| 12 | Create `pages/game/containers/GameShell.tsx` | F2.2 shell |
| 13 | Add `pages/game/game.routes.ts` | routing |
| 14 | Add i18n keys to `ja/game.json` and `en/game.json` | i18n |
| 15 | Add SCSS — game board, result screen, both variants | styling |
| 16 | Lint check | CI |
