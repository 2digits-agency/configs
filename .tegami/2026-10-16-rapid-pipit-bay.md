---
packages:
  'npm:@2digits/config-monorepo': patch
---

## Fix wizard prompt editing and end-of-input handling

- Added Readline editing to visible prompts with cursor-safe color codes
- Made visible and secret prompts fail on empty end-of-input instead of silently continuing
