import { noDiscardedRunPromise } from '../../../src/rules/effect/no-discarded-run-promise';
import { testRule } from '../../rule-tester';

testRule('no-discarded-run-promise', noDiscardedRunPromise, {
  valid: `
    import * as Fx from 'effect/Effect'
    await Fx.runPromise(program)
  `,
  invalid: `
    import * as Fx from 'effect/Effect'
    Fx.runPromise(program)
  `,
  messageId: 'discarded',
});
