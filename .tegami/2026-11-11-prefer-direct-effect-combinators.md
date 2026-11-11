---
packages:
  '@2digits/oxlint-plugin': minor
---

### Prefer direct Effect combinators

Added `prefer-direct-effect-combinators` to `recommendedRules`. In files that import Effect, it reports Option, Array, Result and Filter chains that one API expresses directly, in nested data-first calls and in `.pipe(...)`, `pipe(...)` and `flow(...)`, whatever the file's import aliases:

- Option: `Opt.filter(Opt.some(x), p)` → `Opt.liftPredicate(x, p)`, `Opt.isSome(Opt.filter(o, p))` → `Opt.exists(o, p)`, `Opt.flatMap(o, (x) => Opt.fromNullishOr(f(x)))` → `Opt.flatMapNullishOr`, `Opt.flatten(Opt.map(o, f))` → `Opt.flatMap(o, f)`, `Opt.getOrElse(Opt.map(o, f), () => d)` → `Opt.match`, and `Opt.getOrElse(o, () => null)` → `Opt.getOrNull(o)`.
- Array: `Opt.isSome(Arr.findFirst(xs, p))` → `Arr.some(xs, p)`, `Arr.head(Arr.filter(xs, p))` → `Arr.findFirst(xs, p)`, `Arr.flatten(Arr.map(xs, f))` → `Arr.flatMap(xs, f)`, `Arr.filter(Opt.isSome)` then `Arr.map((o) => o.value)` → `Arr.getSomes`, and `Arr.length(Arr.filter(xs, p))` → `Arr.countBy(xs, p)`.
- Result: `Result.getOrElse(Result.map(r, f), g)` → `Result.match`, `Result.map` with `Result.mapError` → `Result.mapBoth`, and `Opt.isSome(Result.getSuccess(r))` → `Result.isSuccess(r)`.
- Filter: `(x) => Result.isSuccess(f(x))` → `Filter.toPredicate(f)` and `(x) => Result.getSuccess(f(x))` → `Filter.toOption(f)`.

Rewrites that keep the behavior are autofixed. `Arr.filter` followed by `Arr.head` or an emptiness check is a suggestion, because the direct API stops at the first match, and `Arr.findFirst` → `Arr.some` is a suggestion unless the callback visibly returns a boolean. The README lists every pattern.
