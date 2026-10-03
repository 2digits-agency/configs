/* oxlint-disable unicorn/no-null -- RuleTester uses null to assert that no fix is offered. */
/* eslint-disable unicorn/no-null -- RuleTester uses null to assert that no fix is offered. */
import * as Either from 'effect-v3/Either';
import * as Schema from 'effect-v3/Schema';
import { RuleTester } from 'oxlint/plugins-dev';
import { describe, expect, it } from 'vite-plus/test';

import { recommendedRules, rules } from '../../../src';
import { noEmptySchemaStruct } from '../../../src/rules/effect/no-empty-schema-struct';

RuleTester.describe = describe;
RuleTester.it = it;
RuleTester.itOnly = it.only;

const tester = new RuleTester({
  languageOptions: {
    parserOptions: { lang: 'ts' },
    sourceType: 'module',
  },
});

describe('no-empty-schema-struct policy and Effect v3 semantics', () => {
  it('registers the diagnostic-only rule at the recommended error level', () => {
    expect(rules['no-empty-schema-struct']).toBe(noEmptySchemaStruct);
    expect(recommendedRules['2digits/no-empty-schema-struct']).toBe('error');
    expect(noEmptySchemaStruct.meta?.fixable).toBeUndefined();
    expect(noEmptySchemaStruct.meta?.hasSuggestions).toBeUndefined();
  });

  it('distinguishes record validation from sole-empty permissiveness in effect@3.19.14', () => {
    // The Struct(fields, ...records) overload is v3 evidence, not a v4 construction recommendation.
    const record = Schema.Record({ key: Schema.String, value: Schema.Number });
    const decode = Schema.decodeUnknownEither(Schema.Struct({}, record));

    expect(decode({ one: 1, two: 7 })).toStrictEqual(Either.right({ one: 1, two: 7 }));
    expect(decode({ one: 1, two: 'wrong' })._tag).toBe('Left');
    expect(Schema.decodeUnknownEither(Schema.Struct({}))(42)).toStrictEqual(Either.right(42));
  });
});

const schemaImport = `import * as S from 'effect/Schema';`;

tester.run('no-empty-schema-struct', noEmptySchemaStruct, {
  valid: [
    `${schemaImport} S.Struct({}, S.Record({ key: S.String, value: S.Number }))`,
    `${schemaImport} const record = S.Record({ key: S.String, value: S.Number }); S.Struct({}, record)`,
    `${schemaImport} const records = [S.Record({ key: S.String, value: S.Number })]; S.Struct({}, ...records)`,
    `${schemaImport} S.Struct({}, ...unknownRecords)`,
    `${schemaImport} S.Struct({}, undefined)`,
    `${schemaImport} S.Struct(...args)`,
    `${schemaImport} S.Struct(...[{}])`,
    `${schemaImport} S.Struct({ id: S.String })`,
    `${schemaImport} const fields = {}; S.Struct(fields)`,
    `${schemaImport} S.Struct({ ...fields })`,
    `${schemaImport} S.Struct()`,
    `${schemaImport} function example(S) { S.Struct({}) }`,
    `${schemaImport} { const S = other; S.Struct({}) }`,
    `import { Schema as S } from 'effect'; function example(S) { S.Struct({}) }`,
    `import { Struct as Shape } from 'effect/Schema'; function example(Shape) { Shape({}) }`,
    `import * as E from 'effect'; function example(E) { E.Schema.Struct({}) }`,
    `import type * as S from 'effect/Schema'; S.Struct({})`,
    `import { type Struct as Shape } from 'effect/Schema'; Shape({})`,
    `import * as S from 'unrelated/Schema'; S.Struct({})`,
    `const S = other; S.Struct({})`,
  ],
  invalid: (
    [
      [schemaImport, 'S.Struct({})', 12],
      [`import { Schema as S } from 'effect';`, 'S.Struct({})', 12],
      [`import { Struct as Shape } from 'effect/Schema';`, 'Shape({})', 9],
      [`import * as E from 'effect';`, 'E.Schema.Struct({})', 19],
    ] as const
  ).map(([statement, call, endColumn]) => ({
    code: `${statement}\n${call}`,
    filename: 'invalid.ts',
    // Oxlint reports zero-based columns; the diagnostic spans the complete call.
    errors: [{ messageId: 'emptyStruct', line: 2, column: 0, endLine: 2, endColumn }],
    output: null,
  })),
});
