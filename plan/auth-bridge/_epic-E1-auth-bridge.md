# Implementation Plan: E1 — Auth Bridge

**Spec:** [_epic-E1-auth-bridge.md](../../spec/auth-bridge/_epic-E1-auth-bridge.md)
**Date:** 2026-08-06
**Status:** ✅ Implemented

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
  retryCount: number;           // incremented by retry(); triggers useAuthBridge re-run
  setLoading: () => void;
  setTokenValidated: (token: string) => void;
  setAuthError: (code: AuthErrorCode) => void;
  retry: () => void;            // increments retryCount → re-triggers useAuthBridge effect
}
```

Token lives in React state (`AuthContext.token`) during the session. After successful validation, the token is also persisted to `localStorage` (`access_token` key) so subsequent WebView page loads can re-validate without the mobile app re-injecting the token. On validation failure from localStorage, the stored token is cleared automatically.

---

## 4. Token Resolution — Priority Order

Token sources are checked in strict priority order:

1. **URL param** (`?accessToken=`): checked synchronously on mount. If present and non-empty → validate immediately, overwrite any localStorage token.
2. **Retry path**: if a previous validation attempt stored a `pendingToken` and it did not come from localStorage, re-validate it (for server error retries).
3. **localStorage** (`access_token` key): if no URL param and no pending retry — check localStorage. If found → submit for re-validation. On failure, clear localStorage and fall through to JS bridge.
4. **JS bridge** (`window.addEventListener('message', ...)`): active until a token arrives or the 5-second timeout fires.
5. **Timeout**: if nothing arrives within 5 s → show `tokenMissing` error.

The "first wins" lock is a `tokenReceivedRef` boolean inside `useAuthBridge`. After successful validation, the token is saved to localStorage via `authBridgeService.saveToStorage(token)`.

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

Add `auth.validate: 'auth/validate'` to `src/config/endpoint.ts` (actual file path; there is no `api.config.ts`).

---

## 6. Local Development Mode

For local development, real backend validation is still called but with a synthetic token. This keeps the auth gate flow identical across all environments.

**Mechanism:** `VITE_ENV=local` in `.env` (checked via `environment.isLocal = import.meta.env.VITE_ENV === 'local'`).

**Behavior when `VITE_ENV=local`:**
- `useAuthBridge` skips all token collection channels (URL param, JS bridge, localStorage) and immediately calls `handleValidate('local-dev-token')`.
- `AuthBridgeService.validate()` short-circuits when `environment.isLocal` is true and returns `{ success: true, userId: 'local-dev-user' }` without an API call.
- The `local-dev-token` is **not** written to localStorage after successful validation (prevents pollution if environment switches).
- All game API calls also return mock data when `VITE_ENV=local` (in `GameService`).

**Implementation:**
```typescript
// auth-bridge.service.ts
async validate(token: string): Promise<ValidateResult> {
  if (environment.isLocal) {
    return { success: true, userId: 'local-dev-user' };
  }
  // real API call to POST /auth/validate
}

// useAuthBridge.ts
if (environment.isLocal) {
  tokenReceivedRef.current = true;
  handleValidate(LOCAL_DEV_TOKEN);  // 'local-dev-token'
  return;
}
```

No `VITE_DEMO_MODE` flag exists in the codebase — local development uses `VITE_ENV=local` exclusively.

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

## 10. Implementation Notes

- `core/auth/Auth.tsx`, `auth.routes.ts`, `Login.tsx`, `Register.tsx` — **deleted** during E2 cleanup. The WebView has no login UI.
- `AuthBridgeService` uses its own `axios.create()` instance (not the shared `api.service.ts`) to keep auth logic self-contained.
- `core/services/auth.service.ts` — deleted; superseded by `auth-bridge.service.ts`.
- The retry mechanism: `AuthGate` calls `useAuthBridge()` which subscribes to `retryCount` from `AuthContext`. The `retry()` function increments `retryCount`, which re-runs the `useEffect` in `useAuthBridge` to re-attempt validation.
- Execution order steps 9–10 referencing `config/api.config.ts` and `.env.demo` are obsolete — endpoint is in `config/endpoint.ts` and local dev uses `VITE_ENV=local`.
