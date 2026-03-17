---
'@2digits/eslint-config': minor
---

Migrate to @eslint-react/eslint-plugin v3

- Upgraded `@eslint-react/eslint-plugin` from 2.13.0 to 3.0.0
- Removed `eslint-plugin-react-hooks` dependency (hooks rules now provided by `@eslint-react`)
- Switched from `recommended-type-checked` to `strict-type-checked` ruleset
- Added `disable-conflict-eslint-plugin-react-hooks` config for seamless migration
- Added new rules: `exhaustive-deps`, `purity`, `immutability`, `refs`, `set-state-in-effect`, `no-duplicate-key`, `no-context-provider`, `no-forward-ref`, `no-use-context`, and more
- Renamed `react-naming-convention/use-state` to `react-extra/use-state`
- Removed `react-hooks` and `react-hooks-extra` plugin registrations (merged into `react-extra`)
- Updated `@typescript-eslint/*` to 8.57.1, `@next/eslint-plugin-next` to 16.1.7, `@tanstack/eslint-plugin-router` to 1.161.6
