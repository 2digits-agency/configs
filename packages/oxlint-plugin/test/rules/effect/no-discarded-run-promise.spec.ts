import { testRule } from '../../rule-tester';

testRule('no-discarded-run-promise', {
  valid: [
    `
    import * as Fx from 'effect/Effect'
    await Fx.runPromise(program)
  `,
  ],
  invalid: [
    {
      code: `
    import * as Fx from 'effect/Effect'
    Fx.runPromise(program)
  `,
      errors: [{ messageId: 'discarded' }],
    },
  ],
});
