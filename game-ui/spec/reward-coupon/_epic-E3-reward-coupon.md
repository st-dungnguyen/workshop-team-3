# Epic: E3 — Reward/Coupon

**Epic ID:** E3
**Priority:** P0
**Status:** Draft
**Date:** 2026-08-06

## 1. Epic Overview

E3 covers everything that happens after a player wins a game session: recording the win with the backend, receiving the issued coupon identifier, and delivering the player to their coupon in the native app. This is the moment the game's core promise is fulfilled — the player receives a tangible promotional reward.

**Business objective:** Ensure every winning player reliably receives their coupon and reaches it with minimal friction. A win that fails to deliver a coupon damages trust in the campaign and undermines the incentive to play.

**Dependencies:**
- [E1 — Auth Bridge](../auth-bridge/_epic-E1-auth-bridge.md) — the player's validated token is required to associate the win with the correct player on the backend
- [E2 — Game Core](../game-core/_epic-E2-game-core.md) — E3 is triggered by the win signal from the result screen (F2.3); the `GameSession` must be in `completed` state with outcome `win`

**Downstream dependents:**
- [E4 — Game Session](../game-session/_epic-E4-game-session.md) — after a coupon is successfully issued, the `GameSession` transitions to `rewarded`; E4 uses this state to enforce play limits

## 2. Scope

### In Scope

- Receiving the win signal from E2 and submitting a win record to the project backend
- Receiving the `couponId` returned by the backend after successful coupon issuance
- Transitioning the `GameSession` to `rewarded` state upon successful issuance
- Navigating the player to the coupon detail screen in the native app via AppLink
- Handling all error states in the win-recording and delivery flow (server errors, duplicate win, token expiry)
- Localized text for all reward-related player-facing strings in `ja` and `en` (`reward.json` namespace)

### Out of Scope

- Coupon issuance itself — that is performed server-side by the project backend calling the Segment Coupon API; the frontend only receives the `couponId`
- Displaying coupon details within the WebView — the coupon detail is shown in the native app after AppLink navigation
- Coupon validity, expiry, or redemption — those are managed by the native app and backend
- Refund or coupon cancellation flows
- Displaying the player's coupon history within the WebView

## 3. User Personas

| Persona | Role in Epic |
|---|---|
| **PLAYER** | Has just won a game session; expects to receive a coupon and be taken directly to it |
| **SYSTEM** | Receives the win record request from the frontend, validates it, calls the Coupon API server-side, and returns the `couponId` |
| **HOST** | The native app; intercepts the AppLink URL and opens the coupon detail screen |

## 4. Feature Inventory

| Feature ID | Feature Name | Priority | Status |
|---|---|---|---|
| F3.1 | Win Recording & Coupon Issuance | P0 | Draft |
| F3.2 | Coupon Delivery via AppLink | P0 | Draft |

## 5. Key Business Rules

- **Frontend never calls the Coupon API directly.** The frontend calls the project backend to record the win; the backend is responsible for calling `POST /segment` on the Coupon API and returning the `couponId`.
- **Idempotent win recording.** If the player taps the claim CTA multiple times (e.g., double-tap), or if a retry is needed due to a transient error, the backend must return the same `couponId` for the same session — not issue duplicate coupons. The frontend must disable the claim CTA while a request is in flight.
- **Session state transition.** The `GameSession` transitions to `rewarded` only after the backend confirms the coupon has been issued (i.e., `couponId` is received). A failed win-recording attempt does not advance the session state.
- **Coupon type is always segment.** The AppLink must use `/app/coupon/segment`, not `/app/coupon/detail`.
