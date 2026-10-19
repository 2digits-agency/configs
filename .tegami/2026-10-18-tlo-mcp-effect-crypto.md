---
packages:
  'npm:@2digits/tlo-mcp': patch
---

## Use effect Crypto in gateway authentication

- Replaced Node `crypto` hashing with `effect/Crypto` and `effect/encoding/Hex` in gateway key loading and authentication
