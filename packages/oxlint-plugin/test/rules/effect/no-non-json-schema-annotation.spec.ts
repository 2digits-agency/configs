import { noNonJsonSchemaAnnotation } from '../../../src/rules/effect/no-non-json-schema-annotation';
import { testRule } from '../../rule-tester';

testRule('no-non-json-schema-annotation', noNonJsonSchemaAnnotation, {
  valid: `
    import * as S from 'effect/Schema'
    S.Number.annotate({ examples: [1], default: 0 })
  `,
  invalid: `
    import * as S from 'effect/Schema'
    S.BigInt.annotate({ examples: [1n] })
  `,
  messageId: 'nonJson',
});
