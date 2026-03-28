---
'@2digits/oxfmt-config': minor
---

Add `@2digits/oxfmt-config` package

- Introduces `@2digits/oxfmt-config` with an opinionated `oxfmt` configuration for 2digits projects
- Configures import sorting with custom groups for `react`, `react-native`, `next`, `expo`, `@2digits`, and internal aliases
- Sets shared formatting defaults: `printWidth: 120`, `singleQuote`, `trailingComma: 'all'`, `bracketSameLine`
- Integrates Tailwind CSS class sorting via `sortTailwindcss` using `tailwindFunctions` from `@2digits/constants`
- Exports `twoDigits` config as default and re-exports `OxfmtConfig` type
- Added Prettier-parity fixture test suite verifying oxfmt output matches prettier across TypeScript, JSX, import ordering, Tailwind, and JSDoc fixtures
- Documents known differences (embedded language formatting, import attribute spacing, operator position) with `reason` snapshots
