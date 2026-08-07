# Epic: E4 — Game Session

**Epic ID:** E4
**Priority:** P0
**Status:** Implemented
**Date:** 2026-08-06

## 1. Epic Overview

E4 governs session eligibility and play-limit enforcement for the mini game. The business rule is that a player may play once per campaign window (typically once per day). Before showing the game board, the frontend must verify that the player has not already used their play for the current window. If they have, the player sees a clear, encouraging screen communicating when their next play becomes available.

**Business objective:** Prevent a player from playing more than once per window while ensuring ineligible players receive a positive, branded experience — not an error page — that brings them back tomorrow.

**Dependencies:**
- [E1 — Auth Bridge](../auth-bridge/_epic-E1-auth-bridge.md) — a validated player identity (token) is required before any eligibility check can be made
- [E2 — Game Core](../game-core/_epic-E2-game-core.md) — the `GameSession` records created during a play session (including `completed` and `rewarded` states) are what the backend uses to determine eligibility
- [E3 — Reward/Coupon](../reward-coupon/_epic-E3-reward-coupon.md) — the `rewarded` state (set by E3 after successful coupon issuance) is the definitive indicator that a player has both played and claimed their reward for the current window

**Downstream dependents:** None — E4 is the last guard in the flow. It determines entry to E2; there are no epics downstream of E4.

## 2. Scope

### In Scope

- Querying the backend to determine whether the player is eligible to play before showing the game board
- Displaying a loading state while the eligibility check is in progress
- Handling eligibility check errors (backend unavailable) with a retry option
- Displaying the play-limit screen when the player has already played their session for the current window
- Communicating when the next play window opens, if the backend provides that information
- Localized text for all eligibility-related player-facing strings in `ja` and `en` (`game.json` namespace)

### Out of Scope

- Determining the play-limit rules (once per day vs. per campaign window) — the backend is authoritative; the frontend only acts on the response
- Displaying a history of the player's past game sessions
- Replay within the same play window — a player may not retry after completing a session, regardless of the outcome
- Push notifications or reminders when the next play window opens
- Any in-WebView mechanism to extend or reset the play limit

## 3. User Personas

| Persona | Role in Epic |
|---|---|
| **PLAYER (eligible)** | Opens the WebView within their play window with an unused play; passes the eligibility check and arrives at the game board |
| **PLAYER (ineligible)** | Opens the WebView but has already used their play for the current window; sees a friendly message with guidance on when to return |
| **SYSTEM** | Receives the eligibility check request from the frontend; responds with the player's current session status and, when applicable, the next play window timestamp |

## 4. Feature Inventory

| Feature ID | Feature Name | Priority | Status |
|---|---|---|---|
| F4.1 | Pre-Game Session Eligibility Check | P0 | Implemented |
| F4.2 | Play Limit & Cooldown Screen | P0 | Implemented |

## 5. Key Business Rules

- **Backend is authoritative on eligibility.** The frontend never computes whether a player is eligible based on local state. It always defers to the backend response for the current request.
- **Both win and lose outcomes consume the play for the window.** A player who loses cannot replay immediately within the same window. Play-limit enforcement is outcome-agnostic.
- **The eligibility check precedes the game board.** A player must never arrive at the game board without a successful eligibility confirmation for the current session. The check is mandatory — it cannot be skipped or cached from a previous session.
- **Ineligible is not an error.** The play-limit state is an expected, designed UI state — not an error screen. The tone must be warm and encouraging, consistent with the campaign aesthetic.
- **Session state is the source of truth.** The `GameSession` state (`completed`, `rewarded`) is managed by the backend and used to determine eligibility. The frontend holds no persistent record of whether the player played.
