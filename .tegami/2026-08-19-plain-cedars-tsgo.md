---
packages:
  'npm:@2digits/config-monorepo': patch
---

## Stop patching Oxlint with `effect-tsgo`

- The workspace `prepare` script now runs `effect-tsgo patch --typescript` only.
