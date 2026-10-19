import { testRule } from '../../rule-tester';

testRule('no-async-effect-try', {
  valid: [
    `
    import * as Fx from 'effect/Effect'
    Fx.try(() => JSON.parse('{}'))
  `,
  ],
  invalid: [
    {
      code: `
    import * as Fx from 'effect/Effect'
    Fx.try(async () => fetch('/users'))
  `,
      errors: [{ messageId: 'asyncTry' }],
    },
  ],
});
