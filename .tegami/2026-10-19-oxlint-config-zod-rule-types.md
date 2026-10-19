---
packages:
  'npm:@2digits/oxlint-config': patch
---

### Type every `eslint-plugin-zod` rule

The rule types now match `eslint-plugin-zod` 5.2: `zod/no-dynamic-schema-value`, `zod/no-function-scoped-schema`, `zod/prefer-map-set-size-over-min-max`, `zod/prefer-nullish`, `zod/prefer-string-length-over-min-max` and `zod/prefer-validate` are declared, the removed `zod/no-string-schema-with-uuid` is gone, `zod/consistent-import` accepts `syntax: 'default'`, and `zod/prefer-top-level-string-formats` accepts its `ignore` option.
