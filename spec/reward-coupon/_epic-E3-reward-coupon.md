# Epic: E3 — Reward/Coupon

**Epic ID:** E3
**Priority:** P0
**Status:** In Progress
**Date:** 2026-08-06

## 1. Epic Overview

E3 covers everything that happens after a player wins a game session: automatically triggering coupon issuance on the backend, holding the coupon data in memory, and giving the player two clear paths to access their reward. This is the moment the game's core promise is fulfilled — the player receives a tangible promotional reward.

**Business objective:** Ensure every winning player reliably receives their coupon and can access it immediately after winning, with minimal friction and no blocking wait state on the win screen.

**Dependencies:**
- [E1 — Auth Bridge](../auth-bridge/_epic-E1-auth-bridge.md) — the player's validated token is required to associate the win with the correct player on the backend
- [E2 — Game Core](../game-core/_epic-E2-game-core.md) — E3 is triggered by the win result from F2.2 (`play()` response with `outcome === 'win'`); the `GameSession` must have transitioned to `revealing` state

**Downstream dependents:**
- [E4 — Game Session](../game-session/_epic-E4-game-session.md) — after a coupon is successfully claimed, the `GameSession` is in `completed` state with `outcome: win`; E4 uses this state to enforce play limits

## 2. Scope

### In Scope

- Automatically triggering a background coupon claim API call when a win result is received, without any player action
- Holding the `couponId` received from the `play()` response in memory for the duration of the session
- Displaying a persistent win result screen with two CTAs: **"Use Coupon"** and **"My Coupon"**
- Navigating the player to the appropriate native screen via AppLink when either CTA is tapped
- Localized text for all reward-related player-facing strings in `ja` and `en` (`game.json` namespace)

### Out of Scope

- Coupon issuance itself — performed server-side by the project backend calling the Segment Coupon API
- Displaying coupon details within the WebView beyond what is returned in the `play()` response (title, discount, expiry preview)
- An in-WebView coupon history list — the native app already provides a coupon screen; the WebView navigates there via AppLink
- Coupon validity, expiry, or redemption — managed by the native app and backend
- Surfacing background claim errors to the player — failures are silent (fire-and-forget)
- Loading state or retry flow for coupon issuance — the claim is invisible to the player

## 3. User Personas

| Persona | Role in Epic |
|---|---|
| **PLAYER** | Has just won a game session; sees a persistent win screen and chooses how to access their coupon |
| **SYSTEM** | Receives the background claim request, validates it, and calls the Coupon API server-side to issue the coupon |
| **HOST** | The native app; intercepts the AppLink URL and opens the appropriate coupon or coupon-list screen |

## 4. Feature Inventory

| Feature ID | Feature Name | Priority | Status |
|---|---|---|---|
| F3.1 | Auto Background Coupon Claim | P0 | In Progress |
| F3.2 | Coupon Delivery via AppLink | P0 | In Progress |

## 5. Key Business Rules

- **Frontend never calls the Coupon API directly.** The frontend calls the project backend (`POST /game/claim`) to trigger issuance; the backend is responsible for calling `POST /segment` on the Coupon API.
- **Claim is automatic, not player-triggered.** The frontend fires the claim request immediately when a win result is received from `play()` — before the animation completes and before the player sees the win screen.
- **couponId comes from the `play()` response.** The `play()` API returns the `couponId` as part of the win result. This ID is used for AppLink construction; the `claimCoupon` call confirms issuance server-side but the frontend does not wait for its response.
- **The win screen is persistent.** After winning, the player remains on the win result screen until they actively tap a CTA. There is no auto-redirect.
- **Two direct navigation CTAs.** "Use Coupon" navigates to the specific won coupon detail (`/app/coupon/segment?id={couponId}`). "My Coupon" navigates to the native app's coupon list (`/app/coupon`). Neither CTA triggers an API call — they navigate directly.
- **Coupon type is always segment.** The AppLink must use `/app/coupon/segment`, not `/app/coupon/detail`.
