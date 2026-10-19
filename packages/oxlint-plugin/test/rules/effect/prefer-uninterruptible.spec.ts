import { testRule } from '../../rule-tester';

testRule('prefer-uninterruptible', {
  valid: [
    `
    import * as Fx from 'effect/Effect'
    Fx.uninterruptibleMask((restore) => restore(program))
  `,
  ],
  invalid: [
    {
      code: `
    import * as Fx from 'effect/Effect'
    Fx.uninterruptibleMask(() => program)
  `,
      errors: [{ messageId: 'unusedRestore' }],
    },
  ],
});
