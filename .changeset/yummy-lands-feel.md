---
'@2digits/eslint-plugin': minor
---

Enhance ESLint plugin rules with autofixes and dependency cleanup

- Added autofix to `prefer-inline-handlers` that inlines handler and removes declaration
- Added `useCallback`/`useMemo` detection to skip memoized handlers
- Added suggestions to `type-param-names` with automatic rename fixes
- Replaced `ts-pattern` and `magic-regexp` dependencies with native regex
- Simplified `createRule` utility using `ESLintUtils.RuleCreator`
