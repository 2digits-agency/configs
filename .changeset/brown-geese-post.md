---
'@2digits/eslint-config': patch
---

Update ESLint plugins

- Update `@eslint-react/eslint-plugin` to 4.2.3
  - Added `react-extra/jsx-no-leaked-dollar` rule to catch `$` before `{expr}` in JSX
  - Added `react-extra/jsx-no-leaked-semicolon` rule to catch `;` at the start of JSX text nodes
- Update `eslint-plugin-storybook` to 10.3.4
- Update `eslint-plugin-zod` to 3.5.1
