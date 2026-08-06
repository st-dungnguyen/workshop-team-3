# UI Styling

Use this reference when adding or changing SCSS, class names, reusable style modules, layout styles, or page styles.

## Styling System

The project uses global SCSS imported from the app entry:

```ts
import '@stylesheet/styles.scss';
```

Do not introduce CSS Modules, CSS-in-JS, or a new styling system unless the project has already adopted one or the task explicitly requires it.

## Stylesheet Structure

```txt
src/stylesheet/
├── base/       # reset, variables, mixins, extends
├── layout/     # header, footer, grid, main
├── modules/    # button, card, form, spinner, loader
├── pages/      # page-specific styles
└── state/      # utility classes for text, spacing, state
```

Each group has an `_all.scss` aggregator. When adding a new SCSS partial, ensure it is imported by the relevant aggregator.

## Naming Convention

### BEM Methodology (Hyphen-Separated Format)

Use a modified BEM format with hyphens throughout. Do not use traditional BEM separators:

| Traditional BEM | Team Format |
| --- | --- |
| `.block__element--modifier` | `.block-element-modifier` |
| `.card__header--primary` | `.card-header-primary` |
| `.user__avatar--large` | `.user-avatar-large` |
| `.nav__item--active` | `.nav-item-active` |

Hyphen-separated names are easier to read, type, and keep consistent with utility-class style naming.

### Block

A block is the root element for a standalone component or UI concept.

Use descriptive, lowercase, hyphen-separated names:

```txt
.card
.user-profile
.search-form
.data-table
```

Avoid:

```txt
.Card
.user_profile
.searchForm
.userprofile
```

### Element

An element is part of a block and has no standalone meaning outside that block.

Use `block-element`:

```txt
.card-header
.card-body
.user-profile-avatar
.search-form-input
```

Avoid:

```txt
.card__header
.cardHeader
.header
.card-header-item-link
```

If the class becomes too deeply nested, flatten it while preserving meaning:

```txt
.card-link
```

### Modifier

A modifier is a variant that changes appearance, behavior, or state.

Use `block-modifier` or `block-element-modifier`:

```txt
.btn-primary
.btn-lg
.card-featured
.card-header-primary
.user-profile-avatar-large
```

Avoid:

```txt
.btn--primary
.btnPrimary
.primary
.btn-is-primary
.btn-has-icon
```

### State Classes

For dynamic states, use modifier format:

```txt
.btn-active
.btn-disabled
.btn-loading
.nav-item-active
```

Avoid:

```txt
.is-active
.btn.active
.btn[disabled]
```

### Component Structure Example

```txt
.card                 # block
.card-header          # element
.card-avatar          # element
.card-name            # element
.card-body            # element
.card-footer          # element
.card-featured        # modifier
.card-compact         # modifier
.card-avatar-large    # element modifier
```

## ClassName Composition

Reusable components may accept `className` and compose it with base classes:

```tsx
<button className={`btn ${className}`} />
```

```tsx
const inputClassName = `form-control ${className} ${isShowError() ? 'is-invalid' : ''}`;
```

Keep base classes inside the component when they are part of the component contract.

## Where To Put Styles

Use `layout/` for app shells and structural pieces:

```txt
_header.scss
_footer.scss
_grid.scss
_main.scss
```

Use `modules/` for reusable component styles:

```txt
_button.scss
_card.scss
_form.scss
_spinner.scss
_loader.scss
```

Use `pages/` for page-specific styles:

```txt
_home.scss
_common.scss
_error-boundary.scss
```

Use `state/` for utility classes such as text and spacing helpers.

## Styling Rules

- Prefer existing variables and mixins from `base/`.
- Keep page-specific selectors out of reusable module partials.
- Keep reusable component styles out of page partials.
- Avoid inline styles unless the value is truly dynamic.
- Keep class names stable when components already depend on them.
- Make sure new partials are included through `_all.scss` and ultimately `styles.scss`.

## Design Mood & Aesthetic

The visual direction is a warm Japanese food-brand aesthetic, inspired by [takeout.skylark.co.jp](https://takeout.skylark.co.jp/). Key principles:

- **Warm, earthy palette** — prefer reds, oranges, warm browns, and cream tones over cool grays or corporate blues.
- **Friendly and approachable** — rounded corners, generous padding, playful but restrained illustration style. Avoid sharp, corporate UI patterns.
- **Japanese typography-ready** — font stack must support Japanese characters (e.g., `"Noto Sans JP", sans-serif`). Test all text-heavy components with Japanese copy.
- **Mobile-first, full-bleed** — the WebView occupies the full mobile screen. Designs should feel native to mobile, not like a shrunk-down desktop page.
- **No Skylark branding assets** — do not use their logo, mascots, or trademark colors. The aesthetic inspiration is the warmth and approachability of their visual style, not their brand identity.
