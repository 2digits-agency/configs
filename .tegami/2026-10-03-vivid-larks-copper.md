---
packages:
  'npm:@2digits/eslint-config': patch
---

## Update `@eslint-react/eslint-plugin` and `@eslint-react/kit` from 5.20.5 to 5.23.5

- React checks now catch more props/state rebinding, destructured mutations, aliased impure calls, and render-time ref exposure. `static-components` also follows logical and sequence expressions, so existing code may receive new errors.
- Directly returning `useState()` from custom hooks is now allowed. Ref-derived state updates and effect cleanup helpers receive fewer false positives; leaked resources are matched by scope rather than variable name.
- React 19.3 DOM properties are recognized. Async Server Components without a `use client` directive are exempt from purity checks; impure `useRef` initializers remain checked.
