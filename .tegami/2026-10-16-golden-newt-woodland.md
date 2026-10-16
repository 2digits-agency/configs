---
packages:
  'npm:@2digits/config-monorepo': patch
---

## Preserve wizard environment values safely

- Quoted and escaped saved values, and decoded supported quoted values when reusing them on later runs
- Created new environment files with mode `0600` and preserved existing file permissions and symlinks
- Updated the corresponding shell variable after saving its value
