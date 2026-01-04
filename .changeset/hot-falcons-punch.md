---
'@2digits/eslint-plugin': minor
'@2digits/eslint-config': patch
---

Add type-aware `@2digits/no-null` rule to replace `unicorn/no-null`

- Added `no-null` rule that allows `null` when external TypeScript types require it (types with `null` but not `undefined`)
- Enhanced auto-fixes: `let x = null` → `let x`, `return null` → `return`, loose equality auto-fixes `== null` → `== undefined`
- Provides suggestions (not auto-fix) for strict equality (`===`/`!==`) comparisons
- Allows common patterns: `Object.create(null)`, `useRef(null)`, `insertBefore(x, null)`
- Disabled `unicorn/no-null` in favor of the new type-aware rule
