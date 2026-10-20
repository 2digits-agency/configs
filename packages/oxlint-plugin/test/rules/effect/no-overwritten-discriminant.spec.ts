import { testRule } from '../../rule-tester';

testRule('no-overwritten-discriminant', {
  valid: [`const value = { ...input, _tag: 'Ready' }`],
  invalid: [{ code: `const value = { _tag: 'Ready', ...input }`, errors: [{ messageId: 'overwritten' }] }],
});
