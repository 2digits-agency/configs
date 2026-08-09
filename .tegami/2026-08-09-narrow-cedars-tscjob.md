---
packages:
  'npm:@2digits/config-monorepo': patch
---

## Typecheck with the patched `tsc` instead of `tsgo`

- Replaced `tsgo --noEmit` with `tsc --noEmit` in every package `types` script, and removed the `@typescript/native-preview` devDependency and catalog entry that supplied the `tsgo` binary
- `@2digits/eslint-config` and `@2digits/eslint-plugin` call the root binary, so they typecheck on TypeScript 7 despite depending on TypeScript 6 for `typescript-eslint`
- Switched `dts: { tsgo: true }` to `dts: true` in the package build configs, which already emitted through the `typescript` package
- Unlike the unpatched `tsgo`, `tsc` is patched by `effect-tsgo` and therefore reports Effect diagnostics during typechecking
