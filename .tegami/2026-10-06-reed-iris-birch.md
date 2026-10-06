---
packages:
  'npm:@2digits/tlo-mcp': minor
---

## Expose official Orbit tools over local stdio

- Added paginated tool discovery and JSON/SSE response handling, preserving upstream schemas, annotations, instructions and results.
- Scoped HTTP requests to release resources on interruption and timeout, without automatically replaying tool calls.
