import { testRule } from '../../rule-tester';

testRule('prefer-yield-now', {
  valid: [
    `
    import * as Fx from 'effect/Effect'
    const yielded = Fx.yieldNow
  `,
    // String-literal import names resolve like identifiers.
    `import { 'Duration' as Fx } from 'effect'; Fx.sleep('0 millis');`,
  ],
  invalid: [
    {
      code: `
    import * as Fx from 'effect/Effect'
    Fx.sleep('0 millis')
  `,
      errors: [{ messageId: 'zeroSleep' }],
    },
    { code: `import { 'Effect' as Fx } from 'effect'; Fx.sleep('0 millis');`, errors: [{ messageId: 'zeroSleep' }] },
  ],
});
