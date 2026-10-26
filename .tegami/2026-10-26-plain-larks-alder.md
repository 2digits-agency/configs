---
packages:
  'npm:@2digits/oxlint-plugin': minor
---

### Add `no-effect-as-on-log`

Reports `Effect.as`, `Effect.asSome` and `Effect.asVoid` on `Effect.log*` and `Console.*` log effects, such as
`Effect.logInfo('ignored').pipe(Effect.as(false))`. Use `Effect.gen` to `yield*` the log and return the value instead.
The rule is part of `recommendedRules`.
