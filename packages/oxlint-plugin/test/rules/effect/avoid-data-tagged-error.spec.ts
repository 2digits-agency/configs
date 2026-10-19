import { testRule } from '../../rule-tester';

testRule('avoid-data-tagged-error', {
  valid: [
    `
    import * as Schema from 'effect/Schema'
    class ApiError extends Schema.TaggedErrorClass<ApiError>()('ApiError', {}) {}
  `,
  ],
  invalid: [
    {
      code: `
    import { TaggedError as Tagged } from 'effect/Data'
    class ApiError extends Tagged('ApiError')<{}> {}
  `,
      errors: [{ messageId: 'taggedError' }],
    },
  ],
});
