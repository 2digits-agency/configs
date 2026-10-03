/* oxlint-disable unicorn/no-null -- RuleTester uses null to assert no autofix. */
/* eslint-disable unicorn/no-null -- RuleTester uses null to assert no autofix. */
import { RuleTester } from 'oxlint/plugins-dev';
import { describe, it } from 'vite-plus/test';

import { noAmbiguousTemplateLiteralCaptures } from '../../../src/rules/effect/no-ambiguous-template-literal-captures';

RuleTester.describe = describe;
RuleTester.it = it;
RuleTester.itOnly = it.only;

const tester = new RuleTester({
  languageOptions: { parserOptions: { lang: 'ts' }, sourceType: 'module' },
});

const schema = `import * as S from 'effect/Schema';`;
const pair = `${schema} const Pair = S.TemplateLiteralParser([S.String, S.String]);`;

tester.run('no-ambiguous-template-literal-captures', noAmbiguousTemplateLiteralCaptures, {
  valid: [
    `import { Schema } from 'effect';
     const f = (input) => Schema.decodeUnknownSync(Schema.TemplateLiteralParser([Schema.String, '-', Schema.String]))(input);`,
    `import { Schema } from 'effect';
     Schema.decodeUnknownSync(Schema.TemplateLiteralParser([Schema.String, Schema.String]))('helloworld');`,
    ...[
      'S.String',
      "S.String, '-', S.String",
      "S.String, '', S.String",
      'S.String.check(S.isPattern(/^[a-z]{3}$/)), S.String',
      'S.String, S.String.check(S.isPattern(/^[0-9]{4}$/))',
      'S.String, S.NumberFromString',
      "'gid://shopify/GiftCardTransaction/', S.BigIntFromString.check(S.isGreaterThan(0n))",
      'S.String, S.Union([S.String, S.Number])',
      "S.String, S.String.pipe(S.brand('Part'))",
      'S.String, (S.String as unknown)',
      'S.String, S.String!,',
      '...parts, S.String, S.String',
      'S.String, S.String, ...parts',
    ].map((parts) => `${schema} const f = (input) => S.decodeUnknownSync(S.TemplateLiteralParser([${parts}]))(input);`),
    ...[
      'S.is(Pair)(input);',
      'S.encodeSync(Pair)(input);',
      'S.decodeUnknownSync(Pair)(input);',
      'void S.decodeUnknownSync(Pair)(input);',
      'const result = S.decodeUnknownSync(Pair)(input);',
      'const result = S.decodeUnknownSync(Pair)(input); consume(result[0]);',
      'const [first] = S.decodeUnknownSync(Pair)(input); consume(first);',
      'const [, second] = S.decodeUnknownSync(Pair)(input); consume(second);',
      'const [first, _second] = S.decodeUnknownSync(Pair)(input); consume(first, _second);',
      'const [_first, second] = S.decodeUnknownSync(Pair)(input); consume(_first, second);',
      'const [first = fallback, _second = fallback] = S.decodeUnknownSync(Pair)(input); consume(first, _second);',
      'const [first = fallback, second = fallback] = S.decodeUnknownSync(Pair)(input); consume(first);',
      'const [first, second] = S.decodeUnknownSync(Pair)(input); consume(first);',
      'const [first, second] = S.decodeUnknownSync(Pair)(input); consume(second);',
      'const [first, second] = S.decodeUnknownSync(Pair)(input); function f(second) { consume(first, second); }',
      'let [first, second] = S.decodeUnknownSync(Pair)(input); second = replacement; consume(first, second);',
      'const decode = S.decodeUnknownSync(Pair); consume(decode(input));',
      'const Alias = Pair; consume(S.decodeUnknownSync(Pair)(input));',
      'const Refined = Pair.check(filter); consume(S.decodeUnknownSync(Pair)(input));',
      'export { Pair }; consume(S.decodeUnknownSync(Pair)(input));',
      'export default Pair; consume(S.decodeUnknownSync(Pair)(input));',
      'function f(Pair) { return S.decodeUnknownSync(Pair)(input); }',
      'function f(S) { return S.decodeUnknownSync(Pair)(input); }',
    ].map((use) => `${pair} ${use}`),
    `${schema} export const Pair = S.TemplateLiteralParser([S.String, S.String]); consume(S.decodeUnknownSync(Pair)(input));`,
    `${schema} let Pair = S.TemplateLiteralParser([S.String, S.String]); consume(S.decodeUnknownSync(Pair)(input));`,
    `${pair} Pair = other; consume(S.decodeUnknownSync(Pair)(input));`,
    `${schema} import { Pair } from './pair'; consume(S.decodeUnknownSync(Pair)(input));`,
    `${schema} const Text = S.String; consume(S.decodeUnknownSync(S.TemplateLiteralParser([Text, Text]))(input));`,
    `${schema} const parts = [S.String, S.String]; consume(S.decodeUnknownSync(S.TemplateLiteralParser(parts))(input));`,
    `${schema} const f = (input) => S.decodeUnknownSync(S.TemplateLiteral([S.String, S.String]))(input);`,
    `${schema} function f(S) { return S.decodeUnknownSync(S.TemplateLiteralParser([S.String, S.String]))(input); }`,
    `import { TemplateLiteralParser as T, String as Text, decodeUnknownSync as decode } from 'effect/Schema';
     function f(Text) { return decode(T([Text, Text]))(input); }`,
    `import * as S from 'unrelated'; const f = (input) => S.decodeUnknownSync(S.TemplateLiteralParser([S.String, S.String]))(input);`,
    `import type * as S from 'effect/Schema'; const f = (input) => S.decodeUnknownSync(S.TemplateLiteralParser([S.String, S.String]))(input);`,
    `${schema} const Pair = S.TemplateLiteralParser(['prefix', S.String, S.String]);
     const [prefix, first] = S.decodeUnknownSync(Pair)(input); consume(prefix, first);`,
    String.raw`const [, year, month] = input.match(/^(\d{4})(\d{2})$/); consume(year, month);`,
    `const [start, end] = input.split('-'); consume(start, end);`,
  ],
  invalid: [
    {
      code: `import { Schema } from 'effect';
const f = (input) => Schema.decodeUnknownSync(Schema.TemplateLiteralParser([Schema.String, Schema.String]))(input);`,
      errors: [{ messageId: 'ambiguous', line: 2, column: 91 }],
      output: null,
    },
    {
      code: `import * as S from 'effect/Schema';
const Pair = S.TemplateLiteralParser(['prefix', S.String, S.String]);
const [, first, second] = S.decodeUnknownSync(Pair)(input);
consume(first, second);`,
      errors: [{ messageId: 'ambiguous', line: 2, column: 58 }],
      output: null,
    },
    {
      code: `import { TemplateLiteralParser as T, String as Text, decodeUnknownSync as decode } from 'effect/Schema';
const Pair = T([Text, Text]);
function parse(input) { const result = decode(Pair)(input); return result; }`,
      errors: [{ messageId: 'ambiguous', line: 2, column: 22 }],
      output: null,
    },
    ...[
      `${pair} function f(input) { return S.decodeUnknownSync(Pair)(input); }`,
      `${pair} state.pair = S.decodeUnknownSync(Pair)(input);`,
      `${pair} function f(input) { return { pair: S.decodeUnknownSync(Pair)(input) }; }`,
      `${pair} export const result = S.decodeUnknownSync(Pair)(input);`,
      `${pair} const [first, second] = S.decodeUnknownSync(Pair)(input); consume(first, second);`,
      `${pair} const [first = '', second = ''] = S.decodeUnknownSync(Pair)(input); consume(first, second);`,
      `${pair} S.is(Pair)(input); S.encodeSync(Pair)(input); consume(S.decodeUnknownSync(Pair)(input));`,
      `${pair} S.decodeUnknownSync(Pair)(input); consume(S.decodeUnknownSync(Pair)(input));`,
      `${pair} consume(S.decodeUnknownSync(Pair)(a)); consume(S.decodeUnknownSync(Pair)(b));`,
      `${schema} const f = (input) => S.decodeUnknownSync((S.TemplateLiteralParser([(S.String), (S.String)])))(input);`,
      `import { Schema as S } from 'effect'; const f = (input) => S.decodeUnknownSync(S.TemplateLiteralParser([S.String, S.String]))(input);`,
      `import * as Fx from 'effect'; const f = (input) => Fx.Schema.decodeUnknownSync(Fx.Schema.TemplateLiteralParser([Fx.Schema.String, Fx.Schema.String]))(input);`,
      `${schema} const f = (input) => S['decodeUnknownSync'](S['TemplateLiteralParser']([S['String'], S['String']]))(input);`,
      `${schema} const Pair = S.TemplateLiteralParser(['a', 'b', S.String, S.String]);
       const [, , first, second] = S.decodeUnknownSync(Pair)(input); consume(first, second);`,
    ].map((code) => ({ code, errors: [{ messageId: 'ambiguous' }], output: null })),
    {
      code: `${schema} const Pair = S.TemplateLiteralParser([S.String, S.String, S.String]);
       const [, second, third] = S.decodeUnknownSync(Pair)(input); consume(second, third);`,
      errors: [{ messageId: 'ambiguous' }],
      output: null,
    },
    {
      code: `${schema} const f = (input) => S.decodeUnknownSync(S.TemplateLiteralParser([S.String, S.String, S.String]))(input);`,
      errors: [{ messageId: 'ambiguous' }, { messageId: 'ambiguous' }],
      output: null,
    },
  ],
});
