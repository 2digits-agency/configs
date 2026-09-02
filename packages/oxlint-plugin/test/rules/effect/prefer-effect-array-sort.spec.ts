import { preferEffectArraySort } from '../../../src/rules/effect/prefer-effect-array-sort';
import { testRule } from '../../rule-tester';

testRule('prefer-effect-array-sort', preferEffectArraySort, {
  valid: `
    import * as Arr from 'effect/Array'
    import * as Order from 'effect/Order'
    const sorted = Arr.sort([3, 1, 2], Order.Number)
  `,
  invalid: `
    import * as Effect from 'effect/Effect'
    const sorted = [3, 1, 2].sort((a, b) => a - b)
  `,
  messageId: 'effectArraySort',
});
