import { throwInEffectGen } from '../../../src/rules/effect/throw-in-effect-gen';
import { testRule } from '../../rule-tester';

testRule('throw-in-effect-gen', throwInEffectGen, {
  valid: `
    import * as Fx from 'effect/Effect'
    Fx.gen(function* () { yield* Fx.fail(new Error()) })
  `,
  invalid: `
    import * as Fx from 'effect/Effect'
    Fx.gen(function* () { throw new Error() })
  `,
  messageId: 'throwInGen',
});
