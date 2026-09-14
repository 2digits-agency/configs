---
packages:
  'npm:@2digits/config-monorepo': patch
---

## Run package tests with standalone Vitest 5

- Switched test scripts to `vitest run` and watch scripts to `vitest`, avoiding the older runtime bundled with Vite+ and restoring compatibility with `@effect/vitest`.
