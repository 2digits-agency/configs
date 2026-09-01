import { requireSchemaClassBrand } from '../../../src/rules/effect/require-schema-class-brand';
import { testRule } from '../../rule-tester';

testRule('require-schema-class-brand', requireSchemaClassBrand, {
  valid: `
    import * as S from 'effect/Schema'
    class Person extends S.Class<Person, { readonly brand: unique symbol }>('Person')({ name: S.String }) {}
  `,
  invalid: `
    import * as S from 'effect/Schema'
    class Person extends S.Class<Person>('Person')({ name: S.String }) {}
  `,
  messageId: 'missingBrand',
});
