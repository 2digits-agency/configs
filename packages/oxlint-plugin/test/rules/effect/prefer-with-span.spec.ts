import { preferWithSpan } from '../../../src/rules/effect/prefer-with-span';
import { testRule } from '../../rule-tester';

testRule('prefer-with-span', preferWithSpan, {
  valid: `
    import * as Fx from 'effect/Effect'
    Fx.useSpan('request', (span) => addAttributes(span))
  `,
  invalid: `
    import * as Fx from 'effect/Effect'
    Fx.useSpan('request', () => program)
  `,
  messageId: 'unusedSpan',
});
