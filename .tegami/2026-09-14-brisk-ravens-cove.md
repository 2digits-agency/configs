---
packages:
  'npm:@2digits/cli': patch
---

## Stop generating declarations for the private CLI executable

- Removed the declaration entry point and type-package validation from the executable-only build.
