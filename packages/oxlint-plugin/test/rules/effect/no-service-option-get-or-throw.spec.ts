import { noServiceOptionGetOrThrow } from '../../../src/rules/effect/no-service-option-get-or-throw';
import { testRule } from '../../rule-tester';

testRule('no-service-option-get-or-throw', noServiceOptionGetOrThrow, {
  valid: `
    import * as Fx from 'effect/Effect'
    import * as Option from 'effect/Option'
    Fx.serviceOption(Logger).pipe(Fx.map(Option.getOrElse(() => fallback)))
  `,
  invalid: `
    import * as Fx from 'effect/Effect'
    import * as Option from 'effect/Option'
    Fx.gen(function* () {
      const logger = Option.getOrThrow(yield* Fx.serviceOption(Logger))
      return logger
    })
  `,
  messageId: 'getOrThrow',
});
