import { dualNumericArityWithOptionalParameter } from '../../../src/rules/effect/dual-numeric-arity-with-optional-parameter';
import { testRule } from '../../rule-tester';

testRule('dual-numeric-arity-with-optional-parameter', dualNumericArityWithOptionalParameter, {
  valid: `
    import * as Fn from 'effect/Function'
    Fn.dual((args) => args.length === 2, (self: string, suffix?: string) => self + suffix)
  `,
  invalid: `
    import * as Fn from 'effect/Function'
    Fn.dual(2, (self: string, suffix = '') => self + suffix)
  `,
  messageId: 'unsafeArity',
});
