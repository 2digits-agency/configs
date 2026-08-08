---
packages:
  'npm:@2digits/oxlint-config': minor
---

## Adopt previously unconfigured oxlint rules

- Enabled `oxc/bad-match-all-arg`, `no-promise-executor-return` and `vitest/valid-title` with `ignoreTypeOfDescribeName`
- Enabled the newly available unicorn rules `empty-brace-spaces`, `explicit-timer-delay`, `import-style`, `no-array-fill-with-reference-type`, `no-confusing-array-with`, `prefer-export-from` and `prefer-single-call`
- Explicitly disabled the type-aware rules that stay off: `consistent-return`, `no-unsafe-type-assertion`, `prefer-readonly-parameter-types` and `strict-void-return`
- Turned off `no-shadow`, which is covered by the TypeScript-aware equivalent
