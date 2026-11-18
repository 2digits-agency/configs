---
packages:
  '@2digits/oxlint-plugin': minor
---

### Prefer tagged error handlers over `Predicate.isTagged`

Added `prefer-tagged-error-handling` to `recommendedRules`. It reports `Predicate.isTagged(error, 'A')` and `Predicate.isTagged('A')(error)` inside a broad Effect catch handler (`Effect.catch`, `Effect.catchIf` or `Effect.catchAll`): use `Effect.catchTag`/`Effect.catchTags`, or `Effect.catchReason`/`Effect.catchReasons` when the check is on the error's `reason`. It complements `no-manual-effect-error-tag`, which reports `_tag` comparisons in the same handlers.
