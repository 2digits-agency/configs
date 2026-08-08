---
packages:
  'npm:@2digits/eslint-config': patch
---

## Update eslint-plugin-n to 18.3.0

- Enabled the new `node/prefer-global/timers`, `node/prefer-import/assert-strict` and `node/prefer-process-get-builtin-module` rules in the Node config
- Regenerated the rule types, which now cover `import.meta` paths in `node/no-path-concat`
