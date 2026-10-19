import { testRule } from '../../rule-tester';

testRule('no-discarded-schema-checks', {
  valid: [
    `
    import * as Schema from 'effect/Schema'
    const Mapped = Schema.Struct({ value: Schema.String }).mapFields(mapper)
  `,
  ],
  invalid: [
    {
      code: `
    import * as Schema from 'effect/Schema'
    const Mapped = Schema.Struct({ value: Schema.String }).check(filter).mapFields(mapper)
  `,
      errors: [{ messageId: 'discarded' }],
    },
  ],
});
