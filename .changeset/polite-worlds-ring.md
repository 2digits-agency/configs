---
'@2digits/tlo-mcp': patch
---

Refactor internal implementation and simplify build config

- Replaced custom `toUrlParams()` helper with `@effect/platform/UrlParams.fromInput()`
- Fixed ternary expressions to follow preferred `x === undefined ? undefined : value` pattern
- Simplified package.json exports to ESM-only shorthand
- Removed unused dependencies (`@effect/cli`, `@effect/platform-node`, `nypm`, `pkg-types`, `unplugin-replace`)
- Converted arrow functions to named functions for `mapHttpError()` and `mapParseError()`
- Removed unused vitest setup file reference
