---
'@2digits/eslint-config': patch
---

Update ESLint plugin dependencies with breaking changes

- Updated `eslint-plugin-sonarjs` to 4.0.0
  - Removed `sonar/code-eval` rule (dropped upstream)
- Updated `jsonc-eslint-parser` to 3.0.0
  - Fixed parser import to use namespace import for ESM compatibility
- Updated `@tanstack/eslint-plugin-router` to 1.161.2
- Updated `eslint-plugin-storybook` to 10.2.10
- Updated `eslint-plugin-turbo` to 2.8.10
- Disabled `no-useless-assignment` rule (conflicts with existing tooling)
