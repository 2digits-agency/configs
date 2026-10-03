/* oxlint-disable unicorn/no-null -- RuleTester uses null to assert no fix. */
/* eslint-disable unicorn/no-null -- RuleTester uses null to assert no fix. */
import { RuleTester } from 'oxlint/plugins-dev';
import { describe, it } from 'vite-plus/test';

import { noOmitRequiredEncodedKey } from '../../../src/rules/effect/no-omit-required-encoded-key';

RuleTester.describe = describe;
RuleTester.it = it;
RuleTester.itOnly = it.only;

const tester = new RuleTester({
  languageOptions: { parserOptions: { lang: 'ts' }, sourceType: 'module' },
});

const imports = `import { Schema as S, SchemaGetter as G } from 'effect';`;
const pairing = `S.String.pipe(S.encodeTo(S.String, { decode: G.passthrough(), encode: G.omit() }))`;

tester.run('no-omit-required-encoded-key', noOmitRequiredEncodedKey, {
  valid: [
    `import { Schema, SchemaGetter } from 'effect';
     Schema.Struct({ b: Schema.String.pipe(Schema.encodeTo(Schema.optionalKey(Schema.String), {
       decode: SchemaGetter.passthrough(), encode: SchemaGetter.omit(),
     })) });`,
    ...[
      'S.optional(S.String)',
      'S.optionalKey(S.Number)',
      'S.optional(S.Boolean)',
      'target',
      'makeSchema()',
      'S.Unknown',
      'S.Undefined',
    ].map((target) => `${imports} S.Struct({ b: S.String.pipe(S.encodeTo(${target}, { encode: G.omit() })) });`),
    ...[
      '{ decode: G.omit(), encode: G.passthrough() }',
      '{ encode: G.passthrough() }',
      '{ encode: customGetter() }',
      '{ encode: G.omit }',
      '{ encode: G.omit(value) }',
      '{ encode: () => G.omit() }',
      '{ encode: G.omit(), ...options }',
      '{ ...options, encode: G.omit() }',
      '{ encode: G.omit(), encode: G.passthrough() }',
      '{ decode: first, decode: second, encode: G.omit() }',
      '{ ["encode"]: G.omit() }',
      '{ get encode() { return G.omit(); } }',
      '{ encode() { return G.omit(); } }',
      'options',
    ].map((options) => `${imports} S.Struct({ b: S.String.pipe(S.encodeTo(S.String, ${options})) });`),
    `${imports} S.Struct({ b: S.String.pipe(S.encodeTo(S.String, { encode: G.omit() }), S.optionalKey) });`,
    `${imports} S.Struct({ b: S.optionalKey(${pairing}) });`,
    `${imports} S.Struct({ b: ${pairing}.pipe(S.optionalKey) });`,
    `${imports} S.Struct({ b: ${pairing}, ...fields });`,
    `${imports} S.Struct({ b: ${pairing}, b: S.String });`,
    `${imports} S.Struct({ ['b']: ${pairing} });`,
    `${imports} S.Struct({ b: custom.pipe(S.encodeTo(S.String, { encode: G.omit() })) });`,
    `${imports} const field = ${pairing};`,
    `${imports} const fields = { b: ${pairing} }; S.Struct(fields);`,
    `${imports} S.Array(${pairing});`,
    `${imports} G.omit();`,
    `${imports} function f(S) { S.Struct({ b: ${pairing} }); }`,
    `${imports} function f(G) { S.Struct({ b: ${pairing} }); }`,
    `${imports} function f() { S.Struct({ b: ${pairing} }); const G = custom; }`,
    `${imports} { const S = custom; S.Struct({ b: ${pairing} }); }`,
    `import { Schema as S, SchemaGetter as G } from 'unrelated'; S.Struct({ b: ${pairing} });`,
    `import * as S from 'alchemy/Schema'; import * as G from 'effect/SchemaGetter'; S.Struct({ b: ${pairing} });`,
    `import * as S from 'effect/Schema'; import * as G from '@effect/platform/SchemaGetter'; S.Struct({ b: ${pairing} });`,
    `import type { Schema as S, SchemaGetter as G } from 'effect'; S.Struct({ b: ${pairing} });`,
    `import { Schema as S, type SchemaGetter as G } from 'effect'; S.Struct({ b: ${pairing} });`,
    `import S from 'effect/Schema'; import * as G from 'effect/SchemaGetter'; S.Struct({ b: ${pairing} });`,
    `import * as S from 'effect/Schema'; S.Struct({ b: S.String.pipe(S.encodeTo(S.String, { encode: SchemaGetter.omit() })) });`,
    `import * as S from 'effect/Schema'; import * as G from 'effect/SchemaGetter';
     import { encodeTo as encode } from 'effect/Schema';
     function f(encode) { S.Struct({ b: S.String.pipe(encode(S.String, { encode: G.omit() })) }); }`,
    `import { Struct, String as text, encodeTo } from 'effect/Schema'; import { omit } from 'effect/SchemaGetter';
     function f(text) { Struct({ b: text.pipe(encodeTo(text, { encode: omit() })) }); }`,
    // Effect 3 transformations do not use the Effect 4 getter API.
    `import * as S from 'effect/Schema'; S.Struct({ b: S.transform(S.String, S.String, { encode: () => undefined }) });`,
  ],
  invalid: [
    {
      code: `import { Effect, Schema, SchemaGetter } from 'effect';
Schema.Struct({ b: Schema.String.pipe(Schema.encodeTo(Schema.String, {
  decode: SchemaGetter.withDefault(Effect.succeed('default')), encode: SchemaGetter.omit(),
})) });`,
      errors: [{ messageId: 'requiredEncodedKey', line: 2, column: 54, endColumn: 67 }],
      output: null,
    },
    ...['String', 'Number', 'Boolean'].map((name) => ({
      code: `import * as S from 'effect/Schema'; import * as G from 'effect/SchemaGetter';
       S.Struct({ b: S.${name}.pipe(S.encodeTo(S.${name}, { encode: G.omit() })) });`,
      errors: [{ messageId: 'requiredEncodedKey' }],
      output: null,
    })),
    {
      code: `${imports} function f() { S.Struct({ b: ${pairing} }); }`,
      errors: [{ messageId: 'requiredEncodedKey' }],
      output: null,
    },
    {
      code: `import * as Fx from 'effect';
       Fx.Schema.Struct({ b: Fx.Schema.Boolean.pipe(Fx.Schema.encodeTo(Fx.Schema.Number, { encode: Fx.SchemaGetter.omit() })) });`,
      errors: [{ messageId: 'requiredEncodedKey' }],
      output: null,
    },
    {
      code: `import { Struct as struct, String as text, Number as num, encodeTo as encode } from 'effect/Schema';
       import { omit as remove } from 'effect/SchemaGetter';
       struct({ b: text.pipe(encode(num, { encode: remove() })) });`,
      errors: [{ messageId: 'requiredEncodedKey' }],
      output: null,
    },
  ],
});
