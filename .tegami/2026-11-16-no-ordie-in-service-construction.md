---
packages:
  '@2digits/oxlint-plugin': minor
---

### Keep service construction failures typed

Added `no-ordie-in-service-construction` to `recommendedRules`, ported from the [`K-Mistele/anti-slop`](https://github.com/K-Mistele/anti-slop) fork. It reports `Effect.orDie` while a service is built, in the `make` option or a static `make`/`layer*` member of a `Context.Service` class or in the arguments of `Layer.effect`, `Layer.effectContext`, `Layer.effectDiscard` and `Layer.unwrap` or a pipeline into one, and `Layer.orDie` anywhere, including named imports such as `import { orDie } from 'effect/Layer'`. Let construction failures flow through the layer's error channel as `Schema.TaggedError`s instead of turning them into defects. Operations of the built service, `Effect.fn` definitions and test files are exempt.
