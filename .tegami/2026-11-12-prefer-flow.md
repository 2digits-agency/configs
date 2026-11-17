---
packages:
  '@2digits/oxlint-plugin': minor
---

### Prefer `Fn.flow` for pipeline callbacks

Added `prefer-flow` to `recommendedRules`. It reports callbacks of Effect APIs that only run their one parameter through two or more functions, written as `pipe(x, f, g)`, `x.pipe(f, g)`, `f(x).pipe(g)` or `g(f(x))`, such as `Effect.map((created) => Arr.head(created).pipe(Opt.map(Struct.get('id')), Opt.getOrElse(() => 0)))`. Write `Effect.map(Fn.flow(Arr.head, Opt.map(Struct.get('id')), Opt.getOrElse(() => 0)))` instead.

APIs whose callbacks receive more than one argument, such as `Arr.map` and `Effect.forEach`, are exempt, like in `no-forwarding-lambda`. The fix is automatic when building the pipeline once gives the same functions as building it on every call; otherwise, such as for `Arr.take(config.limit)` or an annotated callback, it is a suggestion.

### Exempt every Effect API with a multi-argument callback

`no-forwarding-lambda` and `prefer-flow` now take the APIs whose callbacks receive more than one argument from the `effect` types instead of a hand-made list. This adds APIs such as `Effect.callback`, `Effect.catchReasons`, `Effect.fn`, `Effect.withSpan` and the `Order` and `Equivalence` combinators. `Graph.floydWarshall` and `Optic.fromChecks` are reported again, because their callbacks receive one argument.
