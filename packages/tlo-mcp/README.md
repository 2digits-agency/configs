# @2digits/tlo-mcp

One personal Teamleader Orbit gateway: local OAuth → authenticated HTTP MCP → OpenTunnel → Executor Cloud.
Only the Orbit tools listed in `src/mcp/tools.ts` are exposed. No local Executor, cookie adapter, Amp plugin, Vercel deployment or hosted OAuth bridge.

## Run

Requires Node.js 24+. Start the gateway with:

```bash
npx @2digits/tlo-mcp
```

Or install it globally (`npm i -g @2digits/tlo-mcp`) and run `tlo-mcp`.

The command:

1. Creates/reuses a private gateway API key.
2. Opens Orbit login if no local OAuth session exists (fresh client registration, state and PKCE).
3. Connects to Orbit with Effect's `McpClient` (MCP 2025-11-25), keeps only the allowlisted tools and starts `/mcp`
   on `127.0.0.1:4790`.
4. Connects an isolated `tlo-mcp` OpenTunnel profile with only the `tlo` route.
5. Prints a public HTTPS endpoint and a ready-to-paste agent prompt for Executor Cloud.

OpenTunnel runs inside this process using its Effect SDK. No separate tunnel CLI or daemon is installed.
Keep this process running and the computer awake. Ctrl-C closes the HTTP server and tunnel; identity and key persist
so subsequent starts reuse the URL. Use `--port 4791` if the default port is occupied.
The first tunnel certificate can take several minutes. Failed startup closes acquired resources.

## Run in the background

Any process supervisor works (launchd, systemd, pm2, Pitchfork, …). Keep these in mind:

- Run one instance per machine; it binds `127.0.0.1:4790` (or `--port`).
- Treat it as ready once `TLO gateway ready:` is logged, not when the port opens; the tunnel comes up later.
- The process exits when the tunnel drops for good, so restart it on failure.
- Send `SIGINT` to stop it cleanly.
- The first start needs the interactive Orbit login. Run it once in a terminal (or run `tlo-mcp login`) before handing it to a supervisor.
- The logs contain the public endpoint and the Executor prompt; the gateway key is never printed.

Example with [Pitchfork](https://pitchfork.jdx.dev), in `~/.config/pitchfork/config.toml`:

```toml
[daemons.tlo]
run = "npx -y @2digits/tlo-mcp --port 4790"
dir = "~/"
boot_start = true
retry = true
ready_output = { pattern = "TLO gateway ready:", timeout = "5m" }
health_port = { port = 4790, interval = "30s", retries = 3 }
stop_signal = { signal = "SIGINT", timeout = "10s" }
```

Run `pitchfork boot enable` so the supervisor starts at login. Boot-started supervisors get a minimal `PATH`, so use
absolute paths for `npx`/`node` if they are not found. Manage it with `pitchfork status global/tlo`,
`pitchfork logs global/tlo`, and `pitchfork restart global/tlo`.

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
  Only the allowlisted tools in `src/mcp/tools.ts` (timesheet, time entries, timers, tickets, todos and read-only
  planning/project lookups) are forwarded; other Orbit tools are hidden and cannot be called. Startup warns when Orbit
  no longer offers an allowlisted tool. Only tools are forwarded; resources/prompts/reverse requests are not exposed. No tool call is automatically replayed.
- To rotate the gateway key, stop the gateway, remove only `gateway.key`, restart, and update the Executor connection.

## Re-login and logout

```bash
npx @2digits/tlo-mcp login
npx @2digits/tlo-mcp logout
```

Stop the running gateway (and disable its supervisor) before either command. After login, start it again.
Leave it stopped after logout, or the next start opens the Orbit login again.
Logout removes local OAuth credentials, not the upstream grant,
gateway key or tunnel identity. An expired/rejected existing grant fails visibly; re-login explicitly rather than
silently registering replacement clients. OAuth credential locks fail closed; never remove a live process's lock.

## SDK compatibility patches

The workspace pins `@opentunnel/client` and `@opentunnel/protocol` 0.2.2 to Effect 4.0.1 with scoped overrides.
Versioned patches under `patches/` update old `effect/unstable/*` imports, use Node's standard WebSocket constructor,
handle WebSocket errors and replace TypeScript parameter properties with erasable fields.
The SDK/protocol are bundled into the CLI so published output does not depend on Node loading TypeScript dependencies.
Re-test these patches when upgrading OpenTunnel. The standalone SDK's original Bun requirement does not apply
to this patched Node CLI.

## Development

From this package in the repository:

```bash
vpr run    # build and start the gateway from source
vpr test
vpr types
vpr build
```
