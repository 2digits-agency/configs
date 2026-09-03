import { preferYieldNow } from '../../../src/rules/effect/prefer-yield-now';
import { testRule } from '../../rule-tester';

testRule('prefer-yield-now', preferYieldNow, {
  valid: `
    import * as Fx from 'effect/Effect'
    const yielded = Fx.yieldNow
  `,
  invalid: `
    import * as Fx from 'effect/Effect'
    Fx.sleep('0 millis')
  `,
  messageId: 'zeroSleep',
});
