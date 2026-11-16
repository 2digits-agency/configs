---
packages:
  '@2digits/oxlint-plugin': minor
---

### Prefer Effect Number helpers

Added `prefer-effect-number` to `recommendedRules`. In files that import Effect, it rewrites hand-written arithmetic to `effect/Number` ([Effect-TS/tsgo#1046](https://github.com/Effect-TS/tsgo/issues/1046)):

- `Math.min(hi, Math.max(lo, x))` and `Math.max(lo, Math.min(hi, x))` → `Num.clamp(x, { minimum: lo, maximum: hi })`, autofixed. For `NaN`, `Num.clamp` returns `minimum` instead of `NaN`. When more than one operand has effects, the fix is a suggestion because it changes the evaluation order.
- `Math.round(x * 100) / 100`, also with `10 ** n` or `Math.pow(10, n)` as the factor → `Num.round(x, 2)`, autofixed.
- `xs.reduce((a, b) => a + b, 0)` and `Arr.reduce(xs, 0, Num.sum)` → `Num.sumAll(xs)`, autofixed. The product with `1` gets a `Num.multiplyAll` suggestion, because it returns 0 at the first 0, even when `NaN` follows.
