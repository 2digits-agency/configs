---
packages:
  '@2digits/oxlint-plugin': minor
---

### Report collection-building loops and repeated switches

Added three code-smell rules adapted from the Martin Fowler rules in [`K-Mistele/anti-slop`](https://github.com/K-Mistele/anti-slop/tree/main/src/martinfowler/rules):

- `no-accumulating-loop` (opt-in) reports a `for`, `for…of` or `for…in` loop that is the only builder of an empty array, object, `Map` or `Set` declared before it, such as `const ids = []; for (const x of xs) ids.push(x.id)`. Use `map`, `filter`, `flatMap`, `groupBy`, `Object.fromEntries`, `new Map(…)` or `Effect.forEach`. Searches with an early exit, awaiting loops, loops that read what they build, and loops that change other outer state are not reported. Enable it with `'2digits/no-accumulating-loop': 'warn'`.
- `no-repeated-switch` reports a value that one file branches on over the same cases in several places, with `switch`, `else if` chains, ternary chains or runs of guard `if`s.
- `no-mutable-module-state` reports top-level `let` and `var` bindings that functions reassign. It is opt-in.

Only `no-repeated-switch` is in `recommendedRules`, at `warn`. `@2digits/oxlint-config` sets `denyWarnings`, so its reports fail `oxlint` until they are fixed or the rule is disabled.
