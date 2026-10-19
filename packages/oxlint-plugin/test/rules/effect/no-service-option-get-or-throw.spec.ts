import { testRule } from '../../rule-tester';

testRule('no-service-option-get-or-throw', {
  valid: [
    `
    import * as Fx from 'effect/Effect'
    import * as Option from 'effect/Option'
    Fx.serviceOption(Logger).pipe(Fx.map(Option.getOrElse(() => fallback)))
  `,
  ],
  invalid: [
    {
      code: `
    import * as Fx from 'effect/Effect'
    import * as Option from 'effect/Option'
    Fx.gen(function* () {
      const logger = Option.getOrThrow(yield* Fx.serviceOption(Logger))
      return logger
    })
  `,
      errors: [{ messageId: 'getOrThrow' }],
    },
  ],
});
