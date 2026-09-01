import { noThrowInEffectCallback } from '../../../src/rules/effect/no-throw-in-effect-callback';
import { testRule } from '../../rule-tester';

testRule('no-throw-in-effect-callback', noThrowInEffectCallback, {
  valid: `
    import * as Fx from 'effect/Effect'
    program.pipe(Fx.flatMap((value) => value < 0 ? Fx.fail(new Error()) : Fx.succeed(value)))
  `,
  invalid: `
    import * as Fx from 'effect/Effect'
    program.pipe(Fx.map((value) => { if (value < 0) throw new Error(); return value }))
  `,
  messageId: 'callbackThrow',
});
