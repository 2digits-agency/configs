---
packages:
  'npm:@2digits/config-monorepo': patch
---

## Fix wizard terminal and browser fallbacks

- Added a terminal-clearing fallback when `tput clear` fails
- Restored the manual URL warning when no browser-opening command is available
