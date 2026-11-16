/* eslint-disable unicorn/no-null -- RuleTester requires null to assert that no fix or suggestion is offered. */
import { preferEffectNumber } from '../../../src/rules/effect/prefer-effect-number';
import { testRule } from '../../rule-tester';

const ruleName = 'prefer-effect-number';

const header = `
  import * as Arr from 'effect/Array'
  import * as Num from 'effect/Number'
  import * as Opt from 'effect/Option'
  import * as Order from 'effect/Order'
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
  function localMin(Num: { min: (a: number, b: number) => number; max: (a: number, b: number) => number }) {
    return Num.min(10, Num.max(0, value))
  }
  const dataLast = Num.min(10)
  const subtract = (a: number, b: number) => a - b
  const steps = [values.map((n) => n + 2), values.map((n, index) => n + 1), values.map((n) => 1 + n)]
  const suffix = names.map((name: string) => name + 1)
  const sortedBy = values.sort((a, b) => a.length - b.length)
  const strict = value > 0 && value < 10
  const letters = char >= 'a' && char <= 'z'
  const dates = day.date >= from && day.date <= to
  const sameSide = value >= 0 && value >= 10
  const positive = count > 0 ? total / count : 0
  const otherDivisor = count === 0 ? 0 : total / other
  const withDefault = Math.max(...values, 0)
  const converted = Number(input)
  const checked = Number.isNaN(value)
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
  ['Num.min(10, Num.max(0, value))', 'clamp', 'Num.clamp(value, { minimum: 0, maximum: 10 })'],
  ['Num.max(lower, Num.min(value, upper))', 'clamp', 'Num.clamp(value, { minimum: lower, maximum: upper })'],
  ['Ref.update(counter, (n) => n + 1)', 'increment', 'Ref.update(counter, Num.increment)'],
  ['Arr.map(values, (n: number) => n - 1)', 'decrement', 'Arr.map(values, Num.decrement)'],
  ['values.toSorted((a, b) => a - b)', 'order', 'values.toSorted(Num.Order)'],
  ['Arr.sort(values, (left, right) => right - left)', 'order', 'Arr.sort(values, Order.flip(Num.Order))'],
  ['values.pipe(Arr.sort((a, b) => a - b))', 'order', 'values.pipe(Arr.sort(Num.Order))'],
  ['score >= 0 && score <= 100', 'between', 'Num.between(score, { minimum: 0, maximum: 100 })'],
  ['upper >= value && 0 <= value', 'between', 'Num.between(value, { minimum: 0, maximum: upper })'],
  ['value < 0 || 100 < value', 'between', '!Num.between(value, { minimum: 0, maximum: 100 })'],
  ['count === 0 ? 0 : total / count', 'divide', 'Opt.getOrElse(Num.divide(total, count), () => 0)'],
  ['0 !== count ? total / count : fallback', 'divide', 'Opt.getOrElse(Num.divide(total, count), () => fallback)'],
  [
    'count === 0 ? { empty: true } : total / count',
    'divide',
    'Opt.getOrElse(Num.divide(total, count), () => ({ empty: true }))',
  ],
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
  [
    'value >= lowerBound && value <= upperBound',
    'between',
    'between',
    'Num.between(value, { minimum: lowerBound, maximum: upperBound })',
  ],
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
  ['next() >= 0 && next() <= 10', 'between'],
  ['count === 0 ? 0 : next() / count', 'divide'],
  ['Math.max(...values)', 'extreme'],
  ['Number.isNaN(Number(input))', 'parse'],
  ['const port = parseFloat(input); if (isNaN(port)) {}', 'parse'],
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

// Each missing namespace gets its own import in one fix.
testRule(ruleName, preferEffectNumber, {
  valid: 'const plain = count === 0 ? 0 : total / count',
  invalid: `
    import { Effect } from 'effect'
    const average = count === 0 ? 0 : total / count
  `,
  messageId: 'divide',
  output: `
    import * as Num from 'effect/Number';
import * as Opt from 'effect/Option';
import { Effect } from 'effect'
    const average = Opt.getOrElse(Num.divide(total, count), () => 0)
  `,
});
