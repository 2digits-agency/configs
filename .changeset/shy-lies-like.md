---
'@2digits/eslint-plugin': minor
'@2digits/eslint-config': patch
---

Add `if-curly` rule to enforce curly braces around if statement bodies

- Added new `@2digits/if-curly` rule that requires curly braces on all if/else bodies
- Rule is auto-fixable and handles nested if statements and else-if chains
- Added to recommended config
- Removed `antfu/if-newline` from eslint-config (replaced by `if-curly`)
