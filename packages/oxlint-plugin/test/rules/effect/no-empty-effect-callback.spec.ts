import { testRule } from '../../rule-tester';

testRule('no-empty-effect-callback', {
  valid: [
    `
    import * as Fx from 'effect/Effect'
    const blocked = Fx.never
  `,
  ],
  invalid: [
    {
      code: `
    import * as Fx from 'effect/Effect'
    const blocked = Fx.callback(() => {})
  `,
      errors: [{ messageId: 'emptyCallback' }],
      output: `
    import * as Fx from 'effect/Effect'
    const blocked = Fx.never
  `,
    },
  ],
});
