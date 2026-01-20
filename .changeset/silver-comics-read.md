---
'@2digits/cli': patch
'@2digits/constants': patch
'@2digits/eslint-config': patch
'@2digits/eslint-plugin': patch
'@2digits/prettier-config': patch
'@2digits/tlo-mcp': patch
---

Enable tsgo for declaration file generation

- Updated tsdown configs to use `dts: { tsgo: true }` for faster .d.ts generation
