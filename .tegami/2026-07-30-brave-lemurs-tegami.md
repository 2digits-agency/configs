---
packages:
  'npm:@2digits/config-monorepo': patch
---

## Make the Tegami script importable

- Resolved `cwd` from the script location so it works regardless of the invoking directory
- Guarded `runCli()` behind `import.meta.main` and enabled `createTags` and `release`
