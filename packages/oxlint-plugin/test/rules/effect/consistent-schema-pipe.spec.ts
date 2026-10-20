/* oxlint-disable unicorn/no-null -- RuleTester requires null to assert that no fix is offered. */
/* eslint-disable unicorn/no-null -- RuleTester requires null to assert that no fix is offered. */
import * as Arr from 'effect/Array';

import { testRule } from '../../rule-tester';

const schema = `import * as Schema from 'effect/Schema';`;

const pipe = `${schema} import { pipe } from 'effect/Function';`;

const fn = `${schema} import * as Fn from 'effect/Function';`;

// Each output must itself be valid, so every fix is checked to be stable.
const fixes = Arr.map(
  [
    ['modifierCall', `Schema.optionalKey(Schema.String)`, `Schema.String.pipe(Schema.optionalKey)`],
    [
      'modifierCall',
      `Schema.optional(Schema.NullOr(Schema.String))`,
      `Schema.String.pipe(Schema.NullOr, Schema.optional)`,
    ],
    [
      'modifierCall',
      `Schema.optionalKey(Schema.String.pipe(Schema.check(Schema.isNonEmpty())))`,
      `Schema.String.pipe(Schema.check(Schema.isNonEmpty()), Schema.optionalKey)`,
    ],
    ['wrapperPipe', `Schema.String.pipe(Schema.Array)`, `Schema.Array(Schema.String)`],
    [
      'wrapperPipe',
      `Schema.String.pipe(Schema.Array, Schema.optional)`,
      `Schema.Array(Schema.String).pipe(Schema.optional)`,
    ],
    [
      'modifierCall',
      `Schema.optional(Schema.Array(Schema.String))`,
      `Schema.Array(Schema.String).pipe(Schema.optional)`,
    ],
    [
      'wrapperPipe',
      `Schema.String.pipe(Schema.check(Schema.isNonEmpty()), Schema.ReadonlySet, Schema.mutable)`,
      `Schema.ReadonlySet(Schema.String.pipe(Schema.check(Schema.isNonEmpty()))).pipe(Schema.mutable)`,
    ],
    ['wrapperPipe', `Schema.String.pipe(Schema.Array, Schema.Array)`, `Schema.Array(Schema.Array(Schema.String))`],
    ['wrapperPipe', `(value as Schema.Top).pipe(Schema.Array)`, `Schema.Array(value as Schema.Top)`],
    ['modifierCall', `Schema.fromJsonString(Session)`, `Session.pipe(Schema.fromJsonString)`],
    ['wrapperPipe', `(first, second).pipe(Schema.Array)`, `Schema.Array((first, second))`],
    ['dataLastCall', `Schema.toTaggedUnion('_tag')(Event)`, `Event.pipe(Schema.toTaggedUnion('_tag'))`],
    ['dataLastCall', `Schema.brand('UserId')(Schema.String)`, `Schema.String.pipe(Schema.brand('UserId'))`],
    [
      'dataLastCall',
      `Schema.optionalKey(Schema.check(Schema.isNonEmpty())(Schema.String))`,
      `Schema.String.pipe(Schema.check(Schema.isNonEmpty()), Schema.optionalKey)`,
    ],
    // A generic bounded by a pipeable Schema type, or a wrapper applied first, still gets a fix.
    [
      'modifierCall',
      `function f<T extends Schema.Top>(schema: T) { return Schema.optional(schema) }`,
      `function f<T extends Schema.Top>(schema: T) { return schema.pipe(Schema.optional) }`,
    ],
    [
      'modifierCall',
      `function f<T extends Schema.Constraint>(schema: T) { return Schema.optional(Schema.Array(schema)) }`,
      `function f<T extends Schema.Constraint>(schema: T) { return Schema.Array(schema).pipe(Schema.optional) }`,
    ],
    ['modifierCall', `Schema.optional(value as Schema.Top)`, `(value as Schema.Top).pipe(Schema.optional)`],
  ] as const,
  ([messageId, invalid, output]) => ({
    code: `${schema} ${invalid}`,
    errors: [{ messageId }],
    output: `${schema} ${output}`,
  }),
);

