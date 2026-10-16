import { noInlineSchemaCompile } from '../../../src/rules/effect/no-inline-schema-compile';
import { testRule } from '../../rule-tester';

testRule('no-inline-schema-compile', noInlineSchemaCompile, {
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

testRule('no-inline-schema-compile', noInlineSchemaCompile, {
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

testRule('no-inline-schema-compile', noInlineSchemaCompile, {
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

testRule('no-inline-schema-compile', noInlineSchemaCompile, {
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
