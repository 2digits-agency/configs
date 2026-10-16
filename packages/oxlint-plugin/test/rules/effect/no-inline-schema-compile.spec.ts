import { noInlineSchemaCompile } from '../../../src/rules/effect/no-inline-schema-compile';
import { testRule } from '../../rule-tester';

const ruleName = 'no-inline-schema-compile';

testRule(ruleName, noInlineSchemaCompile, {
  valid: `
    import * as Schema from 'effect/Schema'
    const User = Schema.Struct({ name: Schema.String })
    const decodeUser = Schema.decodeUnknownEffect(User)
    export const parseUser = (input: unknown) => decodeUser(input)
  `,
  invalid: `
    import * as Schema from 'effect/Schema'
    const User = Schema.Struct({ name: Schema.String })
    export const parseUser = (input: unknown) => Schema.decodeUnknownEffect(User)(input)
  `,
  messageId: 'inlineCompile',
});

testRule(ruleName, noInlineSchemaCompile, {
  valid: `
    import { Schema } from 'effect'
    export function parseWith<A>(schema: Schema.Codec<A>, input: unknown) {
      return Schema.decodeUnknownSync(Schema.Array(schema))(input)
    }
  `,
  invalid: `
    import { Schema as S } from 'effect'
    export function parseIds(input: unknown) {
      return S.decodeUnknownSync(S.Array(S.Number.check(S.makeFilter((n) => n > 0))))(input)
    }
  `,
  messageId: 'inlineSchema',
});

testRule(ruleName, noInlineSchemaCompile, {
  valid: `
    import { Schema } from 'effect'
    class Parser {
      schema = Schema.String
      parse(input: unknown) {
        return Schema.decodeUnknownSync(this.schema)(input)
      }
    }
  `,
  invalid: `
    import { Schema } from 'effect'
    const user = Schema.Struct({ name: Schema.String })
    class Parser {
      parse(input: unknown) {
        return Schema.is(user)(input)
      }
    }
  `,
  messageId: 'inlineCompile',
});

testRule(ruleName, noInlineSchemaCompile, {
  valid: `
    import { Schema } from 'effect'
    export const makeParser = <A>(schema: Schema.Codec<A>) => {
      const decode = Schema.decodeUnknownEffect(schema)
      return (input: unknown) => decode(input)
    }
    const Schema2 = { decodeSync: (s: unknown) => (i: unknown) => i }
    export const other = (input: unknown) => Schema2.decodeSync(String)(input)
  `,
  invalid: `
    import { Schema } from 'effect'
    const User = Schema.Struct({ name: Schema.String })
    export const encode = function (user: unknown) {
      return (Schema.encodeSync(User))(user)
    }
  `,
  messageId: 'inlineCompile',
});

testRule(ruleName, noInlineSchemaCompile, {
  valid: `
    import { Schema } from 'effect'
    const User = Schema.Struct({ name: Schema.String })
    export function parse(Schema: { decodeUnknownSync: (s: unknown) => (i: unknown) => unknown }, input: unknown) {
      return Schema.decodeUnknownSync(User)(input)
    }
  `,
  invalid: `
    import { Schema } from 'effect'
    const User = Schema.Struct({ name: Schema.String })
    export function parse(input: unknown) {
      return Schema.decodeUnknownSync(User, { errors: 'all' })(input)
    }
  `,
  messageId: 'inlineCompile',
});

testRule(ruleName, noInlineSchemaCompile, {
  valid: `
    import { Schema, type SchemaAST } from 'effect'
    const User = Schema.Struct({ name: Schema.String })
    export function parse(input: unknown, options: SchemaAST.ParseOptions) {
      return Schema.decodeUnknownSync(User, options)(input)
    }
  `,
  invalid: `
    import { Schema } from 'effect'
    let current = Schema.String
    export const parse = (input: unknown) => Schema.decodeUnknownSync(current)(input)
  `,
  messageId: 'inlineCompile',
});

testRule(ruleName, noInlineSchemaCompile, {
  valid: `
    import { Schema } from 'effect'
    let current: Schema.Codec<unknown> = Schema.String
    export function use(next: Schema.Codec<unknown>) {
      current = next
    }
    export const parse = (input: unknown) => Schema.decodeUnknownSync(current)(input)
  `,
  invalid: `
    import { Schema } from 'effect'
    const schemas = { current: Schema.String }
    export const parse = (input: unknown) => Schema.decodeUnknownSync(schemas.current)(input)
  `,
  messageId: 'inlineCompile',
});

testRule(ruleName, noInlineSchemaCompile, {
  valid: `
    import { Schema } from 'effect'
    const schemas: { current: Schema.Codec<unknown> } = { current: Schema.String }
    export function use(next: Schema.Codec<unknown>) {
      schemas.current = next
    }
    export const parse = (input: unknown) => Schema.decodeUnknownSync(schemas.current)(input)
  `,
  invalid: `
    import { Schema } from 'effect'
    export const parse = (input: unknown) => Schema.is(Schema.Array(Schema.String))(input)
  `,
  messageId: 'inlineSchema',
});
