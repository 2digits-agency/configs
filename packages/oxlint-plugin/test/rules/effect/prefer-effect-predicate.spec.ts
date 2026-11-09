/* eslint-disable unicorn/no-null -- RuleTester requires null to assert that no fix or suggestion is offered. */
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

const ruleName = 'prefer-effect-predicate';

const header = `
  import * as Effect from 'effect/Effect'
  import * as Arr from 'effect/Array'
  import * as P from 'effect/Predicate'
  declare const value: unknown
`;

// Checks Effect implements the same way get a fix.
for (const [invalid, predicate, output] of [
  ["typeof value === 'string'", 'P.isString', 'P.isString(value)'],
  ["'number' !== typeof value", '!P.isNumber', '!P.isNumber(value)'],
  ["typeof (value) === 'function'", 'P.isFunction', 'P.isFunction(value)'],
  ["typeof value === 'undefined'", 'P.isUndefined', 'P.isUndefined(value)'],
  ["typeof value !== 'undefined'", 'P.isNotUndefined', 'P.isNotUndefined(value)'],
  ['value === undefined', 'P.isUndefined', 'P.isUndefined(value)'],
  ['undefined !== value', 'P.isNotUndefined', 'P.isNotUndefined(value)'],
  ['value == null', 'P.isNullish', 'P.isNullish(value)'],
  ['value != undefined', 'P.isNotNullish', 'P.isNotNullish(value)'],
  ['value === null', 'P.isNull', 'P.isNull(value)'],
  ['null !== value', 'P.isNotNull', 'P.isNotNull(value)'],
  ['(value as { a?: string }).a !== undefined', 'P.isNotUndefined', 'P.isNotUndefined((value as { a?: string }).a)'],
  ['(0, value) === null', 'P.isNull', 'P.isNull((0, value))'],
  ['value instanceof Date', 'P.isDate', 'P.isDate(value)'],
  ['value instanceof Error', 'P.isError', 'P.isError(value)'],
  [
    "function isName(input: unknown): boolean { return typeof input === 'string' }",
    'P.isString',
    'function isName(input: unknown): boolean { return P.isString(input) }',
  ],
] as const) {
  testRule(ruleName, preferEffectPredicate, {
    valid,
    invalid: `${header}${invalid}`,
    messageId: 'predicate',
    data: { predicate },
    output: `${header}${output}`,
  });
}

// Same intent, different result or type: a suggestion, not a fix.
for (const [invalid, messageId, predicate, suggestion] of [
  ["typeof value === 'object'", 'objectPredicate', 'P.isObjectOrArray', 'P.isObjectOrArray(value)'],
  ["typeof value !== 'object'", 'objectPredicate', '!P.isObjectOrArray', '!P.isObjectOrArray(value)'],
  ['value instanceof Array', 'predicate', 'Arr.isArray', 'Arr.isArray(value)'],
  ['value instanceof Promise', 'predicate', 'P.isPromise', 'P.isPromise(value)'],
  ['value instanceof Map', 'predicate', 'P.isMap', 'P.isMap(value)'],
  ['value instanceof Set', 'predicate', 'P.isSet', 'P.isSet(value)'],
] as const) {
  testRule(ruleName, preferEffectPredicate, {
    valid,
    invalid: `${header}${invalid}`,
    messageId,
    data: { predicate },
    output: null,
    suggestions: [{ messageId: 'replace', data: { predicate }, output: `${header}${suggestion}` }],
  });
}

// A different check, or a rewrite that would drop a comment: report only.
for (const [invalid, messageId, data] of [
  ['value instanceof String', 'boxedInstance', { constructor: 'String', predicate: 'P.isString' }],
  ['value instanceof Number', 'boxedInstance', { constructor: 'Number', predicate: 'P.isNumber' }],
  ['value /* empty */ === null', 'predicate', { predicate: 'P.isNull' }],
] as const) {
  testRule(ruleName, preferEffectPredicate, {
    valid,
    invalid: `${header}${invalid}`,
    messageId,
    data,
    output: null,
    suggestions: null,
  });
}

testRule(ruleName, preferEffectPredicate, {
  valid: "const plain = typeof value === 'string' && value !== undefined",
  invalid: `
    import { Effect } from 'effect'
    const plain = value !== undefined
  `,
  messageId: 'predicate',
  data: { predicate: 'P.isNotUndefined' },
  output: `
    import * as P from 'effect/Predicate';
import { Effect } from 'effect'
    const plain = P.isNotUndefined(value)
  `,
});

// Configured globals resolve to variables without definitions; they must still count as globals.
testRule(ruleName, preferEffectPredicate, {
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
  output: `
    import * as P from 'effect/Predicate';
import * as Effect from 'effect/Effect'
    const missing = P.isUndefined(value)
  `,
  globals: { undefined: 'readonly', window: 'readonly' },
});
