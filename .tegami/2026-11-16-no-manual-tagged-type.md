---
packages:
  '@2digits/oxlint-plugin': minor
---

### Report hand-written tagged types

Added `no-manual-tagged-type` to `recommendedRules`, adapted from [anti-slop](https://github.com/K-Mistele/anti-slop/blob/main/src/effect/rules/no-manual-tagged-type.ts). It reports a `_tag` written by hand in a type, such as `type Ready = { readonly _tag: 'Ready' }`: define the value with a tagged Schema or Data constructor and infer its type, such as `typeof Ready.Type`. Only literal tags are reported, so `{ readonly _tag: string }` constraints stay allowed, and declaration files and `declare` blocks are skipped.
