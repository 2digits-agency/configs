import { testRule } from '../../rule-tester';

testRule('no-zero-retry-times', {
  valid: [
    `
    import * as Fx from 'effect/Effect'
    Fx.retry(program, { times: 2 })
  `,
  ],
  invalid: [
    {
      code: `
    import * as Fx from 'effect/Effect'
    Fx.retry(program, { times: 0 })
  `,
      errors: [{ messageId: 'zeroTimes' }],
    },
  ],
});
