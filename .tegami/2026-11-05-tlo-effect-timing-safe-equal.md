---
packages:
  '@2digits/tlo-mcp': patch
---

### Compare gateway keys and OAuth state with Effect's `Mac.timingSafeEqual`

The gateway's bearer-key check and the OAuth callback's `state` check now use `Mac.timingSafeEqual` from `effect/crypto` instead of `node:crypto`. Behavior is unchanged: a mismatched or differently sized value is still rejected.
