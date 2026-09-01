import { avoidDataTaggedError } from '../../../src/rules/effect/avoid-data-tagged-error';
import { testRule } from '../../rule-tester';

testRule('avoid-data-tagged-error', avoidDataTaggedError, {
  valid: `
    import * as Schema from 'effect/Schema'
    class ApiError extends Schema.TaggedErrorClass<ApiError>()('ApiError', {}) {}
  `,
  invalid: `
    import { TaggedError as Tagged } from 'effect/Data'
    class ApiError extends Tagged('ApiError')<{}> {}
  `,
  messageId: 'taggedError',
});
