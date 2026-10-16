---
packages:
  'npm:@2digits/tsconfig': major
---

## Require `Effect.yieldNow` instead of zero-duration sleeps

- Enabled `effectSleepZeroToYieldNow` as an error in `effect.json`; flagged `Effect.sleep(0)` calls now need `Effect.yieldNow`
