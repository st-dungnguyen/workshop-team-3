# Routing And Layout

Use this reference when adding or changing routes, page entries, route guards, or layout shells.

## Ownership

```txt
pages/<feature>/<feature>.routes.ts         # per-feature route definitions
core/auth/auth.routes.ts                     # auth feature routes
pages/page.routes.ts                         # aggregates feature routes, wraps them with Page
src/app/app.routes.ts                        # combines auth routes + page routes, top-level
core/modules/custom-router-dom/              # PageRoute type, PrivateRoute guard, RouterOutlet renderer
```

The project uses a small custom routing layer on top of `react-router-dom`, not a bare route config. Inspect `core/modules/custom-router-dom/` before changing routing behavior — it defines the `PageRoute` shape and how guards/rendering work.

## The `PageRoute` Shape

```ts
interface PageRoute {
  path: string;
  element?: LazyExoticComponent<() => JSX.Element>;
  isProtected?: boolean; // default false
  redirect?: string;
  children?: PageRoute[];
}
```

Every route file exports a `PageRoute[]` built from lazy-loaded containers.

## Page Entries

A page container is the root component for one route:

```txt
pages/
└── articles/
    └── containers/
        ├── Articles.tsx      # wraps nested article routes
        ├── ArticleList.tsx   # calls useArticleList for data/loading/error
        └── ArticleDetail.tsx
```

Page containers should:

- call hooks or contexts
- choose high-level render states
- compose components
- pass data and callbacks down

Page containers should not:

- call `api.service.ts` directly
- implement domain permission rules
- duplicate guard logic (`isProtected` on the route handles this)

## Route Definitions

Each feature owns its own `<feature>.routes.ts`, colocated with that feature:

```ts
// pages/game/game.routes.ts  (mini game example)
const GamePlay = React.lazy(() => import('./containers/GamePlay'));
const RewardResult = React.lazy(() => import('./containers/RewardResult'));

const gameRoutes: PageRoute[] = [
  {
    path: 'game',
    element: GamePlay,
    isProtected: true,
  },
  {
    path: 'game/reward',
    element: RewardResult,
    isProtected: true,
  },
];

export default gameRoutes;
```

The boilerplate source includes `articles/article.routes.ts` as a working reference for the route file shape — but it is not a mini game feature.

Feature route arrays are aggregated bottom-up:

```txt
game/game.routes.ts         ┐
reward/reward.routes.ts     ├─> pages/page.routes.ts (wrapped in <Page/>) ┐
error/error.routes.ts       ┘                                            ├─> src/app/app.routes.ts
core/auth/auth.routes.ts ──────────────────────────────────────────────────┘
```

`pages/page.routes.ts` wraps all page-shell routes under the `Page` component (path `/`). `core/auth/auth.routes.ts` is combined separately in `app.routes.ts` because auth routes render under a different shell (see Layouts below).

Keep route definitions declarative. Do not put feature business logic or data fetching in route files. Feature data fetching belongs in a custom hook or a form/action handler (see `data-flow.md`).

## Route Guards

There is no separate guard file per route. Protection is declarative:

- Set `isProtected: true` on the `PageRoute` object.
- `core/modules/custom-router-dom/RouterOutlet.tsx` wraps the route's element in `<PrivateRoute>` when `isProtected` is true.
- `PrivateRoute.tsx` checks `ACCESS_TOKEN_KEY` in `localStorage` and redirects to `/auth/login` if the user is not authenticated.

If a rule is more specific than "must be logged in" (e.g. role-based access), extend `PrivateRoute` or the `PageRoute` shape rather than adding ad hoc checks inside page containers.

## Layouts

There is no `core/layouts/` folder. Layout shells are colocated with the route group they wrap, and compose the reusable header/footer building blocks from `shared/components/layout/`:

```txt
pages/Page.tsx            # main app shell: Header + <Outlet/> + Footer, used by page.routes.ts
core/auth/Auth.tsx         # auth shell: HeaderBasic + <Outlet/> + FooterBasic, used by auth.routes.ts

shared/components/layout/
├── Header.tsx
├── Footer.tsx
├── HeaderBasic.tsx
└── FooterBasic.tsx
```

If a new route needs a different shell (e.g. a dashboard layout), add the shell component next to the route group that owns it (as `Page.tsx` and `Auth.tsx` do), and compose it from `shared/components/layout/` building blocks rather than creating a new top-level `layouts/` folder unless the project has already introduced one.

## Adding A Route

1. Create the page container under `pages/<feature>/containers/`.
2. Add `pages/<feature>/<feature>.routes.ts` exporting a `PageRoute[]`, lazy-loading the container(s).
3. If the route needs data, create a feature hook under `pages/<feature>/hooks/` that calls a `shared/services/` service. If data is fetched imperatively in response to a user action, use `core/hooks/useApi` or call the service directly from the container — see `data-flow.md` for when to use each.
4. Set `isProtected: true` on the route if it requires authentication.
5. Register the feature's route array into the right aggregator: `pages/page.routes.ts` for routes under the main app shell, or directly into `src/app/app.routes.ts` if the route needs a different top-level shell (like auth does).
6. Update `shared/components/layout/Header.tsx` navigation if the route should be linked from the nav.

## WebView Navigation (not React Router routes)

Two navigation patterns exit the WebView entirely — these are not React Router routes:

**Navigate to coupon detail in native app (after winning):**
```ts
window.location.href = `https://www.skylark.co.jp/app/coupon/segment?id=${couponId}`;
```

**Close the WebView and return to the native app:**
```ts
window.location.href = `${window.location.origin}/close`;
```

Do not model these as React Router `<Link>` or `navigate()` calls — they are imperative redirects that hand control back to the native app. See `docs/api/applinks.md` for the full AppLink specification.
