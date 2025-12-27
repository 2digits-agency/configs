---
'@2digits/eslint-plugin': minor
'@2digits/eslint-config': minor
---

Add `prefer-inline-array-callbacks` rule

- Added new ESLint rule that disallows passing function references to array methods (map, filter, reduce, etc.)
- Rule auto-fixes by wrapping callbacks: `arr.map(fn)` → `arr.map((element) => fn(element))`
- Prevents bugs from extra arguments (index, array) being passed unexpectedly
- Allows `Boolean`, `String`, `Number` etc. as callbacks where safe
- Disabled `unicorn/no-array-callback-reference` in favor of new rule with better auto-fix support
- Removed lint-disable comments from CLI services
