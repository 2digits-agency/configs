---
packages:
  'npm:@2digits/tsconfig': minor
---

### Ship a `fixing-type-errors` agent skill

- The package now publishes `skills/fixing-type-errors`, which pnpm 12.11+ links into a project's agent skill directories as `pnpm-@2digits+tsconfig-fixing-type-errors` after you approve the package with `pnpm approve`.
- The skill lists the errors agents keep hitting under this preset, with the error code, the message and the fix that keeps types sound. It covers `noUncheckedIndexedAccess`, `verbatimModuleSyntax`, `erasableSyntaxOnly`, `.ts` import extensions, unused locals and parameters, implicit returns, switch fallthrough and `override`.
- A second reference file covers the Effect diagnostics that `effect.json` turns into errors, such as Schema brands, namespace imports, the `Arr`/`Str`/`R` helpers, Node built-ins and JSON codecs.
