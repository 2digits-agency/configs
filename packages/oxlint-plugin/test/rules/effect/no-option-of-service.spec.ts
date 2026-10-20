import { testRule } from '../../rule-tester';

testRule('no-option-of-service', {
  valid: [
    `
    import * as Fx from 'effect/Effect'
    Fx.serviceOption(Logger)
  `,
  ],
  invalid: [
    {
      code: `
    import * as Fx from 'effect/Effect'
    Fx.option(Fx.service(Logger))
  `,
      errors: [{ messageId: 'mandatory' }],
    },
  ],
});
