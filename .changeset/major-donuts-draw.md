---
'@2digits/eslint-config': patch
---

Refactor ESLint plugin imports to use named exports

- Updated imports in `boolean.ts`, `github-actions.ts`, `regexp.ts`, and `toml.ts` configs to use named `configs` exports from ESLint plugins
- Changed root `eslint.config.ts` to use named import `{ twoDigits }` from `@2digits/eslint-config`
