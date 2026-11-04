---
packages:
  'npm:@2digits/tlo-mcp': patch
---

## Store the gateway key and session in the platform config directory

`tlo-mcp` now resolves its directory with Effect's `UserDirectories`: `~/Library/Application Support/2digits/tlo-mcp` on macOS, and `$XDG_CONFIG_HOME/2digits/tlo-mcp` or `~/.config/2digits/tlo-mcp` elsewhere.

A gateway key or Orbit session that an earlier version stored in `~/.config/2digits/tlo-mcp` keeps being used from there, so upgrading needs no new key and no new login. Startup prints the key path in use, with the matching `pbcopy` command on macOS. On macOS, Orbit credentials stay in the Keychain.
