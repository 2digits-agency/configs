import { testRule } from '../../rule-tester';

testRule('ban-error-string', {
  valid: [`function wrap(error: unknown) { return new Error('Request failed', { cause: error }) }`],
  invalid: [{ code: `function wrap(error: unknown) { return String(error) }`, errors: [{ messageId: 'errorString' }] }],
});
