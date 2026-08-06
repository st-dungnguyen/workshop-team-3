# React + Vite + TypeScript Boilerplate

A lightweight and scalable React boilerplate powered by Vite and TypeScript. Designed with flexibility in mind using Context API by default, with optional branches for popular state/data libraries like Redux Toolkit, SWR, and more.

## Features

⚡️ Vite for lightning-fast dev server and builds

🔋 TypeScript for static type safety

🧠 Context API for global state management (default)

🧩 Modular structure for easy scalability

🌱 Clean and minimal setup — perfect for new projects

🧪 Branch-based extensions for additional tools

## Branches

| Branch           | Description                                   |
|------------------|-----------------------------------------------|
| `main`           | Basic setup with React, Vite, TypeScript, and Context API |
| `additional/apply-redux-toolkit`  | Adds Redux Toolkit for advanced state management |
| `addition/apply-swr`            | Adds SWR for data fetching and caching        |
| `additional/apply-storybook`    | Adds Storybook for isolated UI component development and docs |
| `additional/apply-unit-test`        | Adds testing setup with Vitest, React Testing Library, and setup utilities |


## Based

- Node `^22.0.0`
- pnpm `^10.0.0`

## Libraries

#### Core

- [Typescript](https://www.typescriptlang.org/) `^5.8.2`
- [React](https://facebook.github.io/react/) `^19.0.0`
- [React Router DOM](https://reactrouter.com/web/guides) `^7.3.0`

#### Utilities

- [I18next](https://www.i18next.com/) `^24.2.2` - Providing the standard i18n features
- [Axios](https://github.com/axios/axios) `^1.8.2` - Promise based HTTP client for the browser and node.js

#### Build System

- [Vite](https://vitejs.dev/) `^6.2.1`

#### Plugins

- [vite-plugin-html](https://www.npmjs.com/package/vite-plugin-html) `^3.2.0`

#### Development extensions

- [eslint](https://github.com/eslint/eslint) `^9.22.0`
- [@typescript-eslint](https://typescript-eslint.io) `^8.26.1`

## Get started

Clone the repository

```sh
git clone git@github.com:st-fe-rd/b-react-vite-ts.git
cd b-react-vite-ts
```

Checkout the branch you want

```sh
git checkout additional/apply-redux-toolkit # or additional/apply-swr, or main
```

Copy env and run pnpm install

```sh
 cp .env.example .env && pnpm install
```

Run dev

```sh
 pnpm run dev
```

Check linter

```sh
 pnpm run lint
```

Run build

```sh
 pnpm run build
```

Run preview

```sh
 pnpm run preview
```
