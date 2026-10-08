---
packages:
  '@2digits/tlo-mcp': major
---

### One-command personal Orbit gateway

Running `tlo-mcp` now sets up local Orbit login, an API-key-protected HTTP MCP endpoint and an OpenTunnel connection,
then prints a credential-free prompt for connecting Executor Cloud. Requires Node.js 24+.

The stdio server, library exports, Amp plugin and Vercel adapter have been removed. Existing clients must connect
to the printed HTTPS endpoint using the separate gateway API key; Orbit OAuth credentials remain local.
