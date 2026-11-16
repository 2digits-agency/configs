---
packages:
  '@2digits/eslint-config': minor
  '@2digits/oxlint-config': minor
---

### Ban `Reflect.apply` and `Reflect.get`

`no-restricted-properties` now reports `Reflect.apply` and `Reflect.get`. Call the function directly, and read properties with typed access or after decoding dynamic input into a domain type. `unicorn/prefer-reflect-apply` is turned off, because it recommends `Reflect.apply`.
