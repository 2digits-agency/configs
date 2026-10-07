# @2digits/tlo-mcp

Local MCP proxy for Teamleader Orbit. OAuth runs locally; your MCP client only needs stdio.

## Installation

```bash
vp add @2digits/tlo-mcp
```

## Usage

### Login once

```bash
vp exec tlo-mcp login
```

Login opens your browser and listens on an ephemeral `127.0.0.1` callback. Each login uses fresh state and PKCE S256.
The proxy registers its own OAuth client; never reuse an existing authorization URL or another application's client ID.

### Start the MCP server

```bash
vp exec tlo-mcp
```

Configure your MCP client to run `tlo-mcp` without arguments, or `node /absolute/path/to/dist/bin.mjs`.
No OAuth configuration, cookies or tokens belong in the client's config.

- Tools, descriptions, input/output schemas and annotations are discovered from the official MCP, including all pages.
- Access tokens refresh before expiry; rotated refresh tokens are saved before use.
- Official server instructions, tool content, structured results and `isError` are preserved.
- JSON and SSE responses are supported. Tool calls are never automatically replayed after failures or rate limits.
- Only tools are proxied; resources, prompts, sampling and upstream notification subscriptions are not currently forwarded.
- Tool discovery runs at startup; restart the proxy to discover changes upstream.
- Orbit's own availability and account permissions still apply.

### Credentials and logout

macOS stores credentials in Keychain under `@2digits/tlo-mcp/orbit`; Keychain errors never fall back to plaintext.
Other platforms use `~/.config/2digits/tlo-mcp/session.json` with file mode `0600` and directory mode `0700`.
Windows ACL hardening is not provided; restrict access to your user profile.
Tokens never appear in process arguments or normal stdout. MCP diagnostics go to stderr.

```bash
vp exec tlo-mcp logout
```

Logout deletes local credentials; it does not revoke the upstream grant (Orbit advertises no revocation endpoint).
Concurrent refresh/login is protected by a local lock. After a crashed process, confirm it is no longer running before
removing `~/.config/2digits/tlo-mcp/session.lock`. Do not remove a live process's lock.

## Migrate from the cookie adapter

The cookie adapter, `legacy` command and hand-written tools have been removed, including their exported services,
schemas and layers. Only the official Orbit tools are available; discover their names and schemas through your MCP client.

Remove `legacy` from your command arguments and remove `TLO_SESSION_TOKEN`, `TLO_COOKIES` and `TLO_BASE_URL` from your
configuration. Run `tlo-mcp login`, then start `tlo-mcp` without arguments. Update workflows to use official Orbit tool
names and input schemas instead of the old snake_case tool names.

## License

MIT
