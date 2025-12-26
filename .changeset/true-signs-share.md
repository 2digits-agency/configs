---
'@2digits/eslint-plugin': minor
---

Add `prefer-inline-handlers` rule

- Added new rule that discourages hoisting event handlers only used once in JSX
- Rule reports on arrow functions, function expressions, and function declarations inside components
- Correctly ignores handlers used multiple times, module-level functions, and non-JSX usage
- Added to recommended config as `error`
