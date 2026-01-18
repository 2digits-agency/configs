---
'@2digits/cli': patch
'@2digits/constants': patch
'@2digits/eslint-config': patch
'@2digits/eslint-plugin': patch
'@2digits/prettier-config': patch
'@2digits/renovate-config': patch
---

Migrate type checking from tsc to tsgo

- Replaced `tsc --noEmit` with `tsgo --noEmit` in all package `types` scripts
- Added `@typescript/native-preview` to devDependencies for tsgo binary
