import { noDiscardedSchemaChecks } from '../../../src/rules/effect/no-discarded-schema-checks';
import { testRule } from '../../rule-tester';

testRule('no-discarded-schema-checks', noDiscardedSchemaChecks, {
  valid: `
    import * as Schema from 'effect/Schema'
    const Mapped = Schema.Struct({ value: Schema.String }).mapFields(mapper)
  `,
  invalid: `
    import * as Schema from 'effect/Schema'
    const Mapped = Schema.Struct({ value: Schema.String }).check(filter).mapFields(mapper)
  `,
  messageId: 'discarded',
});
