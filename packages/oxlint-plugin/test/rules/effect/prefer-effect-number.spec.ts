/* eslint-disable unicorn/no-null -- RuleTester requires null to assert that no fix or suggestion is offered. */
import { preferEffectNumber } from '../../../src/rules/effect/prefer-effect-number';
import { testRule } from '../../rule-tester';

const ruleName = 'prefer-effect-number';

const header = `
  import * as Arr from 'effect/Array'
  import * as Num from 'effect/Number'
  declare const value: number
  declare const values: Array<number>
`;

const valid = `${header}
  const smaller = Math.min(value, 10)
  const three = Math.min(10, Math.max(0, value), 20)
  const twice = Math.min(10, Math.min(0, value))
  const empty = Math.max(10, Math.min(0, value))
  function shadowed(Math: { min: typeof globalThis.Math.min; max: typeof globalThis.Math.max }) {
    return Math.min(10, Math.max(0, value))
  }
  const otherScale = Math.round(value * 100) / 10
  const thirds = Math.round(value * 3) / 3
  const floored = Math.floor(value * 100) / 100
  const wrongStart = values.reduce((a, b) => a + b, 1)
  const negativeZero = values.reduce((a, b) => a + b, -0)
  const noStart = values.reduce((a, b) => a + b)
  const difference = values.reduce((a, b) => a - b, 0)
  const doubled = values.reduce((a, b) => a + a, 0)
  const optional = values?.reduce((a, b) => a + b, 0)
  const withIndex = values.reduce((a, b, index) => a + b, 0)
  const clamped = Num.clamp(value, { minimum: 0, maximum: 10 })
  function local(Arr: { reduce: (xs: Array<number>, start: number, f: (a: number, b: number) => number) => string }) {
    return Arr.reduce(values, 0, (a, b) => a + b)
  }
  function localNum(Num: { sum: (a: number, b: number) => number }) {
    return values.reduce(Num.sum, 0)
  }
`;

// Rewrites that keep the behavior get a fix.
for (const [invalid, messageId, output] of [
  ['Math.min(10, Math.max(0, value))', 'clamp', 'Num.clamp(value, { minimum: 0, maximum: 10 })'],
  ['Math.max(0, Math.min(value, 10))', 'clamp', 'Num.clamp(value, { minimum: 0, maximum: 10 })'],
  ['Math.min(Math.max(-1, value), 1)', 'clamp', 'Num.clamp(value, { minimum: -1, maximum: 1 })'],
  ['Math.min(Math.max(value, lower), upper)', 'clamp', 'Num.clamp(value, { minimum: lower, maximum: upper })'],
  ['Math.min(hi, Math.max(lo, value))', 'clamp', 'Num.clamp(value, { minimum: lo, maximum: hi })'],
  ['Math.min(10, Math.max(0, next()))', 'clamp', 'Num.clamp(next(), { minimum: 0, maximum: 10 })'],
  ['Math.max(0, Math.min(value, hi))', 'clamp', 'Num.clamp(value, { minimum: 0, maximum: hi })'],
  ['Math.max(lo, Math.min(hi, value))', 'clamp', 'Num.clamp(value, { minimum: lo, maximum: hi })'],
  ['Math.round(value * 100) / 100', 'round', 'Num.round(value, 2)'],
  ['Math.round(1e3 * value) / 1000', 'round', 'Num.round(value, 3)'],
  ['Math.round(value * 10 ** digits) / 10 ** digits', 'round', 'Num.round(value, digits)'],
  ['Math.round(next() * Math.pow(10, 2)) / Math.pow(10, 2)', 'round', 'Num.round(next(), 2)'],
  ['values.reduce((a, b) => a + b, 0)', 'sumAll', 'Num.sumAll(values)'],
  ['values.reduce((total, n) => { return n + total }, 0)', 'sumAll', 'Num.sumAll(values)'],
  ['values.reduce(Num.sum, 0)', 'sumAll', 'Num.sumAll(values)'],
  ['Arr.reduce(values, 0, (a, b) => a + b)', 'sumAll', 'Num.sumAll(values)'],
  ['values.pipe(Arr.reduce(0, Num.sum))', 'sumAll', 'values.pipe(Num.sumAll)'],
] as const) {
  testRule(ruleName, preferEffectNumber, {
    valid,
    invalid: `${header}${invalid}`,
    messageId,
    output: `${header}${output}`,
  });
}

// The fix would evaluate two operands with effects in another order, or change a product of 0 and NaN.
for (const [invalid, messageId, api, suggestion] of [
  ['Math.min(limit(), Math.max(0, value))', 'clamp', 'clamp', 'Num.clamp(value, { minimum: 0, maximum: limit() })'],
  ['values.reduce((a, b) => a * b, 1)', 'multiplyAll', 'multiplyAll', 'Num.multiplyAll(values)'],
  ['Arr.reduce(values, 1, Num.multiply)', 'multiplyAll', 'multiplyAll', 'Num.multiplyAll(values)'],
] as const) {
  testRule(ruleName, preferEffectNumber, {
    valid,
    invalid: `${header}${invalid}`,
    messageId,
    output: null,
    suggestions: [{ messageId: 'replace', data: { api }, output: `${header}${suggestion}` }],
  });
}

// The precision would run once instead of twice, or a comment would be lost: report only.
for (const [invalid, messageId] of [
  ['Math.round(value * 10 ** next()) / 10 ** next()', 'round'],
  ['Math.round(10 ** digits * next()) / 10 ** digits', 'round'],
  ['Math.max(0, Math.min(value, other))', 'clamp'],
  ['Math.min(10, /* upper */ Math.max(0, value))', 'clamp'],
] as const) {
  testRule(ruleName, preferEffectNumber, {
    valid,
    invalid: `${header}${invalid}`,
    messageId,
    output: null,
    suggestions: null,
  });
}

testRule(ruleName, preferEffectNumber, {
  valid: 'const plain = Math.min(10, Math.max(0, value))',
  invalid: `
    import { Effect } from 'effect'
    const clamped = Math.min(10, Math.max(0, value))
  `,
  messageId: 'clamp',
  output: `
    import * as Num from 'effect/Number';
import { Effect } from 'effect'
    const clamped = Num.clamp(value, { minimum: 0, maximum: 10 })
  `,
});
