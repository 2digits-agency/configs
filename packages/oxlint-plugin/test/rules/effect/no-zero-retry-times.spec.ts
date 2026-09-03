import { noZeroRetryTimes } from '../../../src/rules/effect/no-zero-retry-times';
import { testRule } from '../../rule-tester';

testRule('no-zero-retry-times', noZeroRetryTimes, {
  valid: `
    import * as Fx from 'effect/Effect'
    Fx.retry(program, { times: 2 })
  `,
  invalid: `
    import * as Fx from 'effect/Effect'
    Fx.retry(program, { times: 0 })
  `,
  messageId: 'zeroTimes',
});
