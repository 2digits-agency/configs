---
packages:
  'npm:@2digits/opencode-plugin': patch
---

## Update `posthog-node` to 5.55.0

Update the analytics dependency from 5.52.5 to 5.55.0. Upstream changes add feature flag runtime and evaluation metadata, fix holdout evaluation and cached flag payload compatibility, and allow disabling automatic flag polling. The plugin continues using the existing event capture APIs.
