---
packages:
  'npm:@2digits/config-monorepo': patch
---

## Parse wizard stages before prompting

- Wrapped stages in `run_wizard` so edits made during a run cannot alter later stages being parsed
