# Implementation Plan: E1 — Auth Bridge

**Spec:** [_epic-E1-auth-bridge.md](../../spec/auth-bridge/_epic-E1-auth-bridge.md)
**Date:** 2026-08-06
**Status:** Ready to implement

---

## 1. Overview

The existing codebase uses a traditional login form that stores a token in `localStorage`. The WebView auth bridge replaces this with a passive reception model: the mobile app pushes a JWT in (via URL param or JS bridge), the WebView validates it with the backend, then gates all game content behind a confirmed identity — all without a login screen.

Key principle: **the WebView never initiates auth**. It waits, receives, and validates.

---

## 2. Architecture

### New files

```
src/app/core/auth/
  services/
    auth-bridge.service.ts     # Token extraction (URL param + JS bridge) + backend validation call
  hooks/
    useAuthBridge.ts           # Orchestrates the full auth bridge flow (reception → validation → context)
  containers/
    AuthGate.tsx               # Route-level gate: shows loading/error or passes through to game
  components/
    AuthErrorScreen.tsx        # Renders localized error message + recovery instruction
```

### Modified files

| File | What changes |
|---|---|
| `src/app/shared/contexts/auth.context.tsx` | New shape: `authStatus`, `authError`, `token` (in-memory); remove `localStorage` dependency |
| `src/app/core/modules/custom-router-dom/PrivateRoute.tsx` | Read `isAuthenticated` from `AuthContext`, not from `localStorage` |
| `src/app/app.routes.ts` | Wrap all game/page routes inside `AuthGate` |
| `src/assets/i18n/ja/auth.json` | Add all auth bridge error keys |
| `src/assets/i18n/en/auth.json` | Add all auth bridge error keys |
| `src/config/api.config.ts` | Add `AUTH_VALIDATE` endpoint constant |

---

## 3. Auth Context — New Shape

```typescript
// src/app/shared/contexts/auth.context.tsx

type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'error';
type AuthErrorCode =
  | 'tokenMissing'
  | 'tokenExpired'
  | 'tokenInvalid'
  | 'unauthorized'
  | 'serverError';

interface AuthContextType {
  authStatus: AuthStatus;
  authError: AuthErrorCode | null;
  token: string | null;
  setTokenValidated: (token: string) => void;
  setAuthError: (code: AuthErrorCode) => void;
  setLoading: () => void;
  retryValidation: () => void; // increments a retry counter to re-trigger the bridge hook
}
```

The context **never writes to `localStorage`**. Token lives in React state for the session lifetime only. On page reload, `authStatus` resets to `'idle'` and the bridge flow restarts.

---

## 4. Token Reception — Priority & Race Conditions

Both channels run concurrently from mount. The rule is **first valid non-empty token wins**:

1. On mount: check `window.location.search` for `?token=`. If found and non-empty → pass to validation immediately.
2. Simultaneously: register `window.addEventListener('message', ...)` for JS bridge messages.
3. If URL param delivers a token first → ignore any subsequent bridge message.
4. If no URL param → bridge listener stays active and delivers the token when it arrives.
5. A **5-second timeout** runs from mount. If neither channel delivers a token by then → show `tokenMissing` error.

The "first wins" lock is a simple boolean ref (`tokenReceivedRef`) inside `useAuthBridge`.

---

## 5. Validation Endpoint

```
POST /auth/validate
Authorization: Bearer <token>
Body: { token: "<jwt>" }

Response 200: { userId: string, ... }   → grant access
Response 401: { code: "UNAUTHORIZED" }  → auth.unauthorized
Response 403: { code: "TOKEN_EXPIRED" | "TOKEN_INVALID" } → auth.tokenExpired / auth.tokenInvalid
Response 5xx: any                        → auth.serverError (retry available)
```

Add `AUTH_VALIDATE: '/auth/validate'` to `src/config/api.config.ts`.

---

## 6. Demo Mode (Fake Token)

For the demo build, real backend validation is bypassed. This keeps all auth gate UI intact while removing the backend dependency.

**Mechanism:** `VITE_DEMO_MODE=true` in `.env.demo` (or `.env.local`).

**Behavior when `VITE_DEMO_MODE=true`:**
- `AuthBridgeService.validate()` skips the API call and resolves immediately with a success payload.
- Any non-empty token is accepted (use `?token=demo` in the browser URL to trigger the happy path).
- The `AuthGate` loading screen still appears briefly (realistic UX), then transitions to the game.
- All error screens remain accessible by appending `?token=` (empty) to trigger `tokenMissing`.

**Implementation:**
```typescript
// auth-bridge.service.ts
async validate(token: string): Promise<ValidateResult> {
  if (import.meta.env.VITE_DEMO_MODE === 'true') {
    await new Promise(r => setTimeout(r, 800)); // simulate latency
    return { success: true, userId: 'demo-user' };
  }
  // real API call
}
```

No bypass flag in production builds. `VITE_DEMO_MODE` is not set in `.env.production`.

---

## 7. AuthGate — Route Wiring

`AuthGate` is a container rendered at the root level, above all game routes:

```
App
└─ AuthGate             ← gate: shows loading | error | children
   └─ RouterOutlet      ← game routes (page.routes.ts)
```

`app.routes.ts` wraps the page subtree inside `AuthGate` so no game page is ever rendered before `authStatus === 'authenticated'`.

`PrivateRoute` is updated to check `useContext(AuthContext).authStatus === 'authenticated'` instead of `localStorage.getItem('token')`.

---

## 8. Error Screens

`AuthErrorScreen` is a shared presentational component that receives an `errorCode` prop and renders:

- Localized headline + body from `auth.json`
- Recovery instruction (always: "アプリに戻って再度開いてください" / "Please return to the app and try again")
- A **retry button** shown only for `serverError` — re-triggers validation with the same token

All error strings live in `src/assets/i18n/{ja,en}/auth.json`. See [F1.3 plan](./f1.3-token-validation-and-game-access-gate.md) for the full key list.

---

## 9. Execution Order

Tasks must be done in this order to avoid broken intermediate states:

| Step | Task | File(s) |
|---|---|---|
| 1 | Reshape `AuthContext` | `shared/contexts/auth.context.tsx` |
| 2 | Create `AuthBridgeService` | `core/auth/services/auth-bridge.service.ts` |
| 3 | Create `useAuthBridge` hook | `core/auth/hooks/useAuthBridge.ts` |
| 4 | Create `AuthErrorScreen` component | `core/auth/components/AuthErrorScreen.tsx` |
| 5 | Create `AuthGate` container | `core/auth/containers/AuthGate.tsx` |
| 6 | Update `PrivateRoute` | `core/modules/custom-router-dom/PrivateRoute.tsx` |
| 7 | Wire `AuthGate` into routes | `app.routes.ts` |
| 8 | Add i18n keys | `assets/i18n/{ja,en}/auth.json` |
| 9 | Add endpoint config | `config/api.config.ts` |
| 10 | Add `.env.demo` | project root |

---

## 10. What Does NOT Change

- `core/auth/Auth.tsx`, `auth.routes.ts`, `Login.tsx`, `Register.tsx` — left as-is (unused by WebView but harmless).
- `core/services/api.service.ts` — no changes needed; `AuthBridgeService` calls it via `ApiService`.
- `core/services/auth.service.ts` — no changes needed.
- The overall `src/app/app.routes.ts` aggregation pattern — same shape, just wraps page routes with `AuthGate`.
