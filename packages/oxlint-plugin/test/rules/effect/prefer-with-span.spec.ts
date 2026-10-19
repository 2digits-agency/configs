import { testRule } from '../../rule-tester';

testRule('prefer-with-span', {
  valid: [
    `
    import * as Fx from 'effect/Effect'
    Fx.useSpan('request', (span) => addAttributes(span))
  `,
  ],
  invalid: [
    {
      code: `
    import * as Fx from 'effect/Effect'
    Fx.useSpan('request', () => program)
  `,
      errors: [{ messageId: 'unusedSpan' }],
    },
  ],
});