const functionPipes = [
  {
    code: `${pipe} pipe(Schema.String, Schema.optional)`,
    output: `${pipe} Schema.String.pipe(Schema.optional)`,
    valid: `${pipe} pipe(value, makeSchema, Schema.optional)`,
  },
  {
    code: `${fn} Fn.pipe(item, Schema.Array, Schema.optional)`,
    output: `${fn} Schema.Array(item).pipe(Schema.optional)`,
    valid: `${fn} Fn.pipe(item, toSchema)`,
  },
];

// Reordering would evaluate an impure step or head at a different time, so these are reported without a fix.
const unfixable = [
  {
    messageId: 'wrapperPipe',
    code: `${schema} Schema.String.pipe(Schema.check(filter), Schema.Array, makeStep())`,
    valid: `${schema} Schema.Array(Schema.String.pipe(Schema.check(filter))).pipe(makeStep())`,
  },
  {
    messageId: 'dataLastCall',
    code: `${schema} Schema.check(makeFilter())(makeSchema())`,
    valid: `${schema} makeSchema().pipe(Schema.check(makeFilter()))`,
  },
];

testRule('consistent-schema-pipe', {
  valid: [
    ...Arr.dedupe(Arr.map(fixes, ({ output }) => output)),
    `${schema} Schema.String.pipe(/* keep */ Schema.optional)`,
    ...Arr.map(functionPipes, ({ valid }) => valid),
    ...Arr.map(unfixable, ({ valid }) => valid),
    `${schema}
  const TurboConfigSchema = Schema.Struct({
    $schema: Schema.String.pipe(Schema.optionalKey),
    tasks: Schema.Record(Schema.String, Schema.Unknown).pipe(Schema.optionalKey),
    globalPassThroughEnv: Schema.Array(Schema.String).pipe(Schema.optional),
    ui: Schema.String.pipe(Schema.optionalKey),
  })`,
    `${schema} Schema.Redacted(Schema.String, { label: 'token' }).pipe(Schema.optional)`,
    `${schema} Schema.RedactedFromValue(Schema.String, { label: 'token' })`,
    `${schema} Schema.decodeUnknownSync(Schema.String)(input)`,
    `${schema} Schema.fromJsonString(TurboConfig, { space: 2 })`,
    `${schema} Schema.optional<typeof Name>(Name)`,
    `${schema} Schema.String.pipe<Schema.Top>(Schema.Array)`,
    `${pipe} pipe<Schema.Top, Schema.Top>(Schema.String, Schema.optional)`,
    `${schema} class UserId extends Schema.Opaque<UserId>()(Schema.String) {}`,
    `${pipe} pipe(Schema.decodeUnknownSync(User)(raw), (user) => user.name)`,
    `${pipe} pipe(Schema.Struct({ name: Schema.String }).makeUnsafe(raw), (user) => user.name)`,
    `import { optional } from 'effect/Schema'; optional(Schema.String)`,
    `${schema} function f(Schema: Api) { return Schema.optional(Schema.String) }`,
    `${schema} Schema.String.pipe(Schema.optional).pipe(Schema.mutableKey)`,
    // Schema.Constraint has no `.pipe`, so heads that may only be a Constraint stay calls.
    `${schema} function f<T extends Schema.Constraint>(schema: T) { return Schema.toCodecJson(schema) }`,
    `${schema} const f = <T extends Schema.Constraint, U extends T>(schema: U) => Schema.brand('Id')(schema)`,
    `${pipe} function f<T>(schema: T) { return pipe(schema, Schema.optional) }`,
    `${schema} Schema.optional(value as Schema.ConstraintCodec<string>)`,
    `${schema} import { type Constraint } from 'effect/Schema'; function f(schema: Constraint) { return Schema.optional(schema) }`,
  ],
  invalid: [
    ...fixes,
    {
      code: `${schema} Schema.optional(/* keep */ Schema.String)`,
      errors: [{ messageId: 'modifierCall' }],
      output: null,
    },
    ...Arr.map(functionPipes, ({ code, output }) => ({ code, errors: [{ messageId: 'functionPipe' }], output })),
    ...Arr.map(unfixable, ({ messageId, code }) => ({ code, errors: [{ messageId }], output: null })),
    {
      code: `${schema} Schema.optional(Schema.String)`,
      errors: [{ messageId: 'modifierCall' }],
      output: `${schema} Schema.String.pipe(Schema.optional)`,
    },
  ],
});

/* eslint-enable unicorn/no-null */
