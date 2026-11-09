import { describe, it } from '@effect/vitest';
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
      errors: [{ messageId: 'forwardingLambda', data: { callee: '`Opt.getOrNull`' } }],
    },
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
