import { noEmptySchemaStruct } from '../../../src/rules/effect/no-empty-schema-struct';
import { testRule } from '../../rule-tester';

testRule('no-empty-schema-struct', noEmptySchemaStruct, {
  valid: `
    import * as S from 'effect/Schema'
    S.Struct({ id: S.String })
  `,
  invalid: `
    import * as S from 'effect/Schema'
    S.Struct({})
  `,
  messageId: 'emptyStruct',
});
