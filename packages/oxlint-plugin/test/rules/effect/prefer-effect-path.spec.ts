import { testRule } from '../../rule-tester';

testRule('prefer-effect-path', {
  valid: [
    `
    import * as Effect from 'effect/Effect'
    import * as Path from 'effect/Path'
  `,
  ],
  invalid: [
    {
      code: `
    import path from 'node:path'
    import * as Effect from 'effect/Effect'
  `,
      errors: [{ messageId: 'effectPath' }],
    },
  ],
});
