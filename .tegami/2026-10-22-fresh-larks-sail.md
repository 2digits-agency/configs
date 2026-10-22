---
packages:
  'npm:@2digits/config-monorepo': patch
---

## Remove the repository-specific Pitchfork lint exception

- Removed the `toml/spaced-comment` override for `pitchfork.toml` from the root ESLint configuration
