---
'@2digits/tlo-mcp': minor
---

Refactor architecture and enable @effect/language-service build-time diagnostics

- Extracted `TloConfig` and `TloHttpClient` into dedicated service modules
- Added `TloConfigLive` layer with `TloConfigFromEnv` for configuration
- Converted all imports to namespace style (`import * as Effect from 'effect/Effect'`)
- Added `Effect.fn` span names to all service and handler methods for tracing
- Enabled deterministic key patterns for service tags (e.g., `@2digits/tlo-mcp/services/BoardService`)
- Added `prepare` script to patch TypeScript for build-time Effect diagnostics
- Simplified `TloErrorSchema` to use tagged error classes directly
- Removed `@typescript/native-preview` dependency
