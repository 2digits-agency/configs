import { testRule } from '../../rule-tester';

testRule('no-inline-schema-compile', {
  valid: [
    `
    import * as Schema from 'effect/Schema'
    const User = Schema.Struct({ name: Schema.String })
    const decodeUser = Schema.decodeUnknownEffect(User)
    export const parseUser = (input: unknown) => decodeUser(input)
  `,
    `
    import { Schema } from 'effect'
    export function parseWith<A>(schema: Schema.Codec<A>, input: unknown) {
      return Schema.decodeUnknownSync(Schema.Array(schema))(input)
    }
  `,
    `
    import { Schema } from 'effect'
    class Parser {
      schema = Schema.String
      parse(input: unknown) {
        return Schema.decodeUnknownSync(this.schema)(input)
      }
    }
  `,
    `
    import { Schema } from 'effect'
    export const makeParser = <A>(schema: Schema.Codec<A>) => {
      const decode = Schema.decodeUnknownEffect(schema)
      return (input: unknown) => decode(input)
    }
    const Schema2 = { decodeSync: (s: unknown) => (i: unknown) => i }
    export const other = (input: unknown) => Schema2.decodeSync(String)(input)
  `,
    `
    import { Schema } from 'effect'
    const User = Schema.Struct({ name: Schema.String })
    export function parse(Schema: { decodeUnknownSync: (s: unknown) => (i: unknown) => unknown }, input: unknown) {
      return Schema.decodeUnknownSync(User)(input)
    }
  `,
    `
    import { Schema, type SchemaAST } from 'effect'
    const User = Schema.Struct({ name: Schema.String })
    export function parse(input: unknown, options: SchemaAST.ParseOptions) {
      return Schema.decodeUnknownSync(User, options)(input)
    }
  `,
    `
    import { Schema } from 'effect'
    let current: Schema.Codec<unknown> = Schema.String
    export function use(next: Schema.Codec<unknown>) {
      current = next
    }
    export const parse = (input: unknown) => Schema.decodeUnknownSync(current)(input)
  `,
    `
    import { Schema } from 'effect'
    const schemas: { current: Schema.Codec<unknown> } = { current: Schema.String }
    export function use(next: Schema.Codec<unknown>) {
      schemas.current = next
    }
    export const parse = (input: unknown) => Schema.decodeUnknownSync(schemas.current)(input)
  `,
    `
    import { Schema, type SchemaAST } from 'effect'
    const User = Schema.Struct({ name: Schema.String })
    declare function nextOptions(): SchemaAST.ParseOptions
    export const parse = (input: unknown) => Schema.decodeUnknownSync(User, nextOptions())(input)
  `,
    `
    import { Schema } from 'effect'
    export class Base {
      constructor(input: unknown) {
        Schema.asserts(Schema.instanceOf(new.target))(input)
      }
    }
  `,
  ],
  invalid: [
    {
      code: `
    import * as Schema from 'effect/Schema'
    const User = Schema.Struct({ name: Schema.String })
    export const parseUser = (input: unknown) => Schema.decodeUnknownEffect(User)(input)
  `,
      errors: [{ messageId: 'inlineCompile' }],
    },
    {
      code: `
    import { Schema as S } from 'effect'
    export function parseIds(input: unknown) {
      return S.decodeUnknownSync(S.Array(S.Number.check(S.makeFilter((n) => n > 0))))(input)
    }
  `,
      errors: [{ messageId: 'inlineSchema' }],
    },
    {
      code: `
    import { Schema } from 'effect'
    const user = Schema.Struct({ name: Schema.String })
    class Parser {
      parse(input: unknown) {
        return Schema.is(user)(input)
      }
    }
  `,
      errors: [{ messageId: 'inlineCompile' }],
    },
    {
      code: `
    import { Schema } from 'effect'
    const User = Schema.Struct({ name: Schema.String })
    export const encode = function (user: unknown) {
      return (Schema.encodeSync(User))(user)
    }
  `,
      errors: [{ messageId: 'inlineCompile' }],
    },
    {
      code: `
    import { Schema } from 'effect'
    const User = Schema.Struct({ name: Schema.String })
    export function parse(input: unknown) {
      return Schema.decodeUnknownSync(User, { errors: 'all' })(input)
    }
  `,
      errors: [{ messageId: 'inlineCompile' }],
    },
    {
      code: `
    import { Schema } from 'effect'
    let current = Schema.String
    export const parse = (input: unknown) => Schema.decodeUnknownSync(current)(input)
  `,
      errors: [{ messageId: 'inlineCompile' }],
    },
    {
      code: `
    import { Schema } from 'effect'
    const schemas = { current: Schema.String }
    export const parse = (input: unknown) => Schema.decodeUnknownSync(schemas.current)(input)
  `,
      errors: [{ messageId: 'inlineCompile' }],
    },
    {
      code: `
    import { Schema } from 'effect'
    export const parse = (input: unknown) => Schema.is(Schema.Array(Schema.String))(input)
  `,
      errors: [{ messageId: 'inlineSchema' }],
    },
    {
      code: `
    import { Schema } from 'effect'
    export const parse = (input: unknown) =>
      Schema.decodeUnknownSync(Schema.String.check(Schema.makeFilter((s: string) => s.trim() !== '')))(input)
  `,
      errors: [{ messageId: 'inlineSchema' }],
    },
    {
      code: `
    import { Schema } from 'effect'
    export class Base {
      constructor(input: unknown) {
        Schema.asserts(Schema.instanceOf(Date))(input)
      }
    }
  `,
      errors: [{ messageId: 'inlineSchema' }],
    },
  ],
});
