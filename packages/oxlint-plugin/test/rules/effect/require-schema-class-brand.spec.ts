import { testRule } from '../../rule-tester';

testRule('require-schema-class-brand', {
  valid: [
    `
    import * as S from 'effect/Schema'
    class Person extends S.Class<Person, { readonly brand: unique symbol }>('Person')({ name: S.String }) {}
  `,
  ],
  invalid: [
    {
      code: `
    import * as S from 'effect/Schema'
    class Person extends S.Class<Person>('Person')({ name: S.String }) {}
  `,
      errors: [{ messageId: 'missingBrand' }],
    },
  ],
});
