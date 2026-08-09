---
packages:
  'npm:@2digits/config-monorepo': patch
---

## Default the workspace to TypeScript 7

- Moved the catalog default from `typescript@6.0.3` to `typescript@7.0.2` and dropped Renovate's generated `conflicts_typescript_7_0_2` catalog
- Pointed the root manifest back at `catalog:`, so every package that is not tied to `typescript-eslint` typechecks and builds on 7
- `effect-tsgo patch --typescript` requires `typescript >= 7`, so `tsc` is now the Effect-patched compiler for the whole workspace
