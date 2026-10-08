# @2digits/tlo-mcp

One personal Teamleader Orbit gateway: local OAuth → authenticated HTTP MCP → OpenTunnel → Executor Cloud.
Only Orbit tools are exposed. No local Executor, cookie adapter, Amp plugin, Vercel deployment or hosted OAuth bridge.

## Run

Requires Node.js 24+. From this package:

```bash
vp run run
```

Or, after installation/build:

```bash
vp exec tlo-mcp
```

The command:

1. Creates/reuses a private gateway API key.
2. Opens Orbit login if no local OAuth session exists (fresh client registration, state and PKCE).
3. Discovers the official Orbit tools and starts `/mcp` on `127.0.0.1:4790`.
4. Connects an isolated `tlo-mcp` OpenTunnel profile with only the `tlo` route.
5. Prints a public HTTPS endpoint and a ready-to-paste agent prompt for Executor Cloud.

OpenTunnel runs inside this process using its Effect SDK. No separate tunnel CLI or daemon is installed.
Keep this process running and the computer awake. Ctrl-C closes the HTTP server and tunnel; identity and key persist
so subsequent starts reuse the URL. Use `--port 4791` if the default port is occupied.
The first tunnel certificate can take several minutes. Failed startup closes acquired resources.

## Connect Executor Cloud

Paste the printed prompt into an agent with Executor tools. It registers a Streamable HTTP MCP integration with
API-key auth: `Authorization: Bearer <gateway-key>`. **Do not configure Orbit OAuth in Executor.**

The key is stored at `~/.config/2digits/tlo-mcp/gateway.key` (mode `0600`, directory `0700`).
On macOS, copy it without printing it:

```bash
pbcopy < ~/.config/2digits/tlo-mcp/gateway.key
```

Enter it directly in Executor's secure credential form, never in agent chat. On other platforms, open the private
file locally and copy it into that form. The agent prompt contains no credentials. Executor must use its secure
handoff for the API key and verify one read-only tool after connecting.

## Authentication and security

- Orbit credentials remain in macOS Keychain (`@2digits/tlo-mcp/orbit`). Other platforms use a private local session file.
- OAuth access tokens refresh before expiry; rotated refresh tokens are persisted before use.
- The gateway key is separate from Orbit credentials. All HTTP routes/methods require it before MCP parsing.
- Browser requests with an `Origin` header are rejected; non-browser MCP clients are supported.
- Request bodies are limited to 1 MiB; responses are not cached; request logging is disabled.
- OpenTunnel terminates TLS on this computer; its relay forwards encrypted traffic, not HTTP plaintext.
- The hostname is public/discoverable; route names are not authentication. Anyone possessing the gateway key
  can use your Orbit tools with your permissions, including writes. Executor policies do not protect against a leaked key.
- Tools, schemas, annotations, instructions, structured content, errors and rate limits come from official Orbit.
  Only tools are forwarded; resources/prompts/reverse requests are not exposed. No tool call is automatically replayed.
- To rotate the gateway key, stop the gateway, remove only `gateway.key`, restart, and update the Executor connection.

## Re-login and logout

```bash
vp exec tlo-mcp login
vp exec tlo-mcp logout
```

Stop the running gateway before either command. Logout removes local OAuth credentials, not the upstream grant,
gateway key or tunnel identity. An expired/rejected existing grant fails visibly; re-login explicitly rather than
silently registering replacement clients. OAuth credential locks fail closed; never remove a live process's lock.

## SDK compatibility patches

The workspace pins `@opentunnel/client` and `@opentunnel/protocol` 0.2.2 to Effect 4.0.1 with scoped overrides.
Versioned patches under `patches/` update old `effect/unstable/*` imports, use Node's standard WebSocket constructor,
handle WebSocket errors and replace TypeScript parameter properties with erasable fields.
The SDK/protocol are bundled into the CLI so published output does not depend on Node loading TypeScript dependencies.
Re-test these patches when upgrading OpenTunnel. The standalone SDK's original Bun requirement does not apply
to this patched Node CLI.

```bash
vp test
vp run types
vp run build
```
