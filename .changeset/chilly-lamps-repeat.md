---
'@2digits/eslint-plugin': patch
---

Refactor `if-curly` rule to use `RegExp.exec()` instead of `String.match()`

- Changed `line.match(/^(*)/)` to `/^(\s*)/.exec(line)` for consistency
