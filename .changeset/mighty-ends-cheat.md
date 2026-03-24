---
'@2digits/eslint-config': patch
'@2digits/eslint-plugin': patch
---

Update ESLint plugins and fix storybook config

- Updated `typescript-eslint` to 8.57.2
- Updated `eslint-plugin-storybook` to 10.3.3; removed now-unnecessary `react-hooks/rules-of-hooks` and `react/display-name` disables from storybook config
- Updated `@tanstack/eslint-plugin-query` to 5.95.2
- Updated `eslint-config-flat-gitignore` to 2.3.0
- Refactored `TypedFlatConfigItem` to extend `FlatConfig.Config` instead of `Linter.Config`, removing unused `Linter` import and adding explicit typed `rules` field
