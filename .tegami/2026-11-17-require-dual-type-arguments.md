---
packages:
  '@2digits/oxlint-plugin': minor
---

### Require type arguments on `Function.dual`

Added `require-dual-type-arguments` to `recommendedRules`. It reports every `Function.dual` call without type arguments, including `dual` imported from `effect/Function` and calls that pass an existing function, such as `Fn.dual(2, BigDecimal.divideUnsafe)`. Without type arguments, TypeScript does not check the implementation against an overload annotation on the constant: inline parameters become `any`, and the data-last form returns `any`. Pass both signatures instead:

```ts
export const clientOf = Fn.dual<
  (project: ProjectRef) => (clients: ReadonlyArray<Client>) => ClientRef,
  (clients: ReadonlyArray<Client>, project: ProjectRef) => ClientRef
>(2, (clients, project) => …);
```
