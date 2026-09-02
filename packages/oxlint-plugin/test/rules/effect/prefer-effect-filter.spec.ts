import { preferEffectFilter } from '../../../src/rules/effect/prefer-effect-filter';
import { testRule } from '../../rule-tester';

testRule('prefer-effect-filter', preferEffectFilter, {
  valid: `
    import * as Filter from 'effect/Filter'
    const positive = Filter.fromPredicate((value: number) => value > 0)
  `,
  invalid: `
    import * as Result from 'effect/Result'
    const positive = (value: number) => value > 0 ? Result.succeed(value) : Result.fail(value)
  `,
  messageId: 'effectFilter',
});
