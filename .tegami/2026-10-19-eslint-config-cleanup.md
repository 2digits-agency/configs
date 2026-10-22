---
packages:
  'npm:@2digits/eslint-config': patch
---

### Enable pnpm rules only in pnpm workspaces

The pnpm config is now auto-enabled only when a `pnpm-workspace.yaml` is found. Before, any project with a `package.json` enabled it, and ESLint then crashed on `package.json` with `pnpm-workspace.yaml not found`.

### Honor `ts.tsconfigRootDir`

The TypeScript parser now uses the documented `ts.tsconfigRootDir` option instead of always using `process.cwd()`.

### Keep the React import in the `prefer-namespace-import` fix

The autofix now rewrites `import React from 'react'` to `import * as React from 'react'`. Before, it deleted the import or dropped the default specifier, which broke every `React.*` reference.

### Allow memoized computations in `no-unnecessary-use-memo`

`useMemo` with empty deps is no longer reported when its factory calls a function or uses `new`, such as `useMemo(() => new Map(), [])`. Each component instance keeps its own result, so hoisting it out of the component would change behavior.
