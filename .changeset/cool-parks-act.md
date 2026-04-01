---
'@2digits/oxlint-config': minor
---

Enhance TypeScript linting rules

- Change `consistent-type-assertions` from `angle-bracket` to `as` style
- Add `interface` option to `consistent-type-definitions`
- Add `fixMixedExportsWithInlineTypeSpecifier` option to `consistent-type-exports`
- Add `prefer`, `disallowTypeAnnotations` options to `consistent-type-imports`
- Add `fixToUnknown` and `ignoreRestArgs` options to `no-explicit-any`
- Add `allowSingleExtends` option to `no-empty-interface`
- Add `allowStaticOnly` option to `no-extraneous-class`
- Add `ignoreArrowShorthand` option to `no-confusing-void-expression`
- Add new rules: `no-confusing-non-null-assertion`, `no-dynamic-delete`, `no-extra-non-null-assertion`, `no-inferrable-types`, `no-invalid-void-type`, `no-misused-promises`, `no-mixed-enums`, `no-namespace`, `no-non-null-asserted-nullish-coalescing`, `no-unnecessary-boolean-literal-compare`, `no-unnecessary-qualifier`, `no-unnecessary-template-expression`, `no-unnecessary-type-arguments`, `no-unnecessary-type-assertion`, `no-unnecessary-type-constraint`, `no-unnecessary-type-conversion`, `no-unnecessary-type-parameters`, `no-unsafe-argument`
