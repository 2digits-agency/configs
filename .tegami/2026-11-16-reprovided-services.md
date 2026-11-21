---
packages:
  '@2digits/oxlint-plugin': minor
---

### Report Effect services that are provided back to the code that yielded them

Added two rules from the [`K-Mistele/anti-slop`](https://github.com/K-Mistele/anti-slop) fork of anti-slop to `recommendedRules`:

- `no-reprovide-ambient-service` reports `Effect.provideService(Tag, service)` when `service` came from `yield* Tag` or `yield* Effect.service(Tag)` in the same function, where the effect already requires `Tag`. The data-first and curried `provideService` forms are covered. Providing a captured service to an effect that runs later, such as a service method built in `Layer.effect` or an `Effect.fn` pipeline step, is not reported, because that keeps requirements out of service interfaces.
- `prefer-yield-service` reports `const services = yield* Effect.context()` when `services` is passed to `Effect.provide`, `Effect.provideContext`, `Layer.provide` or `Layer.succeedContext`. `yield*` each service the operation uses instead.
