/* eslint-disable unicorn/no-null -- RuleTester requires null to assert that no fix or suggestion is offered. */
import { describe, it } from '@effect/vitest';
import * as Arr from 'effect/Array';
import { RuleTester } from 'oxlint/plugins-dev';

import { noForwardingLambda } from '../../../src/rules/functions/no-forwarding-lambda';

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
  import * as Effect from 'effect/Effect'
  import * as Match from 'effect/Match'
  import * as Opt from 'effect/Option'
  import * as Schema from 'effect/Schema'
  import * as Stream from 'effect/Stream'
`;

tester.run('no-forwarding-lambda', noForwardingLambda, {
  valid: [
    `${imports} Arr.map(values, (value) => parse(value))`,
    `${imports} Effect.forEach(values, (value) => process(value))`,
    `${imports} Effect.filter(values, (value) => keep(value))`,
    `${imports} Effect.map((user) => user.name)`,
    `${imports} Effect.map((id) => repository.load(id))`,
    `${imports} Effect.map((id) => load(id, options))`,
    `${imports} Effect.map(async (id) => load(id))`,
    `${imports} Effect.map(({ id }) => load(id))`,
    `${imports} values.map((value) => parse(value))`,
    `${imports} register((value) => parse(value))`,
    'Effect.map((value) => parse(value))',
    `${imports} Stream.map((chunk) => decode(chunk))`,
    `${imports} Effect.findFirstFilter(values, (value) => check(value))`,
    `${imports} Effect.acquireRelease(open, (connection) => close(connection))`,
    `${imports} Stream.scan(0, (total) => reset(total))`,
    `${imports} Effect.map((id) => makeLoader(config)(id))`,
    `${imports} Match.tag('Known', (traffic) => Opt.some(traffic))`,
    `${imports} Schema.declare((input): input is Report => isReport(input))`,
  ],
  invalid: [
    {
      code: `${imports} Effect.map((stored) => Opt.getOrNull(stored))`,
      errors: [
        {
          messageId: 'forwardingLambda',
          data: { callee: '`Opt.getOrNull`' },
          // Effect APIs can be overloaded duals, which stop type-checking when passed directly.
          suggestions: [{ messageId: 'passCallee', output: `${imports} Effect.map(Opt.getOrNull)` }],
        },
      ],
      output: null,
    },
    {
      code: `${imports} function parse(raw: string) { return raw } Effect.map((raw) => parse(raw))`,
      errors: [{ messageId: 'forwardingLambda' }],
      output: `${imports} function parse(raw: string) { return raw } Effect.map(parse)`,
    },
    {
      // Function declarations are hoisted, so a later one is already initialized.
      code: `${imports} Effect.map(function (raw) { return parse(raw) }); function parse(raw: string) { return raw }`,
      errors: [{ messageId: 'forwardingLambda' }],
      output: `${imports} Effect.map(parse); function parse(raw: string) { return raw }`,
    },
    {
      code: `${imports} const parse = (raw: string) => raw; const run = () => Effect.map((raw) => parse(raw))`,
      errors: [{ messageId: 'forwardingLambda' }],
      output: `${imports} const parse = (raw: string) => raw; const run = () => Effect.map(parse)`,
    },
    {
      code: `${imports} function parse(raw: string) { return raw } Effect.map((raw: string) => parse(raw))`,
      errors: [
        {
          messageId: 'forwardingLambda',
          suggestions: [
            {
              messageId: 'passCallee',
              output: `${imports} function parse(raw: string) { return raw } Effect.map(parse)`,
            },
          ],
        },
      ],
      output: null,
    },
    {
      code: `${imports} function parse(raw: string): string; function parse(raw: number): number; function parse(raw: unknown) { return raw } Effect.map((raw) => parse(raw))`,
      errors: [
        {
          messageId: 'forwardingLambda',
          suggestions: [
            {
              messageId: 'passCallee',
              output: `${imports} function parse(raw: string): string; function parse(raw: number): number; function parse(raw: unknown) { return raw } Effect.map(parse)`,
            },
          ],
        },
      ],
      output: null,
    },
    // Passing reads the binding where the callback is created: a later const throws, a let may change.
    ...Arr.map(
      [
        `${imports} Effect.map((raw) => parse(raw)); const parse = (raw: string) => raw`,
        `${imports} const parse = (raw: string) => raw; function run() { return Effect.map((raw) => parse(raw)) }`,
        `${imports} let parse = (raw: string) => raw; Effect.map((raw) => parse(raw))`,
        `${imports} function parse(raw: string) { return raw } Effect.map((raw) => parse(raw)); parse = (raw) => raw`,
        `${imports} function run(parse: (raw: string) => string) { const out = Effect.map((raw) => parse(raw)); parse = String; return out }`,
        `${imports} Effect.flatMap((input) => Schema.decodeUnknownEffect(User)(input)); const User = Schema.String`,
        `${imports} Effect.map(function parse(raw) { return parse(raw) })`,
        `${imports} function parse(raw: string) { return raw } Effect.map((raw) => /* why */ parse(raw))`,
      ],
      (code) => ({ code, errors: [{ messageId: 'forwardingLambda', suggestions: null }], output: null }),
    ),
    {
      code: `${imports} Opt.flatMap(option, (raw) => parse(raw))`,
      errors: [{ messageId: 'forwardingLambda', data: { callee: '`parse`' } }],
    },
    {
      code: `${imports} Effect.flatMap((input) => Schema.decodeUnknownEffect(User)(input))`,
      errors: [{ messageId: 'forwardingLambda', data: { callee: '`Schema.decodeUnknownEffect(User)`' } }],
    },
    {
      code: `${imports} Stream.tap((output) => Effect.logDebug(output))`,
      errors: [{ messageId: 'forwardingLambda', data: { callee: '`Effect.logDebug`' } }],
    },
    {
      code: `${imports} Effect.catchTag('NotFound', function (error) { return recover(error) })`,
      errors: [{ messageId: 'forwardingLambda', data: { callee: '`recover`' } }],
    },
  ],
});
