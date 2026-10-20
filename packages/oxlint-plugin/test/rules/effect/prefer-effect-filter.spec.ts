import { testRule } from '../../rule-tester';

testRule('prefer-effect-filter', {
  valid: [
    `
    import * as Filter from 'effect/Filter'
    const positive = Filter.fromPredicate((value: number) => value > 0)
  `,
  ],
  invalid: [
    {
      code: `
    import * as Result from 'effect/Result'
    const positive = (value: number) => value > 0 ? Result.succeed(value) : Result.fail(value)
  `,
      errors: [{ messageId: 'effectFilter' }],
    },
  ],
});
