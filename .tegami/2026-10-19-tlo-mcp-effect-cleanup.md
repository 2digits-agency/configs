---
packages:
  'npm:@2digits/tlo-mcp': patch
---

### Tidy Effect usage in the gateway, Orbit client and OAuth store

- Shared the Orbit 401/403 handler, the browser command options and the callback query-parameter check instead of copying them.
- Hoisted gateway and OAuth callback responses, the request body limit and the text encoder so they are no longer rebuilt per request.
- The credential lock now maps file-system errors with `catchTag` instead of a hand-written error guard.
