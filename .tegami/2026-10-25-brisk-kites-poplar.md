---
packages:
  'npm:@2digits/config-monorepo': patch
  'npm:@2digits/cli': patch
  'npm:@2digits/constants': patch
  'npm:@2digits/eslint-config': patch
  'npm:@2digits/eslint-plugin': patch
  'npm:@2digits/opencode-plugin': patch
  'npm:@2digits/oxfmt-config': patch
  'npm:@2digits/oxlint-config': patch
  'npm:@2digits/oxlint-plugin': patch
  'npm:@2digits/prettier-config': patch
  'npm:@2digits/renovate-config': patch
  'npm:@2digits/tlo-mcp': patch
---

## Type-check with tsrs

- Type checks now run on [tsrs](https://github.com/oxc-project/tsrs) 0.18.0, the Rust port of the TypeScript 7 compiler, instead of `tsc` and `tsgo`.
- `effect-tsgo patch --tsrs` now patches tsrs on install, so type checks still report Effect diagnostics.
