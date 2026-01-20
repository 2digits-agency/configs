---
'@2digits/eslint-plugin': patch
---

Fix `RuleOptions` type to exclude undefined default options

- Wrapped `defaultOptions` accessor with `Exclude<..., undefined>` to ensure proper type inference
