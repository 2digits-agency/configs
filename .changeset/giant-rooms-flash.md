---
'@2digits/eslint-config': patch
---

Refactor plugin imports to use named exports

- Updated `eslint-plugin-de-morgan` to use named `configs` export
- Updated `eslint-plugin-github-action` to use named `configs` and `plugin` exports
- Simplified async promise chain in graphql config
- Fixed conditional promise in react config
