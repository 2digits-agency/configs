import { noMultiShotEffectCallback } from '../../../src/rules/effect/no-multi-shot-effect-callback';
import { testRule } from '../../rule-tester';

testRule('no-multi-shot-effect-callback', noMultiShotEffectCallback, {
  valid: `
    import * as Fx from 'effect/Effect'
    Fx.callback((resume) => target.addEventListener('ready', resume, { once: true }))
  `,
  invalid: `
    import * as Fx from 'effect/Effect'
    Fx.callback((resume) => emitter.on('data', resume))
  `,
  messageId: 'multiShot',
});
