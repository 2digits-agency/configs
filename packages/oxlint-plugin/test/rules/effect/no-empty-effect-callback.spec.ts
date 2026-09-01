import { noEmptyEffectCallback } from '../../../src/rules/effect/no-empty-effect-callback';
import { testRule } from '../../rule-tester';

testRule('no-empty-effect-callback', noEmptyEffectCallback, {
  valid: `
    import * as Fx from 'effect/Effect'
    const blocked = Fx.never
  `,
  invalid: `
    import * as Fx from 'effect/Effect'
    const blocked = Fx.callback(() => {})
  `,
  messageId: 'emptyCallback',
});
