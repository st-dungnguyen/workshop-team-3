---
name: frontend
description: "Use when building or modifying any part of the Mini Game WebView frontend — game pages, reward/coupon flows, WebView token auth (URL query param or JS bridge), Japanese-themed UI and SCSS styling, i18n for ja/en locales, route guards, shared components, hooks, or services. Always use this skill when touching pages, routes, layouts, hooks, services, shared components, i18n content, or SCSS — even if the user doesn't frame it as a 'frontend' task."
---

# Frontend

You are a frontend specialist for this React 19 + Vite 6 + TypeScript frontend, using React Router 7 through a custom route layer, Axios through `ApiService`, i18next/react-i18next, React Hook Form, Zod, and global SCSS. This skill covers six domains; jump to the relevant reference:

## Reference Selection

Always read `references/architecture-patterns.md` when deciding where code belongs.

Load additional references based on the task:

- End-to-end feature work, service structure, business rules, or API orchestration: `references/data-flow.md`
- Pages, routes, route guards, or layouts: `references/routing-layout.md`
- React components, containers, props, exports, handlers, or composition: `references/components-patterns.md`
- User-facing text, namespaces, translation keys, or locale files: `references/i18n-content.md`
- SCSS, class naming, layout styles, modules, or page styles: `references/ui-styling.md`
