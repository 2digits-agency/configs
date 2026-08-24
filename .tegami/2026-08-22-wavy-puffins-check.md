---
packages:
  'npm:@2digits/config-monorepo': patch
---

## Stop running `vp check` in CI

- Removed the `vp check` step so CI does not invoke Vite+'s built-in checker. Lint, format, types, and tests already run through `vp run`.
