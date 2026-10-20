import { testRule } from '../../rule-tester';

testRule('no-already-started-promise', {
  valid: [
    `
    import * as Fx from 'effect/Effect'
    Fx.tryPromise(() => fetch('/users'))
  `,
  ],
  invalid: [
    {
      code: `
    import * as Fx from 'effect/Effect'
    const request = fetch('/users')
    Fx.tryPromise(() => request)
  `,
      errors: [{ messageId: 'prestarted' }],
    },
  ],
});
