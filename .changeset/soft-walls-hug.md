---
'@2digits/eslint-plugin': patch
---

Improve `prefer-inline-array-callbacks` rule accuracy and performance

- Fixed shadowed builtin detection using scope analysis - rule now correctly reports when local variables shadow `Boolean`, `String`, etc.
- Added support for `sort` and `toSorted` methods with `(a, b)` parameter names
- Improved performance with array type caching and AST selector filtering
- Refactored type checking to use `esTreeNodeToTSNodeMap` directly
