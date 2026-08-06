# Epic: E2 — Game Core

**Epic ID:** E2
**Priority:** P0
**Status:** Draft
**Date:** 2026-08-06

## 1. Epic Overview

E2 defines the shared game mechanics, session lifecycle, and variant system that power all seasonal mini games. The business requirement is that the seasonal game can be swapped with only a configuration change and a frontend redeploy — no native app update, no re-architecture.

The key insight is that all current and future game variants (Scratch Card, Flip Card, and others) share an identical underlying mechanic:

1. Player initiates play
2. Backend determines the outcome (win or lose) server-side
3. Frontend receives the outcome and plays the game animation to reveal it
4. Result screen is shown; win path hands off to E3 (Reward)

Only the animation and interaction style differ between variants. The session lifecycle, outcome resolution, and result display are shared infrastructure owned by E2.

**Dependencies:** [E1 — Auth Bridge](../auth-bridge/_epic-E1-auth-bridge.md) — a validated player identity must exist before a game session can be initiated.

**Downstream dependents:**
- [E3 — Reward/Coupon](../reward-coupon/_epic-E3-reward-coupon.md) — receives the win signal from E2 to issue a coupon
- [E4 — Game Session](../game-session/_epic-E4-game-session.md) — enforces play limits using the session records created by E2

## 2. Scope

### In Scope

- A deploy-time configuration that declares the active game variant (Scratch Card or Flip Card)
- A shared game shell that manages the session lifecycle regardless of which variant is active
- A variant contract defining what each game module must implement and what the shell provides
- The Scratch Card variant (scratchable card animation, scratch gesture interaction)
- The Flip Card variant (multi-card reveal animation, single-card tap interaction)
- Server-authoritative outcome resolution — win/lose is determined by the backend, not the frontend
- A shared result screen for win and lose outcomes
- Localized text for all player-facing strings in `ja` and `en` (`game.json` namespace)

### Out of Scope

- Adding a third game variant (covered by the variant contract; implementation is a future task)
- The reward/coupon flow after a win — owned by [E3](../reward-coupon/_epic-E3-reward-coupon.md)
- Session play-limit enforcement (once per day, cooldown) — owned by [E4](../game-session/_epic-E4-game-session.md)
- Game analytics or event tracking
- A/B testing between variants — only one variant is active at a time per deploy

## 3. User Personas

| Persona | Role in Epic |
|---|---|
| **PLAYER** | Opens the WebView, sees the active game (Scratch Card or Flip Card), plays one session, and receives a win or lose result |
| **SYSTEM** | Receives the play initiation from the frontend, determines the outcome (win/lose), and returns it — ensuring outcomes cannot be manipulated client-side |
| **HOST** | Indirectly involved — opened the WebView with a valid token (E1); has no role in the game session itself |

## 4. Feature Inventory

| Feature ID | Feature Name | Priority | Status |
|---|---|---|---|
| F2.1 | Active Game Configuration | P0 | Draft |
| F2.2 | Game Play Session | P0 | Draft |
| F2.3 | Game Result Screen | P0 | Draft |

## 5. Key Business Rules

- **Server-authoritative outcomes:** The backend is the sole authority on whether a player wins or loses. The frontend never generates or modifies the outcome locally.
- **Single-play session:** A player gets exactly one play attempt per session. Once a session moves to `resolving`, it cannot be replayed without starting a new session (governed by E4).
- **Variant-agnostic shell:** The game shell must work identically regardless of which variant is active. Swapping the variant config and redeploying is the complete change required.
- **No variant knowledge in shared code:** The session lifecycle, outcome resolution, and result screen must not contain variant-specific logic (e.g., no `if (variant === "wheel")` in shared modules).
