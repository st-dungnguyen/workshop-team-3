# Architecture Patterns

Use this reference to answer: "Where does this code belong?"

## Purpose

Keeping code placement consistent as the frontend grows prevents common drift:

- duplicated logic scattered across components
- pages that fetch, transform, and render everything at once
- unclear code placement for new features

The project separates infrastructure (`core/`), route entries (`pages/`), and reusable/domain code (`shared/`). See `data-flow.md` for the actual data-fetching patterns in use.

## Top-Level Folders

```txt
src/
├── app/
│   ├── core/    # infrastructure, cross-cutting concerns, routing wiring, auth feature
│   ├── pages/   # route entries, feature routes, containers
│   └── shared/  # reusable UI, contexts, HOCs, domain services, models
├── assets/      # i18n locale files, icons, images
├── config/      # environment and endpoint config
└── stylesheet/  # global SCSS (see ui-styling.md)
```

Everything under `app/` is reached through path aliases, not relative paths across folders: `@app/*`, `@core/*` (`src/app/core/*`), `@shared/*` (`src/app/shared/*`), `@config/*` (`src/config/*`), `@stylesheet/*` (`src/stylesheet/*`), `@assets/*` (`src/assets/*`). Use these aliases for any cross-folder import.

## `core/`

`core/` owns infrastructure and cross-cutting app wiring. It should not contain page-specific UI.

```txt
core/
├── auth/        # auth feature: Auth shell, auth.routes.ts, login/register containers
├── constants/   # app-wide constants and enums (e.g. ACCESS_TOKEN_KEY)
├── helpers/     # supporting logic for core services (auth token handling, jwt, storage, reducers)
├── hooks/       # React hooks not tied to one feature (e.g. useApi)
├── modules/     # self-contained infra modules the app depends on (e.g. custom-router-dom)
└── services/    # infrastructure services: api.service.ts, auth.service.ts, auth-storage.service.ts, i18n.service.ts
```

Use `core/services/` for infrastructure services — the HTTP client (`api.service.ts`), auth/session handling, i18n bootstrap. These are shared by the whole app, not owned by one feature. Domain/feature services live in `shared/services/` instead.

Use `core/hooks/` for hooks that are not specific to one feature, such as a generic request hook. Put feature-specific hooks under `pages/<feature>/hooks/`, as `articles/hooks/useArticleList.ts` does.

Use `core/helpers/` for supporting classes used by core services, such as token/JWT handling or storage access, when the logic is reusable infrastructure rather than a full service.

Use `core/modules/` for infra the app depends on but that isn't a plain service, such as the custom router wiring (`custom-router-dom`: `PageRoute` type, `PrivateRoute` guard, `RouterOutlet` renderer — see `routing-layout.md`).

Use `core/auth/` for the auth feature itself (login/register/auth shell). Auth lives under `core/` rather than `pages/` because it sits outside the authenticated app shell and is wired in at the top level (`app.routes.ts`), not under `pages/page.routes.ts`.

The current source keeps routing infrastructure in `core/modules/custom-router-dom/`, colocates layout shells with their route groups, and uses `shared/contexts/auth.context.tsx` for cross-cutting React state.

## `pages/`

`pages/` contains route entry points, one subfolder per feature.

```txt
pages/
├── Page.tsx               # app shell: Header + <Outlet/> + Footer
├── page.routes.ts         # aggregates feature routes and wraps them with Page
│
│   # ── Mini Game features (the real project) ──────────────────────────
├── game/
│   ├── game.routes.ts
│   ├── hooks/
│   │   └── useGameSession.ts      # session state, win/lose result
│   ├── containers/
│   │   └── GamePlay.tsx           # main game screen
│   └── components/
│       └── GameBoard.tsx          # game-specific presentational component
├── reward/
│   ├── reward.routes.ts
│   ├── hooks/
│   │   └── useRewardCoupon.ts     # coupon result from backend
│   └── containers/
│       └── RewardResult.tsx       # win result + AppLink CTA
│
│   # ── Boilerplate placeholders (not mini game features) ────────────
├── articles/              # reference implementation only; not a real feature
├── home/
└── error/
```

