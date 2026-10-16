---
packages:
  'npm:@2digits/tsconfig': major
---

## Require `Effect.tap` for side effects that preserve the original value

- Enabled `flatMapToTap` as an error in `effect.json`, requiring flagged `Effect.flatMap` calls to use `Effect.tap`
