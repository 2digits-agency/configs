import { testRule } from '../../rule-tester';

testRule('effect-promise-vs-trypromise', {
  valid: [
    `
    import { tryPromise as fromPromise } from 'effect/Effect'
    fromPromise(() => fetch('/'))
  `,
  ],
  invalid: [
    {
      code: `
    import { promise as fromPromise } from 'effect/Effect'
    fromPromise(() => fetch('/'))
  `,
      errors: [{ messageId: 'tryPromise' }],
    },
  ],
});
