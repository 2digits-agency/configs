---
'@2digits/opencode-plugin': patch
---

Switch build tooling from bunup to vp pack

- Replaced `bunup` with `vp pack` for builds
- Removed Bun-specific dev dependencies (`@types/bun`, `bunup`)
- Added `pack` configuration to `vite.config.ts` with export metadata generation
- Updated dist output paths to use `.mjs` and `.d.mts` extensions
