---
packages:
  'npm:@2digits/config-monorepo': patch
---

## Share the Effect language service settings from `tsconfig.base.json`

- Added a root `tsconfig.base.json` holding the `@effect/language-service` plugin options, previously duplicated across the root, `@2digits/cli` and `@2digits/tlo-mcp` configs
- Reduced those three `tsconfig.json` files to `extends` plus their own `include`/`exclude`, and dropped the now unused `@2digits/tsconfig` devDependency from both packages
- Registered `$TURBO_ROOT$/tsconfig.base.json` as an input of the `types` task, verified by re-hashing every `types` task against an inert edit
