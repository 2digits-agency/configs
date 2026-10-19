import { testRule } from '../../rule-tester';

testRule('no-non-json-schema-annotation', {
  valid: [
    `
    import * as S from 'effect/Schema'
    S.Number.annotate({ examples: [1], default: 0 })
  `,
  ],
  invalid: [
    {
      code: `
    import * as S from 'effect/Schema'
    S.BigInt.annotate({ examples: [1n] })
  `,
      errors: [{ messageId: 'nonJson' }],
    },
  ],
});
