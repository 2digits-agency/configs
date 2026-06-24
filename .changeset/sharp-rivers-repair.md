---
'@2digits/eslint-config': patch
'@2digits/eslint-plugin': patch
---

Update ESLint core and plugins

- Updated `eslint` to 10.5.0 and TypeScript ESLint packages to 8.62.0
- Updated React, TanStack, GitHub Action, JSDoc, SonarJS, Storybook, Turbo, Unicorn, YAML, and globals dependencies
- Removed React rules dropped with `@eslint-react/kit` and updated generated rule types and snapshots
- Disabled `unicorn/no-for-each` in markdown code blocks and added `jiti` for ESLint 10 TypeScript config loading
