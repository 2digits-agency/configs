import { noOptionOfService } from '../../../src/rules/effect/no-option-of-service';
import { testRule } from '../../rule-tester';

testRule('no-option-of-service', noOptionOfService, {
  valid: `
    import * as Fx from 'effect/Effect'
    Fx.serviceOption(Logger)
  `,
  invalid: `
    import * as Fx from 'effect/Effect'
    Fx.option(Fx.service(Logger))
  `,
  messageId: 'mandatory',
});
