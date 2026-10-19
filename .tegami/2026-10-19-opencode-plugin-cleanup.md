---
packages:
  'npm:@2digits/opencode-plugin': patch
---

### Fix redaction, error messages and session cleanup

- Objects referenced more than once in tool input or output are no longer replaced with `[Circular]`; only real cycles are.
- String errors are reported as-is instead of wrapped in JSON quotes.
- Text parts of user messages are now released when a session's trace is flushed, instead of being kept for the life of the process.

### Share helpers across capture, state and config

- Trace, generation and tool span events share one builder for the common `$ai_*` and custom properties, and one privacy-aware attribute serializer.
- Custom properties JSON is parsed once instead of twice, and the session window is computed once per plugin instead of on every message.
