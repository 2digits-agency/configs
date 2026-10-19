import { testRule } from '../../rule-tester';

testRule('no-logging-in-catch', {
  valid: [
    `
    import * as Fx from 'effect/Effect'
    program.pipe(Fx.tapError(Fx.logError), Fx.catchAll(() => Fx.succeed(null)))
  `,
  ],
  invalid: [
    {
      code: `
    import * as Fx from 'effect/Effect'
    program.pipe(Fx.catchAll((error) => Fx.logError(error)))
  `,
      errors: [{ messageId: 'logging' }],
    },
  ],
});
