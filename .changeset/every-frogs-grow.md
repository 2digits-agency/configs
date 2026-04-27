---
'@2digits/opencode-plugin': patch
---

Fix PostHog LLM trace capture

- Sent `$ai_trace` snapshots immediately when assistant generations complete
- Added trace input, output, and cost properties for PostHog trace summaries
- Avoided duplicate trace snapshots when trace state has not changed
