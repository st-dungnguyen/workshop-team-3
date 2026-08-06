# Component Conventions

Use this reference when creating or modifying React TypeScript components, props, handlers, JSX, and component-level state.

## Core Values

- Use function components only. Do not add class components in new code.
- Follow the Rules of React. Components and hooks must be pure; props and state are immutable.
- Prefer composition over configuration. Build small components composed together instead of one large component with many mode/flag props.
- Derive, do not sync. Compute values during render instead of mirroring props or computable values into state.
- Treat server state separately from client state. Use a query library for API data when the project has one; use local state for UI-only state. If the current project has no query library, follow the existing data-flow reference instead of introducing one from a component-only task.

## File Naming

```txt
UserList.tsx       # Component files: PascalCase
useUsers.ts        # Hook files: camelCase with use prefix
formatDate.ts      # Utility files: camelCase
types.ts           # Shared types for the feature
UserList.test.tsx  # Tests
```

## Symbol Naming

Components use PascalCase:

```tsx
export const UserList = () => {
  return null;
};
```

Hooks use camelCase and must start with `use`:

```ts
export const useUsers = () => {
  return {};
};
```

Event handler props use the `on` prefix:

```ts
interface UserListProps {
  onSelect: (user: User) => void;
  onClose: () => void;
}
```

Event handler implementations use the `handle` prefix:

```ts
const handleSelect = (user: User) => {
  onSelect(user);
};
```

Boolean values use `is`, `has`, `can`, or `should`:

```ts
const isOpen = true;
const hasError = false;
const canSubmit = !hasError;
const shouldRenderFooter = true;
```

Constants use SCREAMING_SNAKE_CASE:

```ts
const MAX_PAGE_SIZE = 50;
```

## Function Components

Prefer typed arrow function components assigned to a PascalCase `const`.

```tsx
interface UserCardProps {
  user: User;
  compact?: boolean;
  onSelect: (user: User) => void;
}

export const UserCard = ({ user, compact = false, onSelect }: UserCardProps) => {
  return (
    <article onClick={() => onSelect(user)}>
      <h3>{user.name}</h3>
      {!compact && <p>{user.email}</p>}
    </article>
  );
};
```

Avoid `React.FC` by default. Type props directly and return JSX from the function.

For route targets, follow `routing-layout.md` if the routing layer requires default exports for `React.lazy`. Keep the component implementation as a PascalCase `const` and export it at the end:

```tsx
const ArticleList = () => {
  return <section />;
};

export default ArticleList;
```

## Props

Use `ComponentNameProps` for props interfaces.

Destructure props in the function signature and set defaults inline:

```tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

export const Button = ({
  variant = 'primary',
  size = 'medium',
  disabled = false,
  onClick,
  children,
}: ButtonProps) => {
  return (
    <button
      className={`btn btn--${variant} btn--${size}`}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
};
```

Keep props small and explicit. If a component starts collecting many unrelated flags, split it into smaller components.

## JSX Conventions

Use ternaries for either/or rendering:

```tsx
{isLoading ? <Spinner /> : <UserList users={users} />}
```

Use `&&` for optional rendering only with boolean guards:

```tsx
{error && <ErrorBanner message={error} />}
{items.length > 0 && <List items={items} />}
```

Do not use a number directly as an `&&` guard:

```tsx
{items.length && <List items={items} />} // Bad: renders 0 when empty
```

Use early returns for whole-component branches:

```tsx
if (!user) {
  return <LoginPrompt />;
}

return <Profile user={user} />;
```

## Lists And Keys

Use stable unique keys from the data:

```tsx
{users.map((user) => (
  <UserCard key={user.id} user={user} />
))}
```

Do not use array index as key for dynamic lists:

```tsx
{users.map((user, index) => (
  <UserCard key={index} user={user} />
))}
```

Use index keys only for truly static lists that never reorder, insert, or delete.

## Formatting

Put one prop per line when a JSX element has more than two props:

```tsx
<UserCard
  user={user}
  compact
  onSelect={handleSelect}
/>
```

Self-close elements without children:

```tsx
<Spinner />
```

Prefer fragments over wrapper `div`s when no DOM wrapper is needed:

```tsx
<>
  <Header />
  <Main />
</>
```

## Composition Boundaries

Presentation components should receive data and callbacks through props. They should not fetch API data, mutate props, import infrastructure services, or decide domain permissions.

Containers and page components may coordinate routing, forms, and high-level screen states. Move reusable data/lifecycle logic into hooks and domain/business logic into services.

## WebView Constraints

This app runs inside a native WebView — not a standalone browser. These constraints apply to every component:

- **No auth token in localStorage.** The JWT received from the mobile app lives in `AuthContext` only. Never write it to `localStorage`, `sessionStorage`, or any persistent store.
- **No `window.open`.** Opening a new tab or window is undefined behavior in a WebView. Use `window.location.href` for AppLink navigation (coupon detail, close).
- **Mobile viewport only.** There is no desktop layout. Design for a single-column mobile viewport. Interactive targets should be at least 44px in height to be reliably tappable.
- **Touch over hover.** Do not rely on `:hover` states for interactive affordance — they won't fire reliably on touch. Use `:active` or explicit pressed states.
- **Japanese text rendering.** The primary locale is `ja`. Components that display text must use a font stack that supports Japanese characters and test with Japanese copy, not Latin placeholders.
