---
packages:
  'npm:@2digits/oxlint-config': minor
---

### Enable `eslint-plugin-de-morgan`

The preset now loads `eslint-plugin-de-morgan` as the `boolean` JS plugin, matching the ESLint config, and reports
negated conjunctions and disjunctions such as `!(a && b)` with `boolean/no-negated-conjunction` and
`boolean/no-negated-disjunction`.
