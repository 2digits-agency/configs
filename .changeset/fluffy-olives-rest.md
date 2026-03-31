---
'@2digits/oxlint-config': minor
---

Expand unicorn lint rules

- Added 80+ new unicorn plugin rules for comprehensive code quality enforcement
- Includes rules for: array methods (no-array-for-each, no-array-reduce, prefer-array-flat), best practices (consistent-assert, prefer-modern-dom-apis, prefer-node-protocol), and code style (consistent-function-scoping, prefer-ternary)
- Updated prefer-ternary configuration to only-single-line for better readability
- Disabled checkArguments and checkArrowFunctionBody in no-useless-undefined rule
- Set checkAllIndexAccess: false in prefer-at rule for practical array indexing patterns