Page containers should stay thin:

- call hooks
- choose high-level render states
- compose components
- pass data and callbacks down

Page containers should not implement business rules or map raw API responses themselves — that belongs in a service (see `data-flow.md`).

## `shared/`

`shared/` contains reusable resources that are not owned by one route.

```txt
shared/
├── components/
│   ├── common/    # generic UI primitives
│   ├── layout/    # Header, Footer, HeaderBasic, FooterBasic
│   └── partials/  # other reusable presentational components (e.g. Button, Input)
├── contexts/      # React Context for cross-cutting concerns (auth.context.tsx)
├── hoc/           # higher-order components (e.g. withLoading)
├── models/        # shared TypeScript interfaces / domain models (e.g. user.ts)
└── services/      # domain/feature services, e.g. article.service.ts
```

Use `shared/services/` for domain-specific data access tied to a feature (e.g. `GameService`, `RewardService`). These are classes that hold an `ApiService` instance and expose feature methods; they call `core/services/api.service.ts` for the actual HTTP work rather than using axios directly.

Use `shared/components/` for generic UI that receives data through props, grouped into `common/`, `layout/`, or `partials/` by role. These components should not call services or fetch data themselves — pass data and callbacks in from the container.

Use `shared/contexts/` (not `core/contexts/`) for cross-cutting React concerns such as auth session state.

Use `shared/hoc/` for higher-order components that wrap cross-cutting rendering concerns, such as a loading state wrapper.

Use `shared/models/` for shared domain types and API/domain models. Current examples include `user.ts` and `article.ts`.

Follow the current precedent before introducing new shared folders:

- shared domain/API shapes go in `shared/models/`
- feature hooks go in `pages/<feature>/hooks/`
- generic hooks go in `core/hooks/`
- form validation schemas stay colocated with the form container, as auth does

## Placement Guide

| Responsibility | Location |
| --- | --- |
| Route or screen entry point | `pages/<feature>/containers/` |
| Route definition (per feature) | `pages/<feature>/<feature>.routes.ts` (or `core/auth/auth.routes.ts` for auth) |
| Reusable JSX/UI component | `shared/components/{common,layout,partials}/` |
| Feature-local presentational component | `pages/<feature>/components/` |
| Feature-specific hook | `pages/<feature>/hooks/` |
| Domain/feature service (HTTP + shaping for one feature) | `shared/services/` |
| Infrastructure service (HTTP client, auth/session, i18n bootstrap) | `core/services/` |
| Reusable hook not tied to one feature | `core/hooks/` |
| Cross-cutting React provider/context | `shared/contexts/` |
| Higher-order component | `shared/hoc/` |
| Router types/guards/renderer | `core/modules/custom-router-dom/` |
| Route aggregation | `pages/page.routes.ts`, `src/app/app.routes.ts` |
| Shared type/interface | `shared/models/` |
| Constants and enums | `core/constants/` |
| Supporting logic for a core service | `core/helpers/` |

## Decision Heuristic

Ask in order:

1. Is this a route entry or its route definition? Put it under `pages/<feature>/` (or `core/auth/` for auth).
2. Is this reusable UI? Put it under `shared/components/`.
3. Is this data access and shaping for one feature? Put it under `shared/services/` as a service class.
4. Is this app-wide infrastructure (HTTP client, session, i18n)? Put it under `core/services/`.
5. Is this a hook for one feature? Put it under `pages/<feature>/hooks/`.
6. Is this a reusable hook not owned by one feature? Put it under `core/hooks/`.
7. Is this a cross-cutting React context or HOC? Put it under `shared/contexts/` or `shared/hoc/`.
8. Is this a shared model/type? Put it under `shared/models/`.
9. Is this app-wide routing wiring or an infra module? Put it under `core/modules/` or the route aggregators.
10. Is this a constant or enum? Put it under `core/constants/`.

If none of these folders fit, look for the closest existing sibling convention before inventing a new top-level folder.
