# Implementation Plan: POST /auth/validate

**Overview:** [_overview.md](./_overview.md)
**Called by:** `game-ui/src/app/core/auth/services/auth-bridge.service.ts` — `AuthBridgeService.validate()`

---

## Purpose

Validates the JWT token passed by the native app into the WebView. Returns `userId` so the frontend can identify the player for subsequent API calls.

This is the E1 gate — no game action is possible before this succeeds.

---

## File

`game-api/routes/auth/index.js` — auto-registered at `/auth` prefix → `POST /auth/validate`

---

## Request / Response

```
POST /auth/validate
Content-Type: application/json
Authorization: Bearer <jwt>   (also sent in body)

Body: { "token": "<jwt>" }

200 OK:   { "success": true, "userId": "auth0|..." }
401:      { "code": "unauthorized", "message": "Invalid or expired token" }
403:      { "code": "TOKEN_INVALID", "message": "Token missing sub claim" }
```

---

## Logic

```
1. Parse body.token
2. verifyToken(token)
   ├─ ENV=local: jwt.decode(token)  — no signature check
   └─ ENV≠local: fetch JWKS from AUTH0_ISSUER/.well-known/jwks.json
                 jwt.verify(token, publicKey, { issuer, algorithms: ['RS256'] })
3. Extract payload.sub → userId
4. Return { success: true, userId }
```

**Error mapping:**

| Error | HTTP | Code |
|---|---|---|
| Verification failed (bad sig, expired) | 401 | `unauthorized` |
| `payload.sub` missing | 403 | `TOKEN_INVALID` |

---

## JWT Helper

`game-api/helpers/jwt.helper.js`

- **Local mode:** `jwt.decode(token)` — accepts any structurally valid JWT; useful for development with mock tokens
- **Non-local mode:** JWKS client (cached 10 min) fetches RSA public key by `kid`, verifies signature + issuer + algorithm
- JWKS client is a module-level singleton — initialized once per process, not per request

---

## Frontend Integration

`AuthBridgeService.validate(token)` posts `{ token }` to `ENDPOINT.auth.validate` with `Authorization: Bearer <token>` header. Expects `{ success: boolean, userId: string }`.

Error code mapping in `AuthBridgeService.mapErrorToCode()`:
- 401 → `'unauthorized'`
- 403 + `TOKEN_EXPIRED` → `'tokenExpired'`
- 403 other → `'tokenInvalid'`
- 5xx → `'serverError'`
