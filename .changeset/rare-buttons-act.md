---
'@2digits/oxlint-config': minor
---

Add `@2digits/oxlint-config` package

- Added new `@2digits/oxlint-config` package providing an opinionated Oxlint configuration for 2digits projects
- Exported `twoDigits` config (base + TypeScript rules + type-aware rules + vitest rules) and `withTwoDigits()` for project-level extension via `extends`
- Included curated rule sets for `javascript`, `typescript`, `unicorn`, `import`, `vitest`, and `type-aware` categories
- Added `defu`-based deep merge so consumer configs override 2digits defaults without losing unconfigured rules
- Added a `rules:check` script to verify all enabled rules still exist in the installed oxlint version
- Wired `lint:oxlint` Turborepo task that depends on a fresh `@2digits/oxlint-config#build` before running
