# Implementation Plan: E2 — Game Core

**Spec:** [_epic-E2-game-core.md](../../spec/game-core/_epic-E2-game-core.md)
**Depends on:** [E1 — Auth Bridge](../auth-bridge/_epic-E1-auth-bridge.md) ✅ implemented
**Date:** 2026-08-06
**Status:** ✅ Implemented (F2.4 Daily Streak not implemented)

---

## 1. Overview

E2 builds the core game layer that sits directly above the auth gate. Once `AuthGate` confirms a valid token, the player lands on the game screen. E2 owns:

- **F2.1** — A single deploy-time config that declares the active variant and campaign metadata
- **F2.2** — A shared session lifecycle shell + variant contract + two variant implementations (Scratch Card, Flip Card)
- **F2.3** — A shared win/lose result screen that hands off to E3

The session flow is always: `pending → initiated → resolving → revealing → completed`. Only the animation style differs between variants.

---

## 2. Cleanup — Completed

All boilerplate files were deleted during implementation. The WebView codebase contains only game-related features.

### Files deleted

| Path | Reason |
|---|---|
| `src/app/core/auth/Auth.tsx` | Auth shell layout — only wrapped Login/Register |
| `src/app/core/auth/auth.routes.ts` | `/auth/login`, `/auth/register` routes |
| `src/app/core/auth/containers/Login.tsx` | Login form — WebView never shows login |
| `src/app/core/auth/containers/Register.tsx` | Registration form |
| `src/app/pages/home/` | Placeholder home page |
| `src/app/pages/articles/` | Boilerplate reference implementation |
| `src/app/shared/services/article.service.ts` | Boilerplate domain service |
| `src/app/core/services/auth.service.ts` | Superseded by `auth-bridge.service.ts` |

### Files updated

| File | Change |
|---|---|
| `src/app/app.routes.ts` | Only `pageRoutes` — no `authRoutes` |
| `src/app/pages/page.routes.ts` | Only `gameRoutes` + root redirect to `/game` |

---

## 3. Actual File Map

```
src/
├── config/
│   ├── endpoint.ts                 # API endpoints (auth.validate, game.config, game.eligibility, game.play, game.claim)
│   └── environment.ts              # VITE_API_BASE_URL, VITE_ENV → isLocal
│
└── app/
    ├── pages/
    │   └── game/
    │       ├── game.routes.ts            # GameRedirect (/) + GameShell (/game, isProtected)
    │       ├── containers/
    │       │   ├── GameShell.tsx         # config gate → eligibility gate → GameContent (F2.2)
    │       │   ├── GameResult.tsx        # shared win/lose result screen (F2.3)
    │       │   └── GameRedirect.tsx      # <Navigate to="/game" replace />
    │       ├── hooks/
    │       │   ├── useGameConfig.ts      # GET /game/config → GameActiveConfig (F2.1)
    │       │   ├── useEligibilityCheck.ts # GET /game/eligibility → eligible/ineligible/error (E4)
    │       │   └── useGameSession.ts     # session state machine (F2.2)
    │       └── components/
    │           ├── VariantRenderer.tsx   # receives variant prop → renders active variant
    │           ├── ScratchCard.tsx       # scratch-card variant
    │           └── FlipCard.tsx          # flip-card variant
    │
    └── shared/
        ├── models/
        │   └── game.ts                   # SessionState, GameOutcome, GameVariant, CouponInfo, PlayResult, EligibilityResult, GameActiveConfig
        └── services/
            └── game.service.ts           # GET /game/config, GET /game/eligibility, POST /game/play, POST /game/claim
```

> **Note:** There is no `config/game.config.ts` static file. The active variant and campaignId are fetched at runtime via `GET /game/config` through `useGameConfig`. No `VITE_GAME_VARIANT` or `VITE_CAMPAIGN_ID` env vars exist.

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
  outcome: GameOutcome | null;           // null while pending/resolving
  coupon: CouponInfo | null;             // populated when outcome === 'win'
  sessionState: SessionState;
  onPlayInitiated: () => void;           // player tapped/scratched → call this
  onAnimationComplete: () => void;       // animation done → call this
}
```

`GameShell > GameContent` passes these props to `VariantRenderer`, which passes them down to whichever variant is active. Adding a new variant = create a new component matching this interface and register it in `VariantRenderer`.

---

## 7. Game Config (F2.1) — Actual Implementation

Config is fetched at runtime via `GET /game/config` (not a static env-var file):

```typescript
// src/app/pages/game/hooks/useGameConfig.ts
const useGameConfig = (): UseGameConfigReturn => {
  const { token } = useAuth();
  const [status, setStatus] = useState<ConfigStatus>('loading');
  const [config, setConfig] = useState<GameActiveConfig | null>(null);

  const load = useCallback(async () => {
    setStatus('loading');
    try {
      const result = await gameService.getConfig(token ?? '');
      setConfig(result);
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);
  return { config, status, retry: load };
};
```

API response shape: `{ campaignId: string, gameVariant: 'scratch-card' | 'flip-card' }` — matches `GameActiveConfig` in `shared/models/game.ts`.

`VariantRenderer` receives `variant` as a prop (from `GameContent` which gets it from `useGameConfig`) — it does not read from any static config.

**Local dev mock** (`VITE_ENV=local`): `GameService.getConfig()` returns `{ campaignId: 'local-campaign', gameVariant: 'flip-card' }` without an API call.

---

## 8. Backend Endpoints

```
GET /game/config
Authorization: Bearer <token>
Response 200: { campaignId: string, gameVariant: "scratch-card" | "flip-card" }
Response 404: { code: "NO_ACTIVE_CAMPAIGN" }  → game.sessionCheckError
Response 5xx: any                              → game.sessionCheckError

GET /game/eligibility
Authorization: Bearer <token>
Response 200: { eligible: boolean, nextPlayAt: string | null }
Response 401:  → auth.unauthorized

POST /game/play
Authorization: Bearer <token>
Body: { campaignId: string }
Response 200: { outcome: "win" | "lose", coupon?: CouponInfo, points?: number | null }
Response 403: { code: "ALREADY_PLAYED" }   → game.alreadyPlayed state
Response 5xx: any                           → game.serverError state (retry available)

POST /game/claim
Authorization: Bearer <token>
Body: { couponId: string }
Response 200: (ignored — fire-and-forget)
```

All endpoints defined in `src/config/endpoint.ts`.

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
