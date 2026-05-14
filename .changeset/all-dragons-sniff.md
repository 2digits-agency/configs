---
'@2digits/eslint-config': minor
---

Update @eslint-react/eslint-plugin to 5.7.8 and add @eslint-react/kit for custom rules

- Added upstream rules: `react-extra/globals`, `react-extra/jsx-no-leaked-dollar`, `react-extra/static-components`, `react-extra/web-api-no-leaked-fetch`
- Re-added dropped rules as custom implementations using `@eslint-react/kit`: `no-unnecessary-use-callback`, `no-unnecessary-use-memo`, `prefer-destructuring-assignment`, `prefer-namespace-import`
- Removed rules dropped upstream without replacement: `component-hook-factories`, `no-redundant-should-component-update`, `dom-no-string-style-prop`, `dom-no-unknown-property`
- Updated generated types with new and changed rule descriptions
