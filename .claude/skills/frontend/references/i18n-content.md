# I18n Content

Use this reference when adding or changing user-facing text, translation keys, locale files, or namespace usage.

## Current Shape

Locale files live under assets:

```txt
src/assets/i18n/
├── en/
│   ├── common.json   # header, footer, shared labels
│   ├── auth.json     # error screens (token invalid/expired)
│   ├── game.json     # game UI, countdown, win/lose states
│   └── reward.json   # coupon result, claim CTA, AppLink navigation
└── ja/
    ├── common.json
    ├── auth.json
    ├── game.json
    └── reward.json
```

`ja` is the primary locale — always write Japanese copy first. `en` is the secondary fallback. The boilerplate source also has `home.json` and `articles.json` which are placeholder files; do not add new keys there.

The i18n service uses `i18next`, `react-i18next`, and `i18next-http-backend`. Translation files are loaded by namespace.

## Usage

Use `useTranslation` in components:

```tsx
const { t } = useTranslation('common');

return <span>{t('header.login')}</span>;
```

For multiple namespaces:

```tsx
const { t } = useTranslation(['common', 'home']);

return <h1>{t('home:title')}</h1>;
```

## Namespace Conventions

Use existing namespaces when the text belongs there:

- `common`: header, footer, shared labels, shared loading/error states
- `auth`: token-invalid/token-expired error screens
- `game`: game board UI, countdown, win/lose result messages, play again CTA
- `reward`: coupon issuance result, claim button, AppLink navigation prompt

Do not add mini game text to `home` or `articles` — those are boilerplate placeholders. Do not dump game/reward strings into `common`; keep domain text in its own namespace so it stays portable and easy to hand off to translators.

## Key Conventions

Prefer nested, UI-oriented keys:

```json
{
  "logIn": {
    "title": "Login",
    "username": {
      "label": "Username",
      "error": {
        "required": "Username is required"
      }
    }
  }
}
```

Keep keys stable once used by components. If renaming a key, update all locales and all call sites.

## Adding Text

When adding user-facing text:

1. Choose the namespace.
2. Add the key to every supported locale.
3. Use `useTranslation` in the component.
4. Avoid hardcoding production UI text in JSX.

Demo placeholders in the existing boilerplate may still be hardcoded. Do not copy that pattern into production feature work.

## Form Text

Form labels, button titles, and validation errors should come from i18n:

```tsx
const schema = z.object({
  username: z.string().nonempty(t('logIn.username.error.required')),
});

<Input label={t('logIn.username.label')} />
<Button title={t('logIn.btn')} />
```
