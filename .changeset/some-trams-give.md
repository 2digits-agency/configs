---
'@2digits/renovate-config': patch
---

Expand PostHog package grouping to include scoped packages

- Updated PostHog group matcher to include `/^@posthog//` pattern
- Now groups both `posthog-*` and `@posthog/*` packages together
