---
packages:
  'npm:@2digits/eslint-plugin': patch
---

### Fix autofixes in `prefer-inline-array-callbacks` and `prefer-inline-handlers`

- `prefer-inline-array-callbacks` now wraps `as` / `satisfies` / `<T>` callbacks in parentheses, so `arr.map(fn as Mapper)` is fixed to `(element) => (fn as Mapper)(element)` instead of invalid code.
- `prefer-inline-handlers` now reports function handlers that have a parameter with the same name as the function.
- Removed dead checks and per-node caches that never hit from the rule internals.
