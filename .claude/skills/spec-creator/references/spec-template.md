# Spec Templates & Examples

Read this for the exact structure and formatting conventions used in Mini Game WebView specs.

## Feature PRD Template

```markdown
# Feature PRD: F<N>.<M> — <Feature Name>

## 1. Feature Name
**<Feature Name>** — One-sentence description of what this feature enables.

## 2. Epic
- **Parent Epic:** [E<N> — <Epic Name>](./_epic-E<N>-<epic-name>.md)
- **Priority:** P0 | P1 | P2
- **Status:** Draft | In Progress | Done

## 3. Purpose & Scope
What this feature does and why it matters. Include the business value.

**Intended Audience:** Engineering team.

**Assumptions:**
- Assumption about user behavior or system state
- Assumption about dependencies (e.g., Coupon API contract, token format)

## 4. User Personas
| Persona | Description |
|---|---|
| **Player (PLAYER)** | Role-specific description for this feature |
| **Mobile App Host (HOST)** | What the native app does in relation to this feature |

## 5. User Stories
- As a **PLAYER**, I want to **<action>** so that I can **<benefit>**.
- As a **HOST**, I want to **<action>** so that I can **<benefit>**.

## 6. Requirements

### Functional Requirements
- **REQ-001**: The system shall [specific testable behavior].
- **REQ-002**: The system shall [specific testable behavior].

### Validation Rules
- **VAL-001**: The system shall reject [invalid input] with [specific error].

### Security Requirements
- **SEC-001**: The system shall [auth/token enforcement rule].

### Constraints
- **CON-001**: [Hard constraint or limitation].

### Guidelines
- **GUD-001**: The system should [recommended behavior].

## 7. Acceptance Criteria
- **AC-001**: Given [context], When [action], Then [expected outcome].
- **AC-002**: Given [context], When [action], Then [expected outcome].

## 8. Test & Validation Criteria

**Test Perspectives:**
- Happy path: [scenario]
- Validation: [invalid input scenarios, e.g. expired token, malformed payload]
- Security: [unauthorized access scenarios]
- WebView-specific: [e.g. both auth channels, JS bridge unavailable, app backgrounded]
- Edge cases: [boundary conditions, e.g. session limit hit, API timeout]

## 9. Out of Scope
- Feature or behavior explicitly excluded
- Related feature handled in a different PRD
```

## Epic Template

```markdown
# Epic: E<N> — <Epic Name>

**Epic ID:** E<N>
**Priority:** P0 | P1 | P2
**Status:** Draft | In Progress | Done
**Date:** YYYY-MM-DD

## 1. Epic Overview
Business objective, what area this covers, dependencies on other epics,
downstream dependents.

## 2. Scope

### In Scope
- Feature or capability included

### Out of Scope
- Feature or capability excluded

## 3. User Personas
| Persona | Role in Epic |
|---|---|
| **PLAYER** | What this role does in this epic |
| **HOST** | What the mobile app does in this epic |

## 4. Feature Inventory
| Feature ID | Feature Name | Priority | Status |
|---|---|---|---|
| F<N>.1 | Feature Name | P0 | Draft |
| F<N>.2 | Feature Name | P1 | Draft |

## 5. Key Business Rules
- Business rule that applies across features in this epic

## 6. Technical Context
High-level implementation notes. Reference relevant modules/services
without prescribing implementation details.
```

## Spec Directory Map

```
spec/
├── product-spec.md                    # Master product specification
├── auth-bridge/                       # E1: Token reception + validation
│   ├── _epic-E1-auth-bridge.md
│   └── f1.x-...
├── game-core/                         # E2: Game mechanics, session lifecycle
│   ├── _epic-E2-game-core.md
│   └── f2.x-...
├── reward-coupon/                     # E3: Coupon issuance and display
│   ├── _epic-E3-reward-coupon.md
│   └── f3.x-...
├── game-session/                      # E4: Session limits, cooldown, history
│   ├── _epic-E4-game-session.md
│   └── f4.x-...
└── end-to-end/
    └── game-play-lifecycle.md         # Cross-functional workflow
```

## Requirement ID Prefixes

| Prefix | Meaning | Example |
|--------|---------|---------|
| REQ | Functional requirement | REQ-001: The system shall display the game board after token validation succeeds |
| SEC | Security / auth requirement | SEC-001: The system shall reject tokens that fail signature verification |
| VAL | Validation rule | VAL-001: The system shall reject tokens missing the `sub` claim |
| CON | Constraint | CON-001: The WebView shall not persist the auth token to localStorage |
| GUD | Guideline | GUD-001: The system should surface a localized error message in `ja` by default |
| PAT | Pattern to follow | PAT-001: All API calls shall use the token from AuthContext, not re-read from the URL |

## Priority Definitions

| Priority | Meaning | Examples |
|----------|---------|---------|
| P0 | Critical — system non-functional without it | Auth bridge, token validation, game session start |
| P1 | High — core experience degraded without it | Coupon issuance, win/lose UI, session limit enforcement |
| P2 | Medium — nice to have, can ship without | Play history display, animation polish, multi-language toggle |

## Writing Quality Markers

Strong specs in this project share these traits:
- Every requirement is testable: not "the system shall validate the token" but "the system shall reject tokens where `exp` is in the past and display the `auth.tokenExpired` error screen"
- User stories tie to PLAYER or HOST and articulate the benefit clearly
- Acceptance criteria use Given/When/Then format
- WebView edge cases are explicitly covered (JS bridge not available, app backgrounded mid-game, both auth channels)
- Out of Scope is specific: not "future features" but "token refresh flow, in-app purchase, leaderboard"
- Cross-references use relative links: `[E1 — Auth Bridge](./_epic-E1-auth-bridge.md)`
