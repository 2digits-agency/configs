import { RuleTester } from 'oxlint/plugins-dev';

import { preferYieldNow } from '../../../src/rules/effect/prefer-yield-now';
import { testRule } from '../../rule-tester';

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: 'ts' }, sourceType: 'module' } });

testRule('prefer-yield-now', preferYieldNow, {
  valid: `
    import * as Fx from 'effect/Effect'
    const yielded = Fx.yieldNow
  `,
  invalid: `
    import * as Fx from 'effect/Effect'
    Fx.sleep('0 millis')
  `,
  messageId: 'zeroSleep',
});

tester.run('prefer-yield-now string-literal import names', preferYieldNow, {
  valid: [`import { 'Duration' as Fx } from 'effect'; Fx.sleep('0 millis');`],
  invalid: [
    {
      code: `import { 'Effect' as Fx } from 'effect'; Fx.sleep('0 millis');`,
      errors: [{ messageId: 'zeroSleep' }],
    },
  ],
});
