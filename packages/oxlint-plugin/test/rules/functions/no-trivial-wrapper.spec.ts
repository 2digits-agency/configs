import { describe, it } from '@effect/vitest';
import { RuleTester } from 'oxlint/plugins-dev';

import { noTrivialWrapper } from '../../../src/rules/functions/no-trivial-wrapper';

RuleTester.describe = describe;

RuleTester.it = it;

const tester = new RuleTester({
  languageOptions: {
    parserOptions: { lang: 'ts' },
    sourceType: 'module',
  },
});

const imports = `
  import * as Effect from 'effect/Effect'
  import * as Match from 'effect/Match'
  import * as Schema from 'effect/Schema'
`;

tester.run('no-trivial-wrapper', noTrivialWrapper, {
  valid: [
    'function swap(a, b) { return pair(b, a) }',
    'function twice(x) { return pair(x, x) }',
    'function describe(x) { return x.toString() }',
    'function lookup(x) { return load(x.id) }',
    'const load = async (id) => fetchUser(id)',
    'function identity<A>(value: A) { return wrap(value) }',
    'function logged(x) { log(x); return run(x) }',
    'function byId({ id }) { return load(id) }',
    'function withDefault(x = 1) { return run(x) }',
    'function make(x) { return new Box(x) }',
    'function bound(x) { return this.run(x) }',
    'function call(x) { return run?.(x) }',
    'const handlers = { log: (message) => Effect.log(message) }',
    'function now() { return Date.now() }',
    'function parse(values) { return Arr.map(values, (value) => decode(value)) }',
    'function isMode(value: string): value is Mode { return modes.has(value) }',
    'export function isOperator(operator) { return operators.has(operator) }',
    'export function enclosingFunction(node) { return findAncestor(node, isFunctionNode) }',
    "import * as Arr from 'effect/Array'\nfunction isList(value: Item | ReadonlyArray<Item>): value is ReadonlyArray<Item> { return Arr.isArray(value) }",
  ],
  invalid: [
    {
      code: `${imports} function isPolicy(value: unknown): value is Policy { return Schema.is(Policy)(value) }`,
      errors: [{ messageId: 'forwardsParameters', data: { name: 'isPolicy', callee: 'Schema.is(Policy)' } }],
    },
    {
      code: `${imports} function isUser(input: unknown) { return Schema.is(User)(input) }`,
      errors: [{ messageId: 'forwardsParameters', data: { name: 'isUser', callee: 'Schema.is(User)' } }],
    },
    {
      code: `${imports} const logStep = (message: string) => Effect.logDebug(message)`,
      errors: [{ messageId: 'forwardsParameters', data: { name: 'logStep', callee: 'Effect.logDebug' } }],
    },
    {
      code: `${imports} export function render(value) { return Match.valueTags(value, cases) }`,
      errors: [{ messageId: 'forwardsWithArguments', data: { name: 'render', callee: 'Match.valueTags' } }],
    },
    {
      code: 'const send = (...args) => transport(...args)',
      errors: [{ messageId: 'forwardsParameters', data: { name: 'send', callee: 'transport' } }],
    },
    {
      code: `${imports} const save = function (id, data) { return Effect.fn('save')(persist)(id, data) }`,
      errors: [{ messageId: 'forwardsParameters', data: { name: 'save', callee: "Effect.fn('save')(persist)" } }],
    },
  ],
});
