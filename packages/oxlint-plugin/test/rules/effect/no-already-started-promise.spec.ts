import { noAlreadyStartedPromise } from '../../../src/rules/effect/no-already-started-promise';
import { testRule } from '../../rule-tester';

testRule('no-already-started-promise', noAlreadyStartedPromise, {
  valid: `
    import * as Fx from 'effect/Effect'
    Fx.tryPromise(() => fetch('/users'))
  `,
  invalid: `
    import * as Fx from 'effect/Effect'
    const request = fetch('/users')
    Fx.tryPromise(() => request)
  `,
  messageId: 'prestarted',
});
