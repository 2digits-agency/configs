---
packages:
  'npm:@2digits/tlo-mcp': patch
---

## Use Effect string helpers in the Orbit client and OAuth store

- Replaced native string calls with `effect/String` helpers when checking the `text/event-stream` content type, quoting security values, trimming session output and writing the lock file
- The content-type check now treats a missing header as an empty string
