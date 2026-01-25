---
'@2digits/eslint-config': patch
---

Suppress tsdown inlineOnly warning

- Added `inlineOnly: false` to tsdown config to acknowledge intentional bundling of `eslint-plugin-react-hooks` and its transitive dependencies
