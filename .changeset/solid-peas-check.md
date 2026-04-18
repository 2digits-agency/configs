---
'@2digits/eslint-config': patch
---

Update ESLint plugins

- Updated `eslint-plugin-zod` to 3.6.0
  - Added `zod/no-transform-in-record-key` rule to prevent transforms in z.record() key schemas
  - Added `zod/consistent-import` rule to enforce namespace-style imports
- Updated `eslint-plugin-sonarjs` to 4.0.3
  - Added `sonar/dompurify-unsafe-config` rule for DOMPurify configuration security
  - Updated rule documentation with clearer descriptions
  - Updated `sonar/cognitive-complexity` schema options
