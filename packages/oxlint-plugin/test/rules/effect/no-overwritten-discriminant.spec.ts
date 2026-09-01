import { noOverwrittenDiscriminant } from '../../../src/rules/effect/no-overwritten-discriminant';
import { testRule } from '../../rule-tester';

testRule('no-overwritten-discriminant', noOverwrittenDiscriminant, {
  valid: `const value = { ...input, _tag: 'Ready' }`,
  invalid: `const value = { _tag: 'Ready', ...input }`,
  messageId: 'overwritten',
});
