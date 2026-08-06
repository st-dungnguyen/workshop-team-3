# Mini Game WebView — Development Guide

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A React 19 + Vite 6 + TypeScript **mini game WebView** embedded inside an existing ecommerce mobile app (iOS + Android). The WebView renders a traditional Japanese-themed game that rewards players with promotional coupons, incentivizing visits to the mobile app. The mobile app handles authentication; the WebView receives a token and plays entirely within the WebView shell with no separate login UI.

**Design reference:** [takeout.skylark.co.jp](https://takeout.skylark.co.jp/) — warm Japanese food-brand aesthetic (colors, typography mood). Do not use their logo or branding assets.

## Tech Stack

React 19 + Vite 6 + TypeScript using Context API for global state, React Router 7 through a custom routing layer, Axios via a service class, i18next for translations (primary `ja`, secondary `en`), React Hook Form + Zod for forms, and global SCSS.

## Commands

```sh
pnpm run dev       # start Vite dev server
pnpm run build     # vite build --emptyOutDir
pnpm run lint      # eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
pnpm run format    # prettier --write . && eslint . --fix
pnpm run preview   # preview the production build
```

## Architecture

### Path aliases

Code under `src/app` is imported via aliases, not deep relative paths: `@app/*`, `@core/*` → `src/app/core/*`, `@shared/*` → `src/app/shared/*`, `@config/*` → `src/config/*`, `@stylesheet/*` → `src/stylesheet/*`, `@assets/*` → `src/assets/*`. Defined in both `vite.config.ts` and `tsconfig.json` — keep them in sync if adding a new alias.

### Top-level split

```
src/app/core/    # infrastructure & cross-cutting concerns, routing wiring, the auth feature
src/app/pages/   # route entries — one subfolder per feature (containers, hooks, components, routes)
src/app/shared/  # reusable UI, contexts, HOCs, domain services, models
src/config/      # environment + API endpoint config
src/stylesheet/  # global SCSS, organized into base/layout/modules/pages/state
```

## Data flow

Two patterns are in use:

1. **Feature hook (default for read data)**: `container → pages/<feature>/hooks/use<Feature>() → shared/services/<feature>.service.ts → core/services/api.service.ts`. The container renders loading/error/content states from the hook's return. See `articles` for the reference implementation.
2. **Direct service call in container (forms/one-off actions)**: e.g. login — the container owns the event handler, local loading state, and redirect/error behavior, calling a `shared/services/`/`core/services/` class directly.

Services in `shared/services/` and `core/services/` are classes with three conceptual layers: raw HTTP + raw→domain mapping (private), pure business rules (public, no API calls), and public use-case methods that orchestrate the two. Services never import React or router APIs.

## Routing

A custom layer sits on top of `react-router-dom` — always check `core/modules/custom-router-dom/` (`PageRoute` type, `PrivateRoute` guard, `RouterOutlet` renderer) before changing routing behavior. Each feature exports a `PageRoute[]` of lazy-loaded containers from its own `<feature>.routes.ts`; these aggregate bottom-up into `pages/page.routes.ts` (wrapped in the `Page` shell: Header + `<Outlet/>` + Footer) and then `src/app/app.routes.ts`, which combines page routes with `core/auth/auth.routes.ts` (wrapped in the separate `Auth` shell: HeaderBasic + `<Outlet/>` + FooterBasic). Route protection is declarative via `isProtected: true` on a `PageRoute`.

## WebView Auth

The WebView never shows a login screen. The mobile app passes an auth token via one of two channels — both must be supported:

1. **URL query param**: mobile opens `<webview-url>?accessToken=<jwt>` — read on mount from `window.location.search`.
2. **JS Bridge**: mobile calls `window.ReactNativeWebView.postMessage` (or equivalent) with `{ type: 'AUTH_TOKEN', token: '<jwt>' }` — listen via `window.addEventListener('message', ...)`.

Token resolution priority (highest to lowest):
1. URL param `?accessToken=` — always wins, overwrites any stored token.
2. Retry path — re-validates the previously received token (unless it came from localStorage and already failed).
3. `localStorage` (`access_token` key) — used on subsequent WebView page loads without a URL param; cleared automatically on expiry or invalid response.
4. JS Bridge — active listener until token arrives or 5 s timeout (`tokenMissing` error).

After a token is validated, it is saved to `localStorage` (`access_token` key) so navigating to other WebView URLs does not require the mobile app to re-pass the token. Expired or invalid stored tokens are cleared on validation failure so the bridge / timeout path can take over.

## External API & AppLink Integration

Full specs: [`docs/api/coupon-api.md`](docs/api/coupon-api.md) · [`docs/api/applinks.md`](docs/api/applinks.md)

### Coupon API (Segment API)

Coupon issuance is **server-side only** — the frontend never calls `POST /segment` directly. The WebView's role is to trigger the game, receive the win result from the backend, then navigate the user to the coupon.

| Concern | Detail |
|---|---|
| Base URL | `https://coupon-api-{env}.skylark.co.jp` |
| Required headers | `Authorization: Bearer <jwt>`, `x-skylark-token`, `x-client-version: webview-mini-app-{env}` |
| Coupon type | **Segment coupon** — always use `/segment` endpoints, not legacy `/coupon/segment/entry` |
| Grant coupon | `POST /segment` (server-side) |
| Verify grant | `GET /segment?userId=...&types=coupon` |

### AppLink — navigating to coupon after win

After a winning game session, navigate the user to the coupon detail in the native app:

```
window.location.href = `https://www.skylark.co.jp/app/coupon/segment?id={couponId}`
```

### Closing the WebView

Navigate to `{webViewHost}/close` (current iOS + Android implementation). `sklgusto://close` is still in development and not yet in production as of 2026-08 — do not rely on it.

## i18n

Locale JSON lives under `src/assets/i18n/<lang>/<namespace>.json`. Supported locales: `ja` (primary), `en` (secondary). Add new keys to **every** locale. Prefer a dedicated feature namespace (e.g., `game`, `reward`) over adding to `common`.

## Styling

Global SCSS only (no CSS Modules/CSS-in-JS), entry-imported as `@stylesheet/styles.scss`. Organized into `base/`, `layout/`, `modules/`, `pages/`, `state/`, each with an `_all.scss` aggregator that new partials must be registered in. Class naming uses a hyphen-separated BEM format (`.block-element-modifier`) — not traditional BEM separators (`__`/`--`).

## Conventions

- Function components only, typed as `const ComponentName = (props: ComponentNameProps) => ...`; avoid `React.FC`. Route-target containers keep the PascalCase const internally but end with `export default` for `React.lazy`.
- Hooks are camelCase and start with `use`; event handler props use `on...`, implementations use `handle...`; booleans use `is`/`has`/`can`/`should`; constants are `SCREAMING_SNAKE_CASE`.
- Presentational components (`shared/components/`) take data/callbacks via props only — no fetching, no importing infra services.
- ESLint (flat config, `eslint.config.mjs`) enforces `eslint:recommended` + `@typescript-eslint/recommended` + Prettier, with `--max-warnings 0` in CI/lint script — treat warnings as build-breaking. Prettier config: single quotes, semicolons, trailing commas, 80-col width (double quotes for `.scss`/`.css`).

## Development Workflows

- Always run `pnpm run lint` before committing code.
- Use the `frontend` skill when touching pages, routes, layouts, hooks, services, shared components, i18n content, or SCSS.
