import { describe, it } from '@effect/vitest';
import { RuleTester } from 'oxlint/plugins-dev';

import { noConstantThunk } from '../../../src/rules/functions/no-constant-thunk';

RuleTester.describe = describe;

RuleTester.it = it;

const tester = new RuleTester({
  languageOptions: {
    parserOptions: { lang: 'ts' },
    sourceType: 'module',
  },
});

const imports = `
  import * as Arr from 'effect/Array'
  import * as DateTime from 'effect/DateTime'
  import * as Duration from 'effect/Duration'
  import * as Effect from 'effect/Effect'
  import { pipe } from 'effect/Function'
  import * as Opt from 'effect/Option'
  import * as Schema from 'effect/Schema'
`;

tester.run('no-constant-thunk', noConstantThunk, {
  valid: [
    `${imports} function userSchema(name) { return Schema.Struct({ name: Schema.Literal(name) }) }`,
    `${imports} function defaults() { return { retries: 3 } }`,
    `${imports} function rules() { return [Schema.String] }`,
    `${imports} function cache() { return new Map() }`,
    `${imports} function now() { return Date.now() }`,
    `${imports} function now() { return DateTime.nowUnsafe() }`,
    `${imports} function result() { return Effect.runSync(program) }`,
    `${imports} let count = 0\nfunction current() { return count }`,
    `${imports} async function load() { return Schema.String }`,
    `${imports} function empty<A>() { return Arr.empty<A>() }`,
    `${imports} function computed() { return compute() }`,
    `${imports} export default function robots() { return 'User-agent: *' }`,
    `${imports} export function run() { const inner = () => Schema.String; return inner }`,
    `${imports} function ruleImpl(context) { return {} }\nexport function rule() { return ruleImpl }`,
    `${imports} export const handler = () => (event) => Effect.log(event)`,
    `${imports} const state = { count: 0 }\nfunction current() { return state.count }`,
    `${imports} function readClock() { return Date.now() }\nfunction now() { return pipe(0, readClock) }`,
    `${imports} function jitter() { return Opt.map(Opt.some(1), (n) => n + Math.random()) }`,
  ],
  invalid: [
    {
      code: `${imports} function userSchema() { return Schema.Struct({ id: Schema.String }) }`,
      errors: [{ messageId: 'constantThunk', data: { name: 'userSchema' } }],
    },
    {
      code: `${imports} const baseUrl = () => 'https://example.com'`,
      errors: [{ messageId: 'constantThunk', data: { name: 'baseUrl' } }],
    },
    {
      code: `${imports} export function timeout() { return Duration.seconds(5) }`,
      errors: [{ messageId: 'constantThunk', data: { name: 'timeout' } }],
    },
    {
      code: `${imports} export const userId = () => Schema.String.pipe(Schema.brand('UserId'))`,
      errors: [{ messageId: 'constantThunk', data: { name: 'userId' } }],
    },
    {
      code: `${imports} function program() { return Effect.gen(function* () { yield* Effect.log('x') }) }`,
      errors: [{ messageId: 'constantThunk', data: { name: 'program' } }],
    },
    {
      code: `${imports} function fields() { return Schema.Struct({ id: Schema.String }).fields }`,
      errors: [{ messageId: 'constantThunk', data: { name: 'fields' } }],
    },
    {
      code: `${imports} function label() { return pipe('id', Opt.some) }`,
      errors: [{ messageId: 'constantThunk', data: { name: 'label' } }],
    },
    {
      code: `${imports} const host = 'example.com'\nfunction url() { return \`https://\${host}/api\` }`,
      errors: [{ messageId: 'constantThunk', data: { name: 'url' } }],
    },
  ],
});
