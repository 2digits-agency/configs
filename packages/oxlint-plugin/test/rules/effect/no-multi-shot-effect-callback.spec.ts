import { testRule } from '../../rule-tester';

testRule('no-multi-shot-effect-callback', {
  valid: [
    `
    import * as Fx from 'effect/Effect'
    Fx.callback((resume) => target.addEventListener('ready', resume, { once: true }))
  `,
  ],
  invalid: [
    {
      code: `
    import * as Fx from 'effect/Effect'
    Fx.callback((resume) => emitter.on('data', resume))
  `,
      errors: [{ messageId: 'multiShot' }],
    },
  ],
});
