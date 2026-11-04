---
packages:
  'npm:@2digits/tsconfig': patch
---

## Enable the `matchToResultOrOption` Effect diagnostic

The Effect config now reports `matchToResultOrOption` as an error. It flags `Effect.match` handlers, or a map step followed by a catch step, that only turn the outcome into a value, where `Effect.result`, `Effect.option` or `Effect.either` says the same thing directly.
