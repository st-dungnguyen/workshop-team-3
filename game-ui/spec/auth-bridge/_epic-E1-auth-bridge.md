# Epic: E1 — Auth Bridge

**Epic ID:** E1
**Priority:** P0
**Status:** Draft
**Date:** 2026-08-06

## 1. Epic Overview

E1 establishes the trust boundary between the native mobile app and the WebView. The mobile app already has the user authenticated; this epic defines how the WebView receives and validates that identity without requiring the player to log in again.

**Business objective:** Enable seamless, zero-friction entry into the mini game for any authenticated mobile app user. The player opens the WebView and arrives directly at the game — no login screen, no redirect.

**Dependencies:** None — this is the foundational epic. All other epics depend on a valid player identity being available in the session.

**Downstream dependents:** E2 (Game Core), E3 (Reward/Coupon), E4 (Game Session) — all three require a confirmed player identity before their flows can begin.

## 2. Scope

### In Scope

- Receiving a JWT token delivered by the native app via URL query param (`?token=`)
- Receiving a JWT token delivered by the native app via JS bridge message
- Validating the received token with the backend before granting game access
- Blocking all game screens behind an auth gate until a valid token is confirmed
- Displaying localized loading, error, and recovery states for every auth failure mode
- Holding the validated token in-memory for the duration of the WebView session

### Out of Scope

- User login, registration, or password reset (owned entirely by the native app)
- Token refresh or re-authentication within an active session — if the token expires mid-session, the player must re-open the WebView from the native app
- Persisting the token across sessions or page reloads
- Role-based access control — all players share the same permission level
- Handling tokens delivered by any channel other than URL param or JS bridge

## 3. User Personas

| Persona | Role in Epic |
|---|---|
| **PLAYER** | Opens the WebView from the native app and expects to arrive at the game immediately, without a separate login step |
| **HOST** | The native mobile app; responsible for injecting a valid JWT into the WebView at launch via one of the two supported channels |
| **SYSTEM** | The project backend; validates the token and confirms player identity before the frontend grants game access |

## 4. Feature Inventory

| Feature ID | Feature Name | Priority | Status |
|---|---|---|---|
| F1.1 | URL Query Param Token Reception | P0 | Draft |
| F1.2 | JS Bridge Token Reception | P0 | Draft |
| F1.3 | Token Validation & Game Access Gate | P0 | Draft |

## 5. Key Business Rules

- A player must never reach any game screen without a validated token. The auth gate is absolute — no bypass, no grace period.
- The WebView must support **both** delivery channels (URL param and JS bridge) because different native app versions or platforms may use different mechanisms. The first valid token received from either channel is accepted.
- The token is session-scoped only. It must not be written to any persistent storage.
- All error states must display localized text in `ja` (primary) and `en` (secondary).

## 6. Technical Context

The auth bridge is a purely receptive mechanism — the WebView never initiates authentication. The HOST is always the initiating party. Validation of the received token is delegated to SYSTEM; the frontend's role is to pass the token through and act on the result (grant access or display an error).
