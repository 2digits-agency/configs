---
packages:
  '@2digits/tlo-mcp': patch
---

### Wait out Orbit rate limits while the gateway starts

When Orbit answers the startup handshake or tool discovery (`initialize`, `notifications/initialized`, `tools/list`) with HTTP 429, the gateway now waits for its `Retry-After` and sends the request again, instead of exiting. Orbit can limit a session to one MCP request per minute, so startup can take a few minutes; it is bounded by 10 minutes per phase. Tool calls are still never replayed.
