import { noAsyncEffectTry } from '../../../src/rules/effect/no-async-effect-try';
import { testRule } from '../../rule-tester';

testRule('no-async-effect-try', noAsyncEffectTry, {
  valid: `
    import * as Fx from 'effect/Effect'
    Fx.try(() => JSON.parse('{}'))
  `,
  invalid: `
    import * as Fx from 'effect/Effect'
    Fx.try(async () => fetch('/users'))
  `,
  messageId: 'asyncTry',
});
