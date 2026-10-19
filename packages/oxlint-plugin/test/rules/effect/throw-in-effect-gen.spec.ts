import { testRule } from '../../rule-tester';

testRule('throw-in-effect-gen', {
  valid: [
    `
    import * as Fx from 'effect/Effect'
    Fx.gen(function* () { yield* Fx.fail(new Error()) })
  `,
  ],
  invalid: [
    {
      code: `
    import * as Fx from 'effect/Effect'
    Fx.gen(function* () { throw new Error() })
  `,
      errors: [{ messageId: 'throwInGen' }],
    },
  ],
});
