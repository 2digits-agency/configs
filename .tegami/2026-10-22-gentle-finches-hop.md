---
packages:
  'npm:@2digits/config-monorepo': patch
  'npm:@2digits/oxlint-config': patch
  'npm:@2digits/oxlint-plugin': patch
  'npm:@2digits/tlo-mcp': patch
---

## Correct development commands to run repository scripts

- Updated development instructions to use `vpr` so checks, builds and fixes run the intended package scripts instead of Vite+ built-in tasks
