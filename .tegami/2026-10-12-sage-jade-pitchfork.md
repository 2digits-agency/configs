---
packages:
  'npm:@2digits/config-monorepo': patch
---

## Stop auto-starting the TLO gateway on mise enter

- Removed `pitchfork` from `mise.toml` tools and the `enter` hook
