import { effectPromiseVsTryPromise } from '../../../src/rules/effect/effect-promise-vs-trypromise';
import { testRule } from '../../rule-tester';

testRule('effect-promise-vs-trypromise', effectPromiseVsTryPromise, {
  valid: `
    import { tryPromise as fromPromise } from 'effect/Effect'
    fromPromise(() => fetch('/'))
  `,
  invalid: `
    import { promise as fromPromise } from 'effect/Effect'
    fromPromise(() => fetch('/'))
  `,
  messageId: 'tryPromise',
});
