import { preferEffectPredicate } from '../../../src/rules/effect/prefer-effect-predicate';
import { testRule } from '../../rule-tester';

const valid = `
  import * as P from 'effect/Predicate'
  const isName = (input: unknown): input is string => typeof input === 'string'
  function isMissing(input: unknown): input is undefined { return input === undefined }
  const hasWindow = typeof window !== 'undefined'
  const kind = typeof value
  const same = value === other
  const matches = typeof value === kind
  const local = value instanceof Foo
  function shadowed(Date: unknown) { return value instanceof Date }
  const checked = P.isString(value) && P.isNotUndefined(other)
`;

for (const [invalid, predicate] of [
  ["typeof value === 'string'", 'P.isString'],
  ["'number' !== typeof value", 'P.not(P.isNumber)'],
  ["typeof value === 'undefined'", 'P.isUndefined'],
  ["typeof value !== 'undefined'", 'P.isNotUndefined'],
  ['value === undefined', 'P.isUndefined'],
  ['undefined !== value', 'P.isNotUndefined'],
  ['value == null', 'P.isNullish'],
  ['value != undefined', 'P.isNotNullish'],
  ['value === null', 'P.isNull'],
  ['null !== value', 'P.isNotNull'],
  ['value instanceof Date', 'P.isDate'],
  ['value instanceof Array', 'Arr.isArray'],
  ["function isName(input: unknown): boolean { return typeof input === 'string' }", 'P.isString'],
] as const) {
  testRule('prefer-effect-predicate', preferEffectPredicate, {
    valid,
    invalid: `
      import * as Effect from 'effect/Effect'
      declare const value: unknown
      ${invalid}
    `,
    messageId: 'predicate',
    data: { predicate },
  });
}

for (const [invalid, messageId, data] of [
  ["typeof value === 'object'", 'objectPredicate', { predicate: 'P.isObjectOrArray' }],
  ["typeof value !== 'object'", 'objectPredicate', { predicate: 'P.not(P.isObjectOrArray)' }],
  ['value instanceof String', 'boxedInstance', { constructor: 'String', predicate: 'P.isString' }],
  ['value instanceof Number', 'boxedInstance', { constructor: 'Number', predicate: 'P.isNumber' }],
] as const) {
  testRule('prefer-effect-predicate', preferEffectPredicate, {
    valid,
    invalid: `
      import * as Effect from 'effect/Effect'
      declare const value: unknown
      ${invalid}
    `,
    messageId,
    data,
  });
}

testRule('prefer-effect-predicate', preferEffectPredicate, {
  valid: "const plain = typeof value === 'string' && value !== undefined",
  invalid: `
    import { Effect } from 'effect'
    const plain = value !== undefined
  `,
  messageId: 'predicate',
  data: { predicate: 'P.isNotUndefined' },
});

// Configured globals resolve to variables without definitions; they must still count as globals.
testRule('prefer-effect-predicate', preferEffectPredicate, {
  valid: `
    import * as Effect from 'effect/Effect'
    const hasWindow = typeof window !== 'undefined'
  `,
  invalid: `
    import * as Effect from 'effect/Effect'
    const missing = value === undefined
  `,
  messageId: 'predicate',
  data: { predicate: 'P.isUndefined' },
  globals: { undefined: 'readonly', window: 'readonly' },
});
