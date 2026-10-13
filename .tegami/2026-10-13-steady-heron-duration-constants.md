---
packages:
  'npm:@2digits/oxlint-plugin': minor
  'npm:@2digits/oxlint-config': minor
---

## Add `prefer-effect-duration-constants`

- Reported `const` numbers that hold a duration, such as `TIMEOUT_MS = 30_000`, `ONE_DAY = 24 * 60 * 60 * 1000`, or any numeric constant passed to an Effect duration API, and suggested the matching `Duration` constructor
- Enabled the rule by default in `recommendedRules` and the 2digits Oxlint config, in files that import Effect
- Extended `prefer-effect-duration` to number arithmetic and more Effect v4 APIs: `Schedule.exponential`, `Schedule.during`, `Stream.debounce`, `Stream.timeout`, `TestClock.adjust`, `Effect.cachedWithTTL`, and the `duration` option of `Effect.timeoutOrElse` and `Stream.throttle`
