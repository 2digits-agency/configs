import { preferUninterruptible } from '../../../src/rules/effect/prefer-uninterruptible';
import { testRule } from '../../rule-tester';

testRule('prefer-uninterruptible', preferUninterruptible, {
  valid: `
    import * as Fx from 'effect/Effect'
    Fx.uninterruptibleMask((restore) => restore(program))
  `,
  invalid: `
    import * as Fx from 'effect/Effect'
    Fx.uninterruptibleMask(() => program)
  `,
  messageId: 'unusedRestore',
});
