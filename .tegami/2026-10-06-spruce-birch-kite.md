---
packages:
  'npm:@2digits/tlo-mcp': patch
---

## Honor explicit CLI arguments

- Routed arguments passed to `run` through `Command.runWith` instead of ignoring them.
