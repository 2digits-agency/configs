import { noTrivialWrapper } from '../../../src/rules/functions/no-trivial-wrapper';
import { createRuleTester } from '../../rule-tester';

const tester = createRuleTester();

const imports = `
  import * as Effect from 'effect/Effect'
  import * as Fn from 'effect/Function'
  import * as Opt from 'effect/Option'
  import * as Str from 'effect/String'
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
    `${imports} function title(owner) { return Opt.match(owner, { onNone: () => 'none', onSome: (o) => o.name }) }`,
    `${imports} function slug(value: string) { return Fn.pipe(value, Str.trim, Str.toLowerCase) }`,
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
      code: `${imports} function isInternal(email: string) { return Fn.pipe(email, Str.includes('@example.com')) }`,
      errors: [{ messageId: 'forwardsWithArguments', data: { name: 'isInternal', callee: 'Fn.pipe' } }],
    },
    {
      code: "import { pipe } from 'effect/Function'\nimport * as Str from 'effect/String'\nfunction trim(value) { return pipe(value, Str.trim) }",
      errors: [{ messageId: 'forwardsWithArguments', data: { name: 'trim', callee: 'pipe' } }],
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
