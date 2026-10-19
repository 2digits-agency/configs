import { testRule } from '../../rule-tester';

testRule('dual-numeric-arity-with-optional-parameter', {
  valid: [
    `
    import * as Fn from 'effect/Function'
    Fn.dual((args) => args.length === 2, (self: string, suffix?: string) => self + suffix)
  `,
  ],
  invalid: [
    {
      code: `
    import * as Fn from 'effect/Function'
    Fn.dual(2, (self: string, suffix = '') => self + suffix)
  `,
      errors: [{ messageId: 'unsafeArity' }],
    },
  ],
});
