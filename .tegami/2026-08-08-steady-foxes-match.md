---
packages:
  'npm:@2digits/cli': patch
---

## Build Turborepo task config with Match

- Replaced the `switch` in `generateTaskConfig` with an `effect/Match` matcher, removing the implicit fallthrough between the `test`, `lint` and `typecheck` branches
