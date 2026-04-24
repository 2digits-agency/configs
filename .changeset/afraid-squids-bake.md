---
'@2digits/opencode-plugin': minor
---

Refactor plugin to PostHog LLM analytics integration

- Replaced rules-based feedback system with PostHog LLM trace and generation capture
- Added `capture.ts`, `config.ts`, `state.ts`, `types.ts`, and `utilities.ts` for analytics pipeline
- Removed `/fix` command, `create_feedback_issue` tool, and markdown rule injection
- Removed `dedent` dependency and added `posthog-node` for analytics ingestion
- Added test coverage for capture, config, state, and utilities modules
- Updated `@opencode-ai/plugin` to 1.14.22
