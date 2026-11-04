---
packages:
  'npm:@2digits/tlo-mcp': patch
---

## Store the gateway key and session lock in the platform config directory

`tlo-mcp` now resolves its directory with Effect's `UserDirectories`: `~/Library/Application Support/2digits/tlo-mcp` on macOS, and `$XDG_CONFIG_HOME/2digits/tlo-mcp` or `~/.config/2digits/tlo-mcp` elsewhere.

An existing gateway key at `~/.config/2digits/tlo-mcp/gateway.key` keeps being used, so your Executor connection keeps working without a new key. Startup prints the key path in use. On macOS, Orbit credentials stay in the Keychain.
