---
packages:
  'npm:@2digits/oxlint-config': patch
  'npm:@2digits/oxlint-plugin': patch
---

### Fix three misleading lint results

- The default `2digits/padding-line-between-statements` options no longer require a blank line between grouped `case` clauses. `--fix` used to split `case 'a':` from `case 'b':`, which then failed `no-fallthrough`.
- `2digits/avoid-data-tagged-error` now recommends `Schema.TaggedError`; Effect 4 does not export `Schema.TaggedErrorClass`.
- `2digits/no-effect-alchemy-barrel-imports` no longer treats SCREAMING_SNAKE values such as `ALCHEMY_DEV` as modules, so it stops suggesting and autofixing to the nonexistent `alchemy/ALCHEMY_DEV`.
