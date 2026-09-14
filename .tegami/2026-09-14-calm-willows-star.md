---
packages:
  'npm:@2digits/constants': patch
  'npm:@2digits/opencode-plugin': patch
  'npm:@2digits/oxfmt-config': patch
  'npm:@2digits/oxlint-config': patch
  'npm:@2digits/oxlint-plugin': patch
  'npm:@2digits/prettier-config': patch
  'npm:@2digits/tlo-mcp': patch
---

## Configure declaration generation with the current Vite+ API

- Replaced `dts.tsgo` with `dts.generator: 'tsgo'` in package builds.
