/* oxlint-disable unicorn/no-null -- RuleTester requires null to assert that no fix is offered. */
/* eslint-disable unicorn/no-null -- RuleTester requires null to assert that no fix is offered. */
import { consistentSchemaPipe } from '../../../src/rules/effect/consistent-schema-pipe';
import { testRule } from '../../rule-tester';

const rule = 'consistent-schema-pipe';

const schema = `import * as Schema from 'effect/Schema';`;

// Each output must itself be valid, so every fix is checked to be stable.
for (const [messageId, invalid, output] of [
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
  ['modifierCall', `Schema.optional(Schema.Array(Schema.String))`, `Schema.Array(Schema.String).pipe(Schema.optional)`],
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
] as const) {
  testRule(rule, consistentSchemaPipe, {
    valid: `${schema} ${output}`,
    invalid: `${schema} ${invalid}`,
    messageId,
    output: `${schema} ${output}`,
  });
}

const pipe = `${schema} import { pipe } from 'effect/Function';`;

const fn = `${schema} import * as Fn from 'effect/Function';`;

for (const [invalid, output, valid] of [
  [
    `${pipe} pipe(Schema.String, Schema.optional)`,
    `${pipe} Schema.String.pipe(Schema.optional)`,
    `${pipe} pipe(value, makeSchema, Schema.optional)`,
  ],
  [
    `${fn} Fn.pipe(item, Schema.Array, Schema.optional)`,
    `${fn} Schema.Array(item).pipe(Schema.optional)`,
    `${fn} Fn.pipe(item, toSchema)`,
  ],
] as const) {
  testRule(rule, consistentSchemaPipe, { valid, invalid, messageId: 'functionPipe', output });
}

testRule(rule, consistentSchemaPipe, {
  valid: `${schema} (value as Schema.Top).pipe(Schema.optional)`,
  invalid: `${schema} Schema.optional(value as Schema.Top)`,
  messageId: 'modifierCall',
  output: `${schema} (value as Schema.Top).pipe(Schema.optional)`,
});

testRule(rule, consistentSchemaPipe, {
  valid: `${schema} Schema.String.pipe(/* keep */ Schema.optional)`,
  invalid: `${schema} Schema.optional(/* keep */ Schema.String)`,
  messageId: 'modifierCall',
  output: null,
});

// Reordering would evaluate an impure step or head at a different time, so these are reported without a fix.
for (const [messageId, invalid, valid] of [
  [
    'wrapperPipe',
    `${schema} Schema.String.pipe(Schema.check(filter), Schema.Array, makeStep())`,
    `${schema} Schema.Array(Schema.String.pipe(Schema.check(filter))).pipe(makeStep())`,
  ],
  [
    'dataLastCall',
    `${schema} Schema.check(makeFilter())(makeSchema())`,
    `${schema} makeSchema().pipe(Schema.check(makeFilter()))`,
  ],
] as const) {
  testRule(rule, consistentSchemaPipe, { valid, invalid, messageId, output: null });
}

for (const valid of [
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
]) {
  testRule(rule, consistentSchemaPipe, {
    valid,
    invalid: `${schema} Schema.optional(Schema.String)`,
    messageId: 'modifierCall',
    output: `${schema} Schema.String.pipe(Schema.optional)`,
  });
}
