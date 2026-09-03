---
packages:
  'npm:@2digits/config-monorepo': patch
  'npm:@2digits/cli': patch
  'npm:@2digits/renovate-config': patch
---

## Run TypeScript scripts with oxnode

- Replaced `tsx` with `@oxc-node/cli` (`oxnode`) for the `@2digits/cli` bin script, the renovate config build script, and the root `tegami` script
- Removed `tsx` from the catalog
