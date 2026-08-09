---
packages:
  'npm:@2digits/config-monorepo': patch
---

## Keep Effect warnings out of the `tsc` exit code

- Set `ignoreEffectWarningsInTscExitCode` in `tsconfig.base.json`
- The patched `tsc` reports Effect diagnostics, and warning-severity rules such as `nodeBuiltinImport` were failing `types` despite being configured as warnings
