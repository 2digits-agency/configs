import { banErrorString } from '../../../src/rules/effect/ban-error-string';
import { testRule } from '../../rule-tester';

testRule('ban-error-string', banErrorString, {
  valid: `function wrap(error: unknown) { return new Error('Request failed', { cause: error }) }`,
  invalid: `function wrap(error: unknown) { return String(error) }`,
  messageId: 'errorString',
});
