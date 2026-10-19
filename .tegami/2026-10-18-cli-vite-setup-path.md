---
packages:
  'npm:@2digits/cli': patch
---

## Use relative setupFiles path in vite config

- Changed `setupFiles` from an absolute `path.join(__dirname, ...)` to a relative `./test/vitest.setup.ts`
