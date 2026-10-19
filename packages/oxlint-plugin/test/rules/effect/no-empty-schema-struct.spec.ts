import { testRule } from '../../rule-tester';

testRule('no-empty-schema-struct', {
  valid: [
    `
    import * as S from 'effect/Schema'
    S.Struct({ id: S.String })
  `,
  ],
  invalid: [
    {
      code: `
    import * as S from 'effect/Schema'
    S.Struct({})
  `,
      errors: [{ messageId: 'emptyStruct' }],
    },
  ],
});
