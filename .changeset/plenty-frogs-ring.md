---
'@2digits/eslint-config': patch
---

Update @eslint-react/eslint-plugin to 4.2.1

- Consolidated plugin namespaces: `react-dom`, `react-web-api`, `react-naming-convention`, and `react-rsc` rules now use the `react-extra` prefix
- Updated rule names: `react-extra/no-useless-fragment` renamed to `react-extra/jsx-no-useless-fragment`
- Removed rules: `react-extra/jsx-shorthand-boolean`, `react-extra/jsx-shorthand-fragment` (dropped upstream)
- Updated generated types with new rule definitions
