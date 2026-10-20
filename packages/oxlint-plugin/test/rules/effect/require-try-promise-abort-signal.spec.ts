import { testRule } from '../../rule-tester';

testRule('require-try-promise-abort-signal', {
  valid: [
    `
    import * as Effect from 'effect/Effect'
    Effect.tryPromise((signal) => fetch('/users', { signal }))
    Effect.tryPromise((_signal) => legacySdk.request())
  `,
    `
    import * as Effect from 'effect/Effect'
    Effect.tryPromise({ try: (signal) => fetch('/users', { signal }), catch: String })
  `,
  ],
  invalid: [
    {
      code: `
    import * as Effect from 'effect/Effect'
    Effect.tryPromise(() => fetch('/users'))
  `,
      errors: [{ messageId: 'missingSignal' }],
    },
    {
      code: `
    import * as Effect from 'effect/Effect'
    Effect.tryPromise({ try: (signal) => fetch('/users'), catch: String })
  `,
      errors: [{ messageId: 'unusedSignal' }],
    },
  ],
});
